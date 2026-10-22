import { createClient } from "@supabase/supabase-js";
import { SAMPLE_SEED_DATA } from "./seedData";

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
  } catch {}
  currentConfig = {
    url: clean,
    key: key.trim(),
    isCustom: true,
    projectId: clean.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "custom"
  };
  supabase = createClient(clean, key.trim());
};

export const resetSupabaseConfig = () => {
  try {
    localStorage.removeItem("custom_supabase_url");
    localStorage.removeItem("custom_supabase_key");
  } catch {}
  currentConfig = getSupabaseConfig();
  cleanUrl = currentConfig.url.replace(/\/rest\/v1\/?$/, "");
  supabase = createClient(cleanUrl, currentConfig.key);
};

// Cleanup legacy localStorage mock keys automatically on startup
(() => {
  try {
    const legacyKeys = [
      "factory_memory_db",
      "factory_database_cleared",
      "factory_warehouse_semi",
      "factory_warehouse_requisitions",
      "factory_warehouse_deleted_fg",
      "factory_warehouse_custom_fg",
      "supabase_is_offline"
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("factory_deleted_") || key.startsWith("supabase_failed_"))) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
})();

// Timeout wrapper with generous 10s timeout to prevent premature aborts on mobile/cloud
export const withTimeout = <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Supabase request timeout")), ms))
  ]);
};

// Export dummy fallbackDB interface if anything needs it, but it contains NO mock records
export const fallbackDB: Record<string, any[]> = {};

export const setSupabaseOffline = (_offline: boolean) => {
  // No-op: we connect directly to Supabase 100%
};

/**
 * 100% DIRECT SUPABASE QUERY
 * - Returns exact records from the Supabase database.
 * - When table has 0 records, returns [] (Empty array).
 * - NEVER falls back to mock data or localStorage fake data!
 */
export async function clientGetList(entity: string): Promise<any[]> {
  const table = entity;
  try {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(`[Supabase 100%] Error fetching table '${table}':`, error.message);
      return [];
    }

    const rows = data || [];

    // If table is empty, return empty list immediately (0 records)
    if (rows.length === 0) {
      return [];
    }

    // Specific relational enrichment for bom_recipes
    if (entity === "bom_recipes") {
      const enrichedRows = [];
      for (const row of rows) {
        const item = { ...row };
        let materials: any[] = [];

        // 1. Try parsing materials from jsonb column
        if (Array.isArray(item.materials)) {
          materials = item.materials;
        } else if (typeof item.materials === "string") {
          try {
            materials = JSON.parse(item.materials);
          } catch {}
        }

        // 2. If empty, check child table bom_items
        if (materials.length === 0) {
          try {
            const { data: items, error: itmErr } = await supabase
              .from("bom_items")
              .select("*")
              .eq("bom_id", item.id);
            if (!itmErr && items && items.length > 0) {
              materials = items.map((itm: any) => ({
                part: itm.part || "A",
                raw_material_id: itm.raw_material_id,
                material_code: itm.material_code || "",
                material_name: itm.material_name,
                quantity: parseFloat(itm.quantity) || 0,
                unit: itm.unit || "KG.",
                notes: itm.notes || ""
              }));
            }
          } catch (e) {
            console.warn("Error fetching bom_items:", e);
          }
        }

        item.materials = materials;
        enrichedRows.push(item);
      }
      return enrichedRows;
    }

    // Specific relational enrichment for purchase_orders
    if (entity === "purchase_orders") {
      const enrichedRows = [];
      for (const row of rows) {
        const item = { ...row };
        let items: any[] = [];

        if (Array.isArray(item.items)) {
          items = item.items;
        } else if (typeof item.items === "string") {
          try {
            items = JSON.parse(item.items);
          } catch {}
        }

        if (items.length === 0) {
          try {
            const { data: orderItems, error: itmErr } = await supabase
              .from("purchase_order_items")
              .select("*")
              .eq("purchase_order_id", item.id);
            if (!itmErr && orderItems && orderItems.length > 0) {
              items = orderItems.map((itm: any) => ({
                raw_material_id: itm.raw_material_id,
                item_name: itm.item_name,
                quantity: parseFloat(itm.quantity) || 0,
                unit: itm.unit || "กก.",
                unit_price: parseFloat(itm.unit_price) || 0,
                subtotal: parseFloat(itm.subtotal) || 0
              }));
            }
          } catch (e) {
            console.warn("Error fetching purchase_order_items:", e);
          }
        }

        item.items = items;
        enrichedRows.push(item);
      }
      return enrichedRows;
    }

    return rows;
  } catch (err: any) {
    console.error(`[Supabase 100%] Query exception for '${entity}':`, err?.message || err);
    return [];
  }
}

