export enum Screen {
  LOGIN = "LOGIN",
  DASHBOARD = "DASHBOARD",
  INVENTORY = "INVENTORY",
  IMPORTS = "IMPORTS",
  CUSTOMERS = "CUSTOMERS",
  ORDERS = "ORDERS",
  SUPPLIERS = "SUPPLIERS",
  REPORTS = "REPORTS",
  NEW_IMPORT_ORDER = "NEW_IMPORT_ORDER",
  NEW_SALE_ORDER = "NEW_SALE_ORDER",
  NEW_FISH = "NEW_FISH",
  EDIT_FISH = "EDIT_FISH",
  SETTINGS = "SETTINGS",
  CATEGORIES = "CATEGORIES",
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface FishItem {
  id: string;
  sku: string;
  name: string;
  scientificName: string;
  size: string;
  category_id: number;
  category_name: string;
  retail_price: number;
  wholesale_price: number;
  cost_price: number;
  stock: number;
  image: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export type CustomerType = "retail" | "wholesale";
export type SaleType = "retail" | "wholesale";

export interface Transaction {
  id: string;
  product: string;
  date: string;
  customer: string;
  amount: number;
  status: "Completed" | "Processing" | "Cancelled";
}
