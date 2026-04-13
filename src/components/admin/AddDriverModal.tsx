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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const driverSchema = z.object({
  full_name: z.string().trim().min(1, "ПІБ обов'язкове").max(150),
  phone: z.string().trim().min(1, "Телефон обов'язковий").max(30),
  license_number: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Невірний формат email").optional().or(z.literal("")),
  assigned_truck_id: z.string().optional().or(z.literal("")),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  trucks: Tables<"trucks">[];
  existingDrivers: Tables<"drivers">[];
}

export default function AddDriverModal({ open, onOpenChange, onCreated, trucks, existingDrivers }: Props) {
  const [saving, setSaving] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      license_number: "",
      email: "",
      assigned_truck_id: "",
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open]);

  const availableTrucks = trucks.filter(
    (t) => t.status === "available" || !existingDrivers.some((d) => d.assigned_truck_id === t.id)
  );

  const onSubmit = async (values: DriverFormValues) => {
    // Duplicate check
    const phoneDup = existingDrivers.find((d) => d.phone === values.phone);
    if (phoneDup) {
      form.setError("phone", { message: "Водій з таким номером телефону вже існує" });
      return;
    }

    setSaving(true);
    try {
      let userId: string | null = null;

      // If email provided, look up user by email via profiles or create invitation note
      if (values.email) {
        // Check if a user with this email already has a driver record
        const { data: existingProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("full_name", values.email);

        // We can't look up by email directly in profiles, so we skip user_id linking for now
        // Admin can link later or the driver registers with this email
      }

      const { data, error } = await supabase
        .from("drivers")
        .insert({
          full_name: values.full_name,
          phone: values.phone,
          license_number: values.license_number || null,
          assigned_truck_id: values.assigned_truck_id || null,
          status: "available",
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          toast.error("Водій з такими даними вже існує в системі");
        } else {
          toast.error(`Помилка збереження: ${error.message}`);
        }
        console.error("Insert driver error:", error);
        setSaving(false);
        return;
      }

      toast.success(`Водія ${values.full_name} успішно додано до системи`);
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error(`Непередбачена помилка: ${e.message}`);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Додати водія</DialogTitle>
          <DialogDescription>Заповніть дані нового водія</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ПІБ *</FormLabel>
                  <FormControl>
                    <Input placeholder="Іваненко Петро Миколайович" {...field} />
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
                  <FormLabel>Телефон *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+380501234567" {...field} />
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
                  <FormLabel>Номер посвідчення</FormLabel>
                  <FormControl>
                    <Input placeholder="АВС 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Електронна пошта</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="driver@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_truck_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Закріпити авто</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Не обрано" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTrucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          {truck.plate_number} — {truck.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
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
