import React, { useState } from "react";
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  Store, 
  X, 
  Search, 
  TrendingUp, 
  Phone, 
  User, 
  MapPin, 
  AlertTriangle,
  ChevronDown,
  ShoppingBag,
  Briefcase,
  Check,
  Calendar
} from "lucide-react";
import { Order, Product, Sale } from "../types";

interface CustomerOrderManagerProps {
  orders: Order[];
  items: Product[];
  sales: Sale[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onUpdateItems: (updatedItems: Product[]) => void;
  onAddSale: (newSale: Sale) => void;
  onAddLog: (actionType: any, details: string) => void;
  currentUser: string;
}

export default function CustomerOrderManager({
  orders,
  items,
  sales,
  onUpdateOrder,
  onUpdateItems,
  onAddSale,
  onAddLog,
  currentUser
}: CustomerOrderManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // To choose which branch to deduct stock from when delivering a shipped order
  const [deductBranchChoice, setDeductBranchChoice] = useState<"branch1" | "branch2">("branch1");

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" 
      ? true 
      : statusFilter === "delayed" 
        ? o.delayContactRequested === true 
        : o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Best Selling items per branch & online weekly (within the last 7 days)
  const getWeeklyBestsellers = () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklySales = sales.filter((s) => new Date(s.date) >= sevenDaysAgo);

    const aggregateBestsellersByBranch = (branch: "branch1" | "branch2" | "online") => {
      const branchSales = weeklySales.filter((s) => s.branch === branch);
      const productTotals: Record<string, { name: string; quantity: number; amount: number }> = {};

      branchSales.forEach((s) => {
        if (!productTotals[s.productId]) {
          productTotals[s.productId] = { name: s.productName, quantity: 0, amount: 0 };
        }
        productTotals[s.productId].quantity += s.quantity;
        productTotals[s.productId].amount += s.total;
      });

      return Object.values(productTotals)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3); // top 3
    };

