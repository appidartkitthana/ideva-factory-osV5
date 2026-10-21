import React, { useState } from "react";
import {
  Database,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Radio
} from "lucide-react";
import {
  testSupabaseConnection,
  clearAllDatabaseTables,
  resetSampleDatabase,
  getSupabaseConfig,
  updateSupabaseConfig,
  resetSupabaseConfig,
  setSupabaseOffline
} from "../lib/supabaseClient";
import { FULL_SUPABASE_SCHEMA_SQL } from "../lib/schemaSql";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableStats?: {
    projects: number;
    customers: number;
    bomRecipes: number;
    prechecks: number;
    productionOrders: number;
    packingOrders: number;
    purchaseOrders: number;
    grns: number;
    rawMaterials: number;
    inventoryPacks: number;
  };
  onRefreshData?: () => Promise<void>;
  initialTab?: "links" | "clear" | "config" | "sql";
}

export default function DatabaseModal({
  isOpen,
  onClose,
  tableStats,
  onRefreshData,
  initialTab = "links"
}: DatabaseModalProps) {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<"links" | "clear" | "config" | "sql">(initialTab);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isPausedPossible?: boolean;
    details?: string;
  } | null>(null);

  // Clear Database State inside Modal
  const [clearConfirmPasscode, setClearConfirmPasscode] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearSuccess, setClearSuccess] = useState("");

  // Reset Sample Data State inside Modal
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  // Supabase Configuration
  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentConfig.url);
  const [customKey, setCustomKey] = useState(currentConfig.key);
  const [configSaved, setConfigSaved] = useState(false);

  const SUPABASE_PROJECT_ID = currentConfig.projectId || "zizlhxikswejwvoftshk";
  const SUPABASE_URL = currentConfig.url;
  const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`;
  const SUPABASE_TABLE_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor`;
  const SUPABASE_SQL_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`;
  const POSTGRES_HOST = "aws-0-ap-southeast-1.pooler.supabase.com";

  if (!isOpen) return null;

  const totalRecords = tableStats
    ? Object.values(tableStats).reduce((acc, curr) => acc + curr, 0)
    : 0;

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "4321034") {
      setIsUnlocked(true);
      setErrorMsg("");
    } else {
      setErrorMsg("รหัสผ่านไม่ถูกต้อง! กรุณากรอกรหัสผ่านความปลอดภัยที่ถูกต้อง");
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success && onRefreshData) {
        await onRefreshData();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `ข้อผิดพลาดในการเชื่อมต่อ: ${e.message || "เครือข่ายขัดข้อง"}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearAllRecords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearConfirmPasscode.trim() !== "4321034") {
      setClearError("รหัสผ่านความปลอดภัยไม่ถูกต้อง! กรุณาตรวจสอบรหัสผ่านเพื่อยืนยัน");
      return;
    }
    setIsClearing(true);
    setClearError("");
    setClearSuccess("");
    try {
      const res = await clearAllDatabaseTables(clearConfirmPasscode);
      setClearSuccess(res.message);
      setClearConfirmPasscode("");
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setClearError(err.message || "เกิดข้อผิดพลาดในการล้างข้อมูล");
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetSampleData = async () => {
    if (clearConfirmPasscode.trim() !== "4321034") {
      setClearError("กรุณากรอกรหัสผ่านความปลอดภัยในช่องด้านล่างก่อนกดรีเซ็ตข้อมูล");
      return;
    }
    setIsResetting(true);
    setClearError("");
    try {
      await resetSampleDatabase("4321034");
      setResetSuccess("รีเซ็ตเป็นข้อมูลตัวอย่างโรงงานเรียบร้อยแล้ว!");
      setClearConfirmPasscode("");
      if (onRefreshData) {
        await onRefreshData();
      }
      setTimeout(() => setResetSuccess(""), 3000);
    } catch (err: any) {
      setClearError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) return;
    updateSupabaseConfig(customUrl, customKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleResetToDefaultConfig = () => {
    resetSupabaseConfig();
    const def = getSupabaseConfig();
    setCustomUrl(def.url);
    setCustomKey(def.key);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/30">
              <Database className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold">เช็คระบบฐานข้อมูล Supabase</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                ลิงค์เข้าจัดการฐานข้อมูล ตารางข้อมูล และข้อมูลเชื่อมต่อเซิร์ฟเวอร์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {!isUnlocked ? (
            /* Passcode Verification Screen */
            <div className="max-w-md mx-auto py-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800">
                  กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบฐานข้อมูล
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  ระบบรักษาความปลอดภัยโรงงาน — ใส่รหัสผ่าน 7 หลักเพื่อเข้าถึงลิงค์ Supabase และคำสั่งล้างข้อมูล
                </p>
              </div>

              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div className="relative max-w-xs mx-auto">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="ใส่รหัสผ่านความปลอดภัย"
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center justify-center gap-1.5 font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full max-w-xs mx-auto py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" /> ยืนยันรหัสเข้าสู่ฐานข้อมูล
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Unlocked View with 3 Clean Tabs */
            <div className="space-y-5">
              {/* Top Unlocked Status & Tab Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">ปลดล็อคเข้าใช้งานระบบแล้ว</span>
                </div>

                {/* Tab Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("links")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "links"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ลิงค์และตาราง
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("sql")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "sql"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>สคริปต์ SQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("clear")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "clear"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>เคลียร์ข้อมูล</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("config")}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "config"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ตั้งค่า URL
                  </button>
                </div>
              </div>

              {/* TAB 1: LINKS & TABLES */}
              {activeTab === "links" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Direct Link Action Cards (Requested: ลิงค์กดเข้าฐานข้อมูล) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> ลิงค์ด่วนเข้าสู่ Supabase Dashboard
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Link 1: Supabase Main Dashboard */}
                      <a
                        href={SUPABASE_DASHBOARD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-md hover:shadow-lg hover:brightness-105 transition-all flex flex-col justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Supabase Console</span>
                            <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                          <div className="text-sm font-bold">เข้าสู่ Project Dashboard ↗</div>
                          <p className="text-[11px] opacity-80 mt-1">
                            หน้าแดชบอร์ดหลักของโครงการ {SUPABASE_PROJECT_ID}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/20 text-[10px] font-mono flex items-center justify-between">
                          <span className="truncate">{SUPABASE_DASHBOARD_URL}</span>
                        </div>
                      </a>

                      {/* Link 2: Supabase Table Editor */}
                      <a
                        href={SUPABASE_TABLE_EDITOR_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg hover:brightness-105 transition-all flex flex-col justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Table Editor</span>
                            <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                          <div className="text-sm font-bold">ตารางข้อมูล (Table Editor) ↗</div>
                          <p className="text-[11px] opacity-80 mt-1">
                            เข้าดูและแก้ไขแถวข้อมูลโดยตรงในทุกตาราง
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/20 text-[10px] font-mono flex items-center justify-between">
                          <span className="truncate">{SUPABASE_TABLE_EDITOR_URL}</span>
                        </div>
                      </a>

                      {/* Link 3: SQL Editor */}
                      <a
                        href={SUPABASE_SQL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Supabase SQL Editor ↗</div>
                            <p className="text-[10px] text-slate-500">รันคำสั่ง SQL Query และตรวจสอบสคีมา</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>

                      {/* Test Connection Button */}
                      <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <RefreshCw className={`w-4 h-4 ${isTestingConnection ? "animate-spin" : ""}`} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">ทดสอบสัญญาณฐานข้อมูล</div>
                            <p className="text-[10px] text-slate-500">ตรวจเช็ค Realtime Latency ตอนนี้</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-blue-600 font-bold group-hover:underline">กดเช็ค</span>
                      </button>
                    </div>

                    {/* Test Result with intelligent Failed to fetch solution */}
                    {testResult && (
                      <div
                        className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2 ${
                          testResult.success
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold block">{testResult.message}</span>
                            {testResult.details && (
                              <p className="text-[11px] mt-1 leading-relaxed opacity-90">{testResult.details}</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons if Paused or Failed to fetch */}
                        {!testResult.success && testResult.isPausedPossible && (
                          <div className="pt-2 border-t border-red-200 flex flex-wrap items-center gap-2">
                            <a
                              href={SUPABASE_DASHBOARD_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>เปิด Supabase Dashboard เพื่อกด Unpause / Restore Project ↗</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setActiveTab("config")}
                              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              ⚙️ เปลี่ยน URL / Key ใหม่
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSupabaseOffline(true);
                                alert("สลับใช้งาน Local Database ออฟไลน์เรียบร้อยแล้ว ระบบสามารถใช้งานต่อได้ 100%");
                              }}
                              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              ใช้โหมด Local ทันที
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Table Records Summary */}
                  {tableStats && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" /> จำนวนเรคคอร์ดในแต่ละตาราง (Live Counts)
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          รวมทั้งหมด {totalRecords} รายการ
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">โปรเจค</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.projects}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">ลูกค้า</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.customers}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">สูตร BOM</span>
                          <strong className="text-sm text-blue-700 font-bold">{tableStats.bomRecipes}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">วัตถุดิบเคมี</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.rawMaterials}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">ใบสั่งผลิต</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.productionOrders}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">ใบสั่งบรรจุ</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.packingOrders}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">ใบสั่งซื้อ PO</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.purchaseOrders}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">ใบรับเข้า GRN</span>
                          <strong className="text-sm text-emerald-700 font-bold">{tableStats.grns}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">ตรวจ Pre-QC</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.prechecks}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-sans block">บรรจุภัณฑ์</span>
                          <strong className="text-sm text-slate-800 font-bold">{tableStats.inventoryPacks}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connection Strings */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600" /> ข้อมูลการเชื่อมต่อเซิร์ฟเวอร์ (Connection Details)
                    </h4>
                    <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0 font-medium w-28">Project URL:</span>
                        <span className="font-mono text-slate-800 truncate select-all">{SUPABASE_URL}</span>
                        <button
                          onClick={() => copyToClipboard(SUPABASE_URL, "url")}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer shrink-0"
                          title="คัดลอก URL"
                        >
                          {copiedKey === "url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0 font-medium w-28">Project ID:</span>
                        <span className="font-mono text-slate-800 truncate select-all font-bold">{SUPABASE_PROJECT_ID}</span>
                        <button
                          onClick={() => copyToClipboard(SUPABASE_PROJECT_ID, "id")}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer shrink-0"
                          title="คัดลอก Project ID"
                        >
                          {copiedKey === "id" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0 font-medium w-28">Postgres Host:</span>
                        <span className="font-mono text-slate-800 truncate select-all">{POSTGRES_HOST}</span>
                        <button
                          onClick={() => copyToClipboard(POSTGRES_HOST, "host")}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer shrink-0"
                          title="คัดลอก Host"
                        >
                          {copiedKey === "host" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CLEAR ALL DATA (REQUESTED: หน้า เครียร์ข้อมูล ทั้งหมด) */}
              {activeTab === "clear" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <span>คำสั่งล้างข้อมูลในตารางทั้งหมด (Delete all records)</span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed">
                      หน้านี้ใช้สำหรับ <strong>รีเซ็ตฐานข้อมูล</strong> เพื่อล้างข้อมูลเก่าทั้งหมดในทุกตาราง (ลูกค้า, สต็อกเคมีภัณฑ์, สูตร BOM, ใบสั่งผลิต, ใบสั่งซื้อ ฯลฯ)
                      ให้กลายเป็นตารางว่างเปล่า (0 รายการ) เพื่อเริ่มต้นใช้งานระบบใหม่ทั้งหมด
                    </p>
                    <div className="text-[11px] bg-red-100/80 p-2.5 rounded-lg border border-red-200 text-red-800 font-medium">
                      🔒 ป้องกันการกดพลาด: ต้องยืนยันด้วยรหัสผ่านความปลอดภัยของผู้ดูแลระบบ
                    </div>
                  </div>

                  {/* Current Table Record Count */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700">ข้อมูลปัจจุบันที่จะถูกล้าง:</span>
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {totalRecords} เรคคอร์ด
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-1">
                      <span>• โปรเจค: {tableStats?.projects ?? 0}</span>
                      <span>• ลูกค้า: {tableStats?.customers ?? 0}</span>
                      <span>• สูตร BOM: {tableStats?.bomRecipes ?? 0}</span>
                      <span>• วัตถุดิบ: {tableStats?.rawMaterials ?? 0}</span>
                      <span>• สั่งผลิต: {tableStats?.productionOrders ?? 0}</span>
                      <span>• สั่งซื้อ PO: {tableStats?.purchaseOrders ?? 0}</span>
                    </div>
                  </div>

                  {/* Form to Clear Data */}
                  <form onSubmit={handleClearAllRecords} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        ใส่รหัสผ่านความปลอดภัยเพื่อสั่งล้างข้อมูล:
                      </label>
                      <div className="relative max-w-sm">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          value={clearConfirmPasscode}
                          onChange={(e) => {
                            setClearConfirmPasscode(e.target.value);
                            setClearError("");
                          }}
                          placeholder="พิมพ์รหัสผ่านความปลอดภัย"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {clearError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{clearError}</span>
                      </div>
                    )}

                    {clearSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{clearSuccess}</span>
                      </div>
                    )}

                    {resetSuccess && (
                      <div className="p-3 bg-blue-50 border border-blue-300 text-blue-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{resetSuccess}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      {/* Execute Clear Button */}
                      <button
                        type="submit"
                        disabled={isClearing}
                        className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {isClearing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> กำลังล้างข้อมูลทุกตาราง...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" /> สั่งล้างข้อมูลในตารางทั้งหมด (Delete all records)
                          </>
                        )}
                      </button>

                      {/* Restore Sample Data */}
                      <button
                        type="button"
                        onClick={handleResetSampleData}
                        disabled={isResetting}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: CONFIGURATION (Custom URL / Key) */}
              {activeTab === "config" && (
                <form onSubmit={handleSaveConfig} className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <strong>ปรับแต่ง Supabase Connection:</strong> หากคุณมีโปรเจกต์ Supabase ใหม่ หรือกู้คืนโปรเจกต์เดิมมาแล้วได้ URL / API Key ใหม่ สามารถระบุและบันทึกเพื่อเชื่อมต่อทันที
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Supabase Project URL</label>
                      <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://xxxxxxxxxxxx.supabase.co"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Supabase Anon Key</label>
                      <textarea
                        rows={3}
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="eyJhbGciOi..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleResetToDefaultConfig}
                      className="text-xs text-slate-500 hover:text-blue-600 underline cursor-pointer"
                    >
                      คืนค่าเป็นโปรเจกต์เริ่มต้น
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      {configSaved ? "✓ บันทึกสำเร็จ" : "บันทึกและเชื่อมต่อทันที"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: SQL SCHEMA SCRIPT (100% READY FOR SUPABASE) */}
              {activeTab === "sql" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5 text-indigo-950">
                        <Server className="w-4 h-4 text-indigo-600" />
                        <span>สคริปต์ SQL สร้างตารางทั้ง 15 ตาราง (Full Schema + Realtime + RLS)</span>
                      </div>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        คัดลอกคำสั่งนี้ แล้วนำไปวางในหน้า Supabase SQL Editor เพื่อสร้างตารางทั้งหมดแบบ 100%
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(FULL_SUPABASE_SCHEMA_SQL);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2500);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                          copiedSql
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {copiedSql ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>✓ คัดลอกแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอก SQL ทั้งหมด</span>
                          </>
                        )}
                      </button>

                      <a
                        href={SUPABASE_SQL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        <span>เปิด SQL Editor ↗</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[360px] leading-relaxed custom-scrollbar border border-slate-800 select-all">
                      {FULL_SUPABASE_SCHEMA_SQL}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ระบบฐานข้อมูล: <strong className="text-slate-700">Supabase Cloud Realtime</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
