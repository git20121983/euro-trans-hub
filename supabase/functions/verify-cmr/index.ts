import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM = `Ти — інспектор транспортних документів. Аналізуєш фото міжнародної товарно-транспортної накладної CMR або ТТН.
Перевір: чи є мокра печатка/штамп вантажоодержувача (графа 24), чи є підпис, і яка якість фото.
Відповідай ЛИШЕ викликом інструменту report_cmr. Коментар пиши українською, коротко.`;

const TOOL = {
  type: 'function',
  function: {
    name: 'report_cmr',
    description: 'Звіт про перевірку скану CMR',
    parameters: {
      type: 'object',
      properties: {
        is_document: { type: 'boolean', description: 'Чи це справді транспортний документ (CMR/ТТН)' },
        stamp_verified: { type: 'boolean', description: 'Наявна печатка/штамп отримувача' },
        signature_verified: { type: 'boolean', description: 'Наявний підпис' },
        quality: { type: 'string', enum: ['good', 'blurry', 'dark', 'cropped'], description: 'Якість фото' },
        notes: { type: 'string', description: 'Короткий коментар українською' },
      },
      required: ['is_document', 'stamp_verified', 'signature_verified', 'quality', 'notes'],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageUrl, imageBase64 } = await req.json();
    const image = typeof imageBase64 === 'string' && imageBase64.length > 10 ? imageBase64 : imageUrl;
    if (typeof image !== 'string' || image.length < 10) {
      return new Response(JSON.stringify({ error: 'imageUrl або imageBase64 обовʼязковий' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI не налаштовано' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Перевір цей документ.' },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        tools: [TOOL],
        tool_choice: { type: 'function', function: { name: 'report_cmr' } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 500;
      return new Response(JSON.stringify({ error: text.slice(0, 400) }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: 'AI не повернув результат' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const result = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
