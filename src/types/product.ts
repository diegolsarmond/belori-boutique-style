export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  additional_images: string[] | null;
  category: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  is_active: boolean;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}
