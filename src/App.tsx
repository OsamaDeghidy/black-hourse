import React, { useState, useEffect } from "react";
import { DBState, Product, Sale, SyncSettings, ActivityLog, ModificationRequest, Order } from "./types";
import StockManager from "./components/StockManager";
import SalesManager from "./components/SalesManager";
import AIAssistant from "./components/AIAssistant";
import GoogleSheetsSync from "./components/GoogleSheetsSync";
import LoginScreen from "./components/LoginScreen";
import AuditControlPanel from "./components/AuditControlPanel";
import CustomerMarketplace from "./components/CustomerMarketplace";
import CustomerOrderManager from "./components/CustomerOrderManager";
import { 
  Store, 
  TrendingUp, 
  Package, 
  HelpCircle, 
  FileSpreadsheet, 
  Bot, 
  AlertTriangle, 
  Smartphone,
  Eye,
  Activity,
  Maximize2,
  ShoppingCart,
  ShieldCheck,
  LogOut,
  UserCheck,
  ShoppingBag
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<"admin" | "user 1" | "user 2" | "customer" | null>(() => {
    return (localStorage.getItem("blackhours_user") as any) || null;
  });

  const [dataState, setDataState] = useState<DBState>({
    items: [],
    sales: [],
    settings: {
      spreadsheetId: "",
      spreadsheetUrl: "",
      lastSync: null,
    },
    logs: [],
    requests: [],
    orders: []
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "inventory" | "assistant" | "sync" | "audit" | "orders" | "marketplace">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Permissions tab routing guard: customers get locked in marketplace. non-admins cannot do admin modules.
  useEffect(() => {
    if (currentUser === "customer") {
      setActiveTab("marketplace");
    } else if (currentUser && currentUser !== "admin") {
      if (activeTab === "dashboard" || activeTab === "sync" || activeTab === "audit" || activeTab === "marketplace") {
        setActiveTab("sales");
      }
    } else if (currentUser === "admin" && activeTab === "marketplace") {
      setActiveTab("dashboard");
    }
  }, [currentUser, activeTab]);

  // Fetch initial state from the full-stack server
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("تعذر جلب البيانات من الخادم");
        const json = await res.json();
        
        const normalizedItems = (json.items || []).map((item: any) => ({
          ...item,
          priceCost: item.priceCost !== undefined ? Number(item.priceCost) : Number(item.priceWholesale) || 0,
          priceWholesale: Number(item.priceWholesale) || 0,
          priceRetail: Number(item.priceRetail) || 0,
          maxDiscountProfitPercent: item.maxDiscountProfitPercent !== undefined ? Number(item.maxDiscountProfitPercent) : 50,
        }));

        setDataState({
          items: normalizedItems,
          sales: json.sales || [],
          settings: json.settings || { spreadsheetId: "", spreadsheetUrl: "", lastSync: null },
          logs: json.logs || [],
          requests: json.requests || [],
          orders: json.orders || []
        });
      } catch (err) {
        console.error("Error fetching initial state:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Save/Sync database state to full-stack backend
  const syncWithServer = async (updatedState: DBState) => {
    setSaveStatus("جاري المزامنة...");
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedState),
      });
      if (res.ok) {
        setSaveStatus("تم الحفظ والمزامنة");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("خطأ في المزامنة");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("فشل الاتصال بالخادم");
    }
  };

  const handleLogin = (user: "admin" | "user 1" | "user 2" | "customer") => {
    setCurrentUser(user);
    localStorage.setItem("blackhours_user", user);
    
    // Add simple system sign in log
    const systemLog: ActivityLog = {
      id: `log_${Date.now()}`,
      user,
      actionType: "transfer", // categorized under security/transfer
      details: user === "customer" 
        ? "دخل زائر جديد إلى الماركت بليس التفاعلي للطلب الفوري." 
        : `تم تسجيل دخول الموظف [${user}] بنجاح إلى النظام.`,
      timestamp: new Date().toISOString()
    };
    
    setDataState(prev => {
      const next = {
        ...prev,
        logs: [systemLog, ...(prev.logs || [])]
      };
      syncWithServer(next);
      return next;
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      const systemLog: ActivityLog = {
        id: `log_${Date.now()}`,
        user: currentUser,
        actionType: "transfer",
        details: `قام الموظف [${currentUser}] بتسجيل الخروج من النظام.`,
        timestamp: new Date().toISOString()
      };
      setDataState(prev => {
        const next = {
          ...prev,
          logs: [systemLog, ...(prev.logs || [])]
        };
        syncWithServer(next);
        return next;
      });
    }
    setCurrentUser(null);
    localStorage.removeItem("blackhours_user");
  };

  const handleAddLog = (actionType: any, details: string) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user: currentUser || "system",
      actionType,
      details,
      timestamp: new Date().toISOString()
    };
    setDataState(prev => {
      const next = {
        ...prev,
        logs: [newLog, ...(prev.logs || [])]
      };
      syncWithServer(next);
      return next;
    });
  };

  const handleProposeEdit = (
    productId: string, 
    productName: string, 
    originalData: Partial<Product>, 
    proposedData: Partial<Product>
  ) => {
    const newRequest: ModificationRequest = {
      id: `req_${Date.now()}`,
      productId,
      productName,
      requestedBy: currentUser || "unknown",
      requestedAt: new Date().toISOString(),
      originalData,
      proposedData,
      status: "pending" as const
    };
    const logDetails = `طلب الموظف [${currentUser}] إجراء تعديل على الصنف [${productName}]; بانتظار اعتماد المدير العام ورجوع الجرد.`;
    const newLog: ActivityLog = {
      id: `log_req_${Date.now()}`,
      user: currentUser || "system",
      actionType: "edit_request",
      details: logDetails,
      timestamp: new Date().toISOString()
    };
    
    setDataState(prev => {
      const next = {
        ...prev,
        requests: [newRequest, ...(prev.requests || [])],
        logs: [newLog, ...(prev.logs || [])]
      };
      syncWithServer(next);
      return next;
    });
  };

  const handleApproveRequest = (requestId: string) => {
    const req = dataState.requests?.find((r) => r.id === requestId);
    if (!req) return;

    // Update product in items
    const updatedItems = dataState.items.map((item) => {
      if (item.id === req.productId) {
        return {
          ...item,
          ...req.proposedData,
          lastModifiedBy: "admin",
          lastModifiedAt: new Date().toISOString()
        };
      }
      return item;
    });

    // Update status to approved
    const updatedRequests = dataState.requests?.map((r) => {
      if (r.id === requestId) return { ...r, status: "approved" as const };
      return r;
    }) || [];

    const approvalLog: ActivityLog = {
      id: `log_app_${Date.now()}`,
      user: "admin",
      actionType: "edit_approved",
      details: `وافق واعجب الأدمن على طلب التعديل للصنف [${req.productName}] المقدم من [${req.requestedBy}]. تم تطبيق القيم الجديدة مخزنيًا.`,
      timestamp: new Date().toISOString()
    };

    setDataState(prev => {
      const next = {
        ...prev,
        items: updatedItems,
        requests: updatedRequests,
        logs: [approvalLog, ...(prev.logs || [])]
      };
      syncWithServer(next);
      return next;
    });
  };

  const handleRejectRequest = (requestId: string) => {
    const req = dataState.requests?.find((r) => r.id === requestId);
    if (!req) return;

    const updatedRequests = dataState.requests?.map((r) => {
      if (r.id === requestId) return { ...r, status: "rejected" as const };
      return r;
    }) || [];

    const rejectionLog: ActivityLog = {
      id: `log_rej_${Date.now()}`,
      user: "admin",
      actionType: "edit_rejected",
      details: `رفض وألغى الأدمن طلب التعديل للصنف [${req.productName}] المقدم من [${req.requestedBy}]. تم إلغاء التغييرات بنجاح البت.`,
      timestamp: new Date().toISOString()
    };

    setDataState(prev => {
      const next = {
        ...prev,
        requests: updatedRequests,
        logs: [rejectionLog, ...(prev.logs || [])]
      };
      syncWithServer(next);
      return next;
    });
  };

  const handleClearLogs = () => {
    const clearingLog: ActivityLog = {
      id: `log_clr_${Date.now()}`,
      user: "admin",
      actionType: "edit_approved",
      details: "قام المدير العام (admin) بمسح وتفتيش تفاصيل السجل العملياتي لتوفير مساحة وتخزين تدوين المذكرة الجديدة.",
      timestamp: new Date().toISOString()
    };

    setDataState(prev => {
      const next = {
        ...prev,
        logs: [clearingLog]
      };
      syncWithServer(next);
      return next;
    });
  };

  const handleUpdateItems = (newItems: Product[]) => {
    const nextState = { ...dataState, items: newItems };
    setDataState(nextState);
    syncWithServer(nextState);
  };

  const handlePlaceOrder = (newOrder: Order) => {
    setDataState((prev) => {
      const existingIndex = (prev.orders || []).findIndex((o) => o.id === newOrder.id);
      let updatedOrders = [...(prev.orders || [])];
      if (existingIndex !== -1) {
        updatedOrders[existingIndex] = newOrder;
      } else {
        updatedOrders = [newOrder, ...updatedOrders];
      }
      const next = { ...prev, orders: updatedOrders };
      syncWithServer(next);
      return next;
    });
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setDataState((prev) => {
      const updatedOrders = (prev.orders || []).map((o) => o.id === updatedOrder.id ? updatedOrder : o);
      const next = { ...prev, orders: updatedOrders };
      syncWithServer(next);
      return next;
    });
  };

  const handleAddSale = (newSale: Sale, updatedItems: Product[]) => {
    const nextState = {
      ...dataState,
      items: updatedItems,
      sales: [...dataState.sales, newSale],
    };
    setDataState(nextState);
    syncWithServer(nextState);
  };

  const handleAddSalesBatch = (newSales: Sale[], updatedItems: Product[]) => {
    const nextState = {
      ...dataState,
      items: updatedItems,
      sales: [...dataState.sales, ...newSales],
    };
    setDataState(nextState);
    syncWithServer(nextState);
  };

  const handleUpdateSettings = (newSettings: SyncSettings) => {
    const nextState = { ...dataState, settings: newSettings };
    setDataState(nextState);
    syncWithServer(nextState);
  };

  // Compute stats and indicators
  const totalStockBranch1 = dataState.items.reduce((acc, it) => acc + it.stockBranch1, 0);
  const totalStockBranch2 = dataState.items.reduce((acc, it) => acc + it.stockBranch2, 0);
  const totalInventoryWholesaleValue = dataState.items.reduce(
    (acc, it) => acc + (it.stockBranch1 + it.stockBranch2) * it.priceWholesale,
    0
  );

  const totalSalesCount = dataState.sales.length;
  const totalRevenue = dataState.sales.reduce((acc, sa) => acc + sa.total, 0);
  const totalProfit = dataState.sales.reduce((acc, sa) => acc + sa.profit, 0);

  // Filter out low stock alerts
  const lowStockItems = dataState.items.filter(
    (item) => item.stockBranch1 <= item.minStockAlert || item.stockBranch2 <= item.minStockAlert
  );

  // Calculate branch performance split
  const branch1SalesTotal = dataState.sales
    .filter((s) => s.branch === "branch1")
    .reduce((acc, s) => acc + s.total, 0);
  const branch2SalesTotal = dataState.sales
    .filter((s) => s.branch === "branch2")
    .reduce((acc, s) => acc + s.total, 0);

  const branch1ProfitTotal = dataState.sales
    .filter((s) => s.branch === "branch1")
    .reduce((acc, s) => acc + s.profit, 0);
  const branch2ProfitTotal = dataState.sales
    .filter((s) => s.branch === "branch2")
    .reduce((acc, s) => acc + s.profit, 0);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24" dir="rtl">
      {/* Top Brand Header styled precisely like requested theme */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 px-4 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-6 h-6 border-4 border-black rotate-45"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-display tracking-wider text-white">BLACKHOURS</h1>
                <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  {currentUser === "customer" ? "الماركت بليس 🛍️" : "محل جملة"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                {currentUser === "customer" ? "بوابة المشتري للطلب الفوري وتتبع الشحنات المباشر" : "نظام إدارة البضائع وحركات الفروع اللحظي التشاركي"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {saveStatus && (
              <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1 rounded-xl font-mono">
                {saveStatus}
              </span>
            )}
            <div className="bg-neutral-900 border border-neutral-850 rounded-2xl px-3 py-1.5 text-xs text-neutral-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>المستخدم: <strong className="text-white capitalize font-sans">{currentUser === "customer" ? "زبون متجر" : currentUser}</strong></span>
              {currentUser !== "admin" && currentUser !== "customer" && (
                <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded font-black text-zinc-400">
                  {currentUser === "user 1" ? "فرع 1" : "فرع 2"}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-rose-950/40 text-rose-400 border border-rose-900/45 p-2 rounded-xl hover:bg-rose-900/40 transition text-xs flex items-center gap-1 font-bold"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">خروج</span>
            </button>
            <div className="bg-green-500/10 text-green-400 px-3.5 py-1.5 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              المزامنة نشطة
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-neutral-200 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-400">جاري تهيئة لوحة تحكم blackhours وجلب البضائع...</p>
          </div>
        ) : (
          <>
            {/* Bento Stats Grid with progress meters & signature tags */}
            {currentUser !== "customer" && (
              <div className={`grid grid-cols-1 gap-4 ${currentUser === "admin" ? "md:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
              {/* Stat 1 - Branch 1 */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between hover:border-neutral-700 transition duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-neutral-400 text-xs font-semibold">بضائع فرع 1</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-400/20 font-bold uppercase">فرع 1</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-white font-mono">{totalStockBranch1}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">حالة التخزين وسعة العرض</p>
                  
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                  </div>
                  <div className="text-[9px] text-neutral-500 mt-1.5 text-left">سعة تخزين مستغلة 85%</div>
                </div>
              </div>

              {/* Stat 2 - Branch 2 */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between hover:border-neutral-700 transition duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-neutral-400 text-xs font-semibold">بضائع فرع 2</span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-400/20 font-bold uppercase">فرع 2</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-white font-mono">{totalStockBranch2}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">تتبع التزامن بالمخزن</p>

                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: '30%' }}></div>
                  </div>
                  <div className="text-[9px] text-orange-400 mt-1.5 text-left">تنبيه: سعة متوفرة للشحن (30%)</div>
                </div>
              </div>

              {currentUser === "admin" && (
                <>
                  {/* Stat 3 - Financial Capital block */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between hover:border-neutral-700 transition duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-neutral-400 text-xs font-semibold">إجمالي رأس مال البضاعة</span>
                      <span className="text-[10px] bg-amber-500/25 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20 font-bold uppercase font-mono">VALUATION</span>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white font-mono">
                        {totalInventoryWholesaleValue.toLocaleString("ar-EG")} <span className="text-xs text-neutral-400 font-sans">EGP</span>
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">المحسوبة بسعر الجملة الرسمي الحالي</p>
                      
                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="text-[9px] text-neutral-500 mt-1.5 text-left">توزيع السيولة متوازن</div>
                    </div>
                  </div>

                  {/* Stat 4 - Large Card custom gradient look for Bento */}
                  <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-3xl p-5 flex flex-col justify-between hover:border-neutral-600 transition duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-neutral-300 text-xs font-bold uppercase tracking-widest font-display">المبيعات والأرباح الكلية</span>
                      <span className="text-[10px] bg-cyan-400 text-neutral-950 px-2 py-0.5 rounded font-bold">نشط</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-2xl font-black text-cyan-400 font-mono">+{totalRevenue.toLocaleString("ar-EG")} ج.م</span>
                        <span className="text-[11px] text-neutral-300">({totalSalesCount} مبيعة)</span>
                      </div>
                      <p className="text-xs text-emerald-300 font-semibold">
                        الأرباح الصافية الحالية: {totalProfit.toLocaleString("ar-EG")} ج.م
                      </p>

                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <div className="text-[9px] text-neutral-400 mt-1.5 text-left">معدل تحويل فائق</div>
                    </div>
                  </div>
                </>
              )}
              </div>
            )}

            {/* Notification / Alert Bar for Low Stock */}
            {currentUser !== "customer" && lowStockItems.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-3xl p-5 flex items-center justify-between flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 animate-bounce shrink-0" />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">تنبيه بضائع حرجة ونواقص</span>
                    <span className="text-neutral-300">يوجد عدد ({lowStockItems.length}) من قطع الغيار أو الإكسسوارات تحت حد الأمان المطلوب!</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="bg-white hover:bg-neutral-200 text-black font-bold px-4 py-2 rounded-2xl text-xs transition duration-200 shadow-md transform hover:scale-105"
                >
                  عرض النواقص للتعديل
                </button>
              </div>
            )}

            {/* Dashboard Comparison & Tabs Menu */}
            {currentUser === "customer" ? (
              <CustomerMarketplace 
                items={dataState.items} 
                orders={dataState.orders || []} 
                onPlaceOrder={handlePlaceOrder}
                onAddLog={handleAddLog}
              />
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Inner Desk Menu */}
              <div className="bg-neutral-950 border-b border-neutral-850 flex justify-around md:justify-start gap-1 p-2.5 overflow-x-auto">
                {currentUser === "admin" && (
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                      activeTab === "dashboard" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-cyan-400" />
                    لوحة الأداء العام
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeTab === "sales" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  البيع والمبيعات الكلية
                </button>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeTab === "inventory" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Store className="w-4 h-4 text-orange-400" />
                  جرد البضائع وتحويل الفروع
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-5 py-3 rounded-2xl text-xs font-semibold transition flex items-center gap-2 shrink-0 relative ${
                    activeTab === "orders" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  إدارة طلبات الماركت بليس
                  {((dataState.orders?.filter((o) => o.status === "pending" || o.delayContactRequested).length) ?? 0) > 0 && (
                    <span className="bg-amber-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                      {dataState.orders?.filter((o) => o.status === "pending" || o.delayContactRequested).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("assistant")}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeTab === "assistant" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                  مساعد blackhours الذكي
                </button>
                {currentUser === "admin" && (
                  <>
                    <button
                      onClick={() => setActiveTab("sync")}
                      className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 relative ${
                        activeTab === "sync" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-400" />
                      ربط Google Sheets
                      {dataState.settings.spreadsheetId && (
                        <span className="w-2 h-2 rounded-full bg-green-400 absolute top-2 left-2" />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("audit")}
                      className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 relative ${
                        activeTab === "audit" ? "bg-neutral-800 text-white border border-neutral-700/50 shadow-inner" : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400 hover:animate-pulse" />
                      الرقابة وصلاحيات الموظفين
                      {(dataState.requests?.filter((r) => r.status === "pending").length ?? 0) > 0 && (
                        <span className="bg-amber-500 text-neutral-950 font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse ml-1">
                          {dataState.requests?.filter((r) => r.status === "pending").length} طلبات معلقة
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    {/* Performance split widget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Branch 1 Performance card */}
                      <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-850 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                              <h4 className="font-bold text-sm text-neutral-100">تحليل مبيعات فرع 1</h4>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono">فرع 1 الرئيسي</span>
                          </div>
                          <div className="space-y-3.5 text-xs mb-5">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">حجم مبيعات الفرع:</span>
                              <span className="font-bold text-neutral-200 text-sm font-mono">{branch1SalesTotal} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">الأرباح الصافية المحققة:</span>
                              <span className="font-bold text-emerald-400 text-sm font-mono">+{branch1ProfitTotal} ج.م</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {/* Custom Chart Bar */}
                          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${totalRevenue ? (branch1SalesTotal / totalRevenue) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-neutral-400 text-center mt-2.5">
                            يمثل <strong className="font-bold text-white font-mono">{totalRevenue ? Math.round((branch1SalesTotal / totalRevenue) * 100) : 0}%</strong> من إجمالي مبيعات المحل
                          </p>
                        </div>
                      </div>

                      {/* Branch 2 Performance card */}
                      <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-850 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 rounded-full bg-orange-500" />
                              <h4 className="font-bold text-sm text-neutral-100">تحليل مبيعات فرع 2</h4>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono font-bold">فرع 2</span>
                          </div>
                          <div className="space-y-3.5 text-xs mb-5">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">حجم مبيعات الفرع:</span>
                              <span className="font-bold text-neutral-200 text-sm font-mono">{branch2SalesTotal} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">الأرباح الصافية المحققة:</span>
                              <span className="font-bold text-emerald-400 text-sm font-mono">+{branch2ProfitTotal} ج.م</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {/* Custom Chart Bar */}
                          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${totalRevenue ? (branch2SalesTotal / totalRevenue) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-neutral-400 text-center mt-2.5">
                            يمثل <strong className="font-bold text-white font-mono">{totalRevenue ? Math.round((branch2SalesTotal / totalRevenue) * 100) : 0}%</strong> من إجمالي مبيعات المحل
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Overview Guidelines */}
                    <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-850">
                      <h4 className="font-bold text-neutral-200 mb-4 flex items-center gap-2 text-sm">
                        <Smartphone className="w-5 h-5 text-cyan-400" />
                        دليل نظام blackhours المطور:
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed max-w-4xl mb-6">
                        نظام تسيير بضائع blackhours لقطع الهاتف بالجملة يضمن المزامنة الذكية والدقة بين فرعي المحل. عندما تقوم بأي عملية بيع أو تعديل أو تحويل للبضائع، يتم تحديث مخزون كلا الفرعين فوراً مع التحقق الذكي من توفر السلعة.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                          <span className="font-bold text-cyan-400 block text-xs">📦 المزامنة الفورية</span>
                          <span className="text-neutral-400 leading-relaxed">عندما تنفذ القطع في فرع محدد ويقوم العميل بشرائها، يسحبها النظام تلقائياً من الفرع الآخر لموازنة الاحتياج الفوري.</span>
                        </div>
                        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                          <span className="font-bold text-orange-400 block text-xs">🤖 سيناريوهات التخيل</span>
                          <span className="text-neutral-400 leading-relaxed">المساعد المدعوم بـ Gemini يقوم بحساب توقعات الربح ونسب التحويل من فرع لآخر بناء على حركة البيع الحالية.</span>
                        </div>
                        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                          <span className="font-bold text-green-400 block text-xs">🟢 التكامل مع Google Sheets</span>
                          <span className="text-neutral-400 leading-relaxed">تصدير لوائح الجرد وسجلات المبيعات إلى جوجل شيتس لحفظ التقارير مع صلاحية سحابية كاملة.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <CustomerOrderManager
                    orders={dataState.orders || []}
                    items={dataState.items}
                    sales={dataState.sales}
                    onUpdateOrder={handleUpdateOrder}
                    onUpdateItems={handleUpdateItems}
                    onAddSale={(newSale) => {
                      setDataState((prev) => {
                        const updatedState = {
                          ...prev,
                          sales: [...prev.sales, newSale]
                        };
                        syncWithServer(updatedState);
                        return updatedState;
                      });
                    }}
                    onAddLog={handleAddLog}
                    currentUser={currentUser}
                  />
                )}

                {activeTab === "marketplace" && (
                  <CustomerMarketplace
                    items={dataState.items}
                    orders={dataState.orders || []}
                    onPlaceOrder={handlePlaceOrder}
                    onAddLog={handleAddLog}
                  />
                )}

                {activeTab === "sales" && (
                  <SalesManager 
                    items={dataState.items} 
                    sales={dataState.sales} 
                    onAddSale={handleAddSale} 
                    onAddSalesBatch={handleAddSalesBatch}
                    currentUser={currentUser}
                    onAddLog={handleAddLog}
                  />
                )}

                {activeTab === "inventory" && (
                  <StockManager 
                    items={dataState.items} 
                    onUpdateItems={handleUpdateItems} 
                    currentUser={currentUser}
                    onProposeEdit={handleProposeEdit}
                    onAddLog={handleAddLog}
                  />
                )}

                {activeTab === "assistant" && (
                  <AIAssistant 
                    items={dataState.items} 
                    sales={dataState.sales} 
                  />
                )}

                {activeTab === "sync" && (
                  <GoogleSheetsSync 
                    items={dataState.items} 
                    sales={dataState.sales} 
                    settings={dataState.settings}
                    onUpdateSettings={handleUpdateSettings}
                  />
                )}

                {activeTab === "audit" && (
                  <AuditControlPanel
                    logs={dataState.logs || []}
                    requests={dataState.requests || []}
                    currentUser={currentUser}
                    onApproveRequest={handleApproveRequest}
                    onRejectRequest={handleRejectRequest}
                    onClearLogs={handleClearLogs}
                  />
                )}
              </div>
            </div>
            )}
          </>
        )}
      </main>

      {/* Mobile-First Optimized Bottom Navigation Bar */}
      {currentUser !== "customer" && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-900 px-2 py-2 flex items-center justify-around z-40 md:hidden">
          {currentUser === "admin" && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                activeTab === "dashboard" ? "text-cyan-400" : "text-neutral-500"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="text-[9px] font-bold">لوحة التحكم</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              activeTab === "sales" ? "text-cyan-400" : "text-neutral-500"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[9px] font-bold">البيع</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              activeTab === "inventory" ? "text-cyan-400" : "text-neutral-500"
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[9px] font-bold">المخزن</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center gap-1 p-1.5 transition relative ${
              activeTab === "orders" ? "text-cyan-400" : "text-neutral-500"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[9px] font-bold">الطلبات</span>
            {((dataState.orders?.filter((o) => o.status === "pending" || o.delayContactRequested).length) ?? 0) > 0 && (
              <span className="bg-amber-500 text-neutral-950 font-black text-[8px] absolute top-1 right-3 px-1 rounded-full">
                {dataState.orders?.filter((o) => o.status === "pending" || o.delayContactRequested).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("assistant")}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              activeTab === "assistant" ? "text-cyan-400" : "text-neutral-500"
            }`}
          >
            <Bot className="w-5 h-5" />
            <span className="text-[9px] font-bold">المساعد</span>
          </button>
          {currentUser === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("sync")}
                className={`flex flex-col items-center gap-1 p-1.5 transition ${
                  activeTab === "sync" ? "text-cyan-400" : "text-neutral-500"
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-[9px] font-bold">غوغل شيت</span>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`flex flex-col items-center gap-1 p-1.5 transition ${
                  activeTab === "audit" ? "text-cyan-400" : "text-neutral-500"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[9px] font-bold">الرقابة</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

