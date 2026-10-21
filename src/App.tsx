import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import Boms from "./components/Boms";
import UserManual from "./components/UserManual";
import Warehouse from "./components/Warehouse";
import Projects from "./components/Projects";
import DatabaseModal from "./components/DatabaseModal";
import SettingsPage from "./components/SettingsPage";
import { clientGetList, clientSave, clientDelete, subscribeToRealtimeDatabase } from "./lib/supabaseClient";
import { 
  PrecheckPage, 
  ProductionPage, 
  PackingPage, 
  PurchasePage, 
  GrnsPage, 
  InventoryPage, 
  ReportPage 
} from "./components/OtherPages";
import { 
  Customer, 
  Product, 
  RawMaterial, 
  BomRecipe, 
  ProductionOrder, 
  PackingOrder, 
  PurchaseOrder, 
  Grn, 
  Precheck, 
  InventoryPack,
  Project
} from "./types";
import { CheckCircle2, AlertCircle } from "lucide-react";

const THEMES = [
  {
    id: "blue",
    name: "ฟ้าพาสเทล",
    color: "#3b82f6",
    primary: "#3b82f6",
    hover: "#2563eb",
    light: "#f0f6ff",
    border: "#dbeafe",
    dark: "#1d4ed8",
    brand: "#60a5fa"
  },
  {
    id: "sage",
    name: "เขียวพาสเทล",
    color: "#10b981",
    primary: "#10b981",
    hover: "#059669",
    light: "#f0fdf4",
    border: "#d1fae5",
    dark: "#047857",
    brand: "#34d399"
  },
  {
    id: "rose",
    name: "ชมพูพาสเทล",
    color: "#f43f5e",
    primary: "#f43f5e",
    hover: "#e11d48",
    light: "#fff1f2",
    border: "#ffe4e6",
    dark: "#be123c",
    brand: "#fb7185"
  },
  {
    id: "lavender",
    name: "ม่วงพาสเทล",
    color: "#8b5cf6",
    primary: "#8b5cf6",
    hover: "#7c3aed",
    light: "#f5f3ff",
    border: "#ede9fe",
    dark: "#6d28d9",
    brand: "#a78bfa"
  },
  {
    id: "amber",
    name: "พีชพาสเทล",
    color: "#f59e0b",
    primary: "#f59e0b",
    hover: "#d97706",
    light: "#fffbeb",
    border: "#fef3c7",
    dark: "#b45309",
    brand: "#fbbf24"
  }
];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("factory_theme") || "blue");

  // Core database states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [bomRecipes, setBomRecipes] = useState<BomRecipe[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [packingOrders, setPackingOrders] = useState<PackingOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<Grn[]>([]);
  const [prechecks, setPrechecks] = useState<Precheck[]>([]);
  const [inventoryPacks, setInventoryPacks] = useState<InventoryPack[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // UI Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [dbStatus, setDbStatus] = useState<{ useMySQL: boolean; host: string; database: string; user: string } | null>({
    useMySQL: false,
    host: "Supabase Realtime",
    database: "ideva-factory",
    user: "client-direct"
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Refresh all tables from real-time database directly
  const loadAllData = async () => {
    try {
      const [
        custs,
        prods,
        mats,
        recipes,
        pos,
        packOrders,
        pOrders,
        grnLogs,
        checks,
        packs,
        projs
      ] = await Promise.all([
        clientGetList("customers"),
        clientGetList("products"),
        clientGetList("raw_materials"),
        clientGetList("bom_recipes"),
        clientGetList("production_orders"),
        clientGetList("packing_orders"),
        clientGetList("purchase_orders"),
        clientGetList("grns"),
        clientGetList("prechecks"),
        clientGetList("inventory_pack"),
        clientGetList("projects")
      ]);

    // Enrich BOM Recipes with Product Info (code, name, type)
    const enrichedRecipes = recipes.map(r => {
      const matchedProd = prods.find(p => p.id === r.product_id);
      return {
        ...r,
        materials: Array.isArray(r.materials) ? r.materials : [],
        product_code: r.product_code || (matchedProd ? matchedProd.code : "-"),
        product_name: r.product_name || (matchedProd ? matchedProd.name : "-"),
        product_type: r.product_type || (matchedProd ? matchedProd.type : "Finished Goods")
      };
    });

    // Sort newest first so freshly created recipes appear at the top
    enrichedRecipes.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    setCustomers(custs);
    setProducts(prods);
    setRawMaterials(mats);
    setBomRecipes(enrichedRecipes);
    setProductionOrders(pos);
    setPackingOrders(packOrders);
    setPurchaseOrders(pOrders);
    setGrns(grnLogs);
    setPrechecks(checks);
    setInventoryPacks(packs);
    setProjects(projs);
  } catch (err) {
    console.warn("Error refreshing data:", err);
  }
};

  useEffect(() => {
    localStorage.setItem("factory_theme", activeTheme);
    const config = THEMES.find(t => t.id === activeTheme) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--primary-color", config.primary);
    root.style.setProperty("--primary-hover", config.hover);
    root.style.setProperty("--primary-light", config.light);
    root.style.setProperty("--primary-border", config.border);
    root.style.setProperty("--primary-dark", config.dark);
    root.style.setProperty("--primary-brand", config.brand);
  }, [activeTheme]);

  useEffect(() => {
    loadAllData();

    // ⚡ 100% Realtime Sync: Listen to live INSERT / UPDATE / DELETE on all Supabase tables
    const unsubscribe = subscribeToRealtimeDatabase((table, eventType) => {
      console.log(`[Realtime Sync] ${eventType} detected on ${table}, refreshing view...`);
      loadAllData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Post / Save endpoints helpers
  const handleSave = async (entity: string, payload: any, successMsg: string) => {
    try {
      const savedId = await clientSave(entity, payload.id || 0, payload);
      if (savedId > 0) {
        showToast(successMsg, "success");
        await loadAllData();
      } else {
        throw new Error("บันทึกไม่สำเร็จ");
      }
    } catch (e: any) {
      showToast(e.message || "การเชื่อมต่อฐานข้อมูลล้มเหลว", "error");
    }
  };

  const handleDelete = async (entity: string, id: number, successMsg: string) => {
    try {
      // 1. Optimistic React state update: remove immediately so user sees instant reaction
      const strId = String(id);
      if (entity === "projects") setProjects(prev => prev.filter(p => String(p.id) !== strId));
      else if (entity === "customers") setCustomers(prev => prev.filter(c => String(c.id) !== strId));
      else if (entity === "bom_recipes") setBomRecipes(prev => prev.filter(b => String(b.id) !== strId));
      else if (entity === "prechecks") setPrechecks(prev => prev.filter(p => String(p.id) !== strId));
      else if (entity === "production_orders") setProductionOrders(prev => prev.filter(po => String(po.id) !== strId));
      else if (entity === "packing_orders") setPackingOrders(prev => prev.filter(pk => String(pk.id) !== strId));
      else if (entity === "purchase_orders") setPurchaseOrders(prev => prev.filter(po => String(po.id) !== strId));
      else if (entity === "grns") setGrns(prev => prev.filter(g => String(g.id) !== strId));
      else if (entity === "raw_materials") setRawMaterials(prev => prev.filter(rm => String(rm.id) !== strId));
      else if (entity === "inventory_pack") setInventoryPacks(prev => prev.filter(ip => String(ip.id) !== strId));
      else if (entity === "products") setProducts(prev => prev.filter(p => String(p.id) !== strId));

      const success = await clientDelete(entity, id);
      if (success) {
        showToast(successMsg, "success");
        await loadAllData();
      } else {
        throw new Error("ลบไม่สำเร็จ");
      }
    } catch (e: any) {
      showToast(e.message || "ไม่สามารถติดต่อฐานข้อมูลได้", "error");
    }
  };

  // Triggered when GRN is created (adds chemicals to stock)
  const handleAddGrn = async (grn: any) => {
    await handleSave("grns", grn, "บันทึกใบ GRN และอัปเดตสต็อกคงคลังสำเร็จ!");
    
    // Explicitly update raw_material stock_qty in database / memory
    const matId = Number(grn.raw_material_id);
    const qty = parseFloat(grn.received_qty) || 0;
    if (matId && qty > 0) {
      const mat = rawMaterials.find(rm => rm.id === matId);
      if (mat) {
        const newStock = parseFloat(String(mat.stock_qty || 0)) + qty;
        const updatedMat = { ...mat, stock_qty: newStock };
        await clientSave("raw_materials", mat.id, updatedMat);
        await loadAllData();
      }
    }
  };

  // Render subpage views
  const renderActivePageContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard 
            productionOrders={productionOrders}
            rawMaterials={rawMaterials}
            packingOrders={packingOrders}
            prechecks={prechecks}
            setActivePage={setActivePage}
          />
        );
      case "projects":
        return (
          <Projects 
            projects={projects}
            customers={customers}
            onSaveProject={async (p) => handleSave("projects", p, "บันทึกข้อมูลโปรเจคเรียบร้อยแล้ว!")}
            onDeleteProject={async (id) => handleDelete("projects", id, "ลบข้อมูลโปรเจคเรียบร้อยแล้ว!")}
          />
        );
      case "customer":
        return (
          <Customers 
            customers={customers}
            onSaveCustomer={async (c) => handleSave("customers", c, "บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว!")}
            onDeleteCustomer={async (id) => handleDelete("customers", id, "ลบข้อมูลลูกค้าเรียบร้อยแล้ว!")}
            productionOrders={productionOrders}
            bomRecipes={bomRecipes}
          />
        );
      case "bom":
        return (
          <Boms 
            bomRecipes={bomRecipes}
            products={products}
            rawMaterials={rawMaterials}
            productionOrders={productionOrders}
            customers={customers}
            onSaveBom={async (b) => handleSave("bom_recipes", b, "บันทึกสูตรการผลิต (BOM) เรียบร้อยแล้ว!")}
            onDeleteBom={async (id) => handleDelete("bom_recipes", id, "ลบสูตรการผลิต (BOM) เรียบร้อยแล้ว!")}
            onSaveProduct={async (p) => handleSave("products", p, "เพิ่มรายการสินค้าสำเร็จ!")}
            onSaveProductionOrder={async (po) => handleSave("production_orders", po, "จองวัตถุดิบและบันทึกประวัติการสั่งผลิตสำเร็จ!")}
            onSaveRawMaterial={async (rm) => {
              await clientSave("raw_materials", rm.id, rm);
              await loadAllData();
            }}
            onSavePurchaseOrder={async (po) => handleSave("purchase_orders", po, "สร้างรายการขอสั่งซื้อเคมีภัณฑ์สำเร็จ!")}
            setActivePage={setActivePage}
          />
        );
      case "precheck":
        return (
          <PrecheckPage 
            prechecks={prechecks}
            onSavePrecheck={async (p) => handleSave("prechecks", p, "บันทึกผลตรวจสอบสารเคมีเรียบร้อยแล้ว!")}
            onDeletePrecheck={async (id) => handleDelete("prechecks", id, "ลบใบวิเคราะห์สารเคมีเรียบร้อยแล้ว!")}
          />
        );
      case "production":
        return (
          <ProductionPage 
            productionOrders={productionOrders}
            products={products}
            customers={customers}
            onSaveProduction={async (po) => handleSave("production_orders", po, "ออกใบสั่งประกอบการผลิตสำเร็จ!")}
            onDeleteProduction={async (id) => handleDelete("production_orders", id, "ยกเลิกใบสั่งผลิตสำเร็จ!")}
          />
        );
      case "packing":
        return (
          <PackingPage 
            packingOrders={packingOrders}
            productionOrders={productionOrders}
            onSavePacking={async (pk) => handleSave("packing_orders", pk, "บันทึกคิวไลน์บรรจุขวดสำเร็จ!")}
            onDeletePacking={async (id) => handleDelete("packing_orders", id, "ลบคิวไลน์บรรจุขวดเรียบร้อยแล้ว!")}
          />
        );
      case "purchase":
        return (
          <PurchasePage 
            purchaseOrders={purchaseOrders}
            rawMaterials={rawMaterials}
            onAddPurchase={async (po) => handleSave("purchase_orders", po, "ออกใบสั่งสั่งซื้อเคมีภัณฑ์เสร็จสิ้น!")}
            onSavePurchase={async (po) => handleSave("purchase_orders", po, "บันทึกแก้ไขใบสั่งซื้อเรียบร้อยแล้ว!")}
            onDeletePurchase={async (id) => handleDelete("purchase_orders", id, "ลบใบสั่งซื้อเคมีภัณฑ์เรียบร้อยแล้ว!")}
            onReceivePurchase={async (po) => {
              try {
                // 1. Mark PO as received
                const updatedPo = { ...po, status: "received" };
                await clientSave("purchase_orders", po.id, updatedPo);
                
                // 2. Add raw materials to stock
                if (po.items && po.items.length > 0) {
                  for (const item of po.items) {
                    const matId = item.raw_material_id;
                    const qty = item.quantity;
                    if (matId && qty) {
                      const mat = rawMaterials.find(rm => rm.id === matId);
                      if (mat) {
                        const updatedMat = { ...mat, stock_qty: parseFloat(String(mat.stock_qty || 0)) + parseFloat(String(qty)) };
                        await clientSave("raw_materials", mat.id, updatedMat);
                      }
                    }
                  }
                }

                // 3. Create a GRN record automatically
                if (po.items && po.items.length > 0) {
                  for (const item of po.items) {
                    const grnCode = `GRN-2026-${String(grns.length + 20).padStart(4, "0")}`;
                    const lotNum = `L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-AUTO`;
                    const expDate = new Date(Date.now() + 365*2*24*60*60*1000).toISOString().slice(0, 10);
                    
                    await clientSave("grns", 0, {
                      code: grnCode,
                      purchase_order_id: po.id,
                      raw_material_id: item.raw_material_id,
                      lot_number: lotNum,
                      expiry_date: expDate,
                      received_qty: item.quantity,
                      receiver: "ระบบอัตโนมัติ (รับเข้าคลัง)",
                      receive_date: new Date().toISOString().slice(0, 10)
                    });
                  }
                }
                
                showToast("รับเคมีภัณฑ์เข้าคลังและเพิ่มสต็อกเรียบร้อยแล้ว!", "success");
                await loadAllData();
              } catch (e: any) {
                showToast(e.message || "เกิดข้อผิดพลาดในการรับของเข้าสต็อก", "error");
              }
            }}
          />
        );
      case "grn":
        return (
          <GrnsPage 
            grns={grns}
            rawMaterials={rawMaterials}
            purchaseOrders={purchaseOrders}
            onAddGrn={handleAddGrn}
            onDeleteGrn={async (id) => handleDelete("grns", id, "ลบรายการรับเข้า (GRN) เรียบร้อยแล้ว!")}
          />
        );
      case "inventory":
        return (
          <Warehouse 
            rawMaterials={rawMaterials}
            inventoryPacks={inventoryPacks}
            productionOrders={productionOrders}
            bomRecipes={bomRecipes}
            products={products}
            grns={grns}
            purchaseOrders={purchaseOrders}
            setActivePage={setActivePage}
            onSavePurchaseOrder={async (payload) => {
              await handleSave("purchase_orders", payload, "สร้างใบสั่งซื้อเคมีภัณฑ์สำเร็จ!");
            }}
            onSaveRawMaterial={async (payload) => {
              await handleSave("raw_materials", payload, "บันทึกข้อมูลวัตถุดิบเคมีดิบเรียบร้อยแล้ว!");
            }}
            onDeleteRawMaterial={async (id) => {
              await handleDelete("raw_materials", id, "ลบข้อมูลวัตถุดิบเคมีดิบเรียบร้อยแล้ว!");
            }}
            onSaveInventoryPack={async (payload) => {
              await handleSave("inventory_pack", payload, "บันทึกข้อมูลบรรจุภัณฑ์สำเร็จ!");
            }}
            onDeleteInventoryPack={async (id) => {
              await handleDelete("inventory_pack", id, "ลบข้อมูลบรรจุภัณฑ์สำเร็จ!");
            }}
          />
        );
      case "report":
        return (
          <ReportPage 
            productionOrders={productionOrders}
            purchaseOrders={purchaseOrders}
            rawMaterials={rawMaterials}
            products={products}
            customers={customers}
            grns={grns}
            packingOrders={packingOrders}
            prechecks={prechecks}
          />
        );
      case "manual":
        return (
          <UserManual 
            onNavigate={(page) => setActivePage(page)}
          />
        );
      case "settings":
        return (
          <SettingsPage 
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            themes={THEMES}
            tableStats={{
              projects: projects.length,
              customers: customers.length,
              bomRecipes: bomRecipes.length,
              prechecks: prechecks.length,
              productionOrders: productionOrders.length,
              packingOrders: packingOrders.length,
              purchaseOrders: purchaseOrders.length,
              grns: grns.length,
              rawMaterials: rawMaterials.length,
              inventoryPacks: inventoryPacks.length
            }}
            onRefreshData={loadAllData}
            onOpenDbModal={() => setIsDbModalOpen(true)}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            ขออภัย ไม่พบหน้าที่คุณร้องขอในสารระบบ
          </div>
        );
    }
  };

  const lowStockCount = rawMaterials.filter(m => m.stock_qty <= m.min_stock).length;

  // Real-time active alerts & updates
  const notifications: {
    id: string;
    type: "warning" | "info" | "error" | "success";
    title: string;
    description: string;
    page: string;
  }[] = [];

  // 1. Low stock raw materials
  rawMaterials.forEach((m) => {
    if (m.stock_qty <= m.min_stock) {
      notifications.push({
        id: `stock-${m.id}`,
        type: "warning",
        title: `วัตถุดิบต่ำกว่าเกณฑ์: ${m.name}`,
        description: `คงเหลือ ${m.stock_qty} ${m.unit} (ขั้นต่ำ ${m.min_stock})`,
        page: "inventory"
      });
    }
  });

  // 2. Running production orders
  productionOrders.forEach((po) => {
    if (po.status === "running") {
      notifications.push({
        id: `prod-${po.id}`,
        type: "info",
        title: `กำลังดำเนินการผลิต: ${po.code}`,
        description: `สั่งผลิตจำนวน ${po.quantity} ${po.unit}`,
        page: "production"
      });
    }
  });

  // 3. Pending purchase orders
  purchaseOrders.forEach((po) => {
    if (po.status === "pending") {
      notifications.push({
        id: `purch-${po.id}`,
        type: "warning",
        title: `ใบสั่งซื้อรอรับของ: ${po.code}`,
        description: `ซัพพลายเออร์: ${po.supplier}`,
        page: "purchase"
      });
    }
  });

  // 4. Failed or pending prechecks
  prechecks.forEach((c) => {
    if (c.result === "fail") {
      notifications.push({
        id: `check-${c.id}`,
        type: "error",
        title: `ผลตรวจไม่ผ่าน: ${c.material}`,
        description: `ล็อต: ${c.lot} โดยผู้ตรวจ ${c.inspector}`,
        page: "precheck"
      });
    } else if (c.result === "pending") {
      notifications.push({
        id: `check-pend-${c.id}`,
        type: "info",
        title: `รอตรวจสารเคมี: ${c.material}`,
        description: `ล็อต: ${c.lot} ได้รับลงทะเบียนเรียบร้อย`,
        page: "precheck"
      });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onOpenDbModal={() => setIsDbModalOpen(true)}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Topbar 
          activePage={activePage} 
          setSidebarOpen={setSidebarOpen} 
          lowStockCount={lowStockCount}
          dbStatus={dbStatus}
          notifications={notifications}
          onNavigate={setActivePage}
          onOpenDbModal={() => setIsDbModalOpen(true)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActivePageContent()}
        </main>
      </div>

      {/* Database Direct Link & Health Check Modal (Protected by Passcode) */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        tableStats={{
          projects: projects.length,
          customers: customers.length,
          bomRecipes: bomRecipes.length,
          prechecks: prechecks.length,
          productionOrders: productionOrders.length,
          packingOrders: packingOrders.length,
          purchaseOrders: purchaseOrders.length,
          grns: grns.length,
          rawMaterials: rawMaterials.length,
          inventoryPacks: inventoryPacks.length
        }}
        onRefreshData={loadAllData}
      />

      {/* Toast Alert Popups */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`
            flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold
            ${toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
            }
          `}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