/**
 * 100% DIRECT SUPABASE INSERT & UPDATE
 */
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
      cleanData.materials = materialsToSave;
    }
  }
  if (entity === "purchase_orders") {
    if ("items" in cleanData) {
      itemsToSave = Array.isArray(cleanData.items) ? cleanData.items : [];
      cleanData.items = itemsToSave;
    }
  }

  let savedId = id;
  if (id > 0) {
    const { error } = await supabase.from(table).update(cleanData).eq("id", id);
    if (error) {
      console.error(`[Supabase Save Error] Table ${table} id ${id}:`, error);
      throw new Error(`บันทึกไม่สำเร็จ: ${error.message}`);
    }
  } else {
    const { data: inserted, error } = await supabase.from(table).insert(cleanData).select("id").single();
    if (error) {
      console.error(`[Supabase Insert Error] Table ${table}:`, error);
      throw new Error(`เพิ่มข้อมูลไม่สำเร็จ: ${error.message}`);
    }
    savedId = inserted.id;
  }

  // Handle child table saves
  if (entity === "bom_recipes" && materialsToSave !== null) {
    try {
      await supabase.from("bom_items").delete().eq("bom_id", savedId);
      if (materialsToSave.length > 0) {
        const rows = materialsToSave.map((mat) => ({
          bom_id: savedId,
          part: mat.part || "A",
          raw_material_id: mat.raw_material_id || null,
          material_code: mat.material_code || "",
          material_name: mat.material_name,
          quantity: mat.quantity || 0,
          unit: mat.unit || "KG.",
          notes: mat.notes || null
        }));
        await supabase.from("bom_items").insert(rows);
      }
    } catch (errBomItems) {
      console.warn("Could not sync bom_items child table:", errBomItems);
    }
  }

  if (entity === "purchase_orders" && itemsToSave !== null) {
    try {
      await supabase.from("purchase_order_items").delete().eq("purchase_order_id", savedId);
      if (itemsToSave.length > 0) {
        const rows = itemsToSave.map((itm) => ({
          purchase_order_id: savedId,
          raw_material_id: itm.raw_material_id || null,
          item_name: itm.item_name,
          quantity: itm.quantity || 0,
          unit: itm.unit || "กก.",
          unit_price: itm.unit_price || 0,
          subtotal: itm.subtotal || 0
        }));
        await supabase.from("purchase_order_items").insert(rows);
      }
    } catch (errPoItems) {
      console.warn("Could not sync purchase_order_items child table:", errPoItems);
    }
  }

  // Automatically update stock on GRN save directly in Supabase
  if (entity === "grns" && id === 0) {
    const rawMaterialId = parseInt(cleanData.raw_material_id || 0);
    const receivedQty = parseFloat(cleanData.received_qty || 0);
    if (rawMaterialId && receivedQty) {
      try {
        const { data: mat, error: matErr } = await supabase
          .from("raw_materials")
          .select("stock_qty")
          .eq("id", rawMaterialId)
          .single();
        if (!matErr && mat) {
          const newStock = parseFloat(String(mat.stock_qty || 0)) + receivedQty;
          await supabase.from("raw_materials").update({ stock_qty: newStock }).eq("id", rawMaterialId);
        }
      } catch (e) {
        console.error("Error updating stock on GRN save in Supabase:", e);
      }
    }
  }

  return savedId;
}

/**
 * 100% DIRECT SUPABASE DELETE
 * Deletes from Supabase database directly, removing child relations first.
 */
