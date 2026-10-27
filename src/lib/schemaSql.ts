// Full PostgreSQL Schema for Supabase with Realtime and Row Level Security
export const FULL_SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- IDEVA FACTORY OS — COMPLETE SUPABASE POSTGRESQL SCHEMA (100% REALTIME READY)
-- ============================================================================
-- This script creates all 15 tables, relational child tables, indexes,
-- Row Level Security (RLS) permissive policies, Supabase Realtime publications,
-- and seed data for the chemical factory OS.
--
-- How to apply:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- 2. Paste this entire SQL script and click "Run"
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SUPPLIERS TABLE (ข้อมูลซัพพลายเออร์และผู้ผลิตสารเคมี)
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CUSTOMERS TABLE (ข้อมูลลูกค้าและแบรนด์)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    tax_id VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. PRODUCTS TABLE (ข้อมูลผลิตภัณฑ์สำเร็จรูป)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Liquid',
    version VARCHAR(50) DEFAULT 'v1.0',
    status VARCHAR(50) DEFAULT 'active',
    image_url TEXT
);

-- ============================================================================
-- 4. RAW MATERIALS TABLE (คลังสินค้าและวัตถุดิบเคมีภัณฑ์)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock_qty DECIMAL(12,4) DEFAULT 0.0000,
    min_stock DECIMAL(12,4) DEFAULT 0.0000,
    unit_price DECIMAL(12,2) DEFAULT 0.00,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    image_url TEXT
);

-- ============================================================================
-- 5. BOM RECIPES TABLE (สูตรการผลิตแม่บท)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bom_recipes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    part_no VARCHAR(100),
    version VARCHAR(50) DEFAULT 'v1.0',
    status VARCHAR(50) DEFAULT 'active',
    estimated_unit_cost DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    materials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5b. BOM ITEMS TABLE (รายการวัตถุดิบและสัดส่วนในสูตร)
CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INT NOT NULL REFERENCES bom_recipes(id) ON DELETE CASCADE,
    part VARCHAR(10) DEFAULT 'A',
    raw_material_id INT REFERENCES raw_materials(id) ON DELETE SET NULL,
    material_code VARCHAR(50),
    material_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
    unit VARCHAR(50) DEFAULT 'กก.',
    notes VARCHAR(255)
);

-- ============================================================================
-- 6. PRODUCTION ORDERS TABLE (ใบสั่งผลิตเคมีภัณฑ์)
-- ============================================================================
CREATE TABLE IF NOT EXISTS production_orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50) DEFAULT 'ลิตร',
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    staff VARCHAR(255),
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. PACKING ORDERS TABLE (ใบสั่งบรรจุภัณฑ์)
-- ============================================================================
CREATE TABLE IF NOT EXISTS packing_orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    production_order_id INT NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50) DEFAULT 'ขวด',
    status VARCHAR(50) DEFAULT 'pending'
);

-- ============================================================================
-- 8. PURCHASE ORDERS TABLE (ใบสั่งซื้อเคมีภัณฑ์และวัตถุดิบ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    supplier VARCHAR(255) NOT NULL,
    order_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(14,2) DEFAULT 0.00,
    items JSONB DEFAULT '[]'::jsonb
);

-- 8b. PURCHASE ORDER ITEMS TABLE (รายการวัตถุดิบที่สั่งซื้อ)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    raw_material_id INT REFERENCES raw_materials(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    unit VARCHAR(50) DEFAULT 'กก.',
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00
);

