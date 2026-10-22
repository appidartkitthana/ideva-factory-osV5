export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  created_at?: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  address?: string;
  status: string;
  created_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  type: string;
  version: string;
  status: string;
  image_url?: string;
}

export interface RawMaterial {
  id: number;
  code: string;
  name: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
  status: string;
  unit_price?: number;
  supplier?: string;
  supplier_id?: number;
  supplier_name?: string;
  image_url?: string;
}

export interface BomMaterial {
  part?: string;
  material_code?: string;
  material_name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  unit_price?: number;
}

export interface BomRecipe {
  id: number;
  product_id: number;
  part_no?: string;
  version: string;
  status: string;
  notes?: string;
  materials: BomMaterial[];
  product_code?: string;
  product_name?: string;
  product_type?: string;
  production_count?: number;
  production_quantity?: number;
  estimated_unit_cost?: number;
}

export interface ProductionOrder {
  id: number;
  code: string;
  customer_id: number;
  product_id: number;
  quantity: number;
  unit: string;
  status: string;
  due_date: string;
  staff?: string;
  date: string;
  customer_name?: string;
  product_name?: string;
  product_code?: string;
  created_at?: string;
}

export interface PackingOrder {
  id: number;
  code: string;
  production_order_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  status: string;
}

export interface PurchaseItem {
  raw_material_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  supplier: string;
  order_date: string;
  status: string;
  total_amount: number;
  items: PurchaseItem[];
  material?: string; // for simple display/compatibility
  qty?: number;      // for simple display/compatibility
  price?: number;    // for simple display/compatibility
}

export interface Grn {
  id: number;
  code: string;
  purchase_order_id: number;
  po_number?: string;
  raw_material_id: number;
  supplier_name?: string;
  lot_number: string;
  expiry_date: string;
  received_qty: number;
  unit_price?: number;
  unit?: string;
  receiver: string;
  receive_date: string;
  status: string;
  purchase?: string;  // display
  material?: string;  // display
  qty?: number;       // display
  lot?: string;       // display
  expiry?: string;    // display
}

export interface Precheck {
  id: number;
  material: string;
  lot: string;
  expiry: string;
  inspector: string;
  date: string;
  result: string;
}

export interface InventoryPack {
  id: number;
  code: string;
  type: string;
  name: string;
  qty: number;
  unit: string;
  status: string;
  supplier_name?: string;
  unit_price?: number;
  image_url?: string;
}

export interface PurchasePack {
  id: number;
  code: string;
  supplier: string;
  item: string;
  qty: number;
  price: number;
  status: string;
}

export interface Project {
  id: number;
  title: string;              // หัวเรื่อง (เช่น สบู่มังคุด)
  project_type?: string;      // ประเภทโปรเจค
  customer_id?: number;
  customer: string;           // ลูกค้า
  customer_status?: string;   // สถานะของลูกค้า
  owner: string;              // เจ้าของ
  price: number;              // ราคา
  start_date: string;         // วันที่เริ่ม (เช่น 01/01/2024)
  due_date: string;           // วันกำหนดส่ง (เช่น 12/01/2024)
  progress: number;           // ความคืบหน้า (%)
  status: string;             // สถานะ (เช่น รอดำเนินการ, กำลังผลิต, เสร็จสิ้น)
  quantity: number;           // จำนวน (เช่น 500)
  tags?: string[];            // คำกำกับ
  description?: string;       // คำบรรยาย
  product_code?: string;      // รหัสสินค้า
  lot_number?: string;        // Lot Number (เช่น Lot6)
  product_name?: string;      // ชื่อสินค้า (เช่น MANGOSTEEN ACNE SOAP/แมงโกสทีน แอคเน่ โซฟ)
  details?: string;           // รายละเอียด (เช่น SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้)
  category?: string;          // ประเภท
  created_at?: string;
}

export interface SemiFinishedGood {
  id: number;
  code: string;
  name: string;
  batch_no: string;
  qty: number;
  unit: string;
  tank_no: string;
  mfg_date: string;
  status: string;
}

export interface RequisitionSlip {
  id: number;
  code: string;
  date: string;
  department: string;
  requester: string;
  items: { item_name: string; qty: number; unit: string }[];
  status: "approved" | "pending";
  purpose: string;
}