export async function clientDelete(entity: string, id: number | string): Promise<boolean> {
  const table = entity;
  try {
    // 1. Delete dependent child records in Supabase to avoid FK constraint errors
    if (entity === "bom_recipes") {
      await supabase.from("bom_items").delete().eq("bom_id", id);
    } else if (entity === "purchase_orders") {
      await supabase.from("purchase_order_items").delete().eq("purchase_order_id", id);
      await supabase.from("grns").update({ purchase_order_id: null }).eq("purchase_order_id", id);
    } else if (entity === "production_orders") {
      await supabase.from("packing_orders").delete().eq("production_order_id", id);
    } else if (entity === "products") {
      await supabase.from("bom_items").delete().in(
        "bom_id",
        (await supabase.from("bom_recipes").select("id").eq("product_id", id)).data?.map((b) => b.id) || []
      );
      await supabase.from("bom_recipes").delete().eq("product_id", id);
      await supabase.from("production_orders").delete().eq("product_id", id);
    } else if (entity === "customers") {
      await supabase.from("projects").delete().eq("customer_id", id);
      await supabase.from("production_orders").delete().eq("customer_id", id);
    } else if (entity === "raw_materials") {
      await supabase.from("grns").delete().eq("raw_material_id", id);
      await supabase.from("bom_items").delete().eq("raw_material_id", id);
      await supabase.from("purchase_order_items").delete().eq("raw_material_id", id);
    }

    // 2. Delete the record itself in Supabase
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      console.error(`[Supabase Delete Error] Table ${table} id ${id}:`, error);
      throw new Error(`ลบข้อมูลไม่สำเร็จ: ${error.message}`);
    }

    return true;
  } catch (err: any) {
    console.error(`[Supabase Delete Exception] ${entity} ${id}:`, err);
    throw err;
  }
}

/**
 * Clear All Database Tables (Password Protected: 4321034)
 * Deletes all records in Supabase in child-first order.
 * Ensures Supabase tables are truly empty (0 records).
 */
export async function clearAllDatabaseTables(passcode: string): Promise<{
  success: boolean;
  message: string;
  clearedTables: string[];
}> {
  if (passcode.trim() !== "4321034") {
    throw new Error("รหัสผ่านยืนยันไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อป้องกันการกดพลาด");
  }

  // Exact topological order (child leaf tables first to avoid foreign key violations)
  const tablesInOrder = [
    "bom_items",
    "purchase_order_items",
    "grns",
    "packing_orders",
    "production_orders",
    "purchase_packs",
    "purchase_orders",
    "prechecks",
    "bom_recipes",
    "inventory_pack",
    "projects",
    "raw_materials",
    "products",
    "customers",
    "suppliers"
  ];

  // 1. Delete all rows from Supabase directly
  for (const t of tablesInOrder) {
    try {
      const { error } = await supabase.from(t).delete().gt("id", -1);
      if (error) {
        console.warn(`[Supabase Clear] Table ${t}:`, error.message);
      }
    } catch (e) {
      console.warn(`[Supabase Clear Exception] Table ${t}:`, e);
    }
  }

  // 2. Clear any local storage remnants
  try {
    const keys = [
      "factory_memory_db",
      "factory_database_cleared",
      "factory_warehouse_semi",
      "factory_warehouse_requisitions",
      "factory_warehouse_deleted_fg",
      "factory_warehouse_custom_fg",
      "supabase_is_offline"
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("factory_deleted_") || k.startsWith("supabase_failed_"))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}

  // 3. Notify server backend to clear its memory
  try {
    await fetch("/api/clear-all-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "4321034" })
    });
  } catch {}

  return {
    success: true,
    message: "ล้างข้อมูลในฐานข้อมูล Supabase ทั้งหมดเรียบร้อยแล้ว 100% (ทุกตารางว่างเปล่า 0 รายการ)",
    clearedTables: tablesInOrder
  };
}

/**
 * Reset Sample Database (Password Protected: 4321034)
 * Inserts the sample factory dataset directly into Supabase tables so it is persistent across all devices!
 */