    return {
      branch1: aggregateBestsellersByBranch("branch1"),
      branch2: aggregateBestsellersByBranch("branch2"),
      online: aggregateBestsellersByBranch("online")
    };
  };

  const weeklyBestsellers = getWeeklyBestsellers();

  // Change order status state machine
  const handleUpdateStatus = (order: Order, newStatus: Order["status"]) => {
    const updatedOrder: Order = { ...order, status: newStatus };

    // Subtract stock and register Sale record ONLY when order goes to "delivered"
    if (newStatus === "delivered" && order.status !== "delivered") {
      let isErrorStock = false;
      const finalItemsList = [...items];

      // Step 1: Check and deduct stock
      order.items.forEach((orderItem) => {
        const prodIndex = finalItemsList.findIndex((p) => p.id === orderItem.productId);
        if (prodIndex !== -1) {
          const product = finalItemsList[prodIndex];
          const chosenBranch = order.pickupBranch || deductBranchChoice; // use pickup branch if pickup, else choice

          if (chosenBranch === "branch1") {
            if (product.stockBranch1 < orderItem.quantity) {
              isErrorStock = true;
            } else {
              product.stockBranch1 -= orderItem.quantity;
            }
          } else {
            if (product.stockBranch2 < orderItem.quantity) {
              isErrorStock = true;
            } else {
              product.stockBranch2 -= orderItem.quantity;
            }
          }
          finalItemsList[prodIndex] = { ...product };
        }
      });

      if (isErrorStock) {
        const confirmAnyway = window.confirm(
          "⚠️ الرصيد الحالي لبعض القطع في فروعك أقل من الكمية المطلوبة بالطلب! هل ترغب في إتمام البيع والمزامنة وتمرير العجز تلقائيًا لإصلاح العجز في الجرد الفعلي لاحقاً؟"
        );
        if (!confirmAnyway) return;
      }

      // Step 2: Register Sale Record for each item as an 'online' branch sale
      order.items.forEach((orderItem) => {
        const product = items.find((p) => p.id === orderItem.productId);
        const costPrice = product?.priceCost || product?.priceWholesale || 0;
        const profit = (orderItem.price - costPrice) * orderItem.quantity;

        const newSale: Sale = {
          id: `sale_${Date.now()}_${orderItem.productId}`,
          productId: orderItem.productId,
          productName: orderItem.productName,
          branch: "online", // Explicitly registers as an ONLINE sale!
          quantity: orderItem.quantity,
          price: orderItem.price,
          total: orderItem.total,
          profit: profit,
          date: new Date().toISOString(),
          notes: `طلب أونلاين تم استلامه وتوصيله للعميل [رقم طلب: ${order.id}]`,
          soldBy: currentUser
        };
        onAddSale(newSale);
      });

      // Update product catalog stock
      onUpdateItems(finalItemsList);
      onAddLog(
        "sale",
        `تم تأكيد توصيل واستلام الطلب رقم [${order.id}] للمشتري [${order.customerName}] وسحب مخزون المنتجات من [${
          order.pickupBranch ? `فرع استلام: ${order.pickupBranch}` : `فرع تغطية الشحن: ${deductBranchChoice}`
        }] وتسجيل المبيعات كـ [مبيعات أونلاين].`
      );
    }

    onUpdateOrder(updatedOrder);
    onAddLog(
      "edit_approved",
      `قام الموظف [${currentUser}] بتغيير حالة الطلب [${order.id}] إلى [${newStatus}].`
    );
    alert(`✅ تم تحديث حالة الوردر رقم ${order.id} بنجاح إلى الحالة الجديدة.`);
  };

  // Resolve delay complaint
  const handleResolveDelayMessage = (order: Order) => {
    const updatedOrder: Order = {
      ...order,
      delayContactRequested: false, // resolve claim
    };
    onUpdateOrder(updatedOrder);
    onAddLog(
      "edit_approved",
      `قام الموظف [${currentUser}] بحل وقبول بلاغ تأخير الطلب والرد على المشتري ذي الرقم: [${order.customerPhone}].`
    );
    alert("✅ تم إعلام النظام بحل شكوى التأخير والتواصل مع المشتري.");
  };

  return (
    <div className="space-y-6">
      {/* 1. WEEKLY BESTSELLERS CHART DASHBOARD */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-white text-base">التقرير الذكي الأسبوعي: العناصر الأكثر مبيعاً 📈</h3>
            <p className="text-xs text-neutral-400">إحصاءات المبيعات وسحب الأصناف الكلي للسبعة أيام الماضية لكل قناة توزيع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Branch 1 Bestsellers */}
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-850 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-1">
              <span className="text-xs font-black text-cyan-400">فرع 1 الرئيسي</span>
              <span className="text-[10px] text-neutral-500 font-bold">آخر ٧ أيام</span>
            </div>
            {weeklyBestsellers.branch1.length === 0 ? (
              <p className="text-[11px] text-neutral-600 text-center py-6 font-bold">لا يوجد مبيعات في هذا الفرع هذا الأسبوع</p>
            ) : (
              weeklyBestsellers.branch1.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-[10px] flex items-center justify-center border border-neutral-850 text-white font-mono">{index + 1}</span>
                    <span className="text-neutral-300 truncate font-sans">{item.name}</span>
                  </div>
                  <span className="text-cyan-400 font-mono shrink-0 font-black">+{item.quantity} قطع</span>
                </div>
              ))
            )}
          </div>

          {/* Branch 2 Bestsellers */}
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-850 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-1">
              <span className="text-xs font-black text-amber-500">فرع 2 الفرعي</span>
              <span className="text-[10px] text-neutral-500 font-bold">آخر ٧ أيام</span>
            </div>
            {weeklyBestsellers.branch2.length === 0 ? (
              <p className="text-[11px] text-neutral-600 text-center py-6 font-bold">لا يوجد مبيعات في هذا الفرع هذا الأسبوع</p>
            ) : (
              weeklyBestsellers.branch2.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-[10px] flex items-center justify-center border border-neutral-850 text-white font-mono">{index + 1}</span>
                    <span className="text-neutral-300 truncate font-sans">{item.name}</span>
                  </div>
                  <span className="text-amber-500 font-mono shrink-0 font-black">+{item.quantity} قطع</span>
                </div>
              ))
            )}
          </div>

          {/* Online Bestsellers */}
          <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-850 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-1">
              <span className="text-xs font-black text-emerald-400">المبيعات أونلاين (الماركت بليس)</span>
              <span className="text-[10px] text-neutral-500 font-bold">آخر ٧ أيام</span>
            </div>
            {weeklyBestsellers.online.length === 0 ? (
              <p className="text-[11px] text-neutral-600 text-center py-6 font-bold">لا يوجد مبيعات أونلاين هذا الأسبوع</p>
            ) : (
              weeklyBestsellers.online.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-[10px] flex items-center justify-center border border-neutral-850 text-white font-mono">{index + 1}</span>
                    <span className="text-neutral-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-emerald-400 font-mono shrink-0 font-black">+{item.quantity} قطع</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. ORDER LISTING MANAGER AND CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders list view */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-extrabold text-white text-base">تتبع وإدارة طلبات العملاء 🛍️</h3>
                <p className="text-xs text-neutral-400">أشرطة الحالة وإتمام مبيعات الماركت بليس للعملاء</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2 w-full md:w-auto">
              <select
                className="bg-neutral-950 border border-neutral-805 rounded-xl px-2.5 py-1.5 text-xs font-bold text-neutral-300 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">كل الحالات ({orders.length})</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">مؤكد</option>
                <option value="shipped">تم الشحن / مع التوصيل</option>
                <option value="ready_for_pickup">جاهز للاستلام</option>
                <option value="delivered">مكتمل الاستلام</option>
                <option value="cancelled">ملغي</option>
                <option value="delayed">⚠️ طلبات متأخرة وشكاوى</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="ابحث باسم العميل، رقم الهاتف، أو رقم الفاتورة..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-9 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Orders Table Container */}
          {filteredOrders.length === 0 ? (
            <div className="py-12 bg-neutral-950 rounded-2xl border border-neutral-850 text-center text-neutral-500 font-bold text-xs">
              <ShoppingBag className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
              لا توجد طلبات تطابق معايير الفلترة المحددة.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-black">
                    <th className="py-3 px-3">رقم الطلب</th>
                    <th className="py-3 px-3">المشتري والهاتف</th>
                    <th className="py-3 px-3">التوصيل</th>
                    <th className="py-3 px-3">المبلغ الإجمالي</th>
                    <th className="py-3 px-3 text-center">الحالة</th>
                    <th className="py-3 px-3 text-center">خدمة العملاء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const isSelected = order.id === selectedOrderId;
                    const isComplained = order.delayContactRequested === true;

                    return (
                      <tr 
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`border-b border-neutral-850 hover:bg-neutral-800/30 cursor-pointer transition ${
                          isSelected ? "bg-neutral-850/40 border-r-2 border-cyan-400" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono font-bold text-neutral-200">{order.id}</td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-white">{order.customerName}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{order.customerPhone}</p>
                        </td>
                        <td className="py-3.5 px-3 text-neutral-350">
                          {order.deliveryMethod === "delivery" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <Truck className="w-3.5 h-3.5" /> توصيل شحن
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                              <Store className="w-3.5 h-3.5" /> استلام بالفرع
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-black text-white">{order.totalAmount} ج.م</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            order.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                            order.status === "approved" ? "bg-blue-500/10 text-blue-400" :
                            order.status === "shipped" ? "bg-purple-500/10 text-purple-400" :
                            order.status === "ready_for_pickup" ? "bg-cyan-500/10 text-cyan-400" :
                            order.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-rose-500/10 text-rose-400"
                          }`}>
                            {order.status === "pending" ? "قيد المراجعة" :
                             order.status === "approved" ? "تم قبول الطلب" :
                             order.status === "shipped" ? "جاري الشحن" :
                             order.status === "ready_for_pickup" ? "جاهز للاستلام" :
                             order.status === "delivered" ? "تم الاستلام" : "ملغي"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {isComplained ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full animate-pulse border border-rose-900/30">
                              <AlertTriangle className="w-3 h-3" /> بلاغ تأخير!
                            </span>
                          ) : (
                            <span className="text-neutral-600 text-[10px] font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order details control workspace */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="border-b border-neutral-850 pb-3 flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="font-extrabold text-white text-base">منطقة التحكم بالطلب المختار</h3>
          </div>

          {!selectedOrder ? (
            <div className="py-16 text-center text-neutral-500 font-bold space-y-2">
              <div className="text-3xl">👈</div>
              <p className="text-xs">يرجى نقر أحد الطلبات بالجدول لاستعراض تفاصيله وتعديل حالة التسليم.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-semibold">
              {/* Order Info Summary */}
              <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-850 space-y-2.5">
                <div className="flex justify-between items-center bg-neutral-900/40 p-2 rounded-xl">
                  <span className="text-neutral-400">رقم الفاتورة:</span>
                  <span className="font-mono text-white font-extrabold">{selectedOrder.id}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">اسم المشتري:</span>
                  <p className="text-white text-sm font-extrabold">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">رقم هاتف المشتري:</span>
                  <p className="text-white font-mono text-sm leading-none">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">تاريخ تقديم الأوردر:</span>
                  <p className="text-neutral-300 font-mono">
                    {new Date(selectedOrder.date).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">طريقة الشحن / التوصيل:</span>
                  {selectedOrder.deliveryMethod === "delivery" ? (
                    <p className="text-emerald-400 bg-emerald-950/20 px-2.5 py-1.5 rounded-xl border border-emerald-900/30 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      توصيل للعنوان: {selectedOrder.deliveryAddress}
                    </p>
                  ) : (
                    <p className="text-amber-500 bg-amber-950/20 px-2.5 py-1.5 rounded-xl border border-amber-900/30 flex items-center gap-1">
                      <Store className="w-4 h-4" />
                      استلام من الفرع: {selectedOrder.pickupBranch === "branch1" ? "فرع 1" : "فرع 2"}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">طريقة الدفع:</span>
                  <p className="text-neutral-200">
                    {selectedOrder.paymentMethod === "cod" ? "💵 كاش عند الاستلام" : "💳 دفع إلكتروني بالفيزا"}
                  </p>
                </div>
              </div>

              {/* Items Summary list */}
              <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-850 space-y-2">
                <span className="text-neutral-400 block mb-1">أصناف الفاتورة قطاعي:</span>
                <div className="space-y-1.5 border-b border-neutral-800 pb-2 mb-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-2 text-neutral-300">
                      <span>{it.productName}</span>
                      <span className="font-mono text-white shrink-0 font-black">
                        x{it.quantity} = {it.total} ج.م
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-white font-extrabold text-sm font-sans">
                  <span>المبلغ الكلي المستلم:</span>
                  <span className="text-cyan-400 font-mono text-base">{selectedOrder.totalAmount} ج.م</span>
                </div>
              </div>

              {/* Handle Outstanding complaints */}
              {selectedOrder.delayContactRequested && (
                <div className="bg-rose-950/30 border border-rose-900/40 rounded-2xl p-4 space-y-2 text-rose-300">
                  <div className="flex items-center gap-1 text-red-400 font-black">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    <span>⚠️ شكوى تأخير نشطة وبلاغ عاجل!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-350">
                    شكوى المشتري: "{selectedOrder.delayContactMessage}"
                  </p>
                  <button
                    onClick={() => handleResolveDelayMessage(selectedOrder)}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    تم الاتصال بالعميل وحل الشكوى بنجاح ✅
                  </button>
                </div>
              )}

              {/* Status Update Pipeline */}
              {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" ? (
                <div className="space-y-2">
                  <span className="text-neutral-400 block mb-1">تعديل حالة السير ومتابعة الاستلام:</span>

                  {/* Deduct branch settings (only relevant if shipping/delivery is chosen) */}
                  {selectedOrder.deliveryMethod === "delivery" && selectedOrder.status === "shipped" && (
                    <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-2xl mb-2 space-y-1">
                      <label className="text-[11px] text-zinc-400 block mb-1 font-bold">خصم المخزون من أي فرع عند التسليم؟</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDeductBranchChoice("branch1")}
                          className={`flex-1 py-1 px-2 rounded-lg border text-[10px] font-bold transition ${
                            deductBranchChoice === "branch1"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : "bg-neutral-900 text-neutral-500 border-neutral-850"
                          }`}
                        >
                          فرع 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeductBranchChoice("branch2")}
                          className={`flex-1 py-1 px-2 rounded-lg border text-[10px] font-bold transition ${
                            deductBranchChoice === "branch2"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : "bg-neutral-900 text-neutral-500 border-neutral-850"
                          }`}
                        >
                          فرع 2
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pipelines state machine list buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder, "approved")}
                        className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> قبول وتأكيد الطلب المختار
                      </button>
                    )}

                    {selectedOrder.status === "approved" && (
                      <>
                        {selectedOrder.deliveryMethod === "delivery" ? (
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder, "shipped")}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Truck className="w-4 h-4" /> بدء الشحن الفوري
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(selectedOrder, "ready_for_pickup")}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Store className="w-4 h-4" /> جاهز للتسليم في الفرع
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder, "cancelled")}
                          className="bg-rose-950/40 text-rose-400 border border-rose-900/50 py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          إلغاء الطلب
                        </button>
                      </>
                    )}

                    {(selectedOrder.status === "shipped" || selectedOrder.status === "ready_for_pickup") && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder, "delivered")}
                          className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          ✔️ تم التسليم وسحب المخزون قطاعي
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder, "cancelled")}
                          className="bg-rose-955 text-rose-450 border border-rose-900/60 py-2 rounded-xl transition cursor-pointer"
                        >
                          إلغاء الطلب (مرتجع)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-850 text-center space-y-2">
                  <span className="text-emerald-400 text-xl font-bold">✔️</span>
                  <p className="text-[11px] font-extrabold text-neutral-350">
                    هذا الطلب في حالة نهائية مغلقة [{selectedOrder.status === "delivered" ? "مكتمل ومسلّم" : "ملغي"}].
                  </p>
                  <p className="text-[10px] text-neutral-500 font-normal">لا يسمح بإجراء المزيد من التغييرات اللوجستية عليه.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
