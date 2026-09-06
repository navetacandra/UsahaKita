export interface Env {
  AUTH_DO: DurableObjectNamespace;
  TENANT_DO: DurableObjectNamespace;
  AI_API_KEY?: string;
  AI_API_KEYS?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  ASSETS: Fetcher;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  tenant_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  tenant_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  quantity_precision: number;
  current_stock: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  item_type: string;
  item_id: string;
  movement_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reason_type: string | null;
  reason_note: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Bom {
  id: string;
  name: string;
  product_id: string;
  output_quantity: number;
  output_unit: string;
  selling_price_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface BomMaterial {
  bom_id: string;
  material_id: string;
  quantity: number;
}

export interface Production {
  id: string;
  bom_id: string;
  product_id: string;
  target_output_quantity: number;
  actual_output_quantity: number;
  bom_multiplier: number;
  note: string | null;
  created_at: string;
}

export interface ProductionMaterial {
  production_id: string;
  material_id: string;
  calculated_quantity: number;
  actual_quantity: number;
}

export interface StockOpname {
  id: string;
  item_type: string;
  item_id: string;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  note: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  total: number;
  created_at: string;
}

export interface SaleItem {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface AiInsight {
  id: string;
  period_from: string;
  period_to: string;
  data_as_of: string;
  generated_at: string;
  prompt_version: string;
  content_json: string;
  model_metadata_json: string;
}

export type SessionPayload = {
  userId: string;
  tenantId: string;
  sessionId: string;
};

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