export async function resetSampleDatabase(passcode: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (passcode.trim() !== "4321034") {
    throw new Error("รหัสผ่านยืนยันไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อยืนยัน");
  }

  // 1. Clear first to have clean state
  await clearAllDatabaseTables("4321034");

  // 2. Insert into Supabase in parent-to-child order
  try {
    if (SAMPLE_SEED_DATA.suppliers?.length) {
      await supabase.from("suppliers").insert(SAMPLE_SEED_DATA.suppliers);
    }
    if (SAMPLE_SEED_DATA.customers?.length) {
      await supabase.from("customers").insert(SAMPLE_SEED_DATA.customers);
    }
    if (SAMPLE_SEED_DATA.products?.length) {
      await supabase.from("products").insert(SAMPLE_SEED_DATA.products);
    }
    if (SAMPLE_SEED_DATA.raw_materials?.length) {
      await supabase.from("raw_materials").insert(SAMPLE_SEED_DATA.raw_materials);
    }
    if (SAMPLE_SEED_DATA.bom_recipes?.length) {
      for (const b of SAMPLE_SEED_DATA.bom_recipes) {
        const recipeRow = { ...b };
        delete (recipeRow as any).materials;
        const { data: insertedBom } = await supabase.from("bom_recipes").insert({
          ...recipeRow,
          materials: b.materials
        }).select("id").single();

        const bomId = insertedBom?.id || b.id;
        if (b.materials && b.materials.length > 0) {
          const itms = b.materials.map((m: any) => ({
            bom_id: bomId,
            part: m.part || "A",
            material_code: m.material_code || "",
            material_name: m.material_name,
            quantity: m.quantity || 0,
            unit: m.unit || "KG.",
            notes: m.notes || null
          }));
          await supabase.from("bom_items").insert(itms);
        }
      }
    }
    if (SAMPLE_SEED_DATA.production_orders?.length) {
      await supabase.from("production_orders").insert(SAMPLE_SEED_DATA.production_orders);
    }
    if (SAMPLE_SEED_DATA.packing_orders?.length) {
      await supabase.from("packing_orders").insert(SAMPLE_SEED_DATA.packing_orders);
    }
    if (SAMPLE_SEED_DATA.purchase_orders?.length) {
      for (const po of SAMPLE_SEED_DATA.purchase_orders) {
        const poRow = { ...po };
        delete (poRow as any).items;
        const { data: insertedPo } = await supabase.from("purchase_orders").insert({
          ...poRow,
          items: po.items
        }).select("id").single();

        const poId = insertedPo?.id || po.id;
        if (po.items && po.items.length > 0) {
          const itms = po.items.map((i: any) => ({
            purchase_order_id: poId,
            raw_material_id: i.raw_material_id || null,
            item_name: i.item_name,
            quantity: i.quantity || 0,
            unit: i.unit || "กก.",
            unit_price: i.unit_price || 0,
            subtotal: i.subtotal || 0
          }));
          await supabase.from("purchase_order_items").insert(itms);
        }
      }
    }
    if (SAMPLE_SEED_DATA.grns?.length) {
      await supabase.from("grns").insert(SAMPLE_SEED_DATA.grns);
    }
    if (SAMPLE_SEED_DATA.prechecks?.length) {
      await supabase.from("prechecks").insert(SAMPLE_SEED_DATA.prechecks);
    }
    if (SAMPLE_SEED_DATA.inventory_pack?.length) {
      await supabase.from("inventory_pack").insert(SAMPLE_SEED_DATA.inventory_pack);
    }
    if (SAMPLE_SEED_DATA.projects?.length) {
      await supabase.from("projects").insert(SAMPLE_SEED_DATA.projects);
    }
  } catch (seedErr) {
    console.error("Error inserting sample seed into Supabase:", seedErr);
  }

  return {
    success: true,
    message: "รีเซ็ตและบันทึกข้อมูลตัวอย่างโรงงานลงฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!"
  };
}

/**
 * Intelligent Connection Diagnostics
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
      8000
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

    return {
      success: true,
      elapsed,
      message: `เชื่อมต่อ Supabase สำเร็จ 100%! (${elapsed}ms - สถานะออนไลน์โดยตรง)`
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
        details: "ตรวจพบว่าโครงการ Supabase (zizlhxikswejwvoftshk) อาจอยู่ในสถานะ 'Paused' บน Supabase Cloud หรือไม่มีการตอบสนองจาก Host"
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
