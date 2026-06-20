import React, { useState } from "react";
import { ActivityLog, ModificationRequest } from "../types";
import { 
  ShieldCheck, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  AlertTriangle, 
  FileCheck, 
  Layers, 
  Search,
  Check,
  X,
  RefreshCw,
  Eye,
  Info
} from "lucide-react";

interface AuditControlPanelProps {
  logs: ActivityLog[];
  requests: ModificationRequest[];
  currentUser: "admin" | "user 1" | "user 2";
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onClearLogs: () => void;
}

export default function AuditControlPanel({
  logs = [],
  requests = [],
  currentUser,
  onApproveRequest,
  onRejectRequest,
  onClearLogs
}: AuditControlPanelProps) {
  const [logFilter, setLogFilter] = useState<"all" | "adds" | "edits" | "sales" | "transfers">("all");
  const [logSearch, setLogSearch] = useState("");

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const filteredLogs = logs
    .filter((log) => {
      const matchSearch = log.details.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.user.toLowerCase().includes(logSearch.toLowerCase());
      
      if (logFilter === "adds") return matchSearch && log.actionType === "add_product";
      if (logFilter === "edits") return matchSearch && (log.actionType === "edit_request" || log.actionType === "edit_approved" || log.actionType === "edit_rejected");
      if (logFilter === "sales") return matchSearch && log.actionType === "sale";
      if (logFilter === "transfers") return matchSearch && log.actionType === "transfer";
      
      return matchSearch;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Top Welcome Control Card */}
      <div className="bg-gradient-to-r from-zinc-900 to-neutral-900 border border-surface-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand/10 text-brand-light rounded-2xl flex items-center justify-center border border-brand/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              مركز الرقابة الأمنية وحماية الصلاحيات بمخاطر التلاعب
              <span className="text-xs bg-brand/20 text-brand-light border border-brand/30 px-2 py-0.5 rounded-full font-sans font-bold">
                نشط بأمان
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">تتبع تعديلات مستخدمي الفرعين، اعتماد طلبات تعديل الأسعار، ومراقبة التلاعب في كميات قطع الغيار والمخزون في الوقت الحقيقي.</p>
          </div>
        </div>

        {currentUser === "admin" && logs.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("هل أنت متأكد من رغبتك في تفريغ سجل العمليات لتوفير المساحة؟")) {
                onClearLogs();
              }
            }}
            className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-text-primary px-4 py-2.5 rounded-xl transition duration-200 self-start md:self-auto cursor-pointer"
          >
            تفريغ المحفوظات والسجلات
          </button>
        )}
      </div>

      {/* Grid of Main Control Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (9 cols for Admin, or 12 for standard users): Modification requests queue */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-text-primary">
                  طلبات تعديل الأصناف والأسعار المعلقة لتفادي التلاعب ({pendingRequests.length})
                </h4>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold">تتطلب موافقة المدير</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center text-text-secondary space-y-2">
                <CheckCircle className="w-10 h-10 text-brand/30 mx-auto" />
                <p className="text-xs font-medium">لا توجد طلبات تعديل معلقة حالياً!</p>
                <p className="text-[10px] text-text-tertiary">كافة تعديلات الموظفين متطابقة أو معتمدة بالكامل.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {pendingRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="p-4 bg-surface-base border border-surface-border hover:border-amber-500/30 transition duration-200 rounded-2xl relative space-y-3"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-text-primary block mb-0.5">{req.productName}</span>
                        <div className="flex gap-2 items-center text-[10px] text-text-secondary">
                          <span className="bg-surface-card px-1.5 py-0.5 rounded text-text-secondary flex items-center gap-1 font-bold">
                            <User className="w-3 h-3 text-brand-light" />
                            بواسطة: {req.requestedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-text-tertiary" />
                            {new Date(req.requestedAt).toLocaleString("ar-EG")}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-amber-500/25 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                        معلق للأدمن
                      </span>
                    </div>

                    {/* Compare old and proposed values cleanly */}
                    <div className="bg-surface-card/60 p-3 rounded-xl border border-surface-border text-xs text-text-secondary space-y-2">
                      <p className="font-bold text-[10px] text-text-secondary border-b border-surface-border pb-1">الفروق والبيانات المعدلة:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                        {req.proposedData.name && req.proposedData.name !== req.originalData.name && (
                          <div className="col-span-2">
                            <span className="text-text-secondary block">تعديل الاسم:</span>
                            <span className="text-rose-400 line-through truncate block">{req.originalData.name}</span>
                            <span className="text-brand-light font-sans font-bold block">← {req.proposedData.name}</span>
                          </div>
                        )}
                        
                        {req.proposedData.priceWholesale !== undefined && req.proposedData.priceWholesale !== req.originalData.priceWholesale && (
                          <div className="bg-surface-base p-1.5 rounded border border-surface-border flex justify-between">
                            <span className="text-text-secondary">سعر الجملة:</span>
                            <span>
                              <span className="text-rose-400 line-through">{req.originalData.priceWholesale}</span>
                              <span className="text-brand-light font-bold mr-1.5">← {req.proposedData.priceWholesale} ج.م</span>
                            </span>
                          </div>
                        )}

                        {req.proposedData.priceRetail !== undefined && req.proposedData.priceRetail !== req.originalData.priceRetail && (
                          <div className="bg-surface-base p-1.5 rounded border border-surface-border flex justify-between">
                            <span className="text-text-secondary">سعر القطاعي:</span>
                            <span>
                              <span className="text-rose-400 line-through">{req.originalData.priceRetail}</span>
                              <span className="text-brand-light font-bold mr-1.5">← {req.proposedData.priceRetail} ج.م</span>
                            </span>
                          </div>
                        )}

                        {req.proposedData.priceCost !== undefined && req.proposedData.priceCost !== req.originalData.priceCost && (
                          <div className="bg-surface-base p-1.5 rounded border border-surface-border flex justify-between">
                            <span className="text-text-secondary">سعر التكلفة:</span>
                            <span>
                              <span className="text-rose-400 line-through">{req.originalData.priceCost !== undefined ? req.originalData.priceCost : 0}</span>
                              <span className="text-brand-light font-bold mr-1.5">← {req.proposedData.priceCost} ج.م</span>
                            </span>
                          </div>
                        )}

                        {req.proposedData.maxDiscountProfitPercent !== undefined && req.proposedData.maxDiscountProfitPercent !== req.originalData.maxDiscountProfitPercent && (
                          <div className="bg-surface-base p-1.5 rounded border border-surface-border flex justify-between">
                            <span className="text-text-secondary">حد الخصم من الربح:</span>
                            <span>
                              <span className="text-rose-400 line-through">{req.originalData.maxDiscountProfitPercent !== undefined ? req.originalData.maxDiscountProfitPercent : 50}%</span>
                              <span className="text-brand-light font-bold mr-1.5">← {req.proposedData.maxDiscountProfitPercent}%</span>
                            </span>
                          </div>
                        )}

                        {req.proposedData.stockBranch1 !== undefined && req.proposedData.stockBranch1 !== req.originalData.stockBranch1 && (
                          <div className="bg-surface-base p-1.5 rounded border border-surface-border flex justify-between">
                            <span className="text-text-secondary">مخزون فرع 1:</span>
                            <span>
                              <span className="text-rose-400 line-through">{req.originalData.stockBranch1}</span>
                              <span className="text-brand-light font-bold mr-1.5">← {req.proposedData.stockBranch1} ق</span>
                            </span>
                          </div>
                        )}

                        {req.proposedData.stockBranch2 !== undefined && req.proposedData.stockBranch2 !== req.originalData.stockBranch2 && (
                          <div className="bg-surface-base p-1.5 rounded border border-surface-border flex justify-between">
                            <span className="text-text-secondary">مخزون فرع 2:</span>
                            <span>
                              <span className="text-rose-400 line-through">{req.originalData.stockBranch2}</span>
                              <span className="text-brand-light font-bold mr-1.5">← {req.proposedData.stockBranch2} ق</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Approve/Reject Buttons */}
                    <div className="flex gap-2">
                      {currentUser === "admin" ? (
                        <>
                          <button
                            onClick={() => onApproveRequest(req.id)}
                            className="bg-brand-dark hover:bg-brand text-text-primary text-xs font-bold py-2 px-4 rounded-xl flex-1 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            اعتماد التعديل والمزامنة
                          </button>
                          <button
                            onClick={() => onRejectRequest(req.id)}
                            className="bg-surface-card-hover hover:bg-rose-900/50 text-rose-400 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="رفض"
                          >
                            <X className="w-4 h-4" />
                            رفض
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center text-[10px] text-amber-300 bg-amber-500/5 py-2 px-3 rounded-xl border border-amber-500/10">
                          بانتظار مراجعة الأدمن لمنع التلاعب في الأسعار والكميات.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History of Processed Requests */}
          {processedRequests.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-3xl p-6">
              <h4 className="font-bold text-sm text-text-secondary mb-4 flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-text-secondary" />
                آخر القرارات والطلبات المعالجة للفرعين ({processedRequests.length})
              </h4>
              <div className="space-y-3 max-h-[180px] overflow-y-auto">
                {processedRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-surface-base border border-surface-border rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-text-primary block">{req.productName}</span>
                      <span className="text-[10px] text-text-tertiary">
                        بواسطة {req.requestedBy} • {new Date(req.requestedAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "approved" ? (
                        <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3" /> تم اعتماده
                        </span>
                      ) : (
                        <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
                          <X className="w-3 h-3" /> تم رفضه
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Live System Auditing activity logs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-light" />
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">سجل النشاط وحركات الموظفين بالثانية</h4>
                    <p className="text-[10px] text-text-tertiary">رقابة تلقائية تامة لجميع عمليات الإضافة والبيع</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 mb-4">
                <button
                  onClick={() => setLogFilter("all")}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center border transition cursor-pointer ${
                    logFilter === "all" ? "bg-brand text-text-tertiary border-brand" : "bg-surface-base text-text-secondary border-surface-border hover:bg-surface-card"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setLogFilter("adds")}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center border transition cursor-pointer ${
                    logFilter === "adds" ? "bg-brand text-text-primary border-brand" : "bg-surface-base text-brand-light border-surface-border hover:bg-surface-card"
                  }`}
                >
                  إضافة منتج
                </button>
                <button
                  onClick={() => setLogFilter("edits")}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center border transition cursor-pointer ${
                    logFilter === "edits" ? "bg-amber-500 text-text-tertiary border-amber-400" : "bg-surface-base text-amber-400 border-surface-border hover:bg-surface-card"
                  }`}
                >
                  الحماية والتعديلات
                </button>
                <button
                  onClick={() => setLogFilter("sales")}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center border transition cursor-pointer ${
                    logFilter === "sales" ? "bg-blue-500 text-text-primary border-blue-400" : "bg-surface-base text-blue-400 border-surface-border hover:bg-surface-card"
                  }`}
                >
                  مبيعات
                </button>
                <button
                  onClick={() => setLogFilter("transfers")}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold text-center col-span-2 md:col-span-1 border transition cursor-pointer ${
                    logFilter === "transfers" ? "bg-purple-500 text-text-primary border-purple-400" : "bg-surface-base text-purple-400 border-surface-border hover:bg-surface-card"
                  }`}
                >
                  تحويلات
                </button>
              </div>

              {/* Search log field */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="اصف السجل بالبحث عن موظف أو نوع السلعة..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border rounded-xl pr-9 pl-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand/50"
                />
                <Search className="w-4 h-4 text-text-secondary absolute right-3 top-2" />
              </div>

              {/* Logs Timeline */}
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-text-secondary">
                  <p className="text-xs font-semibold">لم يُعثر على سجلات تطابق الفلتر الحالي.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => {
                    let colorClass = "bg-surface-card border-surface-border text-text-secondary";
                    let actionBadge = "";
                    
                    if (log.actionType === "add_product") {
                      colorClass = "bg-emerald-950/20 border-emerald-900/30 text-emerald-350";
                      actionBadge = "إضافة صنف";
                    } else if (log.actionType === "edit_request") {
                      colorClass = "bg-amber-950/20 border-amber-900/30 text-amber-350";
                      actionBadge = "طلب تعديل";
                    } else if (log.actionType === "edit_approved") {
                      colorClass = "bg-green-950/20 border-green-900/30 text-green-300";
                      actionBadge = "اعتماد تعديل";
                    } else if (log.actionType === "edit_rejected") {
                      colorClass = "bg-rose-950/20 border-rose-900/30 text-rose-300";
                      actionBadge = "رفض تعديل";
                    } else if (log.actionType === "sale") {
                      colorClass = "bg-blue-950/20 border-blue-900/30 text-blue-300";
                      actionBadge = "عملية بيع";
                    } else if (log.actionType === "transfer") {
                      colorClass = "bg-purple-950/20 border-purple-900/30 text-purple-300";
                      actionBadge = "تحول مخزني";
                    }

                    return (
                      <div 
                        key={log.id} 
                        className={`p-3 border rounded-xl flex items-start gap-3 transition hover:bg-surface-card/50 ${colorClass}`}
                      >
                        {/* Timeline node */}
                        <div className="w-6 h-6 rounded-full bg-surface-base border border-surface-border flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black text-text-secondary font-mono">
                          {log.user === "admin" ? "AD" : log.user === "user 1" ? "U1" : log.user === "user 2" ? "U2" : "SY"}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2.5">
                            <span className="text-[11px] font-bold text-text-primary flex items-center gap-1 border-b border-dashed border-surface-border pb-0.5">
                              {log.user === "admin" ? "المدير العام (admin)" : log.user === "user 1" ? "مشرف الفرع 1" : log.user === "user 2" ? "مشرف الفرع 2" : "النظام"}
                            </span>
                            <span className="text-[9px] text-text-tertiary font-mono">
                              {new Date(log.timestamp).toLocaleTimeString("ar-EG")}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed break-words font-sans text-text-secondary font-medium">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] bg-surface-base text-text-secondary px-1.5 py-0.5 rounded border border-surface-border tracking-wider">
                              {actionBadge}
                            </span>
                            <span className="text-[8px] text-text-tertiary font-mono">
                              {new Date(log.timestamp).toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