-- ============================================================================
-- 9. GRNS TABLE (ใบรับสินค้าเข้าคลัง - Goods Received Notes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grns (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE SET NULL,
    raw_material_id INT NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    expiry_date DATE,
    received_qty DECIMAL(12,4) DEFAULT 0.0000,
    receiver VARCHAR(255),
    receive_date DATE,
    status VARCHAR(50) DEFAULT 'received'
);

-- ============================================================================
-- 10. PRECHECKS TABLE (ใบตรวจสอบสารเคมีก่อนทำการผลิต)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prechecks (
    id SERIAL PRIMARY KEY,
    material VARCHAR(255) NOT NULL,
    lot VARCHAR(100) NOT NULL,
    expiry DATE,
    inspector VARCHAR(255),
    date DATE,
    result VARCHAR(50) DEFAULT 'pending'
);

-- ============================================================================
-- 11. INVENTORY PACK TABLE (คลังขวด ฝา กล่อง และฉลาก)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_pack (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    qty DECIMAL(12,4) DEFAULT 0.0000,
    unit VARCHAR(50) DEFAULT 'ชิ้น',
    status VARCHAR(50) DEFAULT 'active'
);

-- ============================================================================
-- 12. PURCHASE PACKS TABLE (การจัดซื้อบรรจุภัณฑ์และฝา)
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_packs (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    supplier VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    qty DECIMAL(12,4) DEFAULT 0.0000,
    price DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending'
);

-- ============================================================================
-- 13. PROJECTS TABLE (โปรเจคการผลิตและ OEM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_type VARCHAR(100),
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    customer VARCHAR(255),
    customer_status VARCHAR(50),
    owner VARCHAR(100),
    price DECIMAL(14,2) DEFAULT 0.00,
    start_date VARCHAR(50),
    due_date VARCHAR(50),
    progress INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'กำลังผลิต',
    quantity DECIMAL(12,2) DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    product_code VARCHAR(50),
    lot_number VARCHAR(50),
    product_name VARCHAR(255),
    details TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 14. SEMI-FINISHED GOODS TABLE (สินค้ากึ่งสำเร็จรูป / WIP Bulk)
-- ============================================================================
CREATE TABLE IF NOT EXISTS semi_finished_goods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    batch_no VARCHAR(100),
    qty DECIMAL(12,4) DEFAULT 0.0000,
    unit VARCHAR(50) DEFAULT 'KG.',
    tank_no VARCHAR(100),
    mfg_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 15. REQUISITIONS TABLE (ใบเบิกพัสดุและวัตถุดิบเคมี)
-- ============================================================================
CREATE TABLE IF NOT EXISTS requisitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    date DATE,
    department VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'approved',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES — 100% PUBLIC ACCESS FOR ANON
-- ============================================================================
DO $$ 
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'suppliers', 'customers', 'products', 'raw_materials',
        'bom_recipes', 'bom_items', 'production_orders', 'packing_orders',
        'purchase_orders', 'purchase_order_items', 'grns', 'prechecks',
        'inventory_pack', 'purchase_packs', 'projects', 'semi_finished_goods', 'requisitions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public full access on %s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public full access on %s" ON %I FOR ALL TO public USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- 17. ENABLE SUPABASE REALTIME REPLICATION (เรียลไทม์ 100%)
-- ============================================================================
ALTER TABLE suppliers REPLICA IDENTITY FULL;
ALTER TABLE customers REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE raw_materials REPLICA IDENTITY FULL;
ALTER TABLE bom_recipes REPLICA IDENTITY FULL;
ALTER TABLE bom_items REPLICA IDENTITY FULL;
ALTER TABLE production_orders REPLICA IDENTITY FULL;
ALTER TABLE packing_orders REPLICA IDENTITY FULL;
ALTER TABLE purchase_orders REPLICA IDENTITY FULL;
ALTER TABLE purchase_order_items REPLICA IDENTITY FULL;
ALTER TABLE grns REPLICA IDENTITY FULL;
ALTER TABLE prechecks REPLICA IDENTITY FULL;
ALTER TABLE inventory_pack REPLICA IDENTITY FULL;
ALTER TABLE purchase_packs REPLICA IDENTITY FULL;
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE semi_finished_goods REPLICA IDENTITY FULL;
ALTER TABLE requisitions REPLICA IDENTITY FULL;

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'suppliers', 'customers', 'products', 'raw_materials',
        'bom_recipes', 'bom_items', 'production_orders', 'packing_orders',
        'purchase_orders', 'purchase_order_items', 'grns', 'prechecks',
        'inventory_pack', 'purchase_packs', 'projects', 'semi_finished_goods', 'requisitions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl);
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- 16. SEED INITIAL SAMPLE DATA (ข้อมูลตัวอย่างเริ่มต้นโรงงาน)
-- ============================================================================
INSERT INTO suppliers (id, code, name, contact, phone, email, address, status) VALUES
(1, 'SUP-001', 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', 'คุณสมพงษ์ สารเคมี', '02-123-4567', 'sales@globalchem.co.th', '88/12 ถนนบางนา-ตราด กม.10 บางพลี สมุทรปราการ', 'active'),
(2, 'SUP-002', 'บริษัท ไทยอินกรีเดียนท์ จำกัด', 'คุณวรรณา ซัพพลาย', '02-987-6543', 'info@thaiingredients.com', '101/5 ซอยสุขุมวิท 71 พระโขนง กรุงเทพฯ', 'active'),
(3, 'SUP-003', 'บริษัท นิปปอน เคมิเคิล (ประเทศไทย) จำกัด', 'Mr. Kenji Sato', '02-555-8899', 'order@nipponchem.co.th', '45/8 นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO customers (id, code, name, contact, phone, email, tax_id, address, status) VALUES
(1, 'C69-001', 'บริษัท เอสซีจี เคมิคอลส์ จำกัด (มหาชน)', 'คุณวิทวัส สมบูรณ์', '02-586-4444', 'contact@scgchemicals.com', '0107555000123', '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800', 'active'),
(2, 'C69-002', 'บริษัท สยามเคมีคอล กรุ๊ป จำกัด', 'คุณสมศรี รักดี', '089-876-5432', 'info@siamchem.co.th', '0105559000456', '88 หมู่ 5 นิคมอุตสาหกรรมบางปู ต.บางปูใหม่ อ.เมือง จ.สมุทรปราการ 10280', 'active'),
(3, 'C69-003', 'ห้างหุ้นส่วนจำกัด อุตสาหกรรมเคมีไทย', 'คุณวิชัย เลิศล้ำ', '02-444-5555', 'thaichem_ind@gmail.com', '0103548000789', '456 ถนนเพชรเกษม แขวงบางหว้า เขตภาษีเจริญ กรุงเทพฯ 10160', 'active'),
(4, 'C68-073', 'คุณวิมลมณี ไสบาล', 'คุณวิมลมณี', '081-234-5678', 'wimolmanee@example.com', '0109876543210', '123/45 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (id, code, name, type, version, status) VALUES
(1, 'P-001', 'น้ำยาเคลือบแก้วพรีเมียม A', 'Liquid', 'v1.0', 'active'),
(2, 'P-002', 'สารฆ่าเชื้อประสิทธิภาพสูง B', 'Liquid', 'v2.1', 'active'),
(3, 'P-003', 'ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C', 'Powder', 'v1.0', 'active'),
(4, 'IDV-SP-003', 'Rose Soap (สบู่กุหลาบ)', 'Liquid', 'v1.0', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO raw_materials (id, code, name, unit, stock_qty, min_stock, unit_price, supplier_id, supplier_name, status, image_url) VALUES
(1, 'RM-001', 'Ethanol 96%', 'L.', 120.0000, 50.0000, 65.00, 1, 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', 'active', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop'),
(2, 'RM-002', 'Glycerin USP', 'L.', 45.0000, 30.0000, 90.00, 1, 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', 'active', 'https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop'),
(3, 'RM-003', 'Sodium Hydroxide (NaOH)', 'KG.', 15.0000, 20.0000, 55.00, 2, 'บริษัท ไทยอินกรีเดียนท์ จำกัด', 'active', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop'),
(4, 'RM-004', 'Hydrogen Peroxide 35%', 'L.', 85.0000, 40.0000, 110.00, 3, 'บริษัท นิปปอน เคมิเคิล (ประเทศไทย) จำกัด', 'active', 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop'),
(5, 'RM-005', 'Citric Acid Anhydrous', 'KG.', 32.0000, 25.0000, 70.00, 2, 'บริษัท ไทยอินกรีเดียนท์ จำกัด', 'active', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop'),
(6, 'RMSS-0010', 'เบสใส', 'KG.', 500.0000, 100.0000, 85.00, 2, 'บริษัท ไทยอินกรีเดียนท์ จำกัด', 'active', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop'),
(7, 'RMOP-0013', 'Gold glitter mica / Gold Super Sparkle Mica (Size D, 200 Micron)', 'G.', 1000.0000, 200.0000, 1500.00, 1, 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', 'active', 'https://images.unsplash.com/photo-1608248597280-92fb13e64f77?w=300&auto=format&fit=crop'),
(8, 'RMCL-0009', 'สีชมพูละลายน้ำ', 'G.', 500.0000, 100.0000, 800.00, 2, 'บริษัท ไทยอินกรีเดียนท์ จำกัด', 'active', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop'),
(9, 'RMFL-0232', 'กลิ่นดอกกุหลาบ', 'G.', 2000.0000, 500.0000, 1200.00, 1, 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', 'active', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop'),
(10, 'RMVB-003', 'Vitamin B3 (Niacinamide)', 'KG.', 100.0000, 20.0000, 450.00, 1, 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', 'active', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop')
ON CONFLICT (code) DO NOTHING;

INSERT INTO bom_recipes (id, product_id, part_no, version, status, estimated_unit_cost, notes, materials) VALUES
(1, 1, 'PART-001', 'v1.0', 'active', 65.00, 'สูตรเคลือบแก้วมาตรฐานโรงงาน', '[{"part":"A","material_code":"RM-001","material_name":"Ethanol 96%","quantity":100,"unit":"L.","notes":"ส่วนผสมหลัก"},{"part":"A","material_code":"RM-002","material_name":"Glycerin USP","quantity":10,"unit":"L.","notes":"เพิ่มความหนืด"},{"part":"B","material_code":"RM-005","material_name":"Citric Acid Anhydrous","quantity":2,"unit":"KG.","notes":"ปรับค่าความเป็นกรดด่าง"}]'::jsonb),
(2, 2, 'PART-002', 'v2.1', 'active', 82.00, 'สูตรสารฆ่าเชื้อประสิทธิภาพสูง', '[{"part":"A","material_code":"RM-001","material_name":"Ethanol 96%","quantity":150,"unit":"L.","notes":"ส่วนประกอบหลัก"},{"part":"A","material_code":"RM-004","material_name":"Hydrogen Peroxide 35%","quantity":20,"unit":"L.","notes":"ฆ่าสปอร์และเชื้อไวรัส"},{"part":"B","material_code":"RM-002","material_name":"Glycerin USP","quantity":5,"unit":"L.","notes":"รักษาความชุ่มชื้น"}]'::jsonb),
(3, 3, 'PART-003', 'v1.0', 'active', 48.00, 'ผงซักล้างสูตรด่างเข้มข้น', '[{"part":"A","material_code":"RM-003","material_name":"Sodium Hydroxide (NaOH)","quantity":50,"unit":"KG.","notes":"สารทำปฏิกิริยาด่าง"},{"part":"B","material_code":"RM-005","material_name":"Citric Acid Anhydrous","quantity":15,"unit":"KG.","notes":"สารปรับปรุงสภาพน้ำ"}]'::jsonb),
(4, 4, 'BS30', 'v1.0', 'active', 86.50, '[{"instruction":"ละลาย Part A ด้วยอุณหภูมิ 60-75องศา จนหมด"},{"instruction":"ผสม Part B ให้เข้ากัน รอให้อุณหภูมิลดลงเหลือ 60องศา แล้วเติมลงใน Part A"},{"instruction":"รออุณหภูมิลดลงเหลือ 50-55องศา แล้วเติมลงใน Part A/B"}]', '[{"part":"A","material_code":"RMSS-0010","material_name":"เบสใส","quantity":100.00,"unit":"KG.","notes":"เบสสบู่ใส (100% w/w)"},{"part":"A","material_code":"RMOP-0013","material_name":"Gold glitter mica / Gold Super Sparkle Mica (Size D, 200 Micron)","quantity":0.02,"unit":"G.","notes":"ผงไมก้าทองวิ้ง (0.02% w/w)"},{"part":"B","material_code":"RMCL-0009","material_name":"สีชมพูละลายน้ำ","quantity":0.03,"unit":"G.","notes":"สีผสมสบู่ (0.03% w/w)"},{"part":"C","material_code":"RMFL-0232","material_name":"กลิ่นดอกกุหลาบ","quantity":1.00,"unit":"G.","notes":"หัวน้ำหอมกุหลาบ (1.00% w/w)"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bom_items (id, bom_id, part, raw_material_id, material_code, material_name, quantity, unit, notes) VALUES
(1, 1, 'A', 1, 'RM-001', 'Ethanol 96%', 100.0000, 'L.', 'ส่วนผสมหลัก'),
(2, 1, 'A', 2, 'RM-002', 'Glycerin USP', 10.0000, 'L.', 'เพิ่มความหนืด'),
(3, 1, 'B', 5, 'RM-005', 'Citric Acid Anhydrous', 2.0000, 'KG.', 'ปรับค่าความเป็นกรดด่าง'),
(4, 2, 'A', 1, 'RM-001', 'Ethanol 96%', 150.0000, 'L.', 'ส่วนประกอบหลัก'),
(5, 2, 'A', 4, 'RM-004', 'Hydrogen Peroxide 35%', 20.0000, 'L.', 'ฆ่าสปอร์และเชื้อไวรัส'),
(6, 2, 'B', 2, 'RM-002', 'Glycerin USP', 5.0000, 'L.', 'รักษาความชุ่มชื้น'),
(7, 3, 'A', 3, 'RM-003', 'Sodium Hydroxide (NaOH)', 50.0000, 'KG.', 'สารทำปฏิกิริยาด่าง'),
(8, 3, 'B', 5, 'RM-005', 'Citric Acid Anhydrous', 15.0000, 'KG.', 'สารปรับปรุงสภาพน้ำ'),
(9, 4, 'A', 6, 'RMSS-0010', 'เบสใส', 100.0000, 'KG.', 'เบสสบู่ใส (100% w/w)'),
(10, 4, 'A', 7, 'RMOP-0013', 'Gold glitter mica', 0.0200, 'G.', 'ผงไมก้าทองวิ้ง (0.02% w/w)'),
(11, 4, 'B', 8, 'RMCL-0009', 'สีชมพูละลายน้ำ', 0.0300, 'G.', 'สีผสมสบู่ (0.03% w/w)'),
(12, 4, 'C', 9, 'RMFL-0232', 'กลิ่นดอกกุหลาบ', 1.0000, 'G.', 'หัวน้ำหอมกุหลาบ (1.00% w/w)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO production_orders (id, code, customer_id, product_id, quantity, unit, status, due_date, staff, date) VALUES
(1, 'PO-2026-0056', 1, 1, 500.0000, 'ลิตร', 'done', '2026-06-25', 'สมชาย ใจดี', '2026-06-20'),
(2, 'PO-2026-0055', 2, 2, 200.0000, 'ลิตร', 'running', '2026-07-02', 'ดร.สุภา', '2026-06-28'),
(3, 'PO-2026-0054', 3, 3, 1000.0000, 'กก.', 'pending', '2026-07-10', 'สมชาติ ใจมั่น', '2026-06-29')
ON CONFLICT (code) DO NOTHING;

INSERT INTO packing_orders (id, code, production_order_id, item_name, quantity, unit, status) VALUES
(1, 'PK-2026-0021', 1, 'น้ำยาเคลือบแก้วพรีเมียม A', 500.0000, 'ขวด', 'done'),
(2, 'PK-2026-0020', 2, 'สารฆ่าเชื้อประสิทธิภาพสูง B', 200.0000, 'ขวด', 'running'),
(3, 'PK-2026-0019', 3, 'ผงซักล้างอุตสาหกรรมสูตรเข้มข้น C', 1000.0000, 'ถุง', 'pending')
ON CONFLICT (code) DO NOTHING;

INSERT INTO purchase_orders (id, code, supplier, order_date, status, total_amount, items) VALUES
(1, 'PRM-2026-0023', 'บริษัท โกลบอลเคมีคอล ซัพพลาย จำกัด', '2026-06-18', 'pending', 15400.00, '[{"raw_material_id":1,"item_name":"Ethanol 96%","quantity":200,"unit":"ลิตร","unit_price":60,"subtotal":12000},{"raw_material_id":2,"item_name":"Glycerin USP","quantity":40,"unit":"ลิตร","unit_price":85,"subtotal":3400}]'::jsonb),
(2, 'PRM-2026-0022', 'บริษัท ไทยอินกรีเดียนท์ จำกัด', '2026-06-15', 'received', 8800.00, '[{"raw_material_id":3,"item_name":"Sodium Hydroxide (NaOH)","quantity":100,"unit":"กก.","unit_price":55,"subtotal":5500},{"raw_material_id":5,"item_name":"Citric Acid","quantity":50,"unit":"กก.","unit_price":66,"subtotal":3300}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO purchase_order_items (id, purchase_order_id, raw_material_id, item_name, quantity, unit, unit_price, subtotal) VALUES
(1, 1, 1, 'Ethanol 96%', 200.000, 'ลิตร', 60.00, 12000.00),
(2, 1, 2, 'Glycerin USP', 40.000, 'ลิตร', 85.00, 3400.00),
(3, 2, 3, 'Sodium Hydroxide (NaOH)', 100.000, 'กก.', 55.00, 5500.00),
(4, 2, 5, 'Citric Acid', 50.000, 'กก.', 66.00, 3300.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO grns (id, code, purchase_order_id, raw_material_id, lot_number, expiry_date, received_qty, receiver, receive_date, status) VALUES
(1, 'GRN-2026-0018', 2, 3, 'L260615-001', '2028-06-15', 100.0000, 'สมศักดิ์ คลังสินค้า', '2026-06-15', 'received'),
(2, 'GRN-2026-0017', 2, 5, 'L260615-002', '2028-06-15', 50.0000, 'สมศักดิ์ คลังสินค้า', '2026-06-15', 'received')
ON CONFLICT (code) DO NOTHING;

INSERT INTO prechecks (id, material, lot, expiry, inspector, date, result) VALUES
(1, 'Ethanol 96%', 'L240901', '2026-09-01', 'ดร.สุภา', '2026-06-20', 'pass'),
(2, 'Sodium Hydroxide (NaOH)', 'L240920', '2026-09-20', 'ดร.สุภา', '2026-06-21', 'fail'),
(3, 'Glycerin USP', 'L240820', '2026-07-20', 'นายประพันธ์', '2026-06-25', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory_pack (id, code, type, name, qty, unit, status) VALUES
(1, 'PK-001', 'ขวด', 'ขวด HDPE ขนาด 1 ลิตร', 2450.0000, 'ชิ้น', 'active'),
(2, 'PK-002', 'ฝา', 'ฝาสกรูพลาสติก สีขาว', 4800.0000, 'ชิ้น', 'active'),
(3, 'PK-003', 'ฉลาก', 'ฉลากน้ำยาเคลือบแก้ว P-001', 1500.0000, 'ชิ้น', 'active'),
(4, 'PK-004', 'ฉลาก', 'ฉลากสารฆ่าเชื้อ P-002', 850.0000, 'ชิ้น', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO purchase_packs (id, code, supplier, item, qty, price, status) VALUES
(1, 'PPK-2026-0009', 'บริษัท พลาสติกไทย จำกัด', 'ขวด HDPE ขนาด 1 ลิตร', 1000.0000, 5000.00, 'received'),
(2, 'PPK-2026-0010', 'บริษัท โรงพิมพ์ฉลากสากล จำกัด', 'ฉลากน้ำยาเคลือบแก้ว P-001', 2000.0000, 3000.00, 'pending')
ON CONFLICT (code) DO NOTHING;

INSERT INTO projects (id, title, project_type, customer, customer_status, owner, price, start_date, due_date, progress, status, quantity, tags, description, product_code, lot_number, product_name, details, category) VALUES
(1, 'สบู่มังคุด', 'OEM ผลิตสบู่สมุนไพร', 'SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้', 'ลูกค้า', 'คุณสมใจ ผลิตภัณฑ์', 45000.00, '01/01/2024', '12/01/2024', 60, 'กำลังผลิต', 500.00, '["สบู่ก้อน", "ลดสิว", "ส่งออก"]'::jsonb, 'โครงการผลิตสบู่ก้อนมังคุดเกรดพรีเมียม สารสกัดเปลือกมังคุดธรรมชาติ สำหรับลูกค้า SMBS', 'MP-SOAP-006', 'Lot6', 'MANGOSTEEN ACNE SOAP/แมงโกสทีน แอคเน่ โซฟ', 'SMBS SREYMOM BEAUTY/เอสเอมบีเอส เสรยมอม บิวตี้', 'สบู่ก้อนสมุนไพร'),
(2, 'เซรั่มวิตามินซี ไฮยาลูรอน', 'OEM ผลิตเวชสำอาง', 'บริษัท นพคุณ ฟาร์มาซูติคอล จำกัด', 'ลูกค้า VIP', 'คุณวารุณี แผนกวิจัย', 120000.00, '15/01/2024', '28/02/2024', 85, 'ตรวจ QC', 2000.00, '["เซรั่ม", "หน้าใส", "GMP"]'::jsonb, 'สูตรเซรั่มเข้มข้น Vitamin C 15% และ Hyaluronic Acid 4D', 'SR-VITC-002', 'Lot12', 'GLOW VIT-C BOOSTER SERUM', 'บรรจุขวดแก้วดรอปเปอร์สีชา 30ml พร้อมกล่องพิมพ์ฟอยล์ทอง', 'สกินแคร์/เซรั่ม'),
(3, 'น้ำยาเคลือบแก้วรถยนต์นาโน', 'ODM สูตรเฉพาะทาง', 'บริษัท เอสซีจี เคมิคอลส์ จำกัด (มหาชน)', 'ลูกค้าองค์กร', 'คุณวิทวัส การผลิต', 250000.00, '10/02/2024', '25/03/2024', 30, 'รอสารเคมี', 1000.00, '["เคมีภัณฑ์", "คาร์แคร์", "นาโน"]'::jsonb, 'ผลิตน้ำยาเคลือบสีรถยนต์สูตรซิลิกา 9H สำหรับศูนย์ดูแลรถยนต์ครบวงจร', 'CC-NANO-9H', 'Lot3', 'ULTRA CERAMIC COATING 9H', 'ขวดอลูมิเนียม 50ml พร้อมผ้าไมโครไฟเบอร์และฟองน้ำลงน้ำยา', 'เคมีภัณฑ์ยานยนต์')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAFE COLUMN MIGRATION (รับประกันครบทุกตารางและทุกคอลัมน์ 100%)
-- ============================================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty DECIMAL(12,4) DEFAULT 0.0000;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock DECIMAL(12,4) DEFAULT 0.0000;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(14,2) DEFAULT 0.00;

ALTER TABLE grns ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'KG.';
ALTER TABLE grns ADD COLUMN IF NOT EXISTS unit_price DECIMAL(14,2) DEFAULT 0.00;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE prechecks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE prechecks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE inventory_pack ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE inventory_pack ADD COLUMN IF NOT EXISTS unit_price DECIMAL(14,2) DEFAULT 0.00;
ALTER TABLE inventory_pack ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE inventory_pack ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE purchase_packs ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'ชิ้น';
ALTER TABLE purchase_packs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE packing_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

SELECT setval(pg_get_serial_sequence('suppliers', 'id'), coalesce(max(id), 1)) FROM suppliers;
SELECT setval(pg_get_serial_sequence('customers', 'id'), coalesce(max(id), 1)) FROM customers;
SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('raw_materials', 'id'), coalesce(max(id), 1)) FROM raw_materials;
SELECT setval(pg_get_serial_sequence('bom_recipes', 'id'), coalesce(max(id), 1)) FROM bom_recipes;
SELECT setval(pg_get_serial_sequence('bom_items', 'id'), coalesce(max(id), 1)) FROM bom_items;
SELECT setval(pg_get_serial_sequence('production_orders', 'id'), coalesce(max(id), 1)) FROM production_orders;
SELECT setval(pg_get_serial_sequence('packing_orders', 'id'), coalesce(max(id), 1)) FROM packing_orders;
SELECT setval(pg_get_serial_sequence('purchase_orders', 'id'), coalesce(max(id), 1)) FROM purchase_orders;
SELECT setval(pg_get_serial_sequence('purchase_order_items', 'id'), coalesce(max(id), 1)) FROM purchase_order_items;
SELECT setval(pg_get_serial_sequence('grns', 'id'), coalesce(max(id), 1)) FROM grns;
SELECT setval(pg_get_serial_sequence('prechecks', 'id'), coalesce(max(id), 1)) FROM prechecks;
SELECT setval(pg_get_serial_sequence('inventory_pack', 'id'), coalesce(max(id), 1)) FROM inventory_pack;
SELECT setval(pg_get_serial_sequence('purchase_packs', 'id'), coalesce(max(id), 1)) FROM purchase_packs;
SELECT setval(pg_get_serial_sequence('projects', 'id'), coalesce(max(id), 1)) FROM projects;
SELECT setval(pg_get_serial_sequence('semi_finished_goods', 'id'), coalesce(max(id), 1)) FROM semi_finished_goods;
SELECT setval(pg_get_serial_sequence('requisitions', 'id'), coalesce(max(id), 1)) FROM requisitions;
`;
