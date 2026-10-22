// Optional Sample Seed Data for explicit admin reset into Supabase tables
// NOTE: This is NEVER used as an automatic fallback. 
// When Supabase is empty, queries return [] directly 100%.

export const SAMPLE_SEED_DATA = {
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
      created_at: "2026-06-10 11:20:00"
    }
  ],
  products: [
    { id: 1, code: "P-001", name: "น้ำยาเคลือบแก้วพรีเมียม A", type: "Liquid", version: "v1.0", status: "active", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop" },
    { id: 2, code: "P-002", name: "สารฆ่าเชื้อประสิทธิภาพสูง B", type: "Liquid", version: "v2.1", status: "active", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" },
    { id: 3, code: "P-003", name: "ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C", type: "Powder", version: "v1.0", status: "active", image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop" },
    { id: 4, code: "IDV-SP-003", name: "Rose Soap (สบู่กุหลาบ)", type: "Liquid", version: "v1.0", status: "active", image_url: "https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop" }
  ],
  raw_materials: [
    { id: 1, code: "RM-001", name: "Ethanol 96%", unit: "L.", stock_qty: 120, min_stock: 50, status: "active", unit_price: 65, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop" },
    { id: 2, code: "RM-002", name: "Glycerin USP", unit: "L.", stock_qty: 45, min_stock: 30, status: "active", unit_price: 90, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", image_url: "https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop" },
    { id: 3, code: "RM-003", name: "Sodium Hydroxide (NaOH)", unit: "KG.", stock_qty: 15, min_stock: 20, status: "active", unit_price: 55, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop" },
    { id: 4, code: "RM-004", name: "Hydrogen Peroxide 35%", unit: "L.", stock_qty: 85, min_stock: 40, status: "active", unit_price: 110, supplier_id: 3, supplier_name: "บริษัท นิปปอน เคมิเคิล (ประเทศไทย) จำกัด", image_url: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop" },
    { id: 5, code: "RM-005", name: "Citric Acid Anhydrous", unit: "KG.", stock_qty: 32, min_stock: 25, status: "active", unit_price: 70, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" },
    { id: 6, code: "RMSS-0010", name: "เบสใส", unit: "KG.", stock_qty: 500, min_stock: 100, status: "active", unit_price: 85, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop" },
    { id: 7, code: "RMOP-0013", name: "Gold glitter mica / Gold Super Sparkle Mica (Size D, 200 Micron)", unit: "G.", stock_qty: 1000, min_stock: 200, status: "active", unit_price: 1500, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", image_url: "https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop" },
    { id: 8, code: "RMCL-0009", name: "สีชมพูละลายน้ำ", unit: "G.", stock_qty: 500, min_stock: 100, status: "active", unit_price: 800, supplier_id: 2, supplier_name: "บริษัท ไทยอินกรีเดียนท์ จำกัด", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" },
    { id: 9, code: "RMFL-0232", name: "กลิ่นดอกกุหลาบ", unit: "G.", stock_qty: 2000, min_stock: 500, status: "active", unit_price: 1200, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop" },
    { id: 10, code: "RMVB-003", name: "Vitamin B3 (Niacinamide)", unit: "KG.", stock_qty: 100, min_stock: 20, status: "active", unit_price: 450, supplier_id: 1, supplier_name: "บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด", image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" }
  ],
  bom_recipes: [
    {
      id: 1,
      product_id: 1,
      part_no: "PART-001",
      version: "v1.0",
      status: "active",
      estimated_unit_cost: 65,
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
      part_no: "PART-002",
      version: "v2.1",
      status: "active",
      estimated_unit_cost: 82,
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
      part_no: "PART-003",
      version: "v1.0",
      status: "active",
      estimated_unit_cost: 48,
      notes: "ผงซักล้างสูตรด่างเข้มข้น",
      materials: [
        { part: "A", material_code: "RM-003", material_name: "Sodium Hydroxide (NaOH)", quantity: 50, unit: "KG.", notes: "สารทำปฏิกิริยาด่าง" },
        { part: "B", material_code: "RM-005", material_name: "Citric Acid Anhydrous", quantity: 15, unit: "KG.", notes: "สารปรับปรุงสภาพน้ำ" }
      ]
    },
    {
      id: 4,
      product_id: 4,
      part_no: "BS30",
      version: "v1.0",
      status: "active",
      estimated_unit_cost: 86.5,
      notes: '[{"instruction":"ละลาย Part A ด้วยอุณหภูมิ 60-75องศา จนหมด"},{"instruction":"ผสม Part B ให้เข้ากัน รอให้อุณหภูมิลดลงเหลือ 60องศา แล้วเติมลงใน Part A"},{"instruction":"รออุณหภูมิลดลงเหลือ 50-55องศา แล้วเติมลงใน Part A/B"}]',
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
        { raw_material_id: 1, item_name: "Ethanol 96%", quantity: 200, unit: "L.", unit_price: 65, subtotal: 13000 },
        { raw_material_id: 2, item_name: "Glycerin USP", quantity: 40, unit: "L.", unit_price: 60, subtotal: 2400 }
      ]
    },
    {
      id: 2,
      code: "PRM-2026-0022",
      supplier: "บริษัท ไทยอินกรีเดียนท์ จำกัด",
      order_date: "2026-06-15",
      status: "received",
      total_amount: 9000,
      items: [
        { raw_material_id: 3, item_name: "Sodium Hydroxide (NaOH)", quantity: 100, unit: "KG.", unit_price: 55, subtotal: 5500 },
        { raw_material_id: 5, item_name: "Citric Acid Anhydrous", quantity: 50, unit: "KG.", unit_price: 70, subtotal: 3500 }
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
    }
  ],
  prechecks: [
    {
      id: 1,
      material: "Ethanol 96%",
      lot: "L260610-A",
      expiry: "2028-06-10",
      inspector: "ภก.วิชัย",
      date: "2026-06-12",
      result: "pass"
    },
    {
      id: 2,
      material: "Glycerin USP",
      lot: "L260611-B",
      expiry: "2027-12-31",
      inspector: "ดร.สุภา",
      date: "2026-06-14",
      result: "pass"
    },
    {
      id: 3,
      material: "Sodium Hydroxide (NaOH)",
      lot: "L260615-001",
      expiry: "2028-06-15",
      inspector: "นพพร ตรวจสอบ",
      date: "2026-06-16",
      result: "pending"
    }
  ],
  inventory_pack: [
    { id: 1, code: "PKG-001", type: "ขวด", name: "ขวด HDPE ทึบแสง 1,000 ml", qty: 3500, unit: "ขวด", status: "active" },
    { id: 2, code: "PKG-002", type: "ฝา", name: "ฝาเกลียวกันรั่วซึม 28mm สีขาว", qty: 4200, unit: "ชิ้น", status: "active" },
    { id: 3, code: "PKG-003", type: "กล่อง", name: "กล่องกระดาษลูกฟูกบรรจุ 12 ขวด", qty: 450, unit: "ใบ", status: "active" },
    { id: 4, code: "PKG-004", type: "ฉลาก", name: "ฉลากฟอยล์กันน้ำ P-001 เคลือบเงา", qty: 5000, unit: "ดวง", status: "active" },
    { id: 5, code: "PKG-005", type: "ขวด", name: "ขวด PET ใสทรงกระบอก 500 ml", qty: 2800, unit: "ขวด", status: "active" },
    { id: 6, code: "PKG-006", type: "หัวปั๊ม", name: "หัวปั๊มโลชั่นคอยาว 24/410 สีขาว", qty: 1900, unit: "ชิ้น", status: "active" }
  ],
  projects: [
    {
      id: 1,
      title: "สบู่ก้อนมังคุด SMBS",
      project_type: "ลูกค้า",
      customer: "SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้",
      customer_status: "ลูกค้า",
      owner: "ผู้จัดการฝ่ายผลิต",
      price: 65000,
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
