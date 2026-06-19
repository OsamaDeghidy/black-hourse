import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  MapPin, 
  CreditCard, 
  Phone, 
  User, 
  Sparkles, 
  Send, 
  Clock, 
  CheckCircle, 
  Truck, 
  Store, 
  CornerDownLeft,
  X,
  Plus,
  Minus,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Eye
} from "lucide-react";
import { Product, Order, OrderItem } from "../types";

interface CustomerMarketplaceProps {
  items: Product[];
  orders: Order[];
  onPlaceOrder: (order: Order) => void;
  onAddLog: (actionType: any, details: string) => void;
}

export default function CustomerMarketplace({ 
  items, 
  orders, 
  onPlaceOrder,
  onAddLog 
}: CustomerMarketplaceProps) {
  
  // Navigation tabs for Customer Space
  const [activeSubTab, setActiveSubTab] = useState<"shop" | "track" | "chat">("shop");
  
  // Shopping logic states
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Check-out dialog trigger
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Checkout form info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupBranch, setPickupBranch] = useState<"branch1" | "branch2">("branch1");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  
  // Simulated Card Info
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  
  // Order tracking phone input & current selected order state
  const [trackingPhone, setTrackingPhone] = useState("");
  const [trackedOrders, setTrackedOrders] = useState<Order[]>([]);
  const [hasTracked, setHasTracked] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [delayMessage, setDelayMessage] = useState("");
  const [isSubmittingDelayClaim, setIsSubmittingDelayClaim] = useState(false);

  // Smart assistant states
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { 
      sender: "bot", 
      text: "أهلاً بك في متجر blackhours الذكي! 🤖 أنا المساعد التفاعلي للمبيعات وتوافق البضاعة. هل لديك استفسار حول جودة شاشة معينة، أو توافق بطارية، أو تريد معرفة الأسعار المتاحة؟ تفضّل بطرح سؤالك وسأجيبك فوراً بسعر القطاعي المعتمد." 
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Unique categories of current items
  const categories = Array.from(new Set(items.map((it) => it.category).filter(Boolean)));

  // Sync tracked orders when state changes or phone lookup occurs
  useEffect(() => {
    if (trackingPhone.trim()) {
      const matched = orders.filter(
        (o) => o.customerPhone.replace(/\s+/g, "") === trackingPhone.trim().replace(/\s+/g, "")
      );
      setTrackedOrders(matched);
    }
  }, [orders, trackingPhone]);

  // Shopping cart handler helpers
  const handleAddToCart = (product: Product) => {
    const isAvailable = (product.stockBranch1 + product.stockBranch2) > 0;
    if (!isAvailable) {
      alert("⚠️ نأسف، هذا الصنف غير متوفر حالياً في أي فروعنا.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const totalStock = product.stockBranch1 + product.stockBranch2;
        if (existing.quantity >= totalStock) {
          alert(`⚠️ لا يمكن تجاوز رصيد المخزن المتاح حالياً (${totalStock} قطع).`);
          return prev;
        }
        return prev.map((i) => 
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          const totalStock = item.product.stockBranch1 + item.product.stockBranch2;
          if (newQty <= 0) return null;
          if (newQty > totalStock) {
            alert(`⚠️ تم الوصول للحد الأقصى للمخزون المتوفر (${totalStock} قطع).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const cartTotalAmount = cart.reduce(
    (sum, item) => sum + item.product.priceRetail * item.quantity, 
    0
  );

  // Submit checkout order
  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("يرجى ملء جميع الحقول المطلوبة (الاسم ورقم الهاتف)");
      return;
    }

    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      alert("يرجى تحديد عنوان التوصيل بالتفصيل.");
      return;
    }

    // Process electronic payment simulation
    if (paymentMethod === "online") {
      if (!cardNumber || cardNumber.length < 16) {
        alert("يرجى إدخال رقم بطاقة مكوّن من 16 رقم بشكل صحيح.");
        return;
      }
      setIsPaying(true);
      // Simulate delay for secure electronic payment Gateway 
      setTimeout(() => {
        completeOrderPlacement();
      }, 1500);
    } else {
      completeOrderPlacement();
    }
  };

  const completeOrderPlacement = () => {
    const orderItems: OrderItem[] = cart.map((ci) => ({
      productId: ci.product.id,
      productName: ci.product.name,
      quantity: ci.quantity,
      price: ci.product.priceRetail,
      total: ci.product.priceRetail * ci.quantity,
    }));

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress.trim() : undefined,
      pickupBranch: deliveryMethod === "pickup" ? pickupBranch : undefined,
      paymentMethod,
      items: orderItems,
      totalAmount: cartTotalAmount,
      status: "pending",
      date: new Date().toISOString(),
    };

    onPlaceOrder(newOrder);

    // Write audit log
    const branchText = deliveryMethod === "pickup" 
      ? `استلام من ${pickupBranch === "branch1" ? "فرع 1" : "فرع 2"}`
      : `شحن للعنوان: ${deliveryAddress}`;
    
    onAddLog(
      "sale", 
      `طلب أونلاين جديد من العميل [${newOrder.customerName}] بقيمة ${newOrder.totalAmount} ج.م. طريقة الاستلام: [${branchText}]. طريقة الدفع: [${paymentMethod === "cod" ? "عند الاستلام" : "إلكتروني"}].`
    );

    alert(`🎉 تم إرسال طلبك بنجاح وسجل تحت رقم هاتف متابعة: ${customerPhone}. سيتم مراجعة طلبك فوراً من مشرفي الفروع.`);
    
    // Auto-login to tracking area
    setTrackingPhone(customerPhone.trim());
    setHasTracked(true);
    
    // Clear state
    setCart([]);
    setIsCheckoutOpen(false);
    setIsPaying(false);
    setCustomerName("");
    setDeliveryAddress("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    
    // Switch to Tracking Tab
    setActiveSubTab("track");
  };

  // Submit delay notification
  const handleDelayClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !delayMessage.trim()) return;

    setIsSubmittingDelayClaim(true);
    
    // Simple mock network delay
    setTimeout(() => {
      // Find order in trackedOrders and map
      const updatedOrder: Order = {
        ...selectedOrder,
        delayContactRequested: true,
        delayContactMessage: delayMessage.trim(),
      };
      
      onPlaceOrder(updatedOrder); // reuse place order callback to sync order updates
      onAddLog(
        "edit_request",
        `⚠️ أبلغ العميل [${selectedOrder.customerName} - ${selectedOrder.customerPhone}] عن تأخر تسليم طلبه رقم [${selectedOrder.id}]: "${delayMessage.trim()}"`
      );

      alert("🔔 تم رفع شكوى تأخر الطلب للإدارة بنجاح. سيقوم مشرف الفرع أو خدمة الدعم بالتواصل معك مباشرة على رقم الهاتف فوراً.");
      setDelayMessage("");
      setSelectedOrder(null);
      setIsSubmittingDelayClaim(false);
    }, 850);
  };

  // Chat with AI Assistant (customer_advisor view)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Formulate compact inventory list ONLY containing Name, Category, compatibleMobiles and retail prices (never wholesale or cost to keep secure)
      const sanitizedCatalog = items.map((p) => ({
        name: p.name,
        category: p.category,
        priceRetail: p.priceRetail,
        compatibleMobiles: p.compatibleMobiles,
        available: (p.stockBranch1 + p.stockBranch2) > 0,
        stockBranch1Status: p.stockBranch1 > 0 ? "متوفر في فرع 1" : "غير متوفر في فرع 1",
        stockBranch2Status: p.stockBranch2 > 0 ? "متوفر في فرع 2" : "غير متوفر في فرع 2"
      }));

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          scenarioType: "customer_advisor",
          currentInventory: sanitizedCatalog, // This makes it secure! No wholesale or cost is embedded here
          salesHistory: []
        })
      });

      if (!res.ok) throw new Error("تعذر الرد من الخادم");
      const data = await res.json();
      setChatMessages((prev) => [...prev, { sender: "bot", text: data.reply || data.text }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev, 
        { sender: "bot", text: "عذراً، واجهت اتصال غير مستقر اللحظة. يرجى العلم أن معظم منتجاتنا لشاشات وبطاريات ايفون وسامسونج متوفرة وسعرها القطاعي محدد في المعرض. أعد المحاولة من فضلك." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTrackPhoneLookup = () => {
    if (!trackingPhone.trim()) {
      alert("الرجاء إدخال رقم الهاتف أولاً");
      return;
    }
    const matched = orders.filter(
      (o) => o.customerPhone.replace(/\s+/g, "") === trackingPhone.trim().replace(/\s+/g, "")
    );
    setTrackedOrders(matched);
    setHasTracked(true);
  };

  // Format date helper
  const formatDateString = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString("ar-EG")} ${d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoString;
    }
  };

  // Render Status Badge
  const getStatusLabelAndColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return { label: "قيد المراجعة", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock };
      case "approved":
        return { label: "تم تأكيد طلبك", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle };
      case "shipped":
        return { label: "جاري الشحن/التوصيل", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Truck };
      case "ready_for_pickup":
        return { label: "جاهز للاستلام بالفرع", color: "bg-cyan-500/20 text-cyan-400 border-cyan-400/30", icon: Store };
      case "delivered":
        return { label: "تم استلام الطلب", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle };
      case "cancelled":
        return { label: "ملغي", color: "bg-rose-500/20 text-rose-400 border-rose-500/30", icon: X };
    }
  };

  // Filter products catalog
  const filteredProducts = items.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.compatibleMobiles && p.compatibleMobiles.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Sub Tabs for client view */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-1.5 flex flex-wrap gap-1 max-w-lg mx-auto shadow-xl">
        <button
          onClick={() => setActiveSubTab("shop")}
          className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === "shop" 
              ? "bg-white text-black shadow-lg" 
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          معرض المنتجات والسلة
        </button>
        <button
          onClick={() => setActiveSubTab("track")}
          className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === "track" 
              ? "bg-white text-black shadow-lg" 
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          متابعة حالة الطلبات
        </button>
        <button
          onClick={() => {
            setActiveSubTab("chat");
          }}
          className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 relative ${
            activeSubTab === "chat" 
              ? "bg-white text-black shadow-lg" 
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          الـمساعد الذكي 100%
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === "shop" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Catalog View (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Category Filter Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-neutral-500 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ابحث بتحديد قطع الغيار أو التوافق (مثال: iPhone 13, شاشات...)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-10 py-3 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category horizontal scrolls */}
              <div className="flex gap-1.5 overflow-x-auto pb-1" dir="rtl">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                    selectedCategory === "all" 
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/35"
                      : "bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-neutral-200"
                  }`}
                >
                  الكل ({items.length})
                </button>
                {categories.map((cat) => {
                  const count = items.filter((i) => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap ${
                        selectedCategory === cat 
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/35"
                          : "bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-neutral-200"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-neutral-400">نأسف، لم نجد قطع غيار مطابقة لبحثك وموديلك المختار حالياً.</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const totalStock = product.stockBranch1 + product.stockBranch2;
                  const isAvailable = totalStock > 0;
                  
                  return (
                    <div 
                      key={product.id}
                      className="bg-neutral-900 border border-neutral-850 rounded-3xl p-4.5 flex flex-col justify-between hover:border-neutral-750 transition"
                    >
                      <div className="space-y-3">
                        {/* Image Frame */}
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-850 flex items-center justify-center relative group">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <span className="text-3xl">📦</span>
                              <p className="text-[10px] text-neutral-600 mt-1 uppercase tracking-widest font-bold">blackhours group</p>
                            </div>
                          )}
                          <span className="absolute top-2.5 right-2 a-tag text-[9px] bg-black/75 px-2 py-1 rounded text-cyan-400 font-bold border border-cyan-400/20">
                            {product.category}
                          </span>
                        </div>

                        {/* Text and price metadata */}
                        <div>
                          <h4 className="font-bold text-white text-xs md:text-sm leading-snug line-clamp-2 min-h-[36px]">
                            {product.name}
                          </h4>
                          
                          {/* Compatible devices */}
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {product.compatibleMobiles && product.compatibleMobiles.length > 0 ? (
                              product.compatibleMobiles.slice(0, 3).map((compat, i) => (
                                <span key={i} className="text-[9px] bg-neutral-950 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded">
                                  📱 {compat}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] bg-neutral-950 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded">
                                📱 متوافق مع كافة الأجهزة
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Buy action & stock status */}
                      <div className="mt-4 pt-3.5 border-t border-neutral-850 flex items-center justify-between">
                        <div>
                          <p className="text-neutral-500 text-[10px] uppercase font-bold leading-none">سعر المستهلك قطعة</p>
                          <p className="text-lg font-black text-white font-mono mt-0.5">
                            {product.priceRetail} <span className="text-xs text-neutral-400 font-sans">ج.م</span>
                          </p>
                        </div>

                        {isAvailable ? (
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="bg-white hover:bg-neutral-200 text-black px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                            إضافة للسلة
                          </button>
                        ) : (
                          <span className="bg-rose-950/30 border border-rose-900/40 text-rose-400 text-[10px] px-2.5 py-1.5 rounded-xl font-bold">
                            غير متوفر مؤقتاً
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Checkout / Cart Side Panel */}
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">سلة التسوق الخاصة بك</h3>
                </div>
                <span className="bg-neutral-800 text-white font-black text-xs px-2.5 py-1 rounded-full font-mono">
                  {cart.length} أصناف
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 font-bold space-y-2">
                  <div className="text-3xl">🛒</div>
                  <p className="text-xs">السلة فارغة حالياً.</p>
                  <p className="text-[10px] text-neutral-600 font-normal">تصفح المعارض أعلاه وأضف قطع للتوافق لمتابعة الشراء والتوصيل.</p>
                </div>
              ) : (
                <>
                  {/* Cart list scroll area */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div 
                        key={item.product.id}
                        className="bg-neutral-950 rounded-2xl p-3 border border-neutral-850 flex gap-2 justify-between"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-white truncate">{item.product.name}</h5>
                          <p className="text-[10px] text-neutral-500 font-mono">القطعة: {item.product.priceRetail} ج.م</p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] text-neutral-400">الكمية:</span>
                            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                              <button
                                onClick={() => handleUpdateCartQty(item.product.id, -1)}
                                className="w-4 h-4 rounded bg-neutral-800 text-white text-[10px] flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-white text-xs">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateCartQty(item.product.id, 1)}
                                className="w-4 h-4 rounded bg-neutral-800 text-white text-[10px] flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end shrink-0">
                          <button
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-neutral-600 hover:text-rose-400 p-0.5 transition"
                            title="حذف من السلة"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-extrabold text-white font-mono">
                            {item.product.priceRetail * item.quantity} ج.م
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary receipt info */}
                  <div className="bg-neutral-950 rounded-2xl border border-neutral-850 p-4 space-y-2 font-bold text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>إجمالي القطع:</span>
                      <span className="font-mono text-white">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)} قطع
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>تكلفة الشحن والتجهيز:</span>
                      <span className="text-emerald-400">مجاناً بمناسبة الإطلاق 🎁</span>
                    </div>
                    <div className="border-t border-neutral-800 pt-2 flex justify-between text-white text-sm">
                      <span>المبلغ الإجمالي المستحق:</span>
                      <span className="font-mono text-cyan-400 text-lg">
                        {cartTotalAmount.toLocaleString("ar-EG")} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Open Checkout Trigger */}
                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    المتابعة وتعبئة بيانات الشحن والدفع
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRACKING ORDER SECTION */}
      {activeSubTab === "track" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl text-center">
            <h3 className="font-bold text-lg text-white">تتبع حالة طلباتك برقم الهاتف 📦</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              أدخل رقم الهاتف الذي استخدمته عند تسجيل الطلب لاستعراض الشحنات الحالية والمباعة وتتبع حالتها فوراً.
            </p>

            <div className="flex gap-2 max-w-md mx-auto">
              <button
                onClick={handleTrackPhoneLookup}
                className="bg-white hover:bg-neutral-200 text-black px-4 py-2.5 rounded-xl text-xs font-black transition shrink-5 cursor-pointer"
              >
                استعلام وتثبيت
              </button>
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-neutral-500 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="اكتب رقم الهاتف الخاص بك هنا..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-9 py-2 text-xs font-mono text-center tracking-widest text-neutral-200"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTrackPhoneLookup();
                  }}
                />
              </div>
            </div>
          </div>

          {hasTracked && (
            <div className="space-y-4">
              <h4 className="font-bold text-neutral-400 text-xs text-right mr-1">الطلبات المسجلة ({trackedOrders.length})</h4>
              
              {trackedOrders.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 font-bold space-y-2">
                  <div className="text-3xl">📭</div>
                  <p className="text-xs">لا توجد طلبات مسجلة برقم الهاتف المتوفر.</p>
                  <p className="text-[10px] text-neutral-600 font-normal">تأكد من كتابة الرقم بشكل سليم أو إتمام طلب في المعرض أولاً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Orders loop */}
                  {trackedOrders.map((order) => {
                    const matchedStatus = getStatusLabelAndColor(order.status);
                    const StatusIcon = matchedStatus.icon;
                    const isPassedMaxTime = order.status === "pending" || order.status === "approved";

                    return (
                      <div 
                        key={order.id}
                        className="bg-neutral-900 border border-neutral-850 rounded-3xl p-5 hover:border-neutral-750 transition flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Order Header */}
                          <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                            <div>
                              <span className="text-[9px] text-neutral-500 font-bold uppercase block">رقم طلب الشحنة</span>
                              <span className="font-mono text-xs font-extrabold text-white">{order.id}</span>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1 shrink-0 ${matchedStatus.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {matchedStatus.label}
                            </span>
                          </div>

                          {/* Items and receipt count */}
                          <div className="bg-neutral-950 rounded-2xl p-3 border border-neutral-850 flex flex-col gap-1.5 font-bold text-xs text-neutral-300">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between gap-2 leading-tight">
                                <span className="line-clamp-1">{item.productName}</span>
                                <span className="font-mono text-zinc-100 shrink-0">x{item.quantity}</span>
                              </div>
                            ))}
                            <div className="border-t border-neutral-800 pt-1.5 flex justify-between text-white text-xs mt-1">
                              <span>المبلغ المدفوع/المطلوب:</span>
                              <span className="font-mono text-cyan-400">{order.totalAmount} ج.م</span>
                            </div>
                          </div>

                          {/* Logistics Info */}
                          <div className="text-xs space-y-1 text-neutral-400">
                            <p className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-neutral-500" />
                              <span>الاسم: <strong className="text-neutral-200">{order.customerName}</strong></span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              {order.deliveryMethod === "delivery" ? (
                                <>
                                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                                  <span className="truncate">شحن للعنوان: <strong className="text-neutral-200">{order.deliveryAddress}</strong></span>
                                </>
                              ) : (
                                <>
                                  <Store className="w-3.5 h-3.5 text-neutral-500" />
                                  <span>استلام بالفرع: <strong className="text-neutral-200">{order.pickupBranch === "branch1" ? "فرع 1" : "فرع 2"}</strong></span>
                                </>
                              )}
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              تاريخ تقديم الطلب: {formatDateString(order.date)}
                            </p>
                          </div>
                        </div>

                        {/* Interactive contact delay block if pending or approved */}
                        <div className="mt-4 pt-3 border-t border-neutral-850">
                          {order.delayContactRequested ? (
                            <div className="bg-rose-950/20 border border-rose-900/35 rounded-2xl p-2.5 text-center">
                              <p className="text-[10px] text-rose-300 font-bold flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                تم إرسال إشعار التأخير للإدارة ومتابعة طلبك جارية!
                              </p>
                              {order.delayContactMessage && (
                                <p className="text-[9px] text-neutral-500 mt-1 truncate">رسالتك: "{order.delayContactMessage}"</p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="w-full bg-neutral-950 border border-neutral-800 hover:border-rose-900/40 text-neutral-400 hover:text-rose-400 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              الطلب متأخر؟ إرسال إشعار متابعة فوري للفرع ⚡
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* INTELLIGENT AI STORE ASSISTANT CHAT TAB */}
      {activeSubTab === "chat" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col h-[520px]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-3 mb-4 shrink-0 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="w-5 h-5 text-neutral-950" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">مستشارك الفني الذكي 🤖</h3>
                  <p className="text-[10px] text-neutral-400">يجيبك فوراً عن التوافق والتكاليف الاستهلاكية لقطع الغيار</p>
                </div>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                نشط بأحدث كتالوج 📱
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800" dir="ltr">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-md ${
                      msg.sender === "user" 
                        ? "bg-emerald-600 text-white rounded-br-none text-right" 
                        : "bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-bl-none text-right"
                    }`}
                    dir="rtl"
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-950 border border-neutral-850 text-neutral-400 rounded-2xl rounded-bl-none px-4 py-2 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>جاري التفكير وتأكيد التوافق...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts helper buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2 overflow-x-auto shrink-0 justify-end" dir="rtl">
              <button 
                onClick={() => setChatInput("هل يوجد شاشه متوافقه مع ايفون 13 برو ماكس؟")}
                className="text-[10px] bg-neutral-950 hover:bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-850"
              >
                🔍 متوافق مع ايفون 13؟
              </button>
              <button 
                onClick={() => setChatInput("ما هي الفروع المتوفر بها بطارية ايفون 11 برو ماكس وسعرها؟")}
                className="text-[10px] bg-neutral-950 hover:bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-850"
              >
                🔋 فروع بطارية 11 برو؟
              </button>
              <button 
                onClick={() => setChatInput("ما هي أسعار الشاشات المتاحة لديكم قطاعي؟")}
                className="text-[10px] bg-neutral-950 hover:bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-850"
              >
                💸 أسعار الشاشات قطاعي؟
              </button>
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 shrink-0">
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-white hover:bg-neutral-200 text-black p-3.5 rounded-2xl transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 transform rotate-180 text-black" />
              </button>
              <input
                type="text"
                placeholder="اكتب استشارتك للمساعد الذكي هنا بخصوص القطع والبطاريات..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT POPUP DIALOG */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-neutral-950 border-b border-neutral-850 px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">تقديم وتأكيد الطلب 🧾</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-850"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePlaceOrderSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-[11px] text-zinc-400">يرجى ملء بيانات العميل وعنوان شحن البضاعة لتنفيذ وتأكيد الطلب الفوري أونلاين.</p>
              
              {/* Customer Name */}
              <div className="space-y-1">
                <label className="block text-neutral-400 text-xs font-bold">اسم العميل الثلاثي بالكامل:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-9 py-2.5 text-xs text-neutral-200 outline-none"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div className="space-y-1">
                <label className="block text-neutral-400 text-xs font-bold">رقم الهاتف (مهم لاستئناف ومتابعة طلبك لاحقاً):</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute right-3 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 01012345678"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-9 py-2.5 text-xs font-mono text-neutral-200 outline-none"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery method */}
              <div className="space-y-1.5">
                <label className="block text-neutral-400 text-xs font-bold">طريقة الاستلام المفضلة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("delivery")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      deliveryMethod === "delivery"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/35"
                        : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    شحن وتوصيل للعنوان
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      deliveryMethod === "pickup"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/35"
                        : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    استلام بنفسي من الفرع
                  </button>
                </div>
              </div>

              {/* Dynamic delivery fields */}
              {deliveryMethod === "delivery" ? (
                <div className="space-y-1">
                  <label className="block text-neutral-400 text-xs font-bold">العنوان التفصيلي للشحن والتسليم:</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-500 absolute right-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      placeholder="شارع التسعين، التجمع الخامس، بجوار بنك مصر، القاهرة"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-9 py-2 text-xs text-neutral-200 outline-none resize-none"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-neutral-400 text-xs font-bold">تحديد فرع الاستلام:</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-805 text-xs text-neutral-200 py-2.5 rounded-xl outline-none focus:border-cyan-500 pr-3 font-bold"
                    value={pickupBranch}
                    onChange={(e) => setPickupBranch(e.target.value as any)}
                  >
                    <option value="branch1">فرع 1 الرئيسي (شارع شبرا الرئيسي)</option>
                    <option value="branch2">فرع 2 الفرعي (شارع جامعة الدول بالدقي)</option>
                  </select>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block text-neutral-400 text-xs font-bold">طريقة الدفع:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      paymentMethod === "cod"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/35"
                        : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    <span>💵</span>
                    دفع كاش عند الاستلام
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      paymentMethod === "online"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/35"
                        : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    دفع إلكتروني (فيزا/ماستر)
                  </button>
                </div>
              </div>

              {/* Secure Online Card form mock */}
              {paymentMethod === "online" && (
                <div className="bg-neutral-955 rounded-2xl border border-neutral-850 p-4 space-y-3 font-mono">
                  <p className="text-[10px] text-cyan-400 text-center font-bold font-sans">💳 نافذة دفع آمنة مشفرة 100%</p>
                  
                  <div className="space-y-1 text-right">
                    <label className="block text-[10px] text-neutral-400 font-sans">رقم البطاقة الائتمانية:</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs tracking-widest text-center text-white"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-neutral-400 font-sans">تاريخ الانتهاء:</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-center text-white"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-neutral-400 font-sans">رمز الـ CVV الحماية:</label>
                      <input
                        type="password"
                        placeholder="***"
                        maxLength={3}
                        className="w-full bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-center text-white"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-850 flex gap-2">
                <button
                  type="submit"
                  disabled={isPaying}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isPaying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الدفع الآمن والمزامنة...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      تأكيد وإصدار الفاتورة قطاعي ({cartTotalAmount} ج.م)
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="bg-neutral-850 hover:bg-neutral-800 text-neutral-300 px-4 py-3 rounded-2xl text-xs transition font-bold"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELAY CLAIM FORM POPUP */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-neutral-950 border-b border-neutral-850 px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">تقديم بلاغ تأخر الطلب ⚡</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-850"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDelayClaimSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-2xl">
                ⚠️ سيصل بلاغك فوراً إلى مشرف الفرع المسؤول عن الفاتورة ومُدير عام المجموعة لتثبيت الأولوية والتعبئة السريعة.
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed text-right">
                تفاصيل الطلب: رقم <strong>{selectedOrder.id}</strong> بقيمة {selectedOrder.totalAmount} ج.م باسم {selectedOrder.customerName}.
              </p>

              <div className="space-y-1">
                <label className="block text-neutral-405 text-xs font-bold text-neutral-305 mr-1">اكتب رسالة الدعم أو الاستفسار لتصل للمشرف:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="مثال: الطلب متأخر لأكثر من ساعتين، أرجو شحن الشاشة بأسرع وقت لالتزامي مع فني أخر بالصيانة..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs text-neutral-200 outline-none resize-none"
                  value={delayMessage}
                  onChange={(e) => setDelayMessage(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-neutral-850 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingDelayClaim}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isSubmittingDelayClaim ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الرفع للبث الفوري...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      إرسال البلاغ والمتابعة الفورية
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-neutral-850 hover:bg-neutral-850 text-neutral-300 px-4 py-3 rounded-2xl text-xs transition font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
