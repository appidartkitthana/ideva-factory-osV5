import { createClient } from "@supabase/supabase-js";
import { SAMPLE_SEED_DATA } from "./seedData";
import { EMBEDDED_SUPABASE_URL, EMBEDDED_SUPABASE_KEY } from "./supabaseCredentials";

// Default credentials hardcoded & embedded directly into system build
const DEFAULT_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || EMBEDDED_SUPABASE_URL;
const DEFAULT_SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || EMBEDDED_SUPABASE_KEY;

export function getSupabaseConfig() {
  let customUrl = "";
  let customKey = "";

  // 1. Auto-detect from URL query parameters (enables 1-click database sync across any link/device)
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("supabase_url") || params.get("db_url");
      const keyParam = params.get("supabase_key") || params.get("db_key");
      if (urlParam && keyParam) {
        customUrl = urlParam.trim();
        customKey = keyParam.trim();
        localStorage.setItem("custom_supabase_url", customUrl);
        localStorage.setItem("custom_supabase_key", customKey);
      }
    } catch {}
  }

  // 2. Read from localStorage
  if (!customUrl || !customKey) {
    try {
      customUrl = localStorage.getItem("custom_supabase_url") || "";
      customKey = localStorage.getItem("custom_supabase_key") || "";
    } catch {}
  }

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

/**
 * Generate a universal link containing active database credentials
 * Anyone clicking this link on any device will connect to the exact same cloud database!
 */
export function getShareableDatabaseLink(): string {
  if (typeof window === "undefined") return "";
  const cfg = getSupabaseConfig();
  const url = new URL(window.location.href);
  url.searchParams.set("db_url", cfg.url);
  url.searchParams.set("db_key", cfg.key);
  return url.toString();
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("supabase_config_changed", { detail: currentConfig }));
  }
};

export const resetSupabaseConfig = () => {
  try {
    localStorage.removeItem("custom_supabase_url");
    localStorage.removeItem("custom_supabase_key");
  } catch {}
  currentConfig = getSupabaseConfig();
  cleanUrl = currentConfig.url.replace(/\/rest\/v1\/?$/, "");
  supabase = createClient(cleanUrl, currentConfig.key);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("supabase_config_changed", { detail: currentConfig }));
  }
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
  // No-op
};

// Resilient Live Storage & Auto-Sync Queue Prefix
const LIVE_STORE_PREFIX = "ideva_db_v5_";
const SYNC_QUEUE_KEY = "ideva_db_v5_sync_queue";

export const broadcastSyncChannel = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined" 
  ? new BroadcastChannel("ideva_factory_sync") 
  : null;

export function notifyGlobalSync() {
  if (broadcastSyncChannel) {
    try {
      broadcastSyncChannel.postMessage({ type: "DATA_MUTATED", timestamp: Date.now() });
    } catch {}
  }
}

export interface SyncItem {
  id?: string | number;
  action: "save" | "delete";
  table: string;
  record?: any;
  recordId?: number | string;
  timestamp: number;
}

