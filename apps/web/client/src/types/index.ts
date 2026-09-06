export interface User {
  id: string;
  email: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
}

export type StockStatus = 'Aman' | 'Menipis' | 'Habis';

export interface Material {
  id: string;
  name: string;
  unit: string;
  quantity_precision: number;
  current_stock: number;
  minimum_stock: number;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  selling_price: number;
}

export type MovementType =
  | 'IN'
  | 'OUT'
  | 'PRODUCTION_CONSUME'
  | 'PRODUCTION_OUTPUT'
  | 'SALE'
  | 'OPNAME';

export interface StockMovement {
  movement_id: string;
  item_type: 'MATERIAL' | 'PRODUCT';
  item_id: string;
  item_name: string;
  unit: string;
  type: MovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reason?: string;
  timestamp: string;
}

export interface StockOpnameRecord {
  opname_id: string;
  item_type: 'MATERIAL' | 'PRODUCT';
  item_id: string;
  item_name: string;
  unit: string;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  stock_after: number;
  note?: string;
  created_at: string;
}

export interface BomMaterialItem {
  material_id: string;
  material_name?: string;
  unit?: string;
  quantity: number;
}

export interface Bom {
  id: string;
  name: string;
  product_id: string;
  product_name?: string;
  output_quantity: number;
  output_unit: string;
  selling_price_per_unit: number;
  materials: BomMaterialItem[];
  created_at: string;
}

export interface ProductionPreviewMaterial {
  material_id: string;
  material_name: string;
  calculated_quantity: number;
  unit: string;
  available_quantity: number;
  quantity_precision?: number;
}

export interface ProductionPreview {
  product_id: string;
  product_name?: string;
  bom_id: string;
  bom_name?: string;
  target_output_quantity: number;
  bom_output_quantity: number;
  bom_multiplier: number;
  materials: ProductionPreviewMaterial[];
  stock_check: {
    can_produce: boolean;
    errors: string[];
  };
}

export interface ProductionMaterialUsage {
  material_id: string;
  material_name?: string;
  calculated_quantity: number;
  actual_quantity: number;
  unit?: string;
}

export interface ProductionRecord {
  id: string;
  product_id: string;
  product_name?: string;
  bom_id: string;
  target_output_quantity: number;
  actual_output_quantity: number;
  bom_multiplier: number;
  materials: ProductionMaterialUsage[];
  note?: string;
  created_at: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  created_at: string;
}

export interface DashboardSummary {
  sales: {
    total: number;
    transaction_count: number;
  };
  production: {
    production_count: number;
    output_quantity: number;
  };
  low_stock: {
    materials: number;
    products: number;
  };
  latest_activity_at: string;
}

export interface InsightItem {
  type: 'WARNING' | 'INFO' | 'POSITIVE' | 'OPPORTUNITY' | 'TIP';
  title: string;
  body: string;
}

export interface Insight {
  id: string;
  generated_at: string;
  data_as_of: string;
  is_stale?: boolean;
  content: InsightItem[];
  model_metadata?: { provider: string; model: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
