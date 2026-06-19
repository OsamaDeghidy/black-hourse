export interface Product {
  id: string;
  name: string;
  category: string;
  priceCost: number;
  priceWholesale: number;
  priceRetail: number;
  maxDiscountProfitPercent: number; // percentage of unit profit allowed for discount (e.g. 50 meaning 50% of profit can be discounted)
  stockBranch1: number;
  stockBranch2: number;
  minStockAlert: number;
  compatibleMobiles: string[];
  imageUrl?: string; // Base64 or Preset image URL
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  branch: "branch1" | "branch2" | "online"; // 'online' for online store orders
  quantity: number;
  price: number;
  total: number;
  profit: number;
  date: string;
  notes: string;
  soldBy?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // retail selling price
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: "delivery" | "pickup";
  deliveryAddress?: string;
  pickupBranch?: "branch1" | "branch2";
  paymentMethod: "cod" | "online";
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "approved" | "shipped" | "ready_for_pickup" | "delivered" | "cancelled";
  date: string;
  notes?: string;
  delayContactRequested?: boolean; // dynamic claim in case order is delayed
  delayContactMessage?: string;
}

export interface SyncSettings {
  spreadsheetId: string;
  spreadsheetUrl: string;
  lastSync: string | null;
}

export interface ActivityLog {
  id: string;
  user: string;
  actionType: "add_product" | "edit_request" | "edit_approved" | "edit_rejected" | "sale" | "transfer";
  details: string;
  timestamp: string;
}

export interface ModificationRequest {
  id: string;
  productId: string;
  productName: string;
  requestedBy: string;
  requestedAt: string;
  originalData: Partial<Product>;
  proposedData: Partial<Product>;
  status: "pending" | "approved" | "rejected";
}

export interface DBState {
  items: Product[];
  sales: Sale[];
  settings: SyncSettings;
  logs?: ActivityLog[];
  requests?: ModificationRequest[];
  orders?: Order[];
}

export function getProductImage(imageUrl?: string, category?: string, productName?: string): string {
  if (imageUrl && imageUrl.trim() !== "") {
    // If it looks like a valid URL or base64, return it
    return imageUrl;
  }
  
  const cat = (category || "").toLowerCase();
  const name = (productName || "").toLowerCase();
  
  if (cat.includes("شاش") || name.includes("شاشه") || name.includes("شاشة") || name.includes("oled") || name.includes("screen") || name.includes("lcd")) {
    return "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&w=600&q=80"; // Screen repair OLED
  }
  if (cat.includes("بطار") || name.includes("بطارية") || name.includes("بطاريه") || name.includes("battery")) {
    return "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?auto=format&fit=crop&w=600&q=80"; // Battery cells / hardware
  }
  if (cat.includes("باغ") || cat.includes("زجاج") || name.includes("باغة") || name.includes("باغه") || name.includes("زجاج") || name.includes("glass") || name.includes("سكرين")) {
    return "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80"; // Camera glass or clean protective glass
  }
  if (cat.includes("فلات") || cat.includes("شاحن") || cat.includes("شواحن") || name.includes("فلاتة") || name.includes("فلاته") || name.includes("شاحن") || name.includes("coils") || name.includes("charger") || name.includes("flext")) {
    return "https://images.unsplash.com/photo-1517055720445-995536551677?auto=format&fit=crop&w=600&q=80"; // Microchip / charging board circuit
  }
  if (cat.includes("إكسسوار") || cat.includes("اكسسوار") || cat.includes("سماح") || name.includes("سماعة") || name.includes("سماعه") || name.includes("airpods") || name.includes("جراب") || name.includes("حافظة") || name.includes("case")) {
    return "https://images.unsplash.com/photo-1588449668338-d1347b11a53a?auto=format&fit=crop&w=600&q=80"; // Earphones / casing accessories
  }
  if (cat.includes("كام") || name.includes("كاميرا") || name.includes("كامرا") || name.includes("camera") || name.includes("عدسة")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"; // Phone back detail / camera module
  }
  
  // Default elegant mobile stock photo
  return "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80"; 
}
