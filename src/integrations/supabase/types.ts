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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_ranges: {
        Row: {
          active: boolean | null
          created_at: string | null
          fee: number
          id: string
          label: string
          max_km: number | null
          min_km: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          fee: number
          id?: string
          label: string
          max_km?: number | null
          min_km: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          fee?: number
          id?: string
          label?: string
          max_km?: number | null
          min_km?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean
          category: string
          created_at: string | null
          description: string | null
          highlight: boolean
          id: string
          image_url: string | null
          ingredients: string[] | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string | null
          description?: string | null
          highlight?: boolean
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string | null
          description?: string | null
          highlight?: boolean
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          options: Json | null
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          options?: Json | null
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          id?: string
          options?: Json | null
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_reference: string | null
          address_street: string | null
          change_for: number | null
          coupon_code: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_fee: number
          delivery_method: string | null
          discount: number
          id: string
          items: Json
          needs_change: boolean | null
          notes: string | null
          order_number: number
          payment_method: string | null
          points_used: number | null
          status: string
          subtotal: number | null
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_reference?: string | null
          address_street?: string | null
          change_for?: number | null
          coupon_code?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number
          delivery_method?: string | null
          discount?: number
          id?: string
          items: Json
          needs_change?: boolean | null
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          points_used?: number | null
          status?: string
          subtotal?: number | null
          total: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_reference?: string | null
          address_street?: string | null
          change_for?: number | null
          coupon_code?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number
          delivery_method?: string | null
          discount?: number
          id?: string
          items?: Json
          needs_change?: boolean | null
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          points_used?: number | null
          status?: string
          subtotal?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          points: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          points?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          business_hours: Json | null
          delivery_fee: number
          estimated_delivery_time: number | null
          hours: string | null
          id: string
          is_open: boolean
          latitude: number | null
          longitude: number | null
          min_order: number
          order_prep_time_multiplier: number | null
          phone: string
          pix_key: string | null
          pix_qr_code_url: string | null
          store_name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          delivery_fee?: number
          estimated_delivery_time?: number | null
          hours?: string | null
          id?: string
          is_open?: boolean
          latitude?: number | null
          longitude?: number | null
          min_order?: number
          order_prep_time_multiplier?: number | null
          phone?: string
          pix_key?: string | null
          pix_qr_code_url?: string | null
          store_name?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          delivery_fee?: number
          estimated_delivery_time?: number | null
          hours?: string | null
          id?: string
          is_open?: boolean
          latitude?: number | null
          longitude?: number | null
          min_order?: number
          order_prep_time_multiplier?: number | null
          phone?: string
          pix_key?: string | null
          pix_qr_code_url?: string | null
          store_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          complement: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string
          neighborhood: string
          number: string
          reference: string | null
          street: string
          user_id: string
        }
        Insert: {
          complement?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          neighborhood: string
          number: string
          reference?: string | null
          street: string
          user_id: string
        }
        Update: {
          complement?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          neighborhood?: string
          number?: string
          reference?: string | null
          street?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      store_settings_public: {
        Row: {
          address: string | null
          business_hours: Json | null
          delivery_fee: number | null
          estimated_delivery_time: number | null
          hours: string | null
          id: string | null
          is_open: boolean | null
          latitude: number | null
          longitude: number | null
          min_order: number | null
          order_prep_time_multiplier: number | null
          phone: string | null
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          delivery_fee?: number | null
          estimated_delivery_time?: number | null
          hours?: string | null
          id?: string | null
          is_open?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_order?: number | null
          order_prep_time_multiplier?: number | null
          phone?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          delivery_fee?: number | null
          estimated_delivery_time?: number | null
          hours?: string | null
          id?: string | null
          is_open?: boolean | null
          latitude?: number | null
          longitude?: number | null
          min_order?: number | null
          order_prep_time_multiplier?: number | null
          phone?: string | null
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_unique_order_number: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_order_status: {
        Args: { _order_number?: number; _phone?: string }
        Returns: {
          created_at: string
          delivery_fee: number
          delivery_method: string
          discount: number
          id: string
          items: Json
          order_number: number
          payment_method: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }[]
      }
      place_order:
        | {
            Args: {
              _address_complement?: string
              _address_neighborhood?: string
              _address_number?: string
              _address_reference?: string
              _address_street?: string
              _coupon_code?: string
              _customer_name: string
              _customer_phone: string
              _delivery_fee: number
              _delivery_method: string
              _discount: number
              _items?: Json
              _notes?: string
              _payment_method: string
              _subtotal: number
              _total: number
              _user_id?: string
            }
            Returns: {
              id: string
              order_number: number
            }[]
          }
        | {
            Args: {
              _address_complement?: string
              _address_neighborhood?: string
              _address_number?: string
              _address_reference?: string
              _address_street?: string
              _coupon_code?: string
              _customer_name: string
              _customer_phone: string
              _delivery_fee: number
              _delivery_method: string
              _discount: number
              _items?: Json
              _notes?: string
              _payment_method: string
              _points_used?: number
              _subtotal: number
              _total: number
              _user_id?: string
            }
            Returns: {
              id: string
              order_number: number
            }[]
          }
      validate_coupon: {
        Args: { _code: string }
        Returns: {
          active: boolean
          code: string
          discount_type: string
          discount_value: number
          expires_at: string
          min_order: number
        }[]
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
