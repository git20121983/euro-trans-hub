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
          assigned_truck_id: string | null
          created_at: string
          full_name: string
          id: string
          license_number: string | null
          phone: string
          salary_rate: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_truck_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          license_number?: string | null
          phone: string
          salary_rate?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_truck_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          license_number?: string | null
          phone?: string
          salary_rate?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
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
        ]
      }
      orders: {
        Row: {
          actual_fuel_cost: number | null
          cargo_type: string
          cargo_weight: number | null
          client_name: string
          client_phone: string | null
          client_user_id: string | null
          created_at: string
          depreciation_cost: number | null
          destination: string
          distance: number
          driver_id: string | null
          driver_salary: number | null
          fuel_cost: number | null
          fuel_price: number | null
          id: string
          net_profit: number | null
          notes: string | null
          order_number: string
          origin: string
          status: string
          toll_cost: number | null
          total_price: number | null
          truck_id: string | null
          updated_at: string
        }
        Insert: {
          actual_fuel_cost?: number | null
          cargo_type?: string
          cargo_weight?: number | null
          client_name: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          depreciation_cost?: number | null
          destination: string
          distance: number
          driver_id?: string | null
          driver_salary?: number | null
          fuel_cost?: number | null
          fuel_price?: number | null
          id?: string
          net_profit?: number | null
          notes?: string | null
          order_number?: string
          origin: string
          status?: string
          toll_cost?: number | null
          total_price?: number | null
          truck_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_fuel_cost?: number | null
          cargo_type?: string
          cargo_weight?: number | null
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          depreciation_cost?: number | null
          destination?: string
          distance?: number
          driver_id?: string | null
          driver_salary?: number | null
          fuel_cost?: number | null
          fuel_price?: number | null
          id?: string
          net_profit?: number | null
          notes?: string | null
          order_number?: string
          origin?: string
          status?: string
          toll_cost?: number | null
          total_price?: number | null
          truck_id?: string | null
          updated_at?: string
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
      [_ in never]: never
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
      app_role: "admin" | "manager" | "driver" | "client"
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
      app_role: ["admin", "manager", "driver", "client"],
    },
  },
} as const
