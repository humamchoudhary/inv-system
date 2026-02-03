// types/sales.ts
export interface Sale {
  id: number;
  product_name: string;
  unit_price: number | string;
  quantity: number;
  total_price: number | string;
  tax_percent: number | string | null;
  createdAt: Date;
}

export type SaleFormData = {
  product_name: string;
  unit_price?: number;
  quantity?: number;
  total_price?: number;
  tax_percent?: number;
  createdAt?: Date;
};
