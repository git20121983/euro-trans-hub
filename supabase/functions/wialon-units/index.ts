import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const BASE = Deno.env.get('WIALON_HOST') || 'https://hst-api.wialon.com';

async function wialon(svc: string, params: unknown, sid?: string) {
  const body = new URLSearchParams({ svc, params: JSON.stringify(params) });
  if (sid) body.set('sid', sid);
  const r = await fetch(`${BASE}/wialon/ajax.html`, { method: 'POST', body });
  const d = await r.json();
  if (d?.error) throw new Error(`Wialon ${svc} error ${d.error}`);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser(auth.replace('Bearer ', ''));
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const [{ data: a }, { data: m }] = await Promise.all([
      sb.rpc('has_role', { _user_id: u.user.id, _role: 'admin' }),
      sb.rpc('has_role', { _user_id: u.user.id, _role: 'manager' }),
    ]);
    if (!a && !m) return json({ error: 'Forbidden' }, 403);

    const token = Deno.env.get('WIALON_TOKEN');
    if (!token) return json({ error: 'WIALON_TOKEN не налаштовано', units: [] }, 200);

    const login = await wialon('token/login', { token });
    const sid = login.eid;
    const res = await wialon('core/search_items', {
      spec: { itemsType: 'avl_unit', propName: 'sys_name', propValueMask: '*', sortType: 'sys_name' },
      force: 1, flags: 1 + 1024, from: 0, to: 0,
    }, sid);
    await wialon('core/logout', {}, sid).catch(() => {});

    const units = (res.items ?? []).map((i: any) => ({
      id: i.id, name: i.nm,
      lat: i.pos?.y ?? null, lng: i.pos?.x ?? null,
      speed: i.pos?.s ?? 0, course: i.pos?.c ?? 0,
      time: i.pos?.t ? new Date(i.pos.t * 1000).toISOString() : null,
    }));
    return json({ units });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
