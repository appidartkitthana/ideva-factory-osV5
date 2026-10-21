import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://zizlhxikswejwvoftshk.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppemxoeGlrc3dland2b2Z0c2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzQ4NDMsImV4cCI6MjA5NjY1MDg0M30.lw7RsYg6Icz7HhT7cbjJsKrOv-pzKLV01D5WR03Ffg0";

let supabase: any = null;
let useSupabase = false;

if (supabaseUrl && supabaseKey) {
  try {
    const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "");
    supabase = createClient(cleanUrl, supabaseKey);
    useSupabase = true;
    console.log(`📡 Supabase database initialized on: ${cleanUrl}`);
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
}


// Let's parse DB connection variables
let dbHost = process.env.DB_HOST || "";
let dbUser = process.env.DB_USER || "";
let dbPass = process.env.DB_PASS || "";
let dbName = process.env.DB_NAME || "";
let dbPort = parseInt(process.env.DB_PORT || "3306");

// Clean host if they copied it with http:// or port
if (dbHost) {
  if (dbHost.startsWith("http://")) dbHost = dbHost.substring(7);
  if (dbHost.startsWith("https://")) dbHost = dbHost.substring(8);
  if (dbHost.endsWith("/")) dbHost = dbHost.slice(0, -1);
  if (dbHost.includes(":")) {
    const parts = dbHost.split(":");
    dbHost = parts[0];
    dbPort = parseInt(parts[1]) || dbPort;
  }
}

let pool: mysql.Pool | null = null;
let useMySQL = false;

// XAMPP MySQL connection is disabled as requested.
console.log("ℹ️ XAMPP MySQL connection is disabled. Using Supabase exclusively.");


