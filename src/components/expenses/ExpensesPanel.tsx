import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";

export const EXPENSE_CATEGORIES = [
  "Паром",
  "Омивайка",
  "Платні дороги",
  "Паливо",
  "Інше",
];

export interface ExpenseRow {
  id: string;
  order_id: string;
  driver_id: string | null;
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
}

interface Props {
  orderId: string;
  driverId: string | null;
  allowance: number;
  canAdd: boolean;
  canDelete?: boolean;
  compact?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString("uk-UA", { maximumFractionDigits: 0 });

export default function ExpensesPanel({
  orderId, driverId, allowance, canAdd, canDelete = true, compact = false,
}: Props) {
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    setItems((data as ExpenseRow[]) ?? []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel(`expenses-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `order_id=eq.${orderId}` },
        () => fetchExpenses(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchExpenses]);

  const totalExpenses = items.reduce((s, x) => s + Number(x.amount || 0), 0);
  const remaining = Number(allowance || 0) - totalExpenses;

  const addExpense = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Вкажіть суму більше 0");
      return;
    }
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("expenses").insert({
      order_id: orderId,
      driver_id: driverId,
      amount: amt,
      category,
      description: description || null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(`Помилка: ${error.message}`);
    } else {
      toast.success("Витрату додано");
      setAmount("");
      setDescription("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setShowForm(false);
    }
    setAdding(false);
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) toast.error("Не вдалося видалити");
    else toast.success("Витрату видалено");
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-muted/20 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Аванс</p>
          <p className="text-sm font-semibold text-blue-300">{fmt(Number(allowance || 0))} ₴</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Витрачено</p>
          <p className="text-sm font-semibold text-amber-300">{fmt(totalExpenses)} ₴</p>
        </div>
        <div className={`p-3 rounded-lg border ${remaining >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
          <p className="text-[10px] text-muted-foreground uppercase">Залишок</p>
          <p className={`text-sm font-semibold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmt(remaining)} ₴
          </p>
        </div>
      </div>

      {/* Add form */}
      {canAdd && (
        <>
          {!showForm ? (
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Додати витрату
            </Button>
          ) : (
            <div className="space-y-2 p-3 rounded-lg border border-border bg-card">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Сума, ₴</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Категорія</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Коментар</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Необов'язково"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addExpense} disabled={adding} className="flex-1">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Скасувати</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* List */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Receipt className="w-3 h-3" /> Витрати ({items.length})
        </p>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-center py-4 text-muted-foreground">Витрат немає</p>
        ) : (
          items.map((x) => (
            <div key={x.id} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                    {x.category}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{fmt(Number(x.amount))} ₴</span>
                </div>
                {x.description && (
                  <p className="text-xs text-muted-foreground mt-1 break-words">{x.description}</p>
                )}
                {!compact && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(x.created_at).toLocaleString("uk-UA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              {canDelete && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => deleteExpense(x.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
