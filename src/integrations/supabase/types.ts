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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_custom: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_custom?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_custom?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          amount_discounted: number
          context: string
          coupon_id: string
          created_at: string
          id: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount_discounted: number
          context: string
          coupon_id: string
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount_discounted?: number
          context?: string
          coupon_id?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_uses: number | null
          min_amount: number
          per_user_limit: number
          scope: Database["public"]["Enums"]["coupon_scope"]
          uses_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_uses?: number | null
          min_amount?: number
          per_user_limit?: number
          scope?: Database["public"]["Enums"]["coupon_scope"]
          uses_count?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_uses?: number | null
          min_amount?: number
          per_user_limit?: number
          scope?: Database["public"]["Enums"]["coupon_scope"]
          uses_count?: number
          value?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivered_credential: string
          delivered_notes: string | null
          delivered_password: string
          id: string
          login_id: string | null
          price: number
          product_id: string
          product_name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_credential: string
          delivered_notes?: string | null
          delivered_password: string
          id?: string
          login_id?: string | null
          price: number
          product_id: string
          product_name: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_credential?: string
          delivered_notes?: string | null
          delivered_password?: string
          id?: string
          login_id?: string | null
          price?: number
          product_id?: string
          product_name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_login_id_fkey"
            columns: ["login_id"]
            isOneToOne: false
            referencedRelation: "product_logins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_paid: number
          checkout_url: string | null
          coupon_id: string | null
          created_at: string
          credit_amount: number
          currency: string
          external_id: string | null
          id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          purpose: string
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          checkout_url?: string | null
          coupon_id?: string | null
          created_at?: string
          credit_amount: number
          currency?: string
          external_id?: string | null
          id?: string
          paid_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          purpose?: string
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          checkout_url?: string | null
          coupon_id?: string | null
          created_at?: string
          credit_amount?: number
          currency?: string
          external_id?: string | null
          id?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string
          purpose?: string
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      product_logins: {
        Row: {
          created_at: string
          credential: string
          id: string
          notes: string | null
          password: string
          product_id: string
          sold_at: string | null
          sold_to: string | null
          status: string
        }
        Insert: {
          created_at?: string
          credential: string
          id?: string
          notes?: string | null
          password: string
          product_id: string
          sold_at?: string | null
          sold_to?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          credential?: string
          id?: string
          notes?: string | null
          password?: string
          product_id?: string
          sold_at?: string | null
          sold_to?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_logins_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          seller_id: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          seller_id?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          seller_id?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          email: string | null
          id: string
          is_suspended: boolean
          suspended_reason: string | null
          telegram: string | null
          updated_at: string
          username: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email?: string | null
          id: string
          is_suspended?: boolean
          suspended_reason?: string | null
          telegram?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          is_suspended?: boolean
          suspended_reason?: string | null
          telegram?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      seller_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json
          reference_id: string | null
          seller_id: string
          type: Database["public"]["Enums"]["seller_tx_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference_id?: string | null
          seller_id: string
          type: Database["public"]["Enums"]["seller_tx_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference_id?: string | null
          seller_id?: string
          type?: Database["public"]["Enums"]["seller_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "seller_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          balance: number
          business_description: string | null
          business_name: string
          created_at: string
          id: string
          logo_url: string | null
          paid_registration_at: string | null
          registration_payment_ref: string | null
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
        }
        Insert: {
          balance?: number
          business_description?: string | null
          business_name: string
          created_at?: string
          id: string
          logo_url?: string | null
          paid_registration_at?: string | null
          registration_payment_ref?: string | null
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
        }
        Update: {
          balance?: number
          business_description?: string | null
          business_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          paid_registration_at?: string | null
          registration_payment_ref?: string | null
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json
          reference_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          seller_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          bank_name: string
          created_at?: string
          id?: string
          seller_id: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_wallet: {
        Args: { _amount: number; _description: string; _user_id: string }
        Returns: number
      }
      admin_set_seller_status: {
        Args: {
          _seller_id: string
          _status: Database["public"]["Enums"]["seller_status"]
        }
        Returns: {
          balance: number
          business_description: string | null
          business_name: string
          created_at: string
          id: string
          logo_url: string | null
          paid_registration_at: string | null
          registration_payment_ref: string | null
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sellers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_withdrawal_status: {
        Args: {
          _id: string
          _note?: string
          _status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Returns: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          seller_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawal_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_seller_registration_payment: {
        Args: { _external_id: string; _provider_reference: string; _raw: Json }
        Returns: {
          balance: number
          business_description: string | null
          business_name: string
          created_at: string
          id: string
          logo_url: string | null
          paid_registration_at: string | null
          registration_payment_ref: string | null
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sellers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_seller_registration_intent: {
        Args: {
          _checkout_url: string
          _external_id: string
          _raw: Json
          _reference: string
        }
        Returns: {
          amount_paid: number
          checkout_url: string | null
          coupon_id: string | null
          created_at: string
          credit_amount: number
          currency: string
          external_id: string | null
          id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          purpose: string
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_intents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_wallet_from_payment: {
        Args: {
          _external_id: string
          _provider: Database["public"]["Enums"]["payment_provider"]
          _provider_reference: string
          _raw: Json
        }
        Returns: {
          amount_paid: number
          checkout_url: string | null
          coupon_id: string | null
          created_at: string
          credit_amount: number
          currency: string
          external_id: string | null
          id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          purpose: string
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_intents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purchase_product:
        | {
            Args: { _product_id: string }
            Returns: {
              created_at: string
              delivered_credential: string
              delivered_notes: string | null
              delivered_password: string
              id: string
              login_id: string | null
              price: number
              product_id: string
              product_name: string
              status: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "orders"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { _coupon_code?: string; _product_id: string }
            Returns: {
              created_at: string
              delivered_credential: string
              delivered_notes: string | null
              delivered_password: string
              id: string
              login_id: string | null
              price: number
              product_id: string
              product_name: string
              status: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "orders"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      quote_coupon: {
        Args: { _amount: number; _code: string; _context: string }
        Returns: Json
      }
      register_seller: {
        Args: {
          _business_description: string
          _business_name: string
          _logo_url: string
        }
        Returns: {
          balance: number
          business_description: string | null
          business_name: string
          created_at: string
          id: string
          logo_url: string | null
          paid_registration_at: string | null
          registration_payment_ref: string | null
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "sellers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: {
          _account_name: string
          _account_number: string
          _amount: number
          _bank_name: string
        }
        Returns: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          seller_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawal_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_user_suspended: {
        Args: { _reason: string; _suspended: boolean; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      coupon_kind: "percent" | "fixed"
      coupon_scope: "funding" | "purchase" | "both"
      payment_provider: "monnify" | "binance_pay" | "nowpayments"
      payment_status: "pending" | "paid" | "failed" | "expired" | "cancelled"
      seller_status: "pending" | "active" | "suspended" | "declined"
      seller_tx_type:
        | "sale"
        | "withdrawal_hold"
        | "withdrawal_refund"
        | "withdrawal_paid"
        | "admin_adjustment"
      wallet_tx_type:
        | "funding"
        | "purchase"
        | "admin_credit"
        | "admin_debit"
        | "refund"
        | "coupon_bonus"
      withdrawal_status: "pending" | "approved" | "rejected" | "paid"
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
      app_role: ["admin", "user"],
      coupon_kind: ["percent", "fixed"],
      coupon_scope: ["funding", "purchase", "both"],
      payment_provider: ["monnify", "binance_pay", "nowpayments"],
      payment_status: ["pending", "paid", "failed", "expired", "cancelled"],
      seller_status: ["pending", "active", "suspended", "declined"],
      seller_tx_type: [
        "sale",
        "withdrawal_hold",
        "withdrawal_refund",
        "withdrawal_paid",
        "admin_adjustment",
      ],
      wallet_tx_type: [
        "funding",
        "purchase",
        "admin_credit",
        "admin_debit",
        "refund",
        "coupon_bonus",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
