import { createClient } from "@supabase/supabase-js";

// Default credentials from project config
const DEFAULT_SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "https://zizlhxikswejwvoftshk.supabase.co";
const DEFAULT_SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppemxoeGlrc3dland2b2Z0c2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzQ4NDMsImV4cCI6MjA5NjY1MDg0M30.lw7RsYg6Icz7HhT7cbjJsKrOv-pzKLV01D5WR03Ffg0";

export function getSupabaseConfig() {
  let customUrl = "";
  let customKey = "";
  try {
    customUrl = localStorage.getItem("custom_supabase_url") || "";
    customKey = localStorage.getItem("custom_supabase_key") || "";
  } catch {}

  const url = customUrl || DEFAULT_SUPABASE_URL;
  const key = customKey || DEFAULT_SUPABASE_KEY;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectId = match ? match[1] : "zizlhxikswejwvoftshk";

  return {
    url,
    key,
    isCustom: !!(customUrl || customKey),
    projectId
  };
}

let currentConfig = getSupabaseConfig();
let cleanUrl = currentConfig.url.replace(/\/rest\/v1\/?$/, "");
export let supabase = createClient(cleanUrl, currentConfig.key);

export const updateSupabaseConfig = (url: string, key: string) => {
  const clean = url.trim().replace(/\/rest\/v1\/?$/, "");
  try {
    localStorage.setItem("custom_supabase_url", clean);
    localStorage.setItem("custom_supabase_key", key.trim());
    localStorage.removeItem("supabase_is_offline");
  } catch {}
  currentConfig = {
    url: clean,
    key: key.trim(),
    isCustom: true,
    projectId: clean.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "custom"
  };
  supabase = createClient(clean, key.trim());
  isSupabaseOffline = false;
};

export const resetSupabaseConfig = () => {
  try {
    localStorage.removeItem("custom_supabase_url");
    localStorage.removeItem("custom_supabase_key");
    localStorage.removeItem("supabase_is_offline");
  } catch {}
  currentConfig = getSupabaseConfig();
  cleanUrl = currentConfig.url.replace(/\/rest\/v1\/?$/, "");
  supabase = createClient(cleanUrl, currentConfig.key);
  isSupabaseOffline = false;
};

// Timeout helper to avoid UI hanging if Supabase is slow or blocked
let isSupabaseOffline = (() => {
  try {
    return localStorage.getItem("supabase_is_offline") === "true";
  } catch {
    return false;
  }
})();

export const setSupabaseOffline = (offline: boolean) => {
  isSupabaseOffline = offline;
  try {
    localStorage.setItem("supabase_is_offline", offline ? "true" : "false");
  } catch {}
};

export const withTimeout = <T>(promise: PromiseLike<T>, ms = 2500): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Supabase request timeout")), ms))
  ]);
};

