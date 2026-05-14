import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const driverSchema = z.object({
  full_name: z.string().trim().min(1, "ПІБ обов'язкове").max(150),
  phone: z.string().trim().min(5, "Телефон обов'язковий").max(30),
  license_number: z.string().trim().min(1, "Номер посвідчення обов'язковий").max(50),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  trucks: Tables<"trucks">[];
  existingDrivers: Tables<"drivers">[];
}

export default function AddDriverModal({ open, onOpenChange, onCreated, existingDrivers }: Props) {
  const [saving, setSaving] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { full_name: "", phone: "", license_number: "" },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open]);

  const onSubmit = async (values: DriverFormValues) => {
    if (existingDrivers.find((d) => d.phone === values.phone)) {
      form.setError("phone", { message: "Водій з таким телефоном вже існує" });
      return;
    }
    if (existingDrivers.find((d) => d.license_number === values.license_number)) {
      form.setError("license_number", { message: "Водій з таким посвідченням вже існує" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("drivers").insert({
      full_name: values.full_name,
      phone: values.phone,
      license_number: values.license_number,
      status: "pending_details",
    });
    setSaving(false);

    if (error) {
      toast.error(`Помилка: ${error.message}`);
      return;
    }

    toast.success(`Водія ${values.full_name} додано. Очікується заповнення профілю.`);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Додати водія</DialogTitle>
          <DialogDescription>
            Введіть базові дані. Водій сам завершить профіль після реєстрації за номером телефону.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ім'я та Прізвище *</FormLabel>
                  <FormControl>
                    <Input placeholder="Іваненко Петро" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер посвідчення *</FormLabel>
                  <FormControl>
                    <Input placeholder="АВС 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефону *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+380501234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Скасувати
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Зберегти
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
