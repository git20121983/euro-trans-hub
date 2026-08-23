export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          address: string | null
          adr_certificate_url: string | null
          adr_certified: boolean
          assigned_truck_id: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          details_submitted_at: string | null
          emergency_contact: string | null
          full_name: string
          id: string
          id_card_url: string | null
          intl_passport_expiry: string | null
          intl_passport_url: string | null
          license_back_url: string | null
          license_expiry: string | null
          license_front_url: string | null
          license_number: string | null
          medical_expiry: string | null
          phone: string
          salary_rate: number | null
          selfie_url: string | null
          status: string
          tacho_card_url: string | null
          tacho_expiry: string | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          adr_certificate_url?: string | null
          adr_certified?: boolean
          assigned_truck_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          details_submitted_at?: string | null
          emergency_contact?: string | null
          full_name: string
          id?: string
          id_card_url?: string | null
          intl_passport_expiry?: string | null
          intl_passport_url?: string | null
          license_back_url?: string | null
          license_expiry?: string | null
          license_front_url?: string | null
          license_number?: string | null
          medical_expiry?: string | null
          phone: string
          salary_rate?: number | null
          selfie_url?: string | null
          status?: string
          tacho_card_url?: string | null
          tacho_expiry?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          adr_certificate_url?: string | null
          adr_certified?: boolean
          assigned_truck_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          details_submitted_at?: string | null
          emergency_contact?: string | null
          full_name?: string
          id?: string
          id_card_url?: string | null
          intl_passport_expiry?: string | null
          intl_passport_url?: string | null
          license_back_url?: string | null
          license_expiry?: string | null
          license_front_url?: string | null
          license_number?: string | null
          medical_expiry?: string | null
          phone?: string
          salary_rate?: number | null
          selfie_url?: string | null
          status?: string
          tacho_card_url?: string | null
          tacho_expiry?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_truck_id_fkey"
            columns: ["assigned_truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          driver_id: string | null
          id: string
          order_id: string
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          order_id: string
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          order_id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string
          notes: string | null
          order_id: string
          status: string
          updated_at: string
          vat_amount: number
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          notes?: string | null
          order_id: string
          status?: string
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          notes?: string | null
          order_id?: string
          status?: string
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          category: string
          cost: number
          created_at: string
          created_by: string | null
          current_mileage: number | null
          id: string
          maintenance_date: string
          notes: string | null
          sub_category: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          category: string
          cost?: number
          created_at?: string
          created_by?: string | null
          current_mileage?: number | null
          id?: string
          maintenance_date?: string
          notes?: string | null
          sub_category?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          current_mileage?: number | null
          id?: string
          maintenance_date?: string
          notes?: string | null
          sub_category?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          order_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_fuel_cost: number | null
          allowance_amount: number
          cargo_type: string
          cargo_weight: number | null
          client_name: string
          client_phone: string | null
          client_user_id: string | null
          cmr_ai_result: Json | null
          cmr_document_url: string | null
          cmr_notes: string | null
          cmr_quality: string | null
          cmr_signature_verified: boolean
          cmr_stamp_verified: boolean
          cmr_verified_at: string | null
          created_at: string
          currency: string
          demurrage_amount: number
          demurrage_currency: string
          demurrage_hours: number
          demurrage_rate: number
          depreciation_cost: number | null
          destination: string
          distance: number
          driver_advance: number
          driver_id: string | null
          driver_salary: number | null
          exchange_rate: number | null
          free_hours: number
          freight_price_original: number | null
          freight_price_uah: number | null
          fuel_cost: number | null
          fuel_price: number | null
          id: string
          is_international: boolean
          loading_arrived_at: string | null
          loading_demurrage_rate: number | null
          loading_finished_at: string | null
          loading_free_hours: number | null
          manager_id: string | null
          net_profit: number | null
          notes: string | null
          order_number: string
          origin: string
          paid_amount: number
          payment_date: string | null
          payment_status: string
          price: number | null
          route: string | null
          status: string
          toll_cost: number | null
          total_amount: number | null
          total_price: number | null
          trip_date: string | null
          truck_id: string | null
          unloading_arrived_at: string | null
          unloading_date: string | null
          unloading_demurrage_rate: number | null
          unloading_finished_at: string | null
          unloading_free_hours: number | null
          updated_at: string
          vat_amount: number
        }
        Insert: {
          actual_fuel_cost?: number | null
          allowance_amount?: number
          cargo_type?: string
          cargo_weight?: number | null
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          cmr_ai_result?: Json | null
          cmr_document_url?: string | null
          cmr_notes?: string | null
          cmr_quality?: string | null
          cmr_signature_verified?: boolean
          cmr_stamp_verified?: boolean
          cmr_verified_at?: string | null
          created_at?: string
          currency?: string
          demurrage_amount?: number
          demurrage_currency?: string
          demurrage_hours?: number
          demurrage_rate?: number
          depreciation_cost?: number | null
          destination?: string
          distance?: number
          driver_advance?: number
          driver_id?: string | null
          driver_salary?: number | null
          exchange_rate?: number | null
          free_hours?: number
          freight_price_original?: number | null
          freight_price_uah?: number | null
          fuel_cost?: number | null
          fuel_price?: number | null
          id?: string
          is_international?: boolean
          loading_arrived_at?: string | null
          loading_demurrage_rate?: number | null
          loading_finished_at?: string | null
          loading_free_hours?: number | null
          manager_id?: string | null
          net_profit?: number | null
          notes?: string | null
          order_number?: string
          origin?: string
          paid_amount?: number
          payment_date?: string | null
          payment_status?: string
          price?: number | null
          route?: string | null
          status?: string
          toll_cost?: number | null
          total_amount?: number | null
          total_price?: number | null
          trip_date?: string | null
          truck_id?: string | null
          unloading_arrived_at?: string | null
          unloading_date?: string | null
          unloading_demurrage_rate?: number | null
          unloading_finished_at?: string | null
          unloading_free_hours?: number | null
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          actual_fuel_cost?: number | null
          allowance_amount?: number
          cargo_type?: string
          cargo_weight?: number | null
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          cmr_ai_result?: Json | null
          cmr_document_url?: string | null
          cmr_notes?: string | null
          cmr_quality?: string | null
          cmr_signature_verified?: boolean
          cmr_stamp_verified?: boolean
          cmr_verified_at?: string | null
          created_at?: string
          currency?: string
          demurrage_amount?: number
          demurrage_currency?: string
          demurrage_hours?: number
          demurrage_rate?: number
          depreciation_cost?: number | null
          destination?: string
          distance?: number
          driver_advance?: number
          driver_id?: string | null
          driver_salary?: number | null
          exchange_rate?: number | null
          free_hours?: number
          freight_price_original?: number | null
          freight_price_uah?: number | null
          fuel_cost?: number | null
          fuel_price?: number | null
          id?: string
          is_international?: boolean
          loading_arrived_at?: string | null
          loading_demurrage_rate?: number | null
          loading_finished_at?: string | null
          loading_free_hours?: number | null
          manager_id?: string | null
          net_profit?: number | null
          notes?: string | null
          order_number?: string
          origin?: string
          paid_amount?: number
          payment_date?: string | null
          payment_status?: string
          price?: number | null
          route?: string | null
          status?: string
          toll_cost?: number | null
          total_amount?: number | null
          total_price?: number | null
          trip_date?: string | null
          truck_id?: string | null
          unloading_arrived_at?: string | null
          unloading_date?: string | null
          unloading_demurrage_rate?: number | null
          unloading_finished_at?: string | null
          unloading_free_hours?: number | null
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          method: string
          notes: string | null
          order_id: string
          paid_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          notes?: string | null
          order_id: string
          paid_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          notes?: string | null
          order_id?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trucks: {
        Row: {
          created_at: string
          fuel_consumption: number | null
          id: string
          last_service: string | null
          last_service_mileage: number | null
          mileage: number | null
          model: string
          next_service: string | null
          plate_number: string
          status: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          fuel_consumption?: number | null
          id?: string
          last_service?: string | null
          last_service_mileage?: number | null
          mileage?: number | null
          model: string
          next_service?: string | null
          plate_number: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          fuel_consumption?: number | null
          id?: string
          last_service?: string | null
          last_service_mileage?: number | null
          mileage?: number | null
          model?: string
          next_service?: string | null
          plate_number?: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      orders_finance: {
        Row: {
          actual_fuel_cost: number | null
          cargo_type: string | null
          cargo_weight: number | null
          client_name: string | null
          client_phone: string | null
          client_user_id: string | null
          created_at: string | null
          debt: number | null
          depreciation_cost: number | null
          destination: string | null
          distance: number | null
          driver_advance: number | null
          driver_id: string | null
          driver_salary: number | null
          effective_payment_status: string | null
          fuel_cost: number | null
          fuel_price: number | null
          id: string | null
          is_international: boolean | null
          manager_id: string | null
          net_profit: number | null
          notes: string | null
          order_number: string | null
          origin: string | null
          paid_amount: number | null
          payment_status: string | null
          status: string | null
          toll_cost: number | null
          total_amount: number | null
          total_price: number | null
          truck_id: string | null
          unloading_date: string | null
          updated_at: string | null
          vat_amount: number | null
        }
        Insert: {
          actual_fuel_cost?: number | null
          cargo_type?: string | null
          cargo_weight?: number | null
          client_name?: string | null
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string | null
          debt?: never
          depreciation_cost?: number | null
          destination?: string | null
          distance?: number | null
          driver_advance?: number | null
          driver_id?: string | null
          driver_salary?: number | null
          effective_payment_status?: never
          fuel_cost?: number | null
          fuel_price?: number | null
          id?: string | null
          is_international?: boolean | null
          manager_id?: string | null
          net_profit?: number | null
          notes?: string | null
          order_number?: string | null
          origin?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          status?: string | null
          toll_cost?: number | null
          total_amount?: number | null
          total_price?: number | null
          truck_id?: string | null
          unloading_date?: string | null
          updated_at?: string | null
          vat_amount?: number | null
        }
        Update: {
          actual_fuel_cost?: number | null
          cargo_type?: string | null
          cargo_weight?: number | null
          client_name?: string | null
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string | null
          debt?: never
          depreciation_cost?: number | null
          destination?: string | null
          distance?: number | null
          driver_advance?: number | null
          driver_id?: string | null
          driver_salary?: number | null
          effective_payment_status?: never
          fuel_cost?: number | null
          fuel_price?: number | null
          id?: string | null
          is_international?: boolean | null
          manager_id?: string | null
          net_profit?: number | null
          notes?: string | null
          order_number?: string | null
          origin?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          status?: string | null
          toll_cost?: number | null
          total_amount?: number | null
          total_price?: number | null
          truck_id?: string | null
          unloading_date?: string | null
          updated_at?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "driver" | "client" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "driver", "client", "accountant"],
    },
  },
} as const