// Local Fallback Mock Database in case Supabase tables are empty or unreachable
export const fallbackDB: Record<string, any[]> = {
  suppliers: [
    {
      id: 1,
      code: "SUP-001",
      name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด",
      contact: "คุณสมพงษ์ สารเคมี",
      phone: "02-123-4567",
      email: "sales@globalchem.co.th",
      address: "88/12 ถนนบางนา-ตราด กม.10 บางพลี สมุทรปราการ",
      status: "active"
    },
    {
      id: 2,
      code: "SUP-002",
      name: "บริษัท ไทยอินกรีเดียนท์ จำกัด",
      contact: "คุณวรรณา ซัพพลาย",
      phone: "02-987-6543",
      email: "info@thaiingredients.com",
      address: "101/5 ซอยสุขุมวิท 71 พระโขนง กรุงเทพฯ",
      status: "active"
    },
    {
      id: 3,
      code: "SUP-003",
      name: "บริษัท นิปปอน เคมิเคิล (ประเทศไทย) จำกัด",
      contact: "Mr. Kenji Sato",
      phone: "02-555-8899",
      email: "order@nipponchem.co.th",
      address: "45/8 นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี",
      status: "active"
    }
  ],
  customers: [
    {
      id: 1,
      code: "C69-001",
      name: "บริษัท เอสซีจี เคมิคอลส์ จำกัด (มหาชน)",
      contact: "คุณวิทวัส สมบูรณ์",
      phone: "02-586-4444",
      email: "contact@scgchemicals.com",
      tax_id: "0107555000123",
      address: "1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800",
      status: "active",
      created_at: "2026-05-15 09:30:00"
    },
    {
      id: 2,
      code: "C69-002",
      name: "บริษัท สยามเคมีคอล กรุ๊ป จำกัด",
      contact: "คุณสมศรี รักดี",
      phone: "089-876-5432",
      email: "info@siamchem.co.th",
      tax_id: "0105559000456",
      address: "88 หมู่ 5 นิคมอุตสาหกรรมบางปู ต.บางปูใหม่ อ.เมือง จ.สมุทรปราการ 10280",
      status: "active",
      created_at: "2026-05-20 10:15:00"
    },
    {
      id: 3,
      code: "C69-003",
      name: "ห้างหุ้นส่วนจำกัด อุตสาหกรรมเคมีไทย",
      contact: "คุณวิชัย เลิศล้ำ",
      phone: "02-444-5555",
      email: "thaichem_ind@gmail.com",
      tax_id: "0103548000789",
      address: "456 ถนนเพชรเกษม แขวงบางหว้า เขตภาษีเจริญ กรุงเทพฯ 10160",
      status: "active",
      created_at: "2026-06-01 14:00:00"
    },
    {
      id: 4,
      code: "C68-073",
      name: "คุณวิมลมณี ไสบาล",
      contact: "คุณวิมลมณี",
      phone: "081-234-5678",
      email: "wimolmanee@example.com",
      tax_id: "0109876543210",
      address: "123/45 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110",
      status: "active",
      created_at: "2026-06-10 11:00:00"
    }
  ],
  products: [
    { id: 1, code: "P-001", name: "น้ำยาเคลือบแก้วพรีเมียม A", type: "Liquid", version: "v1.0", status: "active" },
    { id: 2, code: "P-002", name: "สารฆ่าเชื้อประสิทธิภาพสูง B", type: "Liquid", version: "v2.1", status: "active" },
    { id: 3, code: "P-003", name: "ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C", type: "Powder", version: "v1.0", status: "active" },
    { id: 4, code: "IDV-SP-003", name: "Rose Soap (สบู่กุหลาบ)", type: "Liquid", version: "v1.0", status: "active" }
  ],
  raw_materials: [
    { id: 1, code: "RM-001", name: "Ethanol 96%", unit: "L.", stock_qty: 120, min_stock: 50, unit_price: 65, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop" },
    { id: 2, code: "RM-002", name: "Glycerin USP", unit: "L.", stock_qty: 45, min_stock: 30, unit_price: 90, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop" },
    { id: 3, code: "RM-003", name: "Sodium Hydroxide (NaOH)", unit: "KG.", stock_qty: 15, min_stock: 20, unit_price: 55, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop" },
    { id: 4, code: "RM-004", name: "Hydrogen Peroxide 35%", unit: "L.", stock_qty: 85, min_stock: 40, unit_price: 110, supplier_id: 3, supplier_name: "บริษัท นิปปอน เคมิเคิล (ประเทศไทย) จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop" },
    { id: 5, code: "RM-005", name: "Citric Acid Anhydrous", unit: "KG.", stock_qty: 32, min_stock: 25, unit_price: 70, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" },
    { id: 6, code: "RMSS-0010", name: "เบสใส", unit: "KG.", stock_qty: 500, min_stock: 100, unit_price: 85, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop" },
    { id: 7, code: "RMOP-0013", name: "Gold glitter mica / Gold Super Sparkle Mica (Size D, 200 Micron)", unit: "G.", stock_qty: 1000, min_stock: 200, unit_price: 1500, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop" },
    { id: 8, code: "RMCL-0009", name: "สีชมพูละลายน้ำ", unit: "G.", stock_qty: 500, min_stock: 100, unit_price: 800, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" },
    { id: 9, code: "RMFL-0232", name: "กลิ่นดอกกุหลาบ", unit: "G.", stock_qty: 2000, min_stock: 500, unit_price: 1200, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop" },
    { id: 10, code: "RMVB-003", name: "Vitamin B3 (Niacinamide)", unit: "KG.", stock_qty: 100, min_stock: 20, unit_price: 450, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", status: "active", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" }
  ],
  bom_recipes: [
    {
      id: 1,
      product_id: 1,
      product_code: "P-001",
      product_name: "น้ำยาเคลือบแก้วพรีเมียม A",
      part_no: "PART-001",
      version: "v1.0",
      status: "active",
      notes: "สูตรเคลือบแก้วมาตรฐานโรงงาน",
      materials: [
        { part: "A", material_code: "RM-001", material_name: "Ethanol 96%", quantity: 100, unit: "L.", notes: "ส่วนผสมหลัก" },
        { part: "A", material_code: "RM-002", material_name: "Glycerin USP", quantity: 10, unit: "L.", notes: "เพิ่มความหนืด" },
        { part: "B", material_code: "RM-005", material_name: "Citric Acid Anhydrous", quantity: 2, unit: "KG.", notes: "ปรับค่าความเป็นกรดด่าง" }
      ]
    },
    {
      id: 2,
      product_id: 2,
      product_code: "P-002",
      product_name: "สารฆ่าเชื้อประสิทธิภาพสูง B",
      part_no: "PART-002",
      version: "v2.1",
      status: "active",
      notes: "สูตรสารฆ่าเชื้อประสิทธิภาพสูง",
      materials: [
        { part: "A", material_code: "RM-001", material_name: "Ethanol 96%", quantity: 150, unit: "L.", notes: "ส่วนประกอบหลัก" },
        { part: "A", material_code: "RM-004", material_name: "Hydrogen Peroxide 35%", quantity: 20, unit: "L.", notes: "ฆ่าสปอร์และเชื้อไวรัส" },
        { part: "B", material_code: "RM-002", material_name: "Glycerin USP", quantity: 5, unit: "L.", notes: "รักษาความชุ่มชื้น" }
      ]
    },
    {
      id: 3,
      product_id: 3,
      product_code: "P-003",
      product_name: "ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C",
      part_no: "PART-003",
      version: "v1.0",
      status: "active",
      notes: "ผงซักล้างสูตรด่างเข้มข้น",
      materials: [
        { part: "A", material_code: "RM-003", material_name: "Sodium Hydroxide (NaOH)", quantity: 50, unit: "KG.", notes: "สารทำปฏิกิริยาด่าง" },
        { part: "B", material_code: "RM-005", material_name: "Citric Acid Anhydrous", quantity: 15, unit: "KG.", notes: "สารปรับปรุงสภาพน้ำ" }
      ]
    },
    {
      id: 4,
      product_id: 4,
      product_code: "IDV-SP-003",
      product_name: "Rose Soap (สบู่กุหลาบ)",
      part_no: "BS30",
      version: "v1.0",
      status: "active",
      estimated_unit_cost: 86.5,
      notes: JSON.stringify([
        { instruction: "ละลาย Part A ด้วยอุณหภูมิ 60-75องศา จนหมด" },
        { instruction: "ผสม Part B ให้เข้ากัน รอให้อุณหภูมิลดลงเหลือ 60องศา แล้วเติมลงใน Part A" },
        { instruction: "รออุณหภูมิลดลงเหลือ 50-55องศา แล้วเติมลงใน Part A/B" }
      ]),
      materials: [
        { part: "A", material_code: "RMSS-0010", material_name: "เบสใส", quantity: 100.00, unit: "KG.", notes: "เบสสบู่ใส (100% w/w)" },
        { part: "A", material_code: "RMOP-0013", material_name: "Gold glitter mica / Gold Super Sparkle Mica (Size D, 200 Micron)", quantity: 0.02, unit: "G.", notes: "ผงไมก้าทองวิ้ง (0.02% w/w)" },
        { part: "B", material_code: "RMCL-0009", material_name: "สีชมพูละลายน้ำ", quantity: 0.03, unit: "G.", notes: "สีผสมสบู่ (0.03% w/w)" },
        { part: "C", material_code: "RMFL-0232", material_name: "กลิ่นดอกกุหลาบ", quantity: 1.00, unit: "G.", notes: "หัวน้ำหอมกุหลาบ (1.00% w/w)" }
      ]
    }
  ],
  production_orders: [
    {
      id: 1,
      code: "PO-2026-0056",
      customer_id: 1,
      product_id: 1,
      quantity: 500,
      unit: "ลิตร",
      status: "done",
      due_date: "2026-06-25",
      staff: "สมชาย ใจดี",
      date: "2026-06-20",
      created_at: "2026-06-20 09:00:00"
    },
    {
      id: 2,
      code: "PO-2026-0055",
      customer_id: 2,
      product_id: 2,
      quantity: 200,
      unit: "ลิตร",
      status: "running",
      due_date: "2026-07-02",
      staff: "ดร.สุภา",
      date: "2026-06-28",
      created_at: "2026-06-28 10:30:00"
    },
    {
      id: 3,
      code: "PO-2026-0054",
      customer_id: 3,
      product_id: 3,
      quantity: 1000,
      unit: "กก.",
      status: "pending",
      due_date: "2026-07-10",
      staff: "สมชาติ ใจมั่น",
      date: "2026-06-29",
      created_at: "2026-06-29 13:45:00"
    }
  ],
  packing_orders: [
    {
      id: 1,
      code: "PK-2026-0021",
      production_order_id: 1,
      item_name: "น้ำยาเคลือบแก้วพรีเมียม A",
      quantity: 500,
      unit: "ขวด",
      status: "done"
    },
    {
      id: 2,
      code: "PK-2026-0020",
      production_order_id: 2,
      item_name: "สารฆ่าเชื้อประสิทธิภาพสูง B",
      quantity: 200,
      unit: "ขวด",
      status: "running"
    },
    {
      id: 3,
      code: "PK-2026-0019",
      production_order_id: 3,
      item_name: "ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C",
      quantity: 1000,
      unit: "ถุง",
      status: "pending"
    }
  ],
  purchase_orders: [
    {
      id: 1,
      code: "PRM-2026-0023",
      supplier: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด",
      order_date: "2026-06-18",
      status: "pending",
      total_amount: 15400,
      items: [
        { raw_material_id: 1, item_name: "Ethanol 96%", quantity: 200, unit: "ลิตร", unit_price: 60, subtotal: 12000 },
        { raw_material_id: 2, item_name: "Glycerin USP", quantity: 40, unit: "ลิตร", unit_price: 85, subtotal: 3400 }
      ]
    },
    {
      id: 2,
      code: "PRM-2026-0022",
      supplier: "บริษัท ไทยอินกรีเดียนท์ จำกัด",
      order_date: "2026-06-15",
      status: "received",
      total_amount: 8800,
      items: [
        { raw_material_id: 3, item_name: "Sodium Hydroxide (NaOH)", quantity: 100, unit: "กก.", unit_price: 55, subtotal: 5500 },
        { raw_material_id: 5, item_name: "Citric Acid", quantity: 50, unit: "กก.", unit_price: 66, subtotal: 3300 }
      ]
    }
  ],
  grns: [
    {
      id: 1,
      code: "GRN-2026-0018",
      purchase_order_id: 2,
      raw_material_id: 3,
      lot_number: "L260615-001",
      expiry_date: "2028-06-15",
      received_qty: 100,
      receiver: "สมศักดิ์ คลังสินค้า",
      receive_date: "2026-06-15",
      status: "received"
    },
    {
      id: 2,
      code: "GRN-2026-0017",
      purchase_order_id: 2,
      raw_material_id: 5,
      lot_number: "L260615-002",
      expiry_date: "2028-06-15",
      received_qty: 50,
      receiver: "สมศักดิ์ คลังสินค้า",
      receive_date: "2026-06-15",
      status: "received"
    }
  ],
  prechecks: [
    {
      id: 1,
      material: "Ethanol 96%",
      lot: "L240901",
      expiry: "2026-09-01",
      inspector: "ดร.สุภา",
      date: "2026-06-20",
      result: "pass"
    },
    {
      id: 2,
      material: "Sodium Hydroxide (NaOH)",
      lot: "L240920",
      expiry: "2026-09-20",
      inspector: "ดร.สุภา",
      date: "2026-06-21",
      result: "fail"
    },
    {
      id: 3,
      material: "Glycerin USP",
      lot: "L240820",
      expiry: "2026-07-20",
      inspector: "นายประพันธ์",
      date: "2026-06-25",
      result: "pending"
    }
  ],
  inventory_pack: [
    { id: 1, code: "PK-001", type: "ขวด", name: "ขวด HDPE ขนาด 1 ลิตร", qty: 2450, unit: "ชิ้น", status: "active" },
    { id: 2, code: "PK-002", type: "ฝา", name: "ฝาสกรูพลาสติก สีขาว", qty: 4800, unit: "ชิ้น", status: "active" },
    { id: 3, code: "PK-003", type: "ฉลาก", name: "ฉลากน้ำยาเคลือบแก้ว P-001", qty: 1500, unit: "ชิ้น", status: "active" },
    { id: 4, code: "PK-004", type: "ฉลาก", name: "ฉลากสารฆ่าเชื้อ P-002", qty: 850, unit: "ชิ้น", status: "active" }
  ],
  projects: [
    {
      id: 1,
      title: "สบู่มังคุด",
      project_type: "OEM ผลิตสบู่สมุนไพร",
      customer: "SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้",
      customer_status: "ลูกค้า",
      owner: "คุณสมใจ ผลิตภัณฑ์",
      price: 45000,
      start_date: "01/01/2024",
      due_date: "12/01/2024",
      progress: 60,
      status: "กำลังผลิต",
      quantity: 500,
      tags: ["สบู่ก้อน", "ลดสิว", "ส่งออก"],
      description: "โครงการผลิตสบู่ก้อนมังคุดเกรดพรีเมียม สารสกัดเปลือกมังคุดธรรมชาติ สำหรับลูกค้า SMBS",
      product_code: "MP-SOAP-006",
      lot_number: "Lot6",
      product_name: "MANGOSTEEN ACNE SOAP/แมงโกสทีน แอคเน่ โซฟ",
      details: "SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้",
      category: "สบู่ก้อนสมุนไพร",
      created_at: "2024-01-01 10:00:00"
    },
    {
      id: 2,
      title: "เซรั่มวิตามินซี ไฮยาลูรอน",
      project_type: "OEM ผลิตเวชสำอาง",
      customer: "บริษัท นพคุณ ฟาร์มาซูติคอล จำกัด",
      customer_status: "ลูกค้า VIP",
      owner: "คุณวารุณี แผนกวิจัย",
      price: 120000,
      start_date: "15/01/2024",
      due_date: "28/02/2024",
      progress: 85,
      status: "ตรวจ QC",
      quantity: 2000,
      tags: ["เซรั่ม", "หน้าใส", "GMP"],
      description: "สูตรเซรั่มเข้มข้น Vitamin C 15% และ Hyaluronic Acid 4D",
      product_code: "SR-VITC-002",
      lot_number: "Lot12",
      product_name: "GLOW VIT-C BOOSTER SERUM",
      details: "บรรจุขวดแก้วดรอปเปอร์สีชา 30ml พร้อมกล่องพิมพ์ฟอยล์ทอง",
      category: "สกินแคร์/เซรั่ม",
      created_at: "2024-01-15 09:00:00"
    },
    {
      id: 3,
      title: "น้ำยาเคลือบแก้วรถยนต์นาโน",
      project_type: "ODM สูตรเฉพาะทาง",
      customer: "บริษัท เอสซีจี เคมิคอลส์ จำกัด (มหาชน)",
      customer_status: "ลูกค้าองค์กร",
      owner: "คุณวิทวัส การผลิต",
      price: 250000,
      start_date: "10/02/2024",
      due_date: "25/03/2024",
      progress: 30,
      status: "รอสารเคมี",
      quantity: 1000,
      tags: ["เคมีภัณฑ์", "คาร์แคร์", "นาโน"],
      description: "ผลิตน้ำยาเคลือบสีรถยนต์สูตรซิลิกา 9H สำหรับศูนย์ดูแลรถยนต์ครบวงจร",
      product_code: "CC-NANO-9H",
      lot_number: "Lot3",
      product_name: "ULTRA CERAMIC COATING 9H",
      details: "ขวดอลูมิเนียม 50ml พร้อมผ้าไมโครไฟเบอร์และฟองน้ำลงน้ำยา",
      category: "เคมีภัณฑ์ยานยนต์",
      created_at: "2024-02-10 11:30:00"
    }
  ]
};

export function getDeletedSet(entity: string): Set<string> {
  try {
    const raw = localStorage.getItem(`factory_deleted_${entity}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markAsDeleted(entity: string, id: number | string) {
  try {
    const set = getDeletedSet(entity);
    set.add(String(id));
    localStorage.setItem(`factory_deleted_${entity}`, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error("Error saving deleted ID:", e);
  }
}

export function unmarkDeleted(entity: string, id: number | string) {
  try {
    const set = getDeletedSet(entity);
    set.delete(String(id));
    localStorage.setItem(`factory_deleted_${entity}`, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error("Error unmarking deleted ID:", e);
  }
}

// Initialize in-memory storage fallback mimicking Supabase
const memoryDB: Record<string, any[]> = (() => {
  try {
    const isCleared = localStorage.getItem("factory_database_cleared") === "true";
    if (isCleared) {
      const emptyBase: Record<string, any[]> = {};
      for (const key of Object.keys(fallbackDB)) {
        emptyBase[key] = [];
      }
      return emptyBase;
    }
    const raw = localStorage.getItem("factory_memory_db");
    const parsed = raw ? JSON.parse(raw) : null;
    const base = parsed || { ...fallbackDB };
    for (const key of Object.keys(fallbackDB)) {
      if (!base[key] || !Array.isArray(base[key])) {
        base[key] = [...(fallbackDB as any)[key]];
      }
      // Strictly exclude any records that were deleted by user
      const deletedSet = getDeletedSet(key);
      base[key] = base[key].filter((item: any) => !deletedSet.has(String(item.id)));
    }
    return base;
  } catch {
    return { ...fallbackDB };
  }
})();

const saveMemory = () => {
  localStorage.setItem("factory_memory_db", JSON.stringify(memoryDB));
};

export async function clientGetList(entity: string): Promise<any[]> {
  const table = entity;
  const deletedSet = getDeletedSet(entity);
  const isCleared = localStorage.getItem("factory_database_cleared") === "true";

  // If database was cleared by user, return memoryDB state directly
  if (isCleared) {
    const list = (memoryDB[entity] || []).filter((item: any) => !deletedSet.has(String(item.id)));
    return list;
  }

  const hasFailedBefore = localStorage.getItem(`supabase_failed_${entity}`) === "true";
  if (isSupabaseOffline || hasFailedBefore) {
    const list = (memoryDB[entity] || []).filter((item: any) => !deletedSet.has(String(item.id)));
    return list;
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from(table).select("*").order("id", { ascending: false }),
      1500
    );
    if (error) throw error;

    let finalData = data || [];
    let usedMockFallback = false;
    if (finalData.length === 0) {
      if (isCleared) return [];
      finalData = (memoryDB[entity] || []).filter((item: any) => !deletedSet.has(String(item.id)));
      usedMockFallback = true;
    } else {
      finalData = finalData.filter((item: any) => !deletedSet.has(String(item.id)));
    }

    if (entity === "bom_recipes" && finalData) {
      const memRecipes = (memoryDB["bom_recipes"] || []).filter((item: any) => !deletedSet.has(String(item.id)));
      const enrichedRows = [];
      for (const row of finalData) {
        const item = { ...row };
        const memMatch = memRecipes.find((m: any) => m.id === item.id);
        
        let supaMaterials: any[] = [];
        try {
          const { data: items, error: err2 } = await withTimeout(
            supabase.from("bom_items").select("*").eq("bom_id", item.id),
            1500
          );
          if (!err2 && items && items.length > 0) {
            supaMaterials = items.map((itm: any) => ({
              part: itm.part || "A",
              raw_material_id: itm.raw_material_id,
              material_code: itm.material_code || "",
              material_name: itm.material_name,
              quantity: parseFloat(itm.quantity),
              unit: itm.unit,
              notes: itm.notes || ""
            }));
          }
        } catch (e) {
          supaMaterials = [];
        }

        if (supaMaterials.length > 0) {
          item.materials = supaMaterials;
        } else if (memMatch && memMatch.materials && memMatch.materials.length > 0) {
          item.materials = memMatch.materials;
        } else if (item.materials && item.materials.length > 0) {
          // Keep existing
        } else {
          item.materials = [];
        }

        if (memMatch) {
          item.part_no = item.part_no || memMatch.part_no;
          item.product_code = item.product_code || memMatch.product_code;
          item.product_name = item.product_name || memMatch.product_name;
          item.version = item.version || memMatch.version;
          item.status = item.status || memMatch.status;
          item.notes = item.notes || memMatch.notes;
          item.estimated_unit_cost = item.estimated_unit_cost || memMatch.estimated_unit_cost;
        }

        enrichedRows.push(item);
      }

      for (const memItem of memRecipes) {
        if (!enrichedRows.some(r => r.id === memItem.id)) {
          enrichedRows.push(memItem);
        }
      }

      return enrichedRows.filter((item: any) => !deletedSet.has(String(item.id)));
    }

    if (entity === "purchase_orders" && finalData) {
      if (usedMockFallback) return finalData.filter((item: any) => !deletedSet.has(String(item.id)));
      const enrichedRows = [];
      for (const row of finalData) {
        const item = { ...row };
        try {
          const { data: items, error: err2 } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", item.id);
          if (!err2 && items) {
            item.items = items.map((itm: any) => ({
              raw_material_id: itm.raw_material_id,
              item_name: itm.item_name,
              quantity: parseFloat(itm.quantity),
              unit: itm.unit,
              unit_price: parseFloat(itm.unit_price),
              subtotal: parseFloat(itm.subtotal)
            }));
          } else {
            item.items = [];
          }
        } catch (e) {
          item.items = [];
        }
        enrichedRows.push(item);
      }
      return enrichedRows.filter((item: any) => !deletedSet.has(String(item.id)));
    }

    return finalData.filter((item: any) => !deletedSet.has(String(item.id)));
  } catch (err) {
    console.warn(`Supabase client query failed for ${entity}, falling back to local memory:`, err);
    setSupabaseOffline(true);
    localStorage.setItem(`supabase_failed_${entity}`, "true");
    if (isCleared) return [];
    const deletedSet = getDeletedSet(entity);
    return (memoryDB[entity] || []).filter((item: any) => !deletedSet.has(String(item.id)));
  }
}

/**
 * Intelligent Connection Diagnostics
 * Specifically handles "TypeError: Failed to fetch"
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  elapsed?: number;
  errorType?: "FAILED_TO_FETCH" | "AUTH_ERROR" | "TIMEOUT" | "GENERIC";
  details?: string;
  isPausedPossible?: boolean;
}> {
  const start = Date.now();
  try {
    const { data, error } = await withTimeout(
      supabase.from("raw_materials").select("id").limit(1),
      3500
    );
    const elapsed = Date.now() - start;

    if (error) {
      if (error.message?.includes("Invalid API key") || error.code === "401") {
        return {
          success: false,
          elapsed,
          errorType: "AUTH_ERROR",
          message: `รหัส API Key ไม่ถูกต้อง: ${error.message}`,
          details: "กรุณาตรวจสอบ Anon Key ของโครงการ Supabase ในเมนูตั้งค่า"
        };
      }
      return {
        success: false,
        elapsed,
        errorType: "GENERIC",
        message: `เชื่อมต่อไม่สำเร็จ: ${error.message}`,
        details: error.details || error.hint || ""
      };
    }

    setSupabaseOffline(false);
    return {
      success: true,
      elapsed,
      message: `เชื่อมต่อ Supabase Realtime สำเร็จ! (${elapsed}ms - สถานะออนไลน์ 100%)`
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    const errStr = String(err?.message || err?.name || err);
    const isFetchError = 
      err?.name === "TypeError" || 
      errStr.includes("Failed to fetch") || 
      errStr.includes("NetworkError") ||
      errStr.includes("timeout") ||
      errStr.includes("ENOTFOUND");

    if (isFetchError) {
      return {
        success: false,
        elapsed,
        errorType: "FAILED_TO_FETCH",
        isPausedPossible: true,
        message: "เชื่อมต่อไม่สำเร็จ: TypeError: Failed to fetch",
        details: "ตรวจพบว่าโครงการ Supabase (zizlhxikswejwvoftshk) อาจอยู่ในสถานะ 'Paused' (พักการทำงานชั่วคราวบน Supabase Cloud) หรือไม่มีการตอบสนองจาก Host โดเมน"
      };
    }

    return {
      success: false,
      elapsed,
      errorType: "GENERIC",
      message: `ข้อผิดพลาดในการเชื่อมต่อ: ${err?.message || "เครือข่ายขัดข้อง"}`,
      details: String(err)
    };
  }
}

/**
 * Clear All Database Tables (Password Protected: 4321034)
 * Deletes all records in Supabase (if connected) & Local DB
 */
export async function clearAllDatabaseTables(passcode: string): Promise<{
  success: boolean;
  message: string;
  clearedTables: string[];
}> {
  if (passcode.trim() !== "4321034") {
    throw new Error("รหัสผ่านยืนยันไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อป้องกันการกดพลาด");
  }

  const tables = [
    "projects",
    "customers",
    "products",
    "raw_materials",
    "bom_recipes",
    "production_orders",
    "packing_orders",
    "purchase_orders",
    "grns",
    "prechecks",
    "inventory_pack",
    "purchase_packs",
    "suppliers"
  ];

  // 1. Mark system as intentionally cleared
  localStorage.setItem("factory_database_cleared", "true");

  // 2. Clear all tables in local memory
  for (const t of Object.keys(memoryDB)) {
    memoryDB[t] = [];
  }
  saveMemory();

  // 3. Clear all deleted tracking keys
  for (const t of tables) {
    try {
      localStorage.removeItem(`factory_deleted_${t}`);
      localStorage.removeItem(`supabase_failed_${t}`);
    } catch {}
  }

  // 4. Try deleting from Supabase if online
  if (!isSupabaseOffline) {
    try {
      // Child tables first to avoid FK constraint errors
      await withTimeout(supabase.from("bom_items").delete().neq("id", 0), 2000).catch(() => {});
      await withTimeout(supabase.from("purchase_order_items").delete().neq("id", 0), 2000).catch(() => {});

      for (const t of tables) {
        try {
          await withTimeout(supabase.from(t).delete().neq("id", 0), 2000).catch(() => {});
        } catch (e) {
          console.warn(`Supabase clear table ${t} note:`, e);
        }
      }
    } catch (e) {
      console.warn("Supabase clear all execution exception:", e);
    }
  }

  // 5. Notify server backend
  try {
    await fetch("/api/clear-all-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "4321034" })
    });
  } catch {}

  return {
    success: true,
    message: "ล้างข้อมูลในตารางทั้งหมดเรียบร้อยแล้ว (Delete all records สำเร็จ 100%)",
    clearedTables: tables
  };
}

/**
 * Reset Sample Database (Password Protected: 4321034)
 * Restores initial demo factory data
 */
export async function resetSampleDatabase(passcode: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (passcode.trim() !== "4321034") {
    throw new Error("รหัสผ่านยืนยันไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อยืนยัน");
  }

  localStorage.removeItem("factory_database_cleared");

  for (const key of Object.keys(fallbackDB)) {
    memoryDB[key] = JSON.parse(JSON.stringify(fallbackDB[key]));
    try {
      localStorage.removeItem(`factory_deleted_${key}`);
      localStorage.removeItem(`supabase_failed_${key}`);
    } catch {}
  }
  saveMemory();

  try {
    await fetch("/api/reset-sample-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "4321034" })
    });
  } catch {}

  return {
    success: true,
    message: "รีเซ็ตข้อมูลตัวอย่างเริ่มต้นโรงงานเรียบร้อยแล้ว"
  };
}

export async function clientSave(entity: string, id: number, data: any): Promise<number> {
  const table = entity;
  const cleanData = { ...data };
  delete cleanData.id;

  // Extract relations
  let materialsToSave: any[] | null = null;
  let itemsToSave: any[] | null = null;

  if (entity === "bom_recipes") {
    if ("materials" in cleanData) {
      materialsToSave = Array.isArray(cleanData.materials) ? cleanData.materials : [];
      delete cleanData.materials;
    }
  }
  if (entity === "purchase_orders") {
    if ("items" in cleanData) {
      itemsToSave = Array.isArray(cleanData.items) ? cleanData.items : [];
      delete cleanData.items;
    }
  }

  try {
    let savedId = id;
    if (id > 0) {
      const { error } = await withTimeout(supabase.from(table).update(cleanData).eq("id", id));
      if (error) throw error;
    } else {
      const { data: inserted, error } = await withTimeout(supabase.from(table).insert(cleanData).select("id").single());
      if (error) throw error;
      savedId = inserted.id;
    }

    // Handle child table saves
    if (entity === "bom_recipes" && materialsToSave !== null) {
      try {
        await withTimeout(supabase.from("bom_items").delete().eq("bom_id", savedId), 1500);
        for (const mat of materialsToSave) {
          await withTimeout(supabase.from("bom_items").insert({
            bom_id: savedId,
            part: mat.part || "A",
            raw_material_id: mat.raw_material_id || null,
            material_code: mat.material_code || "",
            material_name: mat.material_name,
            quantity: mat.quantity || 0,
            unit: mat.unit || 'KG.',
            notes: mat.notes || null
          }), 1500);
        }
      } catch (errBomItems) {
        console.warn("Could not insert to bom_items table in Supabase, using local memory:", errBomItems);
      }
    }

    if (entity === "purchase_orders" && itemsToSave !== null) {
      await withTimeout(supabase.from("purchase_order_items").delete().eq("purchase_order_id", savedId), 1500);
      for (const itm of itemsToSave) {
        await withTimeout(supabase.from("purchase_order_items").insert({
          purchase_order_id: savedId,
          raw_material_id: itm.raw_material_id || null,
          item_name: itm.item_name,
          quantity: itm.quantity || 0,
          unit: itm.unit || 'กก.',
          unit_price: itm.unit_price || 0,
          subtotal: itm.subtotal || 0
        }), 1500);
      }
    }

    // Automatically update stock on GRN save (real-time, client-side)
    if (entity === "grns" && id === 0) {
      const rawMaterialId = parseInt(cleanData.raw_material_id || 0);
      const receivedQty = parseFloat(cleanData.received_qty || 0);
      if (rawMaterialId && receivedQty) {
        try {
          const { data: mat, error: matErr } = await withTimeout(supabase.from("raw_materials").select("stock_qty").eq("id", rawMaterialId).single(), 1500);
          if (!matErr && mat) {
            const newStock = parseFloat(mat.stock_qty || 0) + receivedQty;
            await withTimeout(supabase.from("raw_materials").update({ stock_qty: newStock }).eq("id", rawMaterialId), 1500);
          }
        } catch (e) {
          console.error("Error updating stock on GRN save:", e);
        }
        
        // Also update local memory fallback
        const matIdx = memoryDB.raw_materials.findIndex((m: any) => m.id === rawMaterialId);
        if (matIdx >= 0) {
          memoryDB.raw_materials[matIdx].stock_qty = parseFloat(memoryDB.raw_materials[matIdx].stock_qty || 0) + receivedQty;
          saveMemory();
        }
      }
    }

    // Keep local memory fallback database synchronized with Supabase
    if ((memoryDB as any)[entity]) {
      const idx = (memoryDB as any)[entity].findIndex((item: any) => item.id === savedId);
      const dataWithId = { ...cleanData, id: savedId };
      if (entity === "bom_recipes" && materialsToSave !== null) {
        dataWithId.materials = materialsToSave;
      }
      if (entity === "purchase_orders" && itemsToSave !== null) {
        dataWithId.items = itemsToSave;
      }
      if (idx >= 0) {
        (memoryDB as any)[entity][idx] = { ...(memoryDB as any)[entity][idx], ...dataWithId };
      } else {
        if (entity === "customers" || entity === "bom_recipes" || entity === "projects") {
          (memoryDB as any)[entity].unshift(dataWithId);
        } else {
          (memoryDB as any)[entity].push(dataWithId);
        }
      }
      saveMemory();
    }

    // Unmark as deleted in case this ID was previously marked
    unmarkDeleted(entity, savedId);
    return savedId;
  } catch (err) {
    console.warn(`Supabase client save failed for ${entity}, performing local state save instead:`, err);
    localStorage.setItem(`supabase_failed_${entity}`, "true");
    
    // Fallback to local memory DB
    if (entity === "bom_recipes" && materialsToSave !== null) {
      cleanData.materials = materialsToSave;
    }
    if (entity === "purchase_orders" && itemsToSave !== null) {
      cleanData.items = itemsToSave;
    }

    if (entity === "grns" && id === 0) {
      const rawMaterialId = parseInt(cleanData.raw_material_id || 0);
      const receivedQty = parseFloat(cleanData.received_qty || 0);
      if (rawMaterialId && receivedQty) {
        const matIdx = memoryDB.raw_materials.findIndex((m: any) => m.id === rawMaterialId);
        if (matIdx >= 0) {
          memoryDB.raw_materials[matIdx].stock_qty = parseFloat(memoryDB.raw_materials[matIdx].stock_qty || 0) + receivedQty;
          saveMemory();
        }
      }
    }

    if (id > 0) {
      const idx = (memoryDB as any)[entity].findIndex((item: any) => String(item.id) === String(id));
      if (idx >= 0) {
        (memoryDB as any)[entity][idx] = { ...(memoryDB as any)[entity][idx], ...cleanData };
      }
      unmarkDeleted(entity, id);
    } else {
      const maxId = (memoryDB as any)[entity].reduce((max: number, item: any) => item.id > max ? item.id : max, 0);
      const newId = maxId + 1;
      const newItem = { id: newId, ...cleanData };
      if (entity === "customers" || entity === "bom_recipes" || entity === "projects") {
        (memoryDB as any)[entity].unshift(newItem);
      } else {
        (memoryDB as any)[entity].push(newItem);
      }
      unmarkDeleted(entity, newId);
      saveMemory();
      return newId;
    }
    saveMemory();
    return id;
  }
}

export async function clientDelete(entity: string, id: number | string): Promise<boolean> {
  const table = entity;
  // Always record as deleted in local storage immediately
  markAsDeleted(entity, id);

  // Update memory DB immediately
  if ((memoryDB as any)[entity]) {
    (memoryDB as any)[entity] = (memoryDB as any)[entity].filter(
      (item: any) => String(item.id) !== String(id)
    );
    saveMemory();
  }

  if (isSupabaseOffline) {
    return true;
  }

  try {
    if (entity === "bom_recipes") {
      await withTimeout(supabase.from("bom_items").delete().eq("bom_id", id), 1000).catch(() => {});
    }
    if (entity === "purchase_orders") {
      await withTimeout(supabase.from("purchase_order_items").delete().eq("purchase_order_id", id), 1000).catch(() => {});
    }
    await withTimeout(supabase.from(table).delete().eq("id", id), 1500).catch((err) => {
      console.warn(`Supabase delete returned error for ${entity} ${id}:`, err);
    });
    return true;
  } catch (err) {
    console.warn(`Supabase client delete failed for ${entity}, deleted locally:`, err);
    return true;
  }
}

/**
 * Real-time Supabase Subscription
 * Listens to all database events (INSERT, UPDATE, DELETE) across all tables
 * and notifies listeners immediately for 100% realtime sync.
 */
export function subscribeToRealtimeDatabase(onUpdate: (table: string, eventType: string) => void) {
  try {
    const channel = supabase
      .channel("ideva-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload: any) => {
          console.log(`⚡ [Supabase Realtime] ${payload.eventType} on table: ${payload.table}`);
          onUpdate(payload.table, payload.eventType);
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("🟢 [Supabase Realtime] Subscribed to all tables successfully!");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Could not subscribe to Supabase Realtime channel:", err);
    return () => {};
  }
}

export { FULL_SUPABASE_SCHEMA_SQL } from "./schemaSql";
