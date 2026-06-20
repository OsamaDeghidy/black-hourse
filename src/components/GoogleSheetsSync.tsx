import React, { useState, useEffect } from "react";
import { Product, Sale, SyncSettings } from "../types";
import { FileSpreadsheet, Download, RefreshCw, Key, HelpCircle, AlertCircle, CheckCircle2 } from "lucide-react";

interface GoogleSheetsSyncProps {
  items: Product[];
  sales: Sale[];
  settings: SyncSettings;
  onUpdateSettings: (settings: SyncSettings) => void;
}

export default function GoogleSheetsSync({
  items,
  sales,
  settings,
  onUpdateSettings,
}: GoogleSheetsSyncProps) {
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheetId || "");
  const [clientId, setClientId] = useState(() => localStorage.getItem("g_sheets_client_id") || "");
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("g_sheets_access_token") || "");
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | null; msg: string }>({
    type: null,
    msg: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Parse token from redirection hash fragment if this is the OAuth redirect popup
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        setAccessToken(token);
        localStorage.setItem("g_sheets_access_token", token);
        setStatus({ type: "success", msg: "تم تسجيل الدخول بنجاح عبر حساب Google!" });
        // Clean fragment
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, []);

  const handleOAuthLogin = () => {
    if (!clientId) {
      setStatus({
        type: "error",
        msg: "يرجى إدخال Client ID الخاص بحساب المطورين لبدء الربط.",
      });
      setShowConfig(true);
      return;
    }

    localStorage.setItem("g_sheets_client_id", clientId);
    const redirectUri = window.location.origin;
    const scopes = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(scopes)}&prompt=consent`;

    // Open in current window or popup
    setStatus({ type: "info", msg: "جاري فتح صفحة تسجيل الدخول من Google..." });
    window.location.href = authUrl;
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setStatus({ type: "error", msg: "يرجى تسجيل الدخول أولاً أو توفير رمز الوصول (Access Token)." });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "info", msg: "جاري إنشاء جدول بيانات جديد في Google Drive..." });

    try {
      const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            title: `سجل مخازن ومبيعات blackhours - ${new Date().toLocaleDateString("ar-EG")}`,
          },
          sheets: [
            { properties: { title: "المخزون الحالي" } },
            { properties: { title: "سجل المبيعات الكلية" } },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "فشل إنشاء جدول البيانات");
      }

      const sheetData = await response.json();
      const newSpreadsheetId = sheetData.spreadsheetId;
      const newSpreadsheetUrl = sheetData.spreadsheetUrl;

      setSpreadsheetId(newSpreadsheetId);
      onUpdateSettings({
        spreadsheetId: newSpreadsheetId,
        spreadsheetUrl: newSpreadsheetUrl,
        lastSync: new Date().toISOString(),
      });

      setStatus({ type: "success", msg: "تم إنشاء شيت جديدة بنجاح! جاري تعبئة البيانات..." });
      await performSyncWithId(newSpreadsheetId);
    } catch (error: any) {
      console.error(error);
      setStatus({ type: "error", msg: `خطأ أثناء الاتصال: ${error.message}. قد تحتاج لتجديد رمز الدخول.` });
    } finally {
      setIsLoading(false);
    }
  };

  const performSyncWithId = async (idToSync: string) => {
    if (!accessToken) {
      setStatus({ type: "error", msg: "يرجى ربط حساب Google أولاً" });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "info", msg: "جاري مزامنة البيانات وتصديرها..." });

    try {
      // 1. Prepare Stock Sheet Data
      const stockValues = [
        ["كود الصنف", "اسم المنتج (القطع والإكسسوارات)", "القسم", "سعر الجملة (ج.م)", "سعر التجزئة (ج.م)", "مخزون فرع 1", "مخزون فرع 2", "إجمالي المخزون", "حد الأمان للتنبيه"],
        ...items.map((item) => [
          item.id,
          item.name,
          item.category,
          item.priceWholesale,
          item.priceRetail,
          item.stockBranch1,
          item.stockBranch2,
          item.stockBranch1 + item.stockBranch2,
          item.minStockAlert,
        ]),
      ];

      // Update Stock Sheet
      const stockRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${idToSync}/values/'المخزون الحالي'!A1?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: stockValues }),
        }
      );

      if (!stockRes.ok) throw new Error("فشل كتابة بيانات المخزون");

      // 2. Prepare Sales Sheet Data
      const salesValues = [
        ["رقم الحركة", "اسم الصنف", "الفرع", "الكمية المباعة", "سعر البيع (ج.م)", "الإجمالي (ج.م)", "صافي الربح", "التاريخ والوقت", "ملاحظات الحركة"],
        ...sales.map((sale) => [
          sale.id,
          sale.productName,
          sale.branch === "branch1" ? "فرع 1" : "فرع 2",
          sale.quantity,
          sale.price,
          sale.total,
          sale.profit,
          new Date(sale.date).toLocaleString("ar-EG"),
          sale.notes,
        ]),
      ];

      // Update Sales Sheet
      const salesRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${idToSync}/values/'سجل المبيعات الكلية'!A1?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: salesValues }),
        }
      );

      if (!salesRes.ok) {
        // Maybe the secondary sheet doesn't exist yet, write to A1 of default sheet
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${idToSync}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ values: salesValues }),
          }
        );
      }

      onUpdateSettings({
        spreadsheetId: idToSync,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${idToSync}`,
        lastSync: new Date().toISOString(),
      });

      setStatus({
        type: "success",
        msg: "تمت م［امنة المخزن وسجل المبيعات بنجاح إلى جدول البيانات على Google Sheets!",
      });
    } catch (error: any) {
      console.error(error);
      setStatus({ type: "error", msg: `فشلت المزامنة: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncExisting = () => {
    if (!spreadsheetId) {
      setStatus({ type: "error", msg: "يرجى إدخال Spreadsheet ID المحدد للمزامنة" });
      return;
    }
    performSyncWithId(spreadsheetId);
  };

  // Offline backup download CSV
  const handleDownloadCSV = (type: "stock" | "sales") => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (type === "stock") {
      headers = ["ID", "Name", "Category", "WholesalePrice", "RetailPrice", "Branch1Stock", "Branch2Stock", "MinAlert"];
      rows = items.map((i) => [
        i.id,
        i.name,
        i.category,
        i.priceWholesale.toString(),
        i.priceRetail.toString(),
        i.stockBranch1.toString(),
        i.stockBranch2.toString(),
        i.minStockAlert.toString(),
      ]);
      filename = `blackhours_stock_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = ["ID", "ProductName", "Branch", "Quantity", "Price", "Total", "Profit", "Date", "Notes"];
      rows = sales.map((s) => [
        s.id,
        s.productName,
        s.branch === "branch1" ? "الفرع 1" : "الفرع 2",
        s.quantity.toString(),
        s.price.toString(),
        s.total.toString(),
        s.profit.toString(),
        s.date,
        s.notes,
      ]);
      filename = `blackhours_sales_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    // Wrap fields in quotes to prevent delimiter bugs
    const csvContent =
      "\uFEFF" + // UTF-8 BOM
      [headers.join(","), ...rows.map((r) => r.map((field) => `"${field.replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus({ type: "success", msg: `تم تحميل ملف الجرد وإكسل ${type === "stock" ? "المخزون" : "المبيعات"} بنجاح!` });
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-6 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand/10 text-brand-light rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-text-primary">تحليلات وتصدير Google Sheets</h3>
            <p className="text-xs text-text-secondary">مزامنة المخازن وحركات المبيعات التشاركية لبراند blackhours</p>
          </div>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs flex items-center gap-1 text-text-secondary hover:text-text-primary bg-surface-card-hover px-2.5 py-1.5 rounded-lg border border-surface-border transition"
        >
          <Key className="w-3.5 h-3.5" />
          {showConfig ? "إخفاء إعدادات الربط" : "إعداد الربط والمطورين"}
        </button>
      </div>

      {status.type && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm mb-4 ${
            status.type === "success"
              ? "bg-brand/10 text-emerald-300 border border-brand/20"
              : status.type === "error"
              ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{status.msg}</span>
        </div>
      )}

      {showConfig && (
        <div className="bg-surface-base p-4 rounded-xl border border-surface-border mb-4 text-xs space-y-3">
          <h4 className="font-semibold text-text-primary flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-brand-light" />
            كيفية إعداد الربط المباشر مع حسابك على Google:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-text-secondary leading-relaxed pr-1">
            <li>قم بزيارة لوحة مطوري غوغل <a href="https://console.cloud.google.com" target="_blank" className="text-brand-light underline">Google Cloud Console</a>.</li>
            <li>قم بإنشاء مشروع وتفعيل <strong>Google Sheets API</strong> و <strong>Google Drive API</strong>.</li>
            <li>قم بإنشاء credentials من نوع <strong>Credentials &gt; OAuth client ID</strong> (نوع التطبيق Web).</li>
            <li>أضف عنوان تطبيقك الحالي (<span className="text-text-primary select-all font-mono">{window.location.origin}</span>) في الـ <strong>Authorized redirect URIs</strong>.</li>
            <li>الآن انسخ الـ <strong>Client ID</strong> وضعه في الحقل بالأسفل لبدء الربط التلقائي بنقرة واحدة.</li>
          </ol>

          <div className="pt-2 space-y-2">
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Google Client ID (معرف المشروع للربط التلقائي):</label>
              <input
                type="text"
                placeholder="مثال: 12345678-abcde.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand/50 text-[11px] font-mono text-left"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">رمز الوصول المؤقت (أو أدخل يدوياً إذا رغبت):</label>
              <input
                type="password"
                placeholder="تاركاً إياها خالية لحصولك التلقائي بعد تسجيل الدخول"
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value);
                  localStorage.setItem("g_sheets_access_token", e.target.value);
                }}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand/50 text-[11px] font-mono text-left"
              />
            </div>
            <button
              type="button"
              onClick={handleOAuthLogin}
              className="w-full bg-brand-dark hover:bg-brand text-text-primary font-medium py-1.5 rounded-lg transition"
            >
              تسجيل الدخول وربط حساب Google
            </button>
          </div>
        </div>
      )}

      {/* Primary Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Sync Column */}
        <div className="bg-surface-base p-4 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-text-secondary">مزامنة غوغل الفورية</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">أدخل معرّف جدول البيانات الحالي (Spreadsheet ID):</label>
              <input
                type="text"
                placeholder="مثال: 1a2b3c4d5e6f7g8h9i0j..."
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-brand/50 font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSyncExisting}
                disabled={isLoading}
                className="flex-1 bg-surface-card-hover hover:bg-surface-border text-text-primary text-xs py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 border border-surface-border disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                تحديث الشيت الحالية
              </button>
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isLoading}
                className="flex-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 border border-emerald-800/50 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                إنشاء شيت جديدة
              </button>
            </div>

            {settings.spreadsheetUrl && (
              <a
                href={settings.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs text-brand-light hover:underline hover:text-emerald-300 pt-1 border-t border-surface-border"
              >
                فتح جدول البيانات الحالي ↗
              </a>
            )}

            {settings.lastSync && (
              <p className="text-[10px] text-text-secondary text-center">
                آخر مزامنة ناجحة: {new Date(settings.lastSync).toLocaleString("ar-EG")}
              </p>
            )}
          </div>
        </div>

        {/* Offline CSV Download Column */}
        <div className="bg-surface-base p-4 rounded-xl border border-surface-border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs font-semibold text-text-secondary">تحميل مباشر بنقرة واحدة (بدون إنترنت/صلاحيات)</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              تصدير فوري لشاشات، وإكسسوارات، وقطع غيار المحل بصيغة إكسل CSV متوافقة مع الأجهزة المحمولة.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button
              onClick={() => handleDownloadCSV("stock")}
              className="bg-surface-card-hover hover:bg-surface-card-hover text-text-primary text-xs py-2 px-3 rounded-lg border border-surface-border transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              تحميل المخزن
            </button>
            <button
              onClick={() => handleDownloadCSV("sales")}
              className="bg-surface-card-hover hover:bg-surface-card-hover text-text-primary text-xs py-2 px-3 rounded-lg border border-surface-border transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              تحميل المبيعات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
