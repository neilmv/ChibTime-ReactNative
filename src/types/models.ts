export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_name?: string;
  category_description?: string;
  is_available: boolean;
  image_url?: string;
}