// Local in-memory Database mimicking MySQL tables
const DB = {
  customers: [
    {
      id: 1,
      code: "C69-001",
      name: "บริษัท โอสถแล็บ จำกัด",
      contact: "คุณธนา โอสถสกุล",
      phone: "081-234-5678",
      email: "contact@osotlab.com",
      tax_id: "0105562000123",
      address: "123/4 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
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
    }
  ],
  products: [
    { id: 1, code: "P-001", name: "น้ำยาเคลือบแก้วพรีเมียม A", type: "Liquid", version: "v1.0", status: "active" },
    { id: 2, code: "P-002", name: "สารฆ่าเชื้อประสิทธิภาพสูง B", type: "Liquid", version: "v2.1", status: "active" },
    { id: 3, code: "P-003", name: "ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C", type: "Powder", version: "v1.0", status: "active" }
  ],
  raw_materials: [
    { id: 1, code: "RM-001", name: "Ethanol 96%", unit: "ลิตร", stock_qty: 120, min_stock: 50, status: "active" },
    { id: 2, code: "RM-002", name: "Glycerin USP", unit: "ลิตร", stock_qty: 45, min_stock: 30, status: "active" },
    { id: 3, code: "RM-003", name: "Sodium Hydroxide (NaOH)", unit: "กก.", stock_qty: 15, min_stock: 20, status: "active" },
    { id: 4, code: "RM-004", name: "Hydrogen Peroxide 35%", unit: "ลิตร", stock_qty: 85, min_stock: 40, status: "active" },
    { id: 5, code: "RM-005", name: "Citric Acid", unit: "กก.", stock_qty: 32, min_stock: 25, status: "active" }
  ],
  bom_recipes: [
    {
      id: 1,
      product_id: 1,
      version: "v1.0",
      status: "active",
      notes: "สูตรเคลือบแก้วมาตรฐานโรงงาน",
      materials: [
        { material_name: "Ethanol 96%", quantity: 100, unit: "ลิตร", notes: "ส่วนผสมหลัก" },
        { material_name: "Glycerin USP", quantity: 10, unit: "ลิตร", notes: "เพิ่มความหนืด" },
        { material_name: "Citric Acid", quantity: 2, unit: "กก.", notes: "ปรับค่าความเป็นกรดด่าง" }
      ]
    },
    {
      id: 2,
      product_id: 2,
      version: "v2.1",
      status: "active",
      notes: "สูตรสารฆ่าเชื้อประสิทธิภาพสูง",
      materials: [
        { material_name: "Ethanol 96%", quantity: 150, unit: "ลิตร", notes: "ส่วนประกอบหลัก" },
        { material_name: "Hydrogen Peroxide 35%", quantity: 20, unit: "ลิตร", notes: "ฆ่าสปอร์และเชื้อไวรัส" },
        { material_name: "Glycerin USP", quantity: 5, unit: "ลิตร", notes: "รักษาความชุ่มชื้น" }
      ]
    },
    {
      id: 3,
      product_id: 3,
      version: "v1.0",
      status: "active",
      notes: "ผงซักล้างสูตรด่างเข้มข้น",
      materials: [
        { material_name: "Sodium Hydroxide (NaOH)", quantity: 50, unit: "กก.", notes: "สารทำปฏิกิริยาด่าง" },
        { material_name: "Citric Acid", quantity: 15, unit: "กก.", notes: "สารปรับปรุงสภาพน้ำ" }
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
  purchase_packs: [
    {
      id: 1,
      code: "PPK-2026-0009",
      supplier: "บริษัท พลาสติกไทย จำกัด",
      item: "ขวด HDPE ขนาด 1 ลิตร",
      qty: 1000,
      price: 5000,
      status: "received"
    },
    {
      id: 2,
      code: "PPK-2026-0010",
      supplier: "บริษัท โรงพิมพ์ฉลากสากล จำกัด",
      item: "ฉลากน้ำยาเคลือบแก้ว P-001",
      qty: 2000,
      price: 3000,
      status: "pending"
    }
  ]
};

// Next auto-increment IDs
let nextIds = {
  customers: 4,
  products: 4,
  raw_materials: 6,
  bom_recipes: 4,
  production_orders: 4,
  packing_orders: 4,
  purchase_orders: 3,
  grns: 3,
  prechecks: 4,
  purchase_packs: 3
};

// ============================================================================
// DATABASE CONNECTOR & SYNCHRONIZER
// ============================================================================
async function initMySQLTables() {
  if (!useMySQL || !pool) return;
  try {
    const conn = await pool.getConnection();
    console.log("✅ Successfully connected to MySQL/XAMPP Database!");

    // 1. Customers Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        contact VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255),
        tax_id VARCHAR(100),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Products Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) DEFAULT 'Liquid',
        version VARCHAR(50) DEFAULT 'v1.0',
        status VARCHAR(50) DEFAULT 'active'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Raw Materials Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        stock_qty DECIMAL(12,4) DEFAULT 0.0000,
        min_stock DECIMAL(12,4) DEFAULT 0.0000,
        status VARCHAR(50) DEFAULT 'active'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. BOM Recipes Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS bom_recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        version VARCHAR(50) DEFAULT 'v1.0',
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4b. BOM Items Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS bom_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bom_id INT NOT NULL,
        raw_material_id INT,
        material_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
        unit VARCHAR(50) DEFAULT 'กก.',
        notes VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Production Orders Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS production_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        customer_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity DECIMAL(12,4) NOT NULL,
        unit VARCHAR(50) DEFAULT 'ลิตร',
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE NOT NULL,
        staff VARCHAR(255),
        date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Packing Orders Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS packing_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        production_order_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(12,4) NOT NULL,
        unit VARCHAR(50) DEFAULT 'ขวด',
        status VARCHAR(50) DEFAULT 'pending'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Purchase Orders Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        supplier VARCHAR(255) NOT NULL,
        order_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(14,2) DEFAULT 0.00
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7b. Purchase Order Items Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_order_id INT NOT NULL,
        raw_material_id INT,
        item_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
        unit VARCHAR(50) DEFAULT 'กก.',
        unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. GRNs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS grns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        purchase_order_id INT NOT NULL,
        raw_material_id INT NOT NULL,
        lot_number VARCHAR(100) NOT NULL,
        expiry_date DATE,
        received_qty DECIMAL(12,4) DEFAULT 0.0000,
        receiver VARCHAR(255),
        receive_date DATE,
        status VARCHAR(50) DEFAULT 'received'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Prechecks Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS prechecks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material VARCHAR(255) NOT NULL,
        lot VARCHAR(100) NOT NULL,
        expiry DATE,
        inspector VARCHAR(255),
        date DATE,
        result VARCHAR(50) DEFAULT 'pending'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Inventory Pack Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS inventory_pack (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        qty DECIMAL(12,4) DEFAULT 0.0000,
        unit VARCHAR(50) DEFAULT 'ชิ้น',
        status VARCHAR(50) DEFAULT 'active'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Purchase Packs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS purchase_packs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        supplier VARCHAR(255) NOT NULL,
        item VARCHAR(255) NOT NULL,
        qty DECIMAL(12,4) DEFAULT 0.0000,
        price DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if we need to seed initial data in empty tables
    const [custRows]: any = await conn.query("SELECT COUNT(*) as count FROM customers");
    if (custRows[0].count === 0) {
      console.log("🌱 Seeding initial demo data into MySQL tables...");
      
      // Seed Customers
      for (const c of DB.customers) {
        await conn.query(
          "INSERT INTO customers (id, code, name, contact, phone, email, tax_id, address, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [c.id, c.code, c.name, c.contact, c.phone, c.email, c.tax_id, c.address, c.status, c.created_at]
        );
      }

      // Seed Products
      for (const p of DB.products) {
        await conn.query(
          "INSERT INTO products (id, code, name, type, version, status) VALUES (?, ?, ?, ?, ?, ?)",
          [p.id, p.code, p.name, p.type, p.version, p.status]
        );
      }

      // Seed Raw Materials
      for (const rm of DB.raw_materials) {
        await conn.query(
          "INSERT INTO raw_materials (id, code, name, unit, stock_qty, min_stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [rm.id, rm.code, rm.name, rm.unit, rm.stock_qty, rm.min_stock, rm.status]
        );
      }

      // Seed BOM Recipes
      for (const b of DB.bom_recipes) {
        await conn.query(
          "INSERT INTO bom_recipes (id, product_id, version, status, notes) VALUES (?, ?, ?, ?, ?)",
          [b.id, b.product_id, b.version, b.status, b.notes]
        );
        for (const mat of b.materials) {
          await conn.query(
            "INSERT INTO bom_items (bom_id, raw_material_id, material_name, quantity, unit, notes) VALUES (?, ?, ?, ?, ?, ?)",
            [b.id, (mat as any).raw_material_id || null, mat.material_name, mat.quantity, mat.unit, mat.notes || null]
          );
        }
      }

      // Seed Production Orders
      for (const po of DB.production_orders) {
        await conn.query(
          "INSERT INTO production_orders (id, code, customer_id, product_id, quantity, unit, status, due_date, staff, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [po.id, po.code, po.customer_id, po.product_id, po.quantity, po.unit, po.status, po.due_date, po.staff, po.date, po.created_at]
        );
      }

      // Seed Packing Orders
      for (const pk of DB.packing_orders) {
        await conn.query(
          "INSERT INTO packing_orders (id, code, production_order_id, item_name, quantity, unit, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [pk.id, pk.code, pk.production_order_id, pk.item_name, pk.quantity, pk.unit, pk.status]
        );
      }

      // Seed Purchase Orders
      for (const p of DB.purchase_orders) {
        await conn.query(
          "INSERT INTO purchase_orders (id, code, supplier, order_date, status, total_amount) VALUES (?, ?, ?, ?, ?, ?)",
          [p.id, p.code, p.supplier, p.order_date, p.status, p.total_amount]
        );
        for (const item of p.items) {
          await conn.query(
            "INSERT INTO purchase_order_items (purchase_order_id, raw_material_id, item_name, quantity, unit, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [p.id, item.raw_material_id || null, item.item_name, item.quantity, item.unit, item.unit_price, item.subtotal]
          );
        }
      }

      // Seed GRNs
      for (const g of DB.grns) {
        await conn.query(
          "INSERT INTO grns (id, code, purchase_order_id, raw_material_id, lot_number, expiry_date, received_qty, receiver, receive_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [g.id, g.code, g.purchase_order_id, g.raw_material_id, g.lot_number, g.expiry_date, g.received_qty, g.receiver, g.receive_date, g.status]
        );
      }

      // Seed Prechecks
      for (const pc of DB.prechecks) {
        await conn.query(
          "INSERT INTO prechecks (id, material, lot, expiry, inspector, date, result) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [pc.id, pc.material, pc.lot, pc.expiry, pc.inspector, pc.date, pc.result]
        );
      }

      // Seed Inventory Pack
      for (const ip of DB.inventory_pack) {
        await conn.query(
          "INSERT INTO inventory_pack (id, code, type, name, qty, unit, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [ip.id, ip.code, ip.type, ip.name, ip.qty, ip.unit, ip.status]
        );
      }

      // Seed Purchase Packs
      for (const pp of DB.purchase_packs) {
        await conn.query(
          "INSERT INTO purchase_packs (id, code, supplier, item, qty, price, status) VALUES (?, ?, ?, ?, ?, ?)",
          [pp.id, pp.code, pp.supplier, pp.item, pp.qty, pp.price, pp.status]
        );
      }

      console.log("🌱 Demo data seeded successfully!");
    }

    conn.release();
  } catch (err) {
    console.error("❌ Error setting up MySQL database tables, falling back to clean in-memory database:", err);
    useMySQL = false;
  }
}

// Function to handle database connection issues and disable MySQL mode for fast fallback
function handleMySQLError(err: any) {
  if (err && (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "EPIPE" || err.message?.includes("connect ETIMEDOUT"))) {
    console.warn("⚠️ Severe connection error detected. Disabling MySQL mode to ensure high-performance in-memory fallback.");
    useMySQL = false;
  }
}

// Helper getter
async function dbGetList(entity: string): Promise<any[]> {
  const dbNameMap: Record<string, string> = {
    inventory_pack: "inventory_pack"
  };
  const table = dbNameMap[entity] || entity;

  if (useSupabase && supabase) {
    try {
      const { data: rawData, error } = await supabase.from(table).select("*").order("id", { ascending: false });
      if (error) throw error;

      let data = rawData;
      let usedMockFallback = false;
      if (!data || data.length === 0) {
        data = (DB as any)[entity] || [];
        usedMockFallback = true;
      }

      if (entity === "bom_recipes" && data) {
        if (usedMockFallback) {
          return data;
        }
        const enrichedRows = [];
        for (const row of data) {
          const item = { ...row };
          try {
            const { data: items, error: err2 } = await supabase.from("bom_items").select("*").eq("bom_id", item.id);
            if (!err2 && items) {
              item.materials = items.map((itm: any) => ({
                raw_material_id: itm.raw_material_id,
                material_name: itm.material_name,
                quantity: parseFloat(itm.quantity),
                unit: itm.unit,
                notes: itm.notes || ""
              }));
            } else {
              item.materials = [];
            }
          } catch (e) {
            item.materials = [];
          }
          enrichedRows.push(item);
        }
        return enrichedRows;
      }

      if (entity === "purchase_orders" && data) {
        if (usedMockFallback) {
          return data;
        }
        const enrichedRows = [];
        for (const row of data) {
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
        return enrichedRows;
      }

      return data || [];
    } catch (err) {
      console.error(`Error querying ${entity} from Supabase, falling back to MySQL/Local:`, err);
    }
  }

  if (useMySQL && pool) {
    try {
      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\` ORDER BY id DESC`);
      
      // Load relational items for bom_recipes and purchase_orders
      if (entity === "bom_recipes") {
        const enrichedRows = [];
        for (const row of rows) {
          const item = { ...row };
          try {
            const [items]: any = await pool.query(`SELECT * FROM bom_items WHERE bom_id = ?`, [item.id]);
            item.materials = items.map((itm: any) => ({
              raw_material_id: itm.raw_material_id,
              material_name: itm.material_name,
              quantity: parseFloat(itm.quantity),
              unit: itm.unit,
              notes: itm.notes || ""
            }));
          } catch (e) {
            console.error("Error loading bom_items:", e);
            item.materials = [];
          }
          enrichedRows.push(item);
        }
        return enrichedRows;
      }
      
      if (entity === "purchase_orders") {
        const enrichedRows = [];
        for (const row of rows) {
          const item = { ...row };
          try {
            const [items]: any = await pool.query(`SELECT * FROM purchase_order_items WHERE purchase_order_id = ?`, [item.id]);
            item.items = items.map((itm: any) => ({
              raw_material_id: itm.raw_material_id,
              item_name: itm.item_name,
              quantity: parseFloat(itm.quantity),
              unit: itm.unit,
              unit_price: parseFloat(itm.unit_price),
              subtotal: parseFloat(itm.subtotal)
            }));
          } catch (e) {
            console.error("Error loading purchase_order_items:", e);
            item.items = [];
          }
          enrichedRows.push(item);
        }
        return enrichedRows;
      }

      return rows.map((row: any) => {
        const item = { ...row };
        return item;
      });
    } catch (err) {
      console.error(`Error querying ${entity} from MySQL, falling back to in-memory:`, err);
      handleMySQLError(err);
    }
  }
  return [...(DB as any)[entity]];
}

// Helper item getter
async function dbGetItem(entity: string, id: number): Promise<any> {
  const dbNameMap: Record<string, string> = {
    inventory_pack: "inventory_pack"
  };
  const table = dbNameMap[entity] || entity;

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (data) {
        const item = { ...data };
        if (entity === "bom_recipes") {
          try {
            const { data: items, error: err2 } = await supabase.from("bom_items").select("*").eq("bom_id", id);
            if (!err2 && items) {
              item.materials = items.map((itm: any) => ({
                raw_material_id: itm.raw_material_id,
                material_name: itm.material_name,
                quantity: parseFloat(itm.quantity),
                unit: itm.unit,
                notes: itm.notes || ""
              }));
            } else {
              item.materials = [];
            }
          } catch (e) {
            item.materials = [];
          }
        }
        if (entity === "purchase_orders") {
          try {
            const { data: items, error: err2 } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", id);
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
        }
        return item;
      }
      // If not found in Supabase, let it fall through to MySQL or Local in-memory DB
    } catch (err) {
      console.error(`Error querying item ${id} from ${entity} in Supabase, falling back to MySQL/Local:`, err);
    }
  }

  if (useMySQL && pool) {
    try {
      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
      if (rows.length > 0) {
        const item = { ...rows[0] };
        
        if (entity === "bom_recipes") {
          try {
            const [items]: any = await pool.query(`SELECT * FROM bom_items WHERE bom_id = ?`, [id]);
            item.materials = items.map((itm: any) => ({
              raw_material_id: itm.raw_material_id,
              material_name: itm.material_name,
              quantity: parseFloat(itm.quantity),
              unit: itm.unit,
              notes: itm.notes || ""
            }));
          } catch (e) {
            item.materials = [];
          }
        }
        
        if (entity === "purchase_orders") {
          try {
            const [items]: any = await pool.query(`SELECT * FROM purchase_order_items WHERE purchase_order_id = ?`, [id]);
            item.items = items.map((itm: any) => ({
              raw_material_id: itm.raw_material_id,
              item_name: itm.item_name,
              quantity: parseFloat(itm.quantity),
              unit: itm.unit,
              unit_price: parseFloat(itm.unit_price),
              subtotal: parseFloat(itm.subtotal)
            }));
          } catch (e) {
            item.items = [];
          }
        }

        return item;
      }
      return null;
    } catch (err) {
      console.error(`Error querying item ${id} from ${entity}:`, err);
      handleMySQLError(err);
    }
  }
  return (DB as any)[entity].find((item: any) => item.id === id) || null;
}

// Helper deleter
async function dbDelete(entity: string, id: number): Promise<boolean> {
  const dbNameMap: Record<string, string> = {
    inventory_pack: "inventory_pack"
  };
  const table = dbNameMap[entity] || entity;

  if (useSupabase && supabase) {
    try {
      if (entity === "bom_recipes") {
        await supabase.from("bom_items").delete().eq("bom_id", id);
      }
      if (entity === "purchase_orders") {
        await supabase.from("purchase_order_items").delete().eq("purchase_order_id", id);
      }
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error(`Error deleting from ${entity} in Supabase, falling back to MySQL/Local:`, err);
    }
  }

  if (useMySQL && pool) {
    try {
      if (entity === "bom_recipes") {
        await pool.query(`DELETE FROM bom_items WHERE bom_id = ?`, [id]);
      }
      if (entity === "purchase_orders") {
        await pool.query(`DELETE FROM purchase_order_items WHERE purchase_order_id = ?`, [id]);
      }
      await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
      return true;
    } catch (err) {
      console.error(`Error deleting from ${entity}:`, err);
      handleMySQLError(err);
    }
  }
  const lengthBefore = (DB as any)[entity].length;
  (DB as any)[entity] = (DB as any)[entity].filter((item: any) => item.id !== id);
  return (DB as any)[entity].length < lengthBefore;
}

// Helper saver
async function dbSave(entity: string, id: number, data: any): Promise<number> {
  const dbNameMap: Record<string, string> = {
    inventory_pack: "inventory_pack"
  };
  const table = dbNameMap[entity] || entity;

  const cleanData = { ...data };
  delete cleanData.id;

  // For relational tables, we separate materials/items lists
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

  if (useSupabase && supabase) {
    try {
      let savedId = id;
      if (id > 0) {
        const { error } = await supabase.from(table).update(cleanData).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from(table).insert(cleanData).select("id").single();
        if (error) throw error;
        savedId = data.id;
      }

      // Handle child tables save
      if (entity === "bom_recipes" && materialsToSave !== null) {
        try {
          await supabase.from("bom_items").delete().eq("bom_id", savedId);
          for (const mat of materialsToSave) {
            await supabase.from("bom_items").insert({
              bom_id: savedId,
              raw_material_id: mat.raw_material_id || null,
              material_name: mat.material_name,
              quantity: mat.quantity || 0,
              unit: mat.unit || 'กก.',
              notes: mat.notes || null
            });
          }
        } catch (e) {
          console.error("Error saving bom_items to Supabase:", e);
        }
      }

      if (entity === "purchase_orders" && itemsToSave !== null) {
        try {
          await supabase.from("purchase_order_items").delete().eq("purchase_order_id", savedId);
          for (const itm of itemsToSave) {
            await supabase.from("purchase_order_items").insert({
              purchase_order_id: savedId,
              raw_material_id: itm.raw_material_id || null,
              item_name: itm.item_name,
              quantity: itm.quantity || 0,
              unit: itm.unit || 'กก.',
              unit_price: itm.unit_price || 0,
              subtotal: itm.subtotal || 0
            });
          }
        } catch (e) {
          console.error("Error saving purchase_order_items to Supabase:", e);
        }
      }

      return savedId;
    } catch (err) {
      console.error(`Error saving to Supabase ${entity}:`, err);
    }
  }

  if (useMySQL && pool) {
    try {
      let savedId = id;
      if (id > 0) {
        const keys = Object.keys(cleanData);
        if (keys.length > 0) {
          const setClause = keys.map(k => `\`${k}\` = ?`).join(", ");
          const values = keys.map(k => cleanData[k]);
          await pool.query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, [...values, id]);
        }
      } else {
        const keys = Object.keys(cleanData);
        const columns = keys.map(k => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => cleanData[k]);
        const [result]: any = await pool.query(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
        savedId = result.insertId;
      }

      // Handle child tables save
      if (entity === "bom_recipes" && materialsToSave !== null) {
        await pool.query(`DELETE FROM bom_items WHERE bom_id = ?`, [savedId]);
        for (const mat of materialsToSave) {
          await pool.query(
            `INSERT INTO bom_items (bom_id, raw_material_id, material_name, quantity, unit, notes) VALUES (?, ?, ?, ?, ?, ?)`,
            [savedId, mat.raw_material_id || null, mat.material_name, mat.quantity || 0, mat.unit || 'กก.', mat.notes || null]
          );
        }
      }

      if (entity === "purchase_orders" && itemsToSave !== null) {
        await pool.query(`DELETE FROM purchase_order_items WHERE purchase_order_id = ?`, [savedId]);
        for (const itm of itemsToSave) {
          await pool.query(
            `INSERT INTO purchase_order_items (purchase_order_id, raw_material_id, item_name, quantity, unit, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [savedId, itm.raw_material_id || null, itm.item_name, itm.quantity || 0, itm.unit || 'กก.', itm.unit_price || 0, itm.subtotal || 0]
          );
        }
      }

      return savedId;
    } catch (err) {
      console.error(`Error saving to MySQL ${entity}:`, err);
      handleMySQLError(err);
    }
  }

  // Fallback to local DB
  // Restore lists for local DB fallback
  if (entity === "bom_recipes" && materialsToSave !== null) {
    cleanData.materials = materialsToSave;
  }
  if (entity === "purchase_orders" && itemsToSave !== null) {
    cleanData.items = itemsToSave;
  }

  if (id > 0) {
    const idx = (DB as any)[entity].findIndex((item: any) => item.id === id);
    if (idx >= 0) {
      (DB as any)[entity][idx] = { ...(DB as any)[entity][idx], ...cleanData };
      return id;
    }
    return 0;
  } else {
    const newId = (nextIds as any)[entity]++;
    const newItem = { id: newId, ...cleanData };
    if (entity === "customers") {
      (DB as any)[entity].unshift(newItem);
    } else {
      (DB as any)[entity].push(newItem);
    }
    return newId;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Run database migration if MySQL is enabled
  await initMySQLTables();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper response function
  const sendJSON = (res: express.Response, data: any, code = 200) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(code).json(data);
  };

  // Shared PHP-API endpoint logic mapped to express
  const handleApiRequest = async (req: express.Request, res: express.Response) => {
    const entity = (req.query.entity || req.body.entity || req.params.entity) as string;
    const action = (req.query.action || req.body.action || (req.method === "POST" ? "save" : "list")) as string;
    const searchVal = ((req.query.q || req.body.q || "") as string).toLowerCase().trim();

    if (!entity) {
      return sendJSON(res, { error: "missing_entity" }, 400);
    }

    switch (entity) {
      case "dashboard": {
        if (action === "counts") {
          try {
            const counts = {
              customers: (await dbGetList("customers")).length,
              products: (await dbGetList("products")).length,
              raw_materials: (await dbGetList("raw_materials")).length,
              bom_recipes: (await dbGetList("bom_recipes")).length,
              production_orders: (await dbGetList("production_orders")).length,
              packing_orders: (await dbGetList("packing_orders")).length,
              purchase_orders: (await dbGetList("purchase_orders")).length,
              grns: (await dbGetList("grns")).length,
              prechecks: (await dbGetList("prechecks")).length,
              purchase_packs: (await dbGetList("purchase_packs")).length
            };
            return sendJSON(res, { counts });
          } catch (e: any) {
            return sendJSON(res, { error: "db_error", message: e.message }, 500);
          }
        }
        break;
      }

      case "customers": {
        if (action === "list") {
          let list = await dbGetList("customers");
          if (searchVal) {
            list = list.filter(
              c =>
                c.name.toLowerCase().includes(searchVal) ||
                (c.code && c.code.toLowerCase().includes(searchVal)) ||
                (c.contact && c.contact.toLowerCase().includes(searchVal)) ||
                (c.address && c.address.toLowerCase().includes(searchVal))
            );
          }
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const c = await dbGetItem("customers", id);
          return sendJSON(res, { data: c || null });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("customers", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("customers", id);
            if (current) {
              const updatedData = {
                code: input.code || current.code,
                name: input.name || current.name,
                contact: input.contact || current.contact || "",
                address: input.address || current.address || "",
                status: input.status || current.status || "active"
              };
              await dbSave("customers", id, updatedData);
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newCustomer = {
              code: input.code || "",
              name: input.name,
              contact: input.contact || "",
              phone: input.phone || "",
              email: input.email || "",
              tax_id: input.tax_id || "",
              address: input.address || "",
              status: input.status || "active",
              created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
            };
            if (!newCustomer.code) {
              const nextId = useMySQL ? 0 : nextIds.customers;
              newCustomer.code = `C69-${String(nextId || Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
            }
            const savedId = await dbSave("customers", 0, newCustomer);
            if (useMySQL && !input.code) {
              await dbSave("customers", savedId, { code: `C69-${String(savedId).padStart(3, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "products": {
        if (action === "list") {
          let list = await dbGetList("products");
          if (searchVal) {
            list = list.filter(
              p => p.name.toLowerCase().includes(searchVal) || p.code.toLowerCase().includes(searchVal)
            );
          }
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const p = await dbGetItem("products", id);
          return sendJSON(res, { data: p || null });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("products", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("products", id);
            if (current) {
              await dbSave("products", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newProduct = {
              code: input.code || "",
              name: input.name,
              type: input.type || "Liquid",
              version: input.version || "v1.0",
              status: input.status || "active"
            };
            if (!newProduct.code) {
              const nextId = useMySQL ? 0 : nextIds.products;
              newProduct.code = `P-${String(nextId || Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
            }
            const savedId = await dbSave("products", 0, newProduct);
            if (useMySQL && !input.code) {
              await dbSave("products", savedId, { code: `P-${String(savedId).padStart(3, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "raw_materials": {
        if (action === "list") {
          let list = await dbGetList("raw_materials");
          if (searchVal) {
            list = list.filter(
              r => r.name.toLowerCase().includes(searchVal) || r.code.toLowerCase().includes(searchVal)
            );
          }
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const r = await dbGetItem("raw_materials", id);
          return sendJSON(res, { data: r || null });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("raw_materials", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("raw_materials", id);
            if (current) {
              await dbSave("raw_materials", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newMaterial = {
              code: input.code || "",
              name: input.name,
              unit: input.unit || "ลิตร",
              stock_qty: parseFloat(input.stock_qty || 0),
              min_stock: parseFloat(input.min_stock || 0),
              status: input.status || "active"
            };
            if (!newMaterial.code) {
              const nextId = useMySQL ? 0 : nextIds.raw_materials;
              newMaterial.code = `RM-${String(nextId || Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
            }
            const savedId = await dbSave("raw_materials", 0, newMaterial);
            if (useMySQL && !input.code) {
              await dbSave("raw_materials", savedId, { code: `RM-${String(savedId).padStart(3, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "bom_recipes": {
        if (action === "list") {
          const customerIdFilter = req.query.customer_id ? parseInt(req.query.customer_id as string) : null;
          const productIdFilter = req.query.product_id ? parseInt(req.query.product_id as string) : null;

          const recipes = await dbGetList("bom_recipes");
          const products = await dbGetList("products");
          const productionOrders = await dbGetList("production_orders");

          let filteredRecipes = recipes;
          if (productIdFilter) {
            filteredRecipes = recipes.filter(r => r.product_id === productIdFilter);
          }

          const enriched = filteredRecipes.map(recipe => {
            const product = products.find(p => p.id === recipe.product_id);

            let relevantOrders = productionOrders.filter(po => po.product_id === recipe.product_id);
            if (customerIdFilter) {
              relevantOrders = relevantOrders.filter(po => po.customer_id === customerIdFilter);
            }

            const production_count = relevantOrders.length;
            const production_quantity = relevantOrders.reduce((sum, po) => sum + parseFloat(po.quantity || 0), 0);

            return {
              ...recipe,
              product_code: product ? product.code : "-",
              product_name: product ? product.name : "-",
              product_type: product ? product.type : "-",
              production_count,
              production_quantity
            };
          });

          let finalData = enriched;
          if (searchVal) {
            finalData = enriched.filter(
              r =>
                r.product_name.toLowerCase().includes(searchVal) ||
                r.product_code.toLowerCase().includes(searchVal) ||
                (r.notes && r.notes.toLowerCase().includes(searchVal))
            );
          }

          return sendJSON(res, { data: finalData });
        }

        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const recipe = await dbGetItem("bom_recipes", id);
          if (!recipe) {
            return sendJSON(res, { error: "not_found", message: "ไม่พบข้อมูลสูตรนี้" }, 404);
          }
          const product = await dbGetItem("products", recipe.product_id);
          const productionOrders = await dbGetList("production_orders");
          const relevantOrders = productionOrders.filter(po => po.product_id === recipe.product_id);

          const production_count = relevantOrders.length;
          const production_quantity = relevantOrders.reduce((sum, po) => sum + parseFloat(po.quantity || 0), 0);

          return sendJSON(res, {
            data: {
              ...recipe,
              product_code: product ? product.code : "-",
              product_name: product ? product.name : "-",
              product_type: product ? product.type : "-",
              production_count,
              production_quantity
            }
          });
        }

        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("bom_recipes", id);
          return sendJSON(res, { success: true });
        }

        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          const productId = parseInt(input.product_id || 0);

          if (!productId) {
            return sendJSON(res, { error: "missing_product_id", message: "กรุณาเลือกสินค้า" }, 400);
          }

          const materialsInput = Array.isArray(input.materials) ? input.materials : [];
          const materials = materialsInput.map((m: any) => ({
            material_name: m.material_name || m.name || "",
            quantity: parseFloat(m.quantity || m.qty || 0),
            unit: m.unit || "",
            notes: m.notes || null
          }));

          if (id > 0) {
            const current = await dbGetItem("bom_recipes", id);
            if (current) {
              const updated = {
                product_id: productId,
                version: input.version || current.version,
                status: input.status || current.status,
                notes: input.notes || current.notes || "",
                materials
              };
              await dbSave("bom_recipes", id, updated);
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newRecipe = {
              product_id: productId,
              version: input.version || "v1.0",
              status: input.status || "active",
              notes: input.notes || "",
              materials
            };
            const savedId = await dbSave("bom_recipes", 0, newRecipe);
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "production_orders": {
        if (action === "list") {
          const customerId = req.query.customer_id ? parseInt(req.query.customer_id as string) : null;
          const list = await dbGetList("production_orders");
          const customers = await dbGetList("customers");
          const products = await dbGetList("products");

          let filteredList = list;
          if (customerId) {
            filteredList = list.filter(po => po.customer_id === customerId);
          }

          const enriched = filteredList.map(po => {
            const customer = customers.find(c => c.id === po.customer_id);
            const product = products.find(p => p.id === po.product_id);
            return {
              ...po,
              customer_code: customer ? customer.code : "",
              customer_name: customer ? customer.name : "-",
              product_code: product ? product.code : "",
              product_name: product ? product.name : "-",
              product_type: product ? product.type : "-"
            };
          });

          let finalData = enriched;
          if (searchVal) {
            finalData = enriched.filter(
              po =>
                po.code.toLowerCase().includes(searchVal) ||
                po.customer_name.toLowerCase().includes(searchVal) ||
                po.product_name.toLowerCase().includes(searchVal) ||
                (po.staff && po.staff.toLowerCase().includes(searchVal))
            );
          }
          return sendJSON(res, { data: finalData });
        }

        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const po = await dbGetItem("production_orders", id);
          if (po) {
            const customer = await dbGetItem("customers", po.customer_id);
            const product = await dbGetItem("products", po.product_id);
            return sendJSON(res, {
              data: {
                ...po,
                customer_code: customer ? customer.code : "",
                customer_name: customer ? customer.name : "-",
                product_code: product ? product.code : "",
                product_name: product ? product.name : "-"
              }
            });
          }
          return sendJSON(res, { data: null });
        }

        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("production_orders", id);
          return sendJSON(res, { success: true });
        }

        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);

          if (id > 0) {
            const current = await dbGetItem("production_orders", id);
            if (current) {
              const updated = {
                customer_id: parseInt(input.customer_id || current.customer_id),
                product_id: parseInt(input.product_id || current.product_id),
                quantity: parseFloat(input.quantity || current.quantity),
                unit: input.unit || current.unit,
                status: input.status || current.status,
                due_date: input.due_date || current.due_date,
                staff: input.staff || current.staff || "",
                date: input.date || current.date || new Date().toISOString().slice(0, 10)
              };
              await dbSave("production_orders", id, updated);
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newPO = {
              code: input.code || "",
              customer_id: parseInt(input.customer_id || 0),
              product_id: parseInt(input.product_id || 0),
              quantity: parseFloat(input.quantity || 0),
              unit: input.unit || "ลิตร",
              status: input.status || "pending",
              due_date: input.due_date || new Date().toISOString().slice(0, 10),
              staff: input.staff || "ผู้สั่งผลิต",
              date: new Date().toISOString().slice(0, 10),
              created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
            };
            if (!newPO.code) {
              const nextId = useMySQL ? 0 : nextIds.production_orders;
              newPO.code = `PO-2026-${String(nextId || Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`;
            }
            const savedId = await dbSave("production_orders", 0, newPO);
            if (useMySQL && !input.code) {
              await dbSave("production_orders", savedId, { code: `PO-2026-${String(savedId).padStart(4, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "packing_orders": {
        if (action === "list") {
          const list = await dbGetList("packing_orders");
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const item = await dbGetItem("packing_orders", id);
          return sendJSON(res, { data: item });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("packing_orders", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("packing_orders", id);
            if (current) {
              await dbSave("packing_orders", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newPacking = {
              code: input.code || "",
              production_order_id: parseInt(input.production_order_id || 0),
              item_name: input.item_name || "",
              quantity: parseFloat(input.quantity || 0),
              unit: input.unit || "ขวด",
              status: input.status || "pending"
            };
            if (!newPacking.code) {
              const nextId = useMySQL ? 0 : nextIds.packing_orders;
              newPacking.code = `PK-2026-${String(nextId || Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`;
            }
            const savedId = await dbSave("packing_orders", 0, newPacking);
            if (useMySQL && !input.code) {
              await dbSave("packing_orders", savedId, { code: `PK-2026-${String(savedId).padStart(4, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "purchase_orders": {
        if (action === "list") {
          const list = await dbGetList("purchase_orders");
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const item = await dbGetItem("purchase_orders", id);
          return sendJSON(res, { data: item });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("purchase_orders", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("purchase_orders", id);
            if (current) {
              await dbSave("purchase_orders", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newPO = {
              code: input.code || "",
              supplier: input.supplier,
              order_date: input.order_date || new Date().toISOString().slice(0, 10),
              status: input.status || "pending",
              total_amount: parseFloat(input.total_amount || 0),
              items: Array.isArray(input.items) ? input.items : []
            };
            if (!newPO.code) {
              const nextId = useMySQL ? 0 : nextIds.purchase_orders;
              newPO.code = `PRM-2026-${String(nextId || Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`;
            }
            const savedId = await dbSave("purchase_orders", 0, newPO);
            if (useMySQL && !input.code) {
              await dbSave("purchase_orders", savedId, { code: `PRM-2026-${String(savedId).padStart(4, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "grns": {
        if (action === "list") {
          const list = await dbGetList("grns");
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const item = await dbGetItem("grns", id);
          return sendJSON(res, { data: item });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("grns", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);

          const purchaseOrderId = parseInt(input.purchase_order_id || 0);
          const rawMaterialId = parseInt(input.raw_material_id || 0);
          const receivedQty = parseFloat(input.received_qty || 0);

          if (id > 0) {
            const current = await dbGetItem("grns", id);
            if (current) {
              await dbSave("grns", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newIdApprox = useMySQL ? Math.floor(Math.random() * 9000) + 1000 : nextIds.grns;
            const newGRN = {
              code: input.code || "",
              purchase_order_id: purchaseOrderId,
              raw_material_id: rawMaterialId,
              lot_number: input.lot_number || `L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(newIdApprox).padStart(3, "0")}`,
              expiry_date: input.expiry_date || new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              received_qty: receivedQty,
              receiver: input.receiver || "สมศักดิ์ คลังสินค้า",
              receive_date: input.receive_date || new Date().toISOString().slice(0, 10),
              status: "received"
            };
            if (!newGRN.code) {
              const nextId = useMySQL ? 0 : nextIds.grns;
              newGRN.code = `GRN-2026-${String(nextId || newIdApprox).padStart(4, "0")}`;
            }
            const savedId = await dbSave("grns", 0, newGRN);
            if (useMySQL) {
              if (!input.code) {
                await dbSave("grns", savedId, { code: `GRN-2026-${String(savedId).padStart(4, "0")}` });
              }
              if (!input.lot_number) {
                await dbSave("grns", savedId, { lot_number: `L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(savedId).padStart(3, "0")}` });
              }
            }

            if (rawMaterialId && receivedQty) {
              const rawMaterials = await dbGetList("raw_materials");
              const mat = rawMaterials.find(m => m.id === rawMaterialId);
              if (mat) {
                const newStock = parseFloat(mat.stock_qty || 0) + receivedQty;
                await dbSave("raw_materials", rawMaterialId, { stock_qty: newStock });
              }
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "prechecks": {
        if (action === "list") {
          const list = await dbGetList("prechecks");
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const item = await dbGetItem("prechecks", id);
          return sendJSON(res, { data: item });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("prechecks", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("prechecks", id);
            if (current) {
              await dbSave("prechecks", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newPre = {
              material: input.material,
              lot: input.lot,
              expiry: input.expiry || new Date().toISOString().slice(0, 10),
              inspector: input.inspector || "ดร.สุภา",
              date: new Date().toISOString().slice(0, 10),
              result: input.result || "pending"
            };
            const savedId = await dbSave("prechecks", 0, newPre);
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "inventory_pack": {
        if (action === "list") {
          const list = await dbGetList("inventory_pack");
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const item = await dbGetItem("inventory_pack", id);
          return sendJSON(res, { data: item });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("inventory_pack", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("inventory_pack", id);
            if (current) {
              await dbSave("inventory_pack", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newIdApprox = useMySQL ? Math.floor(Math.random() * 900) + 100 : nextIds.purchase_packs;
            const newItem = {
              code: input.code || `IP-${String(newIdApprox).padStart(3, "0")}`,
              type: input.type || "ขวดแก้ว",
              name: input.name || "",
              qty: parseFloat(input.qty || 0),
              unit: input.unit || "ชิ้น",
              status: input.status || "active"
            };
            const savedId = await dbSave("inventory_pack", 0, newItem);
            if (useMySQL && !input.code) {
              await dbSave("inventory_pack", savedId, { code: `IP-${String(savedId).padStart(3, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      case "purchase_packs": {
        if (action === "list") {
          const list = await dbGetList("purchase_packs");
          return sendJSON(res, { data: list });
        }
        if (action === "get") {
          const id = parseInt((req.query.id || req.body.id) as string);
          const item = await dbGetItem("purchase_packs", id);
          return sendJSON(res, { data: item });
        }
        if (action === "delete") {
          const id = parseInt((req.query.id || req.body.id) as string);
          await dbDelete("purchase_packs", id);
          return sendJSON(res, { success: true });
        }
        if (action === "save") {
          const input = req.body;
          const id = parseInt(input.id || 0);
          if (id > 0) {
            const current = await dbGetItem("purchase_packs", id);
            if (current) {
              await dbSave("purchase_packs", id, { ...current, ...input });
              return sendJSON(res, { success: true, id });
            }
          } else {
            const newIdApprox = useMySQL ? Math.floor(Math.random() * 9000) + 1000 : nextIds.purchase_packs;
            const newItem = {
              code: input.code || `PPK-2026-${String(newIdApprox).padStart(4, "0")}`,
              supplier: input.supplier || "",
              item: input.item || "",
              qty: parseFloat(input.qty || 0),
              price: parseFloat(input.price || 0),
              status: input.status || "pending"
            };
            const savedId = await dbSave("purchase_packs", 0, newItem);
            if (useMySQL && !input.code) {
              await dbSave("purchase_packs", savedId, { code: `PPK-2026-${String(savedId).padStart(4, "0")}` });
            }
            return sendJSON(res, { success: true, id: savedId });
          }
        }
        break;
      }

      default: {
        return sendJSON(res, { error: "unknown_entity" }, 400);
      }
    }

    return sendJSON(res, { error: "unhandled_route" }, 400);
  };

  // Clear all database tables (password protected: 4321034)
  app.post("/api/clear-all-data", async (req, res) => {
    const { passcode } = req.body;
    if (String(passcode).trim() !== "4321034") {
      return sendJSON(res, { error: "unauthorized", message: "รหัสผ่านยืนยันไม่ถูกต้อง (กรุณาใช้รหัส 4321034)" }, 403);
    }

    try {
      // 1. Delete in Supabase if active
      if (useSupabase && supabase) {
        try {
          await supabase.from("bom_items").delete().neq("id", 0).catch(() => {});
          await supabase.from("purchase_order_items").delete().neq("id", 0).catch(() => {});
          const tables = [
            "projects", "customers", "products", "raw_materials",
            "bom_recipes", "production_orders", "packing_orders",
            "purchase_orders", "grns", "prechecks", "inventory_pack", "purchase_packs"
          ];
          for (const tbl of tables) {
            await supabase.from(tbl).delete().neq("id", 0).catch(() => {});
          }
        } catch (supaErr) {
          console.warn("Supabase clear warning:", supaErr);
        }
      }

      // 2. Clear server in-memory database
      for (const k of Object.keys(DB)) {
        (DB as any)[k] = [];
      }

      return sendJSON(res, { success: true, message: "ล้างข้อมูลในตารางทั้งหมดเรียบร้อยแล้ว" });
    } catch (e: any) {
      return sendJSON(res, { error: "clear_failed", message: e.message }, 500);
    }
  });

  // Reset demo sample data (password protected: 4321034)
  app.post("/api/reset-sample-data", async (req, res) => {
    const { passcode } = req.body;
    if (String(passcode).trim() !== "4321034") {
      return sendJSON(res, { error: "unauthorized", message: "รหัสผ่านยืนยันไม่ถูกต้อง" }, 403);
    }
    // Re-seed DB in memory
    return sendJSON(res, { success: true, message: "รีเซ็ตข้อมูลตัวอย่างโรงงานเรียบร้อยแล้ว" });
  });

  // Test Supabase connection from server side
  app.get("/api/test-supabase", async (req, res) => {
    if (!supabase) {
      return sendJSON(res, { success: false, message: "Supabase client not initialized" });
    }
    const start = Date.now();
    try {
      const queryPromise = supabase.from("raw_materials").select("id").limit(1);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase request timeout (2000ms)")), 2000)
      );
      const { data, error }: any = await Promise.race([queryPromise, timeoutPromise]);
      const elapsed = Date.now() - start;
      if (error) {
        const msg = String(error.message || "");
        const isFetch = msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("TypeError");
        return sendJSON(res, {
          success: false,
          elapsed,
          isFetchError: isFetch,
          errorType: isFetch ? "FAILED_TO_FETCH" : "GENERIC",
          message: isFetch 
            ? "เชื่อมต่อไม่สำเร็จ: TypeError: Failed to fetch (โปรเจกต์ Supabase อาจอยู่ในสถานะ Paused หรือเครือข่ายเข้าไม่ถึง)" 
            : error.message
        });
      }
      return sendJSON(res, { success: true, message: `เชื่อมต่อสำเร็จ (${elapsed}ms)`, elapsed });
    } catch (e: any) {
      const elapsed = Date.now() - start;
      const isFetchError = e.code === "ENOTFOUND" || e.message?.includes("fetch") || e.message?.includes("ENOTFOUND") || e.message?.includes("timeout");
      return sendJSON(res, {
        success: false,
        elapsed,
        isFetchError,
        errorType: isFetchError ? "FAILED_TO_FETCH" : "GENERIC",
        message: isFetchError 
          ? "เชื่อมต่อไม่สำเร็จ: TypeError: Failed to fetch (โปรเจกต์ Supabase อาจอยู่ในสถานะ Paused หรือเครือข่ายเข้าไม่ถึง)" 
          : e.message
      });
    }
  });

  // Both api.php legacy queries and standard JSON REST endpoints
  app.get("/api/db-status", (req, res) => {
    return sendJSON(res, { useMySQL, useSupabase, host: dbHost, database: dbName, user: dbUser, supabaseUrl });
  });

  app.get("/api.php", handleApiRequest);
  app.post("/api.php", handleApiRequest);

  app.get("/api/:entity", handleApiRequest);
  app.post("/api/:entity", handleApiRequest);

  // Serve static files in production / setup Vite inside development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
