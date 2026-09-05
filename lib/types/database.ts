/**
 * Hand-maintained mirror of supabase/migrations. Regenerate with
 * `supabase gen types typescript --linked > lib/types/database.ts` once the
 * project is linked; the shape below matches what that command produces.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";

export type CreditTransactionType =
  | "purchase"
  | "usage"
  | "refund"
  | "bonus"
  | "admin_adjustment";

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "expired"
  | "refunded";

export type GenerationStatus = "completed" | "failed";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  primary_use_case: string | null;
  onboarded_at: string | null;
  disabled: boolean;
  created_at: string;
  updated_at: string;
}

export type CreditBalance = {
  user_id: string;
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  updated_at: string;
}

export type CreditTransaction = {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export type ToolCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
}

export type ToolRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category_id: string | null;
  icon: string | null;
  credit_cost: number;
  system_prompt: string | null;
  component: string;
  input_schema: Json;
  output_type: string;
  max_input_chars: number;
  seo_title: string | null;
  seo_description: string | null;
  featured: boolean;
  enabled: boolean;
  new_until: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type OrderRow = {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  credits: number;
  status: OrderStatus;
  payment_provider: string;
  provider_payment_id: string | null;
  provider_checkout_url: string | null;
  pay_currency: string | null;
  pay_amount: number | null;
  pay_address: string | null;
  expires_at: string | null;
  completed_at: string | null;
  credited: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentEventRow = {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string | null;
  order_id: string | null;
  payload: Json | null;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  created_at: string;
}

export type GenerationRow = {
  id: string;
  user_id: string;
  tool_slug: string;
  tool_name: string;
  project_id: string | null;
  input: Json;
  input_preview: string | null;
  output_text: string | null;
  output_json: Json | null;
  credits_used: number;
  model: string | null;
  provider: string | null;
  status: GenerationStatus;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export type FavoriteRow = {
  id: string;
  user_id: string;
  generation_id: string;
  created_at: string;
}

export type FavoriteToolRow = {
  id: string;
  user_id: string;
  tool_slug: string;
  created_at: string;
}

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectItemRow = {
  id: string;
  project_id: string;
  generation_id: string;
  note: string | null;
  created_at: string;
}

export type AiUsageRow = {
  id: string;
  user_id: string | null;
  generation_id: string | null;
  tool_slug: string | null;
  provider: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  credits_charged: number | null;
  success: boolean;
  created_at: string;
}

export type ContactMessageRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export type SiteSettingRow = {
  key: string;
  value: Json;
  updated_at: string;
}

export type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  starts_at: string;
  ends_at: string | null;
  enabled: boolean;
  created_at: string;
}

export type ToolAuditRow = {
  id: string;
  tool_id: string | null;
  tool_slug: string | null;
  admin_id: string | null;
  action: string;
  changes: Json | null;
  created_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      credit_balances: Table<CreditBalance>;
      credit_transactions: Table<CreditTransaction>;
      tool_categories: Table<ToolCategoryRow>;
      tools: Table<ToolRow>;
      tool_audit_log: Table<ToolAuditRow>;
      orders: Table<OrderRow>;
      payment_events: Table<PaymentEventRow>;
      ai_generations: Table<GenerationRow>;
      favorites: Table<FavoriteRow>;
      favorite_tools: Table<FavoriteToolRow>;
      projects: Table<ProjectRow>;
      project_items: Table<ProjectItemRow>;
      ai_usage: Table<AiUsageRow>;
      contact_messages: Table<ContactMessageRow>;
      site_settings: Table<SiteSettingRow>;
      announcements: Table<AnnouncementRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: { p_user_id?: string }; Returns: boolean };
      consume_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description?: string | null;
          p_reference_type?: string;
          p_reference_id?: string | null;
        };
        Returns: number;
      };
      refund_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description?: string | null;
          p_reference_type?: string;
          p_reference_id?: string | null;
        };
        Returns: number;
      };
      complete_order_and_credit: {
        Args: { p_order_id: string; p_provider_payment_id?: string | null };
        Returns: boolean;
      };
      refund_order: { Args: { p_order_id: string }; Returns: number };
      admin_adjust_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description?: string | null;
        };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      credit_transaction_type: CreditTransactionType;
      order_status: OrderStatus;
      generation_status: GenerationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