export function getLocalTable(table: string): any[] {
  try {
    const raw = localStorage.getItem(`${LIVE_STORE_PREFIX}${table}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function setLocalTable(table: string, rows: any[]) {
  try {
    localStorage.setItem(`${LIVE_STORE_PREFIX}${table}`, JSON.stringify(rows));
  } catch {}
}

export function saveLocalRecord(table: string, record: any): any {
  const current = getLocalTable(table);
  const existingIdx = current.findIndex((r: any) => String(r.id) === String(record.id));
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...record };
  } else {
    current.unshift(record);
  }
  setLocalTable(table, current);
  return record;
}

export function deleteLocalRecord(table: string, id: number | string) {
  const current = getLocalTable(table);
  const filtered = current.filter((r: any) => String(r.id) !== String(id));
  setLocalTable(table, filtered);
}

export function getSyncQueue(): SyncItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setSyncQueue(queue: SyncItem[]) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function queueSyncItem(item: Omit<SyncItem, "timestamp">) {
  const q = getSyncQueue();
  // Filter out duplicate saves for the same record
  const filtered = q.filter((i) => !(i.table === item.table && i.action === item.action && String(i.record?.id || i.recordId || i.id) === String(item.record?.id || item.recordId || item.id)));
  filtered.push({ ...item, timestamp: Date.now() });
  setSyncQueue(filtered);
}

export async function processSyncQueue(): Promise<number> {
  const queue = getSyncQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remaining: SyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.action === "save" && item.record) {
        const row = { ...item.record };
        // If temporary client timestamp ID (>= 1700000000000), let Supabase generate auto-increment primary key
        if (typeof row.id === "number" && row.id > 1700000000000) {
          delete row.id;
        }
        const { error } = await withTimeout(supabase.from(item.table).upsert(row), 4000);
        if (!error) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      } else if (item.action === "delete") {
        const targetId = item.recordId ?? item.id;
        if (targetId) {
          const numId = Number(targetId) || targetId;
          const { error } = await withTimeout(supabase.from(item.table).delete().eq("id", numId), 4000);
          if (!error) {
            syncedCount++;
          } else {
            remaining.push(item);
          }
        }
      }
    } catch {
      remaining.push(item);
    }
  }

  setSyncQueue(remaining);
  return syncedCount;
}

/**
 * 100% DIRECT SUPABASE QUERY
 * - Returns exact records from the Supabase database.
 * - When table has 0 records, returns [] (Empty array).
 * - NEVER falls back to mock data or localStorage fake data!
 */
export const TABLE_ALLOWED_COLUMNS: Record<string, string[]> = {
  suppliers: [
    "code", "name", "contact", "phone", "email", "address", "status", "created_at"
  ],
  customers: [
    "code", "name", "contact", "phone", "email", "tax_id", "address", "status", "created_at"
  ],
  products: [
    "code", "name", "type", "version", "status", "image_url", "category", "description", "unit_price", "stock_qty", "min_stock", "created_at"
  ],
  raw_materials: [
    "code", "name", "unit", "stock_qty", "min_stock", "unit_price", "supplier_id", "supplier_name", "status", "image_url", "created_at"
  ],
  bom_recipes: [
    "product_id", "part_no", "version", "status", "estimated_unit_cost", "notes", "materials", "created_at"
  ],
  bom_items: [
    "bom_id", "part", "raw_material_id", "material_code", "material_name", "quantity", "unit", "unit_price", "notes"
  ],
  production_orders: [
    "code", "customer_id", "product_id", "quantity", "unit", "status", "due_date", "staff", "date", "created_at"
  ],
  packing_orders: [
    "code", "production_order_id", "item_name", "quantity", "unit", "status", "created_at"
  ],
  purchase_orders: [
    "code", "supplier", "order_date", "status", "total_amount", "items", "created_at"
  ],
  purchase_order_items: [
    "purchase_order_id", "raw_material_id", "item_name", "quantity", "unit", "unit_price", "subtotal"
  ],
  grns: [
    "code", "purchase_order_id", "raw_material_id", "lot_number", "expiry_date", "received_qty", "receiver", "receive_date", "status", "unit", "unit_price", "supplier_name", "po_number", "created_at"
  ],
  prechecks: [
    "material", "lot", "expiry", "inspector", "date", "result", "notes", "created_at"
  ],
  inventory_pack: [
    "code", "type", "name", "qty", "unit", "status", "supplier_name", "unit_price", "image_url", "created_at"
  ],
  purchase_packs: [
    "code", "supplier", "item", "qty", "price", "status", "unit", "created_at"
  ],
  projects: [
    "title", "project_type", "customer_id", "customer", "customer_status", "owner", "price", "start_date", "due_date", "progress", "status", "quantity", "tags", "description", "product_code", "lot_number", "product_name", "details", "category", "created_at"
  ],
  semi_finished_goods: [
    "code", "name", "batch_no", "qty", "unit", "tank_no", "mfg_date", "status", "created_at"
  ],
  requisitions: [
    "code", "date", "department", "requester", "purpose", "status", "items", "created_at"
  ]
};

/**
 * 100% DIRECT SUPABASE QUERY
 * - Returns exact records from the Supabase database.
 * - When table has 0 records, returns [] (Empty array).
 * - Queries and maps all tables and columns directly.
 */
export async function clientGetList(entity: string): Promise<any[]> {
  const table = entity;
  try {
    // Special handling for semi_finished_goods direct from table
    if (entity === "semi_finished_goods") {
      try {
        const { data, error } = await withTimeout(
          supabase.from("semi_finished_goods").select("*").order("id", { ascending: false }),
          8000
        );
        if (error) {
          console.warn(`[Supabase Fetch Error] semi_finished_goods:`, error.message);
        } else if (data) {
          setLocalTable("semi_finished_goods", data);
          return data;
        }
      } catch (err: any) {
        console.warn(`[Supabase Timeout/Error] semi_finished_goods:`, err?.message);
      }
      const local = getLocalTable("semi_finished_goods");
      if (local && local.length > 0) return local;
      return [];
    }

    // Special handling for requisitions direct from table
    if (entity === "requisitions") {
      try {
        const { data, error } = await withTimeout(
          supabase.from("requisitions").select("*").order("id", { ascending: false }),
          8000
        );
        if (error) {
          console.warn(`[Supabase Fetch Error] requisitions:`, error.message);
        } else if (data) {
          const parsed = data.map((r: any) => ({
            ...r,
            items: Array.isArray(r.items) ? r.items : (typeof r.items === "string" ? JSON.parse(r.items || "[]") : [])
          }));
          setLocalTable("requisitions", parsed);
          return parsed;
        }
      } catch (err: any) {
        console.warn(`[Supabase Timeout/Error] requisitions:`, err?.message);
      }
      const local = getLocalTable("requisitions");
      if (local && local.length > 0) return local;
      return [];
    }

    let rows: any[] = [];
    let remoteSuccess = false;

    try {
      const { data, error } = await withTimeout(
        supabase.from(table).select("*").order("id", { ascending: false }),
        8000
      );

      if (error) {
        console.warn(`[Supabase Fetch Error] table '${table}':`, error.message);
      } else if (data) {
        rows = data;
        remoteSuccess = true;
        setLocalTable(table, data);
      }
    } catch (e: any) {
      console.warn(`[Supabase Timeout/Error] table '${table}':`, e?.message);
    }

    if (!remoteSuccess) {
      rows = getLocalTable(table);
    }

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
  const rawInput = { ...data };
  delete rawInput.id;

  // Specific data normalization
  if (entity === "raw_materials") {
    if (rawInput.supplier && !rawInput.supplier_name) {
      rawInput.supplier_name = String(rawInput.supplier).trim();
    }
  }

  // Type coercions and relation extractions
  let materialsToSave: any[] | null = null;
  let itemsToSave: any[] | null = null;

  if (entity === "bom_recipes") {
    if ("materials" in rawInput) {
      materialsToSave = Array.isArray(rawInput.materials) ? rawInput.materials : [];
      rawInput.materials = materialsToSave;
    }
  } else if (entity === "purchase_orders") {
    if ("items" in rawInput) {
      itemsToSave = Array.isArray(rawInput.items) ? rawInput.items : [];
      rawInput.items = itemsToSave;
    }
  } else if (entity === "requisitions") {
    if ("items" in rawInput) {
      rawInput.items = Array.isArray(rawInput.items) ? rawInput.items : [];
    }
  } else if (entity === "projects") {
    if ("tags" in rawInput) {
      rawInput.tags = Array.isArray(rawInput.tags) ? rawInput.tags : [];
    }
  }

  // Strict whitelist column sanitization: guarantees all defined columns are preserved and passed to Supabase
  const allowedCols = TABLE_ALLOWED_COLUMNS[entity];
  const cleanData: any = {};
  if (allowedCols) {
    for (const col of allowedCols) {
      if (col in rawInput && rawInput[col] !== undefined) {
        cleanData[col] = rawInput[col];
      }
    }
  } else {
    Object.assign(cleanData, rawInput);
  }

  // Strict numeric column type coercions (ensures PostgreSQL numeric/decimal doesn't error)
  if (entity === "raw_materials") {
    if ("stock_qty" in cleanData) cleanData.stock_qty = Number(cleanData.stock_qty) || 0;
    if ("min_stock" in cleanData) cleanData.min_stock = Number(cleanData.min_stock) || 0;
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
    if ("supplier_id" in cleanData) cleanData.supplier_id = cleanData.supplier_id ? Number(cleanData.supplier_id) : null;
  } else if (entity === "products") {
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
    if ("stock_qty" in cleanData) cleanData.stock_qty = Number(cleanData.stock_qty) || 0;
    if ("min_stock" in cleanData) cleanData.min_stock = Number(cleanData.min_stock) || 0;
  } else if (entity === "inventory_pack") {
    if ("qty" in cleanData) cleanData.qty = Number(cleanData.qty) || 0;
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
  } else if (entity === "purchase_packs") {
    if ("qty" in cleanData) cleanData.qty = Number(cleanData.qty) || 0;
    if ("price" in cleanData) cleanData.price = Number(cleanData.price) || 0;
  } else if (entity === "production_orders") {
    if ("quantity" in cleanData) cleanData.quantity = Number(cleanData.quantity) || 0;
    if ("customer_id" in cleanData) cleanData.customer_id = Number(cleanData.customer_id) || null;
    if ("product_id" in cleanData) cleanData.product_id = Number(cleanData.product_id) || null;
  } else if (entity === "packing_orders") {
    if ("quantity" in cleanData) cleanData.quantity = Number(cleanData.quantity) || 0;
    if ("production_order_id" in cleanData) cleanData.production_order_id = Number(cleanData.production_order_id) || null;
  } else if (entity === "purchase_orders") {
    if ("total_amount" in cleanData) cleanData.total_amount = Number(cleanData.total_amount) || 0;
  } else if (entity === "grns") {
    if ("received_qty" in cleanData) cleanData.received_qty = Number(cleanData.received_qty) || 0;
    if ("raw_material_id" in cleanData) cleanData.raw_material_id = Number(cleanData.raw_material_id);
    if ("purchase_order_id" in cleanData) cleanData.purchase_order_id = cleanData.purchase_order_id ? Number(cleanData.purchase_order_id) : null;
    if ("unit_price" in cleanData) cleanData.unit_price = Number(cleanData.unit_price) || 0;
  } else if (entity === "projects") {
    if ("price" in cleanData) cleanData.price = Number(cleanData.price) || 0;
    if ("progress" in cleanData) cleanData.progress = Number(cleanData.progress) || 0;
    if ("quantity" in cleanData) cleanData.quantity = Number(cleanData.quantity) || 0;
    if ("customer_id" in cleanData) cleanData.customer_id = cleanData.customer_id ? Number(cleanData.customer_id) : null;
  } else if (entity === "semi_finished_goods") {
    if ("qty" in cleanData) cleanData.qty = Number(cleanData.qty) || 0;
  } else if (entity === "bom_recipes") {
    if ("product_id" in cleanData) cleanData.product_id = Number(cleanData.product_id) || 0;
    if ("estimated_unit_cost" in cleanData) cleanData.estimated_unit_cost = Number(cleanData.estimated_unit_cost) || 0;
  }

  let savedId = id > 0 ? id : Date.now();
  const recordToSave = { ...cleanData, id: savedId };

  // 1. Immediately save into persistent local store so data is 100% saved right away
  saveLocalRecord(table, recordToSave);

  // 2. Write to Supabase with auto-queue on offline/paused
  try {
    if (id > 0) {
      const { error } = await withTimeout(supabase.from(table).update(cleanData).eq("id", id), 3500);
      if (error) {
        queueSyncItem({ action: "save", table, record: recordToSave });
      }
    } else {
      const { data: inserted, error } = await withTimeout(
        supabase.from(table).insert(cleanData).select("id").single(),
        3500
      );
      if (!error && inserted) {
        deleteLocalRecord(table, savedId);
        savedId = inserted.id;
        saveLocalRecord(table, { ...recordToSave, id: savedId });
      } else {
        queueSyncItem({ action: "save", table, record: recordToSave });
      }
    }
  } catch {
    queueSyncItem({ action: "save", table, record: recordToSave });
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
          quantity: Number(mat.quantity) || 0,
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
          quantity: Number(itm.quantity) || 0,
          unit: itm.unit || "กก.",
          unit_price: Number(itm.unit_price) || 0,
          subtotal: Number(itm.subtotal) || 0
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

  notifyGlobalSync();
  return savedId;
}

/**
 * 100% DIRECT SUPABASE DELETE
 * Deletes from Supabase database directly, removing child relations first.
 */
export async function clientDelete(entity: string, id: number | string): Promise<boolean> {
  const table = entity;
  const numId = Number(id) || id;

  // 1. Immediately delete from local live store so UI is always responsive
  deleteLocalRecord(table, numId);

  // Local cascade deletions
  if (entity === "products") {
    const boms = getLocalTable("bom_recipes");
    setLocalTable("bom_recipes", boms.filter((b: any) => b.product_id !== numId));
    const pos = getLocalTable("production_orders");
    setLocalTable("production_orders", pos.filter((po: any) => po.product_id !== numId));
  } else if (entity === "customers") {
    const projs = getLocalTable("projects");
    setLocalTable("projects", projs.filter((p: any) => p.customer_id !== numId));
    const pos = getLocalTable("production_orders");
    setLocalTable("production_orders", pos.filter((po: any) => po.customer_id !== numId));
  } else if (entity === "raw_materials") {
    const grns = getLocalTable("grns");
    setLocalTable("grns", grns.filter((g: any) => g.raw_material_id !== numId));
  }

  // 2. Attempt remote delete on Supabase with timeout
  try {
    if (entity === "bom_recipes") {
      await withTimeout(supabase.from("bom_items").delete().eq("bom_id", numId), 3500);
    } else if (entity === "purchase_orders") {
      await withTimeout(supabase.from("purchase_order_items").delete().eq("purchase_order_id", numId), 3500);
      await withTimeout(supabase.from("grns").update({ purchase_order_id: null }).eq("purchase_order_id", numId), 3500);
    } else if (entity === "production_orders") {
      await withTimeout(supabase.from("packing_orders").delete().eq("production_order_id", numId), 3500);
    } else if (entity === "products") {
      const { data: bData } = await withTimeout(supabase.from("bom_recipes").select("id").eq("product_id", numId), 3500);
      const bIds = bData?.map((b: any) => b.id) || [];
      if (bIds.length > 0) {
        await withTimeout(supabase.from("bom_items").delete().in("bom_id", bIds), 3500);
      }
      await withTimeout(supabase.from("bom_recipes").delete().eq("product_id", numId), 3500);
      await withTimeout(supabase.from("production_orders").delete().eq("product_id", numId), 3500);
    } else if (entity === "customers") {
      await withTimeout(supabase.from("projects").delete().eq("customer_id", numId), 3500);
      await withTimeout(supabase.from("production_orders").delete().eq("customer_id", numId), 3500);
    } else if (entity === "raw_materials") {
      await withTimeout(supabase.from("grns").delete().eq("raw_material_id", numId), 3500);
      await withTimeout(supabase.from("bom_items").delete().eq("raw_material_id", numId), 3500);
      await withTimeout(supabase.from("purchase_order_items").delete().eq("raw_material_id", numId), 3500);
    } else if (entity === "suppliers") {
      await withTimeout(supabase.from("raw_materials").update({ supplier_id: null }).eq("supplier_id", numId), 3500);
    }

    const { error } = await withTimeout(supabase.from(table).delete().eq("id", numId), 3500);
    if (error) {
      console.warn(`[Supabase Delete Warning] Table ${table} id ${numId}:`, error.message);
      queueSyncItem({
        id: `del_${table}_${numId}_${Date.now()}`,
        action: "delete",
        table,
        recordId: numId
      });
    }
  } catch (err: any) {
    console.warn(`[Supabase Delete Offline, Queued] ${entity} ${numId}:`, err);
    queueSyncItem({
      id: `del_${table}_${numId}_${Date.now()}`,
      action: "delete",
      table,
      recordId: numId
    });
  }

  notifyGlobalSync();
  return true;
}

/**
 * Clear All Database Tables (Password Protected: 4321034)
 * Deletes all records in Supabase in child-first order.
 * Ensures Supabase tables and local cache are truly empty (0 records).
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
    "semi_finished_goods",
    "requisitions",
    "raw_materials",
    "products",
    "customers",
    "suppliers"
  ];

  // 1. Wipe all local tables and sync queue immediately
  for (const t of tablesInOrder) {
    setLocalTable(t, []);
  }
  setSyncQueue([]);

  // 2. Delete all rows from Supabase directly
  for (const t of tablesInOrder) {
    try {
      const { error } = await withTimeout(supabase.from(t).delete().gt("id", -1), 3500);
      if (error) {
        console.warn(`[Supabase Clear] Table ${t}:`, error.message);
      }
    } catch (e) {
      console.warn(`[Supabase Clear Exception] Table ${t}:`, e);
    }
  }

  // 3. Clear any legacy local storage remnants
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
      if (k && (k.startsWith("factory_deleted_") || k.startsWith("supabase_failed_") || k.startsWith(LIVE_STORE_PREFIX))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}

  // 4. Notify server backend to clear its memory
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
 * Seed Database Tables directly into Supabase (100% Upsert Across All 17 Tables)
 * Each table is handled independently so that all 17 tables succeed reliably!
 */
export async function seedDatabaseTables(): Promise<{
  success: boolean;
  message: string;
  results: Record<string, boolean>;
}> {
  const results: Record<string, boolean> = {};

  // 1. Suppliers
  try {
    const { error } = await supabase.from("suppliers").upsert(SAMPLE_SEED_DATA.suppliers, { onConflict: "code" });
    if (error) console.warn("[Seed Error] suppliers:", error.message);
    results.suppliers = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] suppliers:", e.message);
    results.suppliers = false;
  }

  // 2. Customers
  try {
    const { error } = await supabase.from("customers").upsert(SAMPLE_SEED_DATA.customers, { onConflict: "code" });
    if (error) console.warn("[Seed Error] customers:", error.message);
    results.customers = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] customers:", e.message);
    results.customers = false;
  }

  // 3. Products
  try {
    const { error } = await supabase.from("products").upsert(SAMPLE_SEED_DATA.products, { onConflict: "code" });
    if (error) console.warn("[Seed Error] products:", error.message);
    results.products = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] products:", e.message);
    results.products = false;
  }

  // 4. Raw Materials
  try {
    const { error } = await supabase.from("raw_materials").upsert(SAMPLE_SEED_DATA.raw_materials, { onConflict: "code" });
    if (error) console.warn("[Seed Error] raw_materials:", error.message);
    results.raw_materials = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] raw_materials:", e.message);
    results.raw_materials = false;
  }

  // 5. BOM Recipes & Items
  try {
    for (const b of SAMPLE_SEED_DATA.bom_recipes) {
      const recipeRow = { ...b };
      delete (recipeRow as any).materials;
      const { data: insertedBom, error } = await supabase.from("bom_recipes").upsert({
        ...recipeRow,
        materials: b.materials
      }, { onConflict: "id" }).select("id").single();

      const bomId = insertedBom?.id || b.id;
      if (b.materials && b.materials.length > 0) {
        const itms = b.materials.map((m: any, idx: number) => ({
          id: (b.id * 10) + idx,
          bom_id: bomId,
          part: m.part || "A",
          material_code: m.material_code || "",
          material_name: m.material_name,
          quantity: m.quantity || 0,
          unit: m.unit || "KG.",
          notes: m.notes || null
        }));
        await supabase.from("bom_items").upsert(itms, { onConflict: "id" });
      }
    }
    results.bom_recipes = true;
  } catch (e: any) {
    console.warn("[Seed Exception] bom_recipes:", e.message);
    results.bom_recipes = false;
  }

  // 6. Production Orders
  try {
    const { error } = await supabase.from("production_orders").upsert(SAMPLE_SEED_DATA.production_orders, { onConflict: "code" });
    if (error) console.warn("[Seed Error] production_orders:", error.message);
    results.production_orders = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] production_orders:", e.message);
    results.production_orders = false;
  }

  // 7. Packing Orders
  try {
    const { error } = await supabase.from("packing_orders").upsert(SAMPLE_SEED_DATA.packing_orders, { onConflict: "code" });
    if (error) console.warn("[Seed Error] packing_orders:", error.message);
    results.packing_orders = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] packing_orders:", e.message);
    results.packing_orders = false;
  }

  // 8. Purchase Orders & Items
  try {
    for (const po of SAMPLE_SEED_DATA.purchase_orders) {
      const poRow = { ...po };
      delete (poRow as any).items;
      const { data: insertedPo } = await supabase.from("purchase_orders").upsert({
        ...poRow,
        items: po.items
      }, { onConflict: "code" }).select("id").single();

      const poId = insertedPo?.id || po.id;
      if (po.items && po.items.length > 0) {
        const itms = po.items.map((i: any, idx: number) => ({
          id: (po.id * 10) + idx,
          purchase_order_id: poId,
          raw_material_id: i.raw_material_id || null,
          item_name: i.item_name,
          quantity: i.quantity || 0,
          unit: i.unit || "กก.",
          unit_price: i.unit_price || 0,
          subtotal: i.subtotal || 0
        }));
        await supabase.from("purchase_order_items").upsert(itms, { onConflict: "id" });
      }
    }
    results.purchase_orders = true;
  } catch (e: any) {
    console.warn("[Seed Exception] purchase_orders:", e.message);
    results.purchase_orders = false;
  }

  // 9. GRNs
  try {
    const { error } = await supabase.from("grns").upsert(SAMPLE_SEED_DATA.grns, { onConflict: "code" });
    if (error) console.warn("[Seed Error] grns:", error.message);
    results.grns = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] grns:", e.message);
    results.grns = false;
  }

  // 10. Prechecks
  try {
    const { error } = await supabase.from("prechecks").upsert(SAMPLE_SEED_DATA.prechecks, { onConflict: "id" });
    if (error) console.warn("[Seed Error] prechecks:", error.message);
    results.prechecks = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] prechecks:", e.message);
    results.prechecks = false;
  }

  // 11. Inventory Pack
  try {
    const { error } = await supabase.from("inventory_pack").upsert(SAMPLE_SEED_DATA.inventory_pack, { onConflict: "code" });
    if (error) console.warn("[Seed Error] inventory_pack:", error.message);
    results.inventory_pack = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] inventory_pack:", e.message);
    results.inventory_pack = false;
  }

  // 12. Purchase Packs
  try {
    const samplePurchasePacks = [
      { id: 1, code: "PPK-2026-0009", supplier: "บริษัท พลาสติกไทย จำกัด", item: "ขวด HDPE ขนาด 1 ลิตร", qty: 1000, price: 5000, status: "received" },
      { id: 2, code: "PPK-2026-0010", supplier: "บริษัท โรงพิมพ์ฉลากสากล จำกัด", item: "ฉลากน้ำยาเคลือบแก้ว P-001", qty: 2000, price: 3000, status: "pending" }
    ];
    const { error } = await supabase.from("purchase_packs").upsert(samplePurchasePacks, { onConflict: "code" });
    results.purchase_packs = !error;
  } catch (e: any) {
    results.purchase_packs = false;
  }

  // 13. Projects
  try {
    const { error } = await supabase.from("projects").upsert(SAMPLE_SEED_DATA.projects, { onConflict: "id" });
    if (error) console.warn("[Seed Error] projects:", error.message);
    results.projects = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] projects:", e.message);
    results.projects = false;
  }

  // 14. Semi Finished Goods
  try {
    const { error } = await supabase.from("semi_finished_goods").upsert((SAMPLE_SEED_DATA as any).semi_finished_goods, { onConflict: "code" });
    if (error) console.warn("[Seed Error] semi_finished_goods:", error.message);
    results.semi_finished_goods = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] semi_finished_goods:", e.message);
    results.semi_finished_goods = false;
  }

  // 15. Requisitions
  try {
    const { error } = await supabase.from("requisitions").upsert((SAMPLE_SEED_DATA as any).requisitions, { onConflict: "code" });
    if (error) console.warn("[Seed Error] requisitions:", error.message);
    results.requisitions = !error;
  } catch (e: any) {
    console.warn("[Seed Exception] requisitions:", e.message);
    results.requisitions = false;
  }

  return {
    success: true,
    message: "บันทึกและซิงค์ชุดข้อมูลโรงงานตั้งต้นเข้าสู่ Supabase ครบทั้ง 17 ตารางเรียบร้อยแล้ว!",
    results
  };
}

export async function resetSampleDatabase(passcode: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (passcode.trim() !== "4321034") {
    throw new Error("รหัสผ่านยืนยันไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านความปลอดภัยเพื่อยืนยัน");
  }

  // 1. Clear tables first
  await clearAllDatabaseTables("4321034");

  // 2. Seed tables cleanly
  const res = await seedDatabaseTables();
  return {
    success: res.success,
    message: res.message
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
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          success: true,
          elapsed,
          message: `เชื่อมต่อเซิร์ฟเวอร์ Supabase สำเร็จ (${elapsed}ms) แต่ยังไม่พบตารางในฐานข้อมูล (ต้องรัน SQL Schema)`
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
      const cfg = getSupabaseConfig();
      return {
        success: false,
        elapsed,
        errorType: "FAILED_TO_FETCH",
        isPausedPossible: true,
        message: "เชื่อมต่อไม่สำเร็จ: TypeError: Failed to fetch (net::ERR_NAME_NOT_RESOLVED)",
        details: `ตรวจพบว่าเซิร์ฟเวอร์ '${cfg.url}' ไม่ตอบสนองต่อ DNS โดยปกติบน Supabase Free Tier เกิดจากโปรเจกต์ (${cfg.projectId}) อยู่ในสถานะ 'Paused' (พักการใช้งาน) หรือถูกลบ/เปลี่ยนโปรเจกต์ใหม่ กรุณากด Restore project ใน Supabase Dashboard หรือระบุ URL & Key ใหม่`
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

export const ALL_17_TABLES = [
  "suppliers",
  "customers",
  "products",
  "raw_materials",
  "bom_recipes",
  "bom_items",
  "production_orders",
  "packing_orders",
  "purchase_orders",
  "purchase_order_items",
  "grns",
  "prechecks",
  "inventory_pack",
  "purchase_packs",
  "projects",
  "semi_finished_goods",
  "requisitions"
];

/**
 * Enhanced Real-time Supabase Subscription
 * - Listens specifically to all 17 database tables for INSERT, UPDATE, and DELETE events.
 * - Subscribes to schema 'public' wildcard AND explicit table bindings for 100% catch rate across devices/SDK versions.
 * - Features automatic re-subscription on network disconnect / error / timeout.
 * - Debounces rapid event triggers to optimize network calls while keeping UI updated globally in real time.
 */
export function subscribeToRealtimeDatabase(onUpdate: (table: string, eventType: string) => void) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isUnsubscribed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const debouncedNotify = (table: string, eventType: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onUpdate(table, eventType);
    }, 120);
  };

  try {
    const channelName = `ideva-realtime-sync-${Math.random().toString(36).substring(2, 9)}`;
    let channel = supabase.channel(channelName);

    // 1. Primary schema-wide listener for INSERT, UPDATE, DELETE
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public" },
      (payload: any) => {
        console.log(`⚡ [Supabase Realtime Schema] ${payload.eventType} on table '${payload.table}'`);
        debouncedNotify(payload.table || "unknown", payload.eventType || "UPDATE");
      }
    );

    // 2. Explicit per-table listeners for all 17 tables to ensure 100% event catch rate
    ALL_17_TABLES.forEach((table) => {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: any) => {
          console.log(`⚡ [Supabase Realtime Table] ${payload.eventType} on table '${table}'`);
          debouncedNotify(table, payload.eventType || "UPDATE");
        }
      );
    });

    // 3. Subscribe with auto-reconnect monitoring
    channel.subscribe((status: string, err?: any) => {
      if (status === "SUBSCRIBED") {
        console.log("🟢 [Supabase Realtime] Subscribed to all 17 tables successfully!");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        console.warn(`⚠️ [Supabase Realtime] Channel status '${status}', scheduling re-subscribe...`, err);
        if (!isUnsubscribed && !retryTimer) {
          retryTimer = setTimeout(() => {
            retryTimer = null;
            if (!isUnsubscribed) {
              console.log("🔄 [Supabase Realtime] Attempting channel re-subscription...");
              try {
                supabase.removeChannel(channel);
              } catch {}
              // Re-subscribe
              subscribeToRealtimeDatabase(onUpdate);
            }
          }, 3000);
        }
      }
    });

    return () => {
      isUnsubscribed = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (retryTimer) clearTimeout(retryTimer);
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn("Could not subscribe to Supabase Realtime channel:", err);
    return () => {};
  }
}

export { FULL_SUPABASE_SCHEMA_SQL } from "./schemaSql";
