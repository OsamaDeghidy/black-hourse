import React, { useState, useMemo, useEffect, useRef } from "react";
import { Product, Sale } from "../types";
import { 
  ShoppingCart, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  Store, 
  Info, 
  PlusCircle, 
  CheckCircle, 
  Printer, 
  X, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Filter, 
  Smartphone, 
  Layers, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShoppingBag
} from "lucide-react";

interface SalesManagerProps {
  items: Product[];
  sales: Sale[];
  onAddSale: (sale: Sale, updatedItems: Product[]) => void;
  onAddSalesBatch?: (sales: Sale[], updatedItems: Product[]) => void;
  currentUser: "admin" | "user 1" | "user 2";
  onAddLog: (actionType: "sale", details: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  customPrice: number; // Defaults to product.priceRetail
  notes: string;
}

export default function SalesManager({ 
  items, 
  sales, 
  onAddSale,
  onAddSalesBatch,
  currentUser,
  onAddLog 
}: SalesManagerProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<"branch1" | "branch2">(
    currentUser === "user 2" ? "branch2" : "branch1"
  );
  
  // UI states for quick lookup
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [selectedModel, setSelectedModel] = useState<string>("الكل");
  const [cartNotes, setCartNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Thermal receipt modal target (consolidated details)
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const [showProfits, setShowProfits] = useState(false);

  const cartSectionRef = useRef<HTMLDivElement>(null);

  // Sync branch selection with current logged in user
  useEffect(() => {
    if (currentUser === "user 1") {
      setSelectedBranch("branch1");
    } else if (currentUser === "user 2") {
      setSelectedBranch("branch2");
    }
  }, [currentUser]);

  // Extract list of unique categories
  const categories = useMemo(() => {
    const list = new Set<string>();
    items.forEach((it) => {
      if (it.category) list.add(it.category.trim());
    });
    return ["الكل", ...Array.from(list)];
  }, [items]);

  // Extract list of unique compatible device models (highly searchable)
  const devices = useMemo(() => {
    const list = new Set<string>();
    items.forEach((it) => {
      if (it.compatibleMobiles) {
        it.compatibleMobiles.forEach((mob) => {
          if (mob && mob.trim()) list.add(mob.trim());
        });
      }
    });
    return ["الكل", ...Array.from(list).slice(0, 16)]; // Limit to top 16 models for clean display
  }, [items]);

  // Filter products based on search term, category and device compatibilities
  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return items.filter((prod) => {
      // 1. Category check
      if (selectedCategory !== "الكل" && prod.category !== selectedCategory) {
        return false;
      }
      // 2. Compatibility check
      if (selectedModel !== "الكل") {
        const matchesModel = prod.compatibleMobiles?.some(
          (m) => m.toLowerCase().includes(selectedModel.toLowerCase())
        );
        if (!matchesModel) return false;
      }
      // 3. Search text check (Name, compatible devices, or ID)
      if (q) {
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesCompat = prod.compatibleMobiles?.some((m) => m.toLowerCase().includes(q));
        const matchesCat = prod.category?.toLowerCase().includes(q);
        return matchesName || matchesCompat || matchesCat;
      }
      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedModel]);

  // Scroll function to bring the active cart to view on mobile
  const scrollCartToTop = () => {
    if (cartSectionRef.current) {
      cartSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Add / Increment Item in Cart with stock check
  const handleAddToCart = (product: Product) => {
    const activeStock = selectedBranch === "branch1" ? product.stockBranch1 : product.stockBranch2;
    const otherStock = selectedBranch === "branch1" ? product.stockBranch2 : product.stockBranch1;
    const existingIndex = cart.findIndex((c) => c.product.id === product.id);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const targetQty = updatedCart[existingIndex].quantity + 1;
      
      // Stock warning across both branches
      if (targetQty > activeStock + otherStock) {
        alert(`❌ تنبيه: المخزون الإجمالي المتاح بالفرعين معاً لهذا المنتج (${activeStock + otherStock} قطع) أقل من الكمية المطلوبة.`);
        return;
      }

      updatedCart[existingIndex].quantity = targetQty;
      setCart(updatedCart);
    } else {
      if (activeStock + otherStock < 1) {
        alert("❌ عذراً: هذا المنتج غير متوفر حالياً في كلا الفرعين!");
        return;
      }
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          customPrice: product.priceRetail,
          notes: ""
        }
      ]);
    }
  };

  // Decrement Quantity in Cart
  const handleDecrementCart = (productId: string) => {
    const existingIndex = cart.findIndex((c) => c.product.id === productId);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity > 1) {
        updatedCart[existingIndex].quantity -= 1;
        setCart(updatedCart);
      } else {
        // Remove item if quantity goes to 0
        setCart(cart.filter((c) => c.product.id !== productId));
      }
    }
  };

  // Direct edit custom price per line
  const handleUpdatePrice = (productId: string, priceVal: number) => {
    setCart(
      cart.map((c) => {
        if (c.product.id === productId) {
          return { ...c, customPrice: priceVal };
        }
        return c;
      })
    );
  };

  // Direct edit custom item notes
  const handleUpdateItemNotes = (productId: string, noteVal: string) => {
    setCart(
      cart.map((c) => {
        if (c.product.id === productId) {
          return { ...c, notes: noteVal };
        }
        return c;
      })
    );
  };

  // Check if any cart item has a stock anomaly compared to current branch stock
  const getCartItemAnomaly = (item: CartItem) => {
    const branchStock = selectedBranch === "branch1" ? item.product.stockBranch1 : item.product.stockBranch2;
    const otherStock = selectedBranch === "branch1" ? item.product.stockBranch2 : item.product.stockBranch1;
    
    if (item.quantity > branchStock) {
      if (item.quantity <= branchStock + otherStock) {
        return {
          type: "anomaly",
          msg: `⚠️ العجز (${item.quantity - branchStock} ق.) سيسحب تلقائياً من الفرع الآخر لموازنة الجرد.`
        };
      } else {
        return {
          type: "out_of_stock",
          msg: `❌ غير متوفر مخزون كافي بالفرعين معاً! الأقصى المتاح (${branchStock + otherStock})`
        };
      }
    }
    return null;
  };

  // Combined checkout execution (ERP style)
  const handleCartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let updatedItems = [...items];
    const newSales: Sale[] = [];
    const invoiceId = `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const dateStr = new Date().toISOString();

    for (const cartItem of cart) {
      const prod = updatedItems.find((it) => it.id === cartItem.product.id);
      if (!prod) continue;

      const qty = cartItem.quantity;
      const currentStock = selectedBranch === "branch1" ? prod.stockBranch1 : prod.stockBranch2;
      const otherStock = selectedBranch === "branch1" ? prod.stockBranch2 : prod.stockBranch1;

      // Final inventory availability guard
      if (currentStock + otherStock < qty) {
        alert(`❌ فشل تأكيد الفاتورة: صنف [${prod.name}] لا يحتوي على مخزون كافٍ بالفرعين مجتمعين!`);
        return;
      }

      // Check anomaly and deduct stock
      let finalNotes = cartItem.notes.trim();
      const isAnomaly = currentStock < qty;

      if (isAnomaly) {
        const otherBranchLabel = selectedBranch === "branch1" ? "فرع 2" : "فرع 1";
        if (selectedBranch === "branch1") {
          prod.stockBranch2 -= qty; // draw deficit from other branch
          finalNotes += ` [سحب تلقائي من ${otherBranchLabel} لعدم التوفر]`;
        } else {
          prod.stockBranch1 -= qty; // draw deficit from other branch
          finalNotes += ` [سحب تلقائي من ${otherBranchLabel} لعدم التوفر]`;
        }
      } else {
        if (selectedBranch === "branch1") {
          prod.stockBranch1 -= qty;
        } else {
          prod.stockBranch2 -= qty;
        }
      }

      // Profit and Discount Limit checks
      const costPriceVal = prod.priceCost !== undefined ? prod.priceCost : prod.priceWholesale;
      const retailPriceVal = prod.priceRetail;
      const maxDiscountPercentVal = prod.maxDiscountProfitPercent !== undefined ? prod.maxDiscountProfitPercent : 50;
      
      const originalMargin = retailPriceVal - costPriceVal;
      const maximumDiscountAmt = originalMargin > 0 ? (originalMargin * (maxDiscountPercentVal / 100)) : 0;
      const minAllowedPriceVal = retailPriceVal - maximumDiscountAmt;

      // Restrict customized selling price for branch characters
      if (currentUser !== "admin" && cartItem.customPrice < minAllowedPriceVal - 0.01) {
        alert(`❌ تجاوز حد الخصم المسموح! الصنف [${prod.name}] أدنى سعر بيع مسموح لك تحديده هو: ${minAllowedPriceVal.toFixed(1)} ج.م.\n\n- لتوضيح الحسبة:\n  - سعر التكلفة: ${costPriceVal} ج.م\n  - سعر التجزئة الافتراضي: ${retailPriceVal} ج.م\n  - النسبة المسموح خصمها من الربح: ${maxDiscountPercentVal}%\n  - قيمة الخصم الأقصى المسموح: ${maximumDiscountAmt.toFixed(1)} ج.م\n\nيرجى تعديل السعر المدخل (${cartItem.customPrice} ج.م) للالتزام بالسياسة المالية للمحلات بحد أقصى لل خصم من الفائدة.`);
        return;
      }

      // Profit calculation (Retail custom price - primary purchase cost)
      const unitProfit = cartItem.customPrice - costPriceVal;
      const itemTotalProfit = unitProfit * qty;
      const itemTotalPrice = cartItem.customPrice * qty;

      const newSale: Sale = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        productName: prod.name,
        branch: selectedBranch,
        quantity: qty,
        price: cartItem.customPrice,
        total: itemTotalPrice,
        profit: itemTotalProfit,
        date: dateStr,
        notes: `[فاتورة مجمعة #${invoiceId}]` + (finalNotes ? ` - ${finalNotes}` : ""),
        soldBy: currentUser
      };

      newSales.push(newSale);
    }

    // Fire batch or single fallback
    if (onAddSalesBatch) {
      onAddSalesBatch(newSales, updatedItems);
    } else {
      newSales.forEach((s) => onAddSale(s, updatedItems));
    }

    // Register a visual ledger log
    const currentBranchNameStr = selectedBranch === "branch1" ? "فرع 1" : "فرع 2";
    onAddLog(
      "sale",
      `سجل الموظف [${currentUser}] فاتورة بيع مجمعة رقماً (#${invoiceId}) من ${currentBranchNameStr} تحتوي على (${cart.reduce((acc, c) => acc + c.quantity, 0)}) قطع غيار بقيمة إجمالية ${newSales.reduce((acc, s) => acc + s.total, 0)} ج.م.`
    );

    // Create printable receipt bundle
    const consolidatedReceipt = {
      id: invoiceId,
      branch: selectedBranch,
      date: dateStr,
      notes: cartNotes || "بيعة مجمعة",
      itemsList: cart.map((c) => ({
        name: c.product.name,
        qty: c.quantity,
        price: c.customPrice,
        total: c.customPrice * c.quantity
      })),
      total: newSales.reduce((acc, s) => acc + s.total, 0),
      soldBy: currentUser
    };

    // Reset workflow
    setCart([]);
    setCartNotes("");
    setSuccessMsg(`✅ تم تسجيل الفاتورة بنجاح [#${invoiceId}] ومزامنة مخازن الفروع فورا!`);
    
    // Automatically trigger thermal printable view immediately for clerk speed!
    setViewingReceipt(consolidatedReceipt);

    setTimeout(() => {
      setSuccessMsg("");
    }, 6000);
  };

  // Re-consolidate combined items for historical print click
  const getConsolidatedReceipt = (sale: Sale): any => {
    const match = sale.notes.match(/\[فاتورة مجمعة #(INV-[A-Z0-9]+)\]/);
    if (match) {
      const invoiceId = match[1];
      const associatedSales = sales.filter((s) => s.notes.includes(invoiceId));
      if (associatedSales.length > 0) {
        const cleanNotes = sale.notes.split(" - ").slice(1).join(" - ") || "فاتورة مجمعة";
        return {
          id: invoiceId,
          branch: sale.branch,
          date: sale.date,
          notes: cleanNotes,
          itemsList: associatedSales.map((as) => ({
            name: as.productName,
            qty: as.quantity,
            price: as.price,
            total: as.total
          })),
          total: associatedSales.reduce((acc, as) => acc + as.total, 0),
          soldBy: sale.soldBy || "غير معروف"
        };
      }
    }
    
    // Fallback normal single receipt
    return {
      id: sale.id,
      branch: sale.branch,
      date: sale.date,
      notes: sale.notes,
      itemsList: [{
        name: sale.productName,
        qty: sale.quantity,
        price: sale.price,
        total: sale.total
      }],
      total: sale.total,
      soldBy: sale.soldBy || "غير معروف"
    };
  };

  // Quick total metrics
  const cartTotalAmount = cart.reduce((acc, c) => acc + (c.customPrice * c.quantity), 0);
  const cartTotalWholesaleValue = cart.reduce((acc, c) => acc + (c.product.priceWholesale * c.quantity), 0);
  const cartTotalProfit = cartTotalAmount - cartTotalWholesaleValue;
  const isCartEmpty = cart.length === 0;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Dynamic welcome header with selected branch indicator */}
      <div className="bg-gradient-to-l from-zinc-900 to-zinc-950 border border-zinc-850 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/10 border border-emerald-500/25 p-2.5 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-sm sm:text-base">بوابة المبيعات المباشرة السريعة (تلفون + كمبيوتر)</h3>
            <p className="text-[10px] text-zinc-400 mt-1">تحديد فوري للبضائع، دعم سلة المبيعات المتعددة، ومزامنة جرد الفروع.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-bold">الفرع البائع النشط:</span>
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
            selectedBranch === "branch1" 
              ? "bg-purple-950/40 text-purple-300 border-purple-900/35" 
              : "bg-blue-950/40 text-blue-300 border-blue-900/35"
          }`}>
            <Store className="w-3.5 h-3.5" />
            {selectedBranch === "branch1" ? "فرع 1" : "فرع 2"}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN: Fast Product Select Area & Interactive Filtering */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
            
            {/* Search Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-zinc-200 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                البحث والاختيار السريع للأصناف (بدون فجوات)
              </span>
              <span className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-850 px-2.5 py-1 rounded-full font-mono">
                عثرنا على {filteredProducts.length} صنف مطبق
              </span>
            </div>

            {/* Powerful Touch text search with clear action */}
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="w-4 h-4 text-zinc-500" />
              </span>
              <input
                type="text"
                placeholder="ابحث بكتابة اسم صمولة، صنف شاشة، كود، أو هاتف متوافق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl pr-9 pl-10 py-3 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 placeholder-zinc-500 font-sans tracking-wide"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 hover:text-white text-zinc-400 cursor-pointer min-h-[44px] px-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Touch Pills for Categories */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-black block tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                تصفية حسب نوع الصنف:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap shrink-0 border min-h-[38px] ${
                      selectedCategory === cat
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50"
                        : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Touch Pills for Device Compatibility */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-black block tracking-wider flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-cyan-400" />
                تصفية حسب هاتف المستخدم (موافق عليه):
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {devices.map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => setSelectedModel(dev)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap shrink-0 border min-h-[38px] ${
                      selectedModel === dev
                        ? "bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/50"
                        : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    {dev}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters indicator */}
            {(selectedCategory !== "الكل" || selectedModel !== "الكل" || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("الكل");
                  setSelectedModel("الكل");
                  setSearchTerm("");
                }}
                className="text-[10px] text-rose-400 font-bold hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                تحصيل تصفير كافة الفلاتر والتبديلات وعرض الكل
              </button>
            )}

            {/* Smart Product Grid - Touch friendly & Large targets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-zinc-950 border border-zinc-850 rounded-2xl">
                  <p className="text-zinc-500 text-xs">لا يوجد بضائع تطابق التصفية الحالية.</p>
                  <p className="text-zinc-600 text-[10px] mt-1">تأكد من كتابة الاسم بصورة صحيحة أو تصفير الفلاتر بالأعلى.</p>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const cartItem = cart.find((c) => c.product.id === prod.id);
                  const activeStock = selectedBranch === "branch1" ? prod.stockBranch1 : prod.stockBranch2;
                  const otherStock = selectedBranch === "branch1" ? prod.stockBranch2 : prod.stockBranch1;
                  
                  return (
                    <div 
                      key={prod.id} 
                      className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                        cartItem 
                          ? "bg-zinc-950/90 border-emerald-500/50 shadow-inner" 
                          : "bg-zinc-950 border-zinc-850 hover:border-zinc-800"
                      }`}
                    >
                      <div>
                        {/* Title and Category */}
                        <div className="flex justify-between items-start gap-1 pb-1">
                          <span className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded font-bold">{prod.category}</span>
                          
                          {/* Stock status indicator */}
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${activeStock > 0 ? "text-emerald-400 bg-emerald-950/25 border border-emerald-900/30 px-1.5 rounded" : "text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 rounded"}`}>
                              بفرعك: {activeStock} ق.
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-zinc-100 text-xs sm:text-sm leading-snug my-1 text-right">{prod.name}</h4>
                        
                        {/* Compatibilities */}
                        <div className="flex items-center gap-1 flex-wrap text-[10px] text-zinc-500 my-1">
                          <Smartphone className="w-3 h-3 text-cyan-500 shrink-0" />
                          <span>متوافق: </span>
                          <span className="text-zinc-400 font-medium">
                            {prod.compatibleMobiles && prod.compatibleMobiles.length > 0 
                              ? prod.compatibleMobiles.join("، ") 
                              : "عـام"}
                          </span>
                        </div>
                      </div>

                      {/* Pricing and Action Button area inside the card */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-900 flex items-center justify-between gap-2">
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-500 block">سعر التجزئة:</span>
                          <span className="text-emerald-400 font-extrabold text-xs sm:text-sm font-mono">{prod.priceRetail} ج.م</span>
                        </div>

                        {/* Interactive Plus / Minus and Quantity inside the exact item card! Extremely convenient! */}
                        {cartItem ? (
                          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden self-end">
                            <button
                              type="button"
                              onClick={() => handleDecrementCart(prod.id)}
                              className="p-1 px-2.5 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 transition min-w-[34px] min-h-[34px] flex items-center justify-center"
                              title="تقليل واحد"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs text-white font-extrabold font-mono">{cartItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod)}
                              className="p-1 px-2.5 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 transition min-w-[34px] min-h-[34px] flex items-center justify-center"
                              title="زيادة واحد"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={activeStock + otherStock === 0}
                            onClick={() => {
                              handleAddToCart(prod);
                              // Simple smooth scroll fallback is fine
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer min-h-[38px] ${
                              activeStock + otherStock === 0
                                ? "bg-zinc-900 border border-zinc-850 text-zinc-650 cursor-not-allowed opacity-50"
                                : "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
                            }`}
                          >
                            إضافة 🛒
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* LEFT COLUMN: Shopping Cart Tray + Consolidated Metadata */}
        <div ref={cartSectionRef} className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
            
            {/* Header of Basket */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-zinc-100 text-sm sm:text-base">سلة المبيعات والطلب المجمّع</h3>
              </div>
              <span className="text-[10px] bg-emerald-900/40 text-emerald-300 font-bold px-2.5 py-1 rounded-full">
                {cart.reduce((sum, c) => sum + c.quantity, 0)} قطع غيار مجهزة
              </span>
            </div>

            {/* Shopping List Tray rendering */}
            {isCartEmpty ? (
              <div className="py-12 px-4 text-center space-y-3 bg-zinc-950 rounded-2xl border border-zinc-850/60">
                <div className="inline-flex p-3 bg-zinc-900 border border-zinc-850 rounded-2xl text-zinc-500">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-zinc-300 text-xs">سلة مبيعاتك فارغة حالياً</h4>
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    استخدم شريط البحث أو اضغط على أزرار التصفية لتصفح بضائع blackhours، ثم اضغط على زر إضافة لتجهيز الفاتورة.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCartCheckout} className="space-y-4">
                
                {/* Scrollable list of selected items in the cart */}
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const anomaly = getCartItemAnomaly(item);
                    const prodWholesale = item.product.priceWholesale;
                    const belowWholesale = item.customPrice < prodWholesale;

                    return (
                      <div 
                        key={item.product.id}
                        className="bg-zinc-950 border border-zinc-850 p-3 rounded-2xl space-y-2.5"
                      >
                        {/* Title line */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-zinc-100 text-xs leading-5">{item.product.name}</h5>
                            <span className="text-[9px] text-zinc-500 font-semibold">{item.product.category}</span>
                          </div>
                          
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => setCart(cart.filter((c) => c.product.id !== item.product.id))}
                            className="text-zinc-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/20 rounded-xl transition min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
                            title="حذف القطعة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Interactive adjustments */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-zinc-900">
                          
                          {/* Quantity control (Thick targets >=44px) */}
                          <div className="flex flex-col space-y-1">
                            <span className="text-[9px] text-zinc-500">الكمية المباعة:</span>
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden self-start">
                              <button
                                type="button"
                                onClick={() => handleDecrementCart(item.product.id)}
                                className="p-1 px-3 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-850 transition min-w-[38px] min-h-[38px] flex items-center justify-center font-black"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs text-white font-extrabold font-mono">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item.product)}
                                className="p-1 px-3 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-850 transition min-w-[38px] min-h-[38px] flex items-center justify-center font-black"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Price override per item */}
                          <div className="flex flex-col space-y-1">
                            <span className="text-[9px] text-zinc-500">سعر البيع الفردي (ج.م):</span>
                            <div className="relative">
                              <input
                                type="number"
                                required
                                value={item.customPrice}
                                onChange={(e) => handleUpdatePrice(item.product.id, Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-250 outline-none focus:border-cyan-500/50 font-bold font-mono text-center"
                              />
                            </div>
                          </div>

                        </div>

                        {/* Warnings indicators */}
                        {belowWholesale && (
                          <p className="text-[10px] text-rose-450 bg-rose-950/20 border border-rose-900/30 px-2 py-1 rounded-xl flex items-center gap-1.5 font-bold font-sans">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>تحذير: سيتم البيع بأقل من سعر الجملة ({prodWholesale} ج.م)! خسارة بالهامش.</span>
                          </p>
                        )}

                        {(() => {
                          const costPriceValCol = item.product.priceCost !== undefined ? item.product.priceCost : item.product.priceWholesale;
                          const retailPriceValCol = item.product.priceRetail;
                          const maxDiscountPercentValCol = item.product.maxDiscountProfitPercent !== undefined ? item.product.maxDiscountProfitPercent : 50;
                          const originalMarginCol = retailPriceValCol - costPriceValCol;
                          const maximumDiscountAmtCol = originalMarginCol > 0 ? (originalMarginCol * (maxDiscountPercentValCol / 100)) : 0;
                          const minAllowedPriceValCol = retailPriceValCol - maximumDiscountAmtCol;
                          const isOverDiscountCol = item.customPrice < minAllowedPriceValCol - 0.01;

                          return (
                            <div className="bg-zinc-950 p-2.5 rounded-xl text-[10px] space-y-1 border border-zinc-900 leading-relaxed font-sans text-zinc-400">
                              <div className="flex justify-between">
                                <span>البيع بالتجزئة (الحالي / الافتراضي):</span>
                                <span className="font-mono text-zinc-200">{item.customPrice} ج.م / {retailPriceValCol} ج.م</span>
                              </div>
                              <div className="flex justify-between">
                                <span>الحد الأدنى المسموح للبيع:</span>
                                <span className="font-mono font-bold text-amber-500">{minAllowedPriceValCol.toFixed(0)} ج.م (نسبة مسموحة {maxDiscountPercentValCol}%)</span>
                              </div>
                              {isOverDiscountCol && (
                                <p className="text-rose-450 bg-rose-950/25 border border-rose-900/30 p-2 rounded-lg font-bold flex items-center gap-1 mt-1 text-[9.5px]">
                                  <AlertCircle className="w-3 h-3 shrink-0 text-rose-500 animate-pulse" />
                                  <span>ممنوع البيع: السعر المدخل يتخطى حد الخصم المسموح به للموظف! سيتم الرفض عند الحفظ لجلب موافقة الأدمن.</span>
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {anomaly && (
                          <p className={`text-[10px] px-2.5 py-1 rounded-xl font-bold font-sans ${
                            anomaly.type === "anomaly" 
                              ? "text-amber-400 bg-amber-950/20 border border-amber-900/30" 
                              : "text-rose-400 bg-rose-950/20 border border-rose-900/30"
                          }`}>
                            {anomaly.type === "anomaly" ? (
                              <Info className="w-3.5 h-3.5 inline ml-1 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 inline ml-1 shrink-0" />
                            )}
                            {anomaly.msg}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Branch Selection Sync Lock override for Cart */}
                <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 space-y-2">
                  <label className="block text-zinc-400 text-[10px] sm:text-xs font-bold leading-relaxed">الفرع المسؤول عن المبيعات وتحديث مخزونه:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={currentUser !== "admin"}
                      onClick={() => setSelectedBranch("branch1")}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedBranch === "branch1"
                          ? "bg-purple-600 text-white border-purple-500 shadow"
                          : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                      } ${currentUser !== "admin" && selectedBranch !== "branch1" ? "opacity-35 cursor-not-allowed" : ""}`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      فرع 1
                    </button>
                    <button
                      type="button"
                      disabled={currentUser !== "admin"}
                      onClick={() => setSelectedBranch("branch2")}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedBranch === "branch2"
                          ? "bg-blue-600 text-white border-blue-500 shadow"
                          : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                      } ${currentUser !== "admin" && selectedBranch !== "branch2" ? "opacity-35 cursor-not-allowed" : ""}`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      فرع 2
                    </button>
                  </div>
                  {currentUser !== "admin" && (
                    <p className="text-[9px] text-zinc-500 font-semibold leading-relaxed">
                      بصفتك موظف بالجرد وقسم المبيعات، يتم تعيين الجاهزية الافتراضية لحسابك تلقائياً لمنع الأخطاء.
                    </p>
                  )}
                </div>

                {/* Basket Notes */}
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-bold">ملاحظات مرافقة للفاتورة المجمعة (اختياري):</label>
                  <input
                    type="text"
                    placeholder="مثال: اسم العميل، خصم خاص للفاتورة بالكامل، تذكرة هاتف..."
                    value={cartNotes}
                    onChange={(e) => setCartNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Ledger calculations */}
                <div className="bg-zinc-950/70 rounded-2xl p-4 border border-zinc-850 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-900">
                    <span>إجمالي الأصناف:</span>
                    <span className="text-zinc-200">{cart.length} أصناف فريدة</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-900">
                    <span>إجمالي الكمية (القطع):</span>
                    <span className="text-zinc-200 font-mono">{cart.reduce((sum, c) => sum + c.quantity, 0)} قطع</span>
                  </div>
                  
                  {/* Ledger Profit Visual lock - Only visible to admin or toggled */}
                  {currentUser === "admin" && (
                    <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-900">
                      <span className="flex items-center gap-1">
                        هامش الربح التقديري:
                        <button
                          type="button"
                          onClick={() => setShowProfits(!showProfits)}
                          className="text-zinc-500 hover:text-white p-0.5"
                          title="إظهار/إخفاء هامش الربح"
                        >
                          {showProfits ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                      {showProfits ? (
                        <span className={`font-mono font-bold ${cartTotalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {cartTotalProfit} ج.م
                        </span>
                      ) : (
                        <span className="text-zinc-600">•••• ج.م</span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-black text-white pt-1">
                    <span>الإجمالي ليدجر (المطلوب):</span>
                    <span className="text-emerald-400 text-base font-bold font-mono">{cartTotalAmount} ج.م</span>
                  </div>
                </div>

                {/* Dynamic warning if any item exceeds availability */}
                {cart.some((c) => {
                  const check = getCartItemAnomaly(c);
                  return check && check.type === "out_of_stock";
                }) ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                    ⚠️ لا يمكن إتمام الفاتورة حتى تراجع الكميات الحمراء؛ تتجاوز إجمالي المخزون في كلا الفرعين!
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-100 font-extrabold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    تأكيد الفاتورة المجمعة وتحديث المخازن
                  </button>
                )}

              </form>
            )}

          </div>
        </div>

      </div>

      {/* Sales Transactions Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-zinc-100 text-lg">سجل المبيعات الأخير لفرعي blackhours</h3>
          </div>
          <span className="text-xs text-zinc-500 font-bold font-mono">مسجل لدينا: {sales.length} بيعة فردية</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-850">
          {sales.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 text-xs">لا توجد عمليات مبيعات مسجلة حتى الآن.</p>
          ) : (
            <table className="w-full text-xs text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/40">
                  <th className="py-2.5 px-3 font-bold text-zinc-400">المنتج / قطع الغيار</th>
                  <th className="py-2.5 px-3 font-bold text-zinc-400">الفرع</th>
                  <th className="py-2.5 px-3 font-bold text-zinc-400 text-center">الكمية</th>
                  <th className="py-2.5 px-3 font-bold text-zinc-400">السعر</th>
                  <th className="py-2.5 px-3 font-bold text-zinc-400">الإجمالي</th>
                  {currentUser === "admin" && <th className="py-2.5 px-3 font-bold text-zinc-400 text-emerald-400">الربح</th>}
                  <th className="py-2.5 px-3 font-bold text-zinc-400">التاريخ</th>
                  <th className="py-2.5 px-3 font-bold text-zinc-400 col-span-2">الملاحظات والفواتير المدمجة</th>
                  <th className="py-2.5 px-3 font-bold text-zinc-400 text-center">الفاتورة المباشرة</th>
                </tr>
              </thead>
              <tbody>
                {sales
                  .slice()
                  .reverse()
                  .map((sale) => {
                    const isCombined = sale.notes.includes("فاتورة مجمعة");
                    
                    return (
                      <tr key={sale.id} className="border-b border-zinc-850 hover:bg-zinc-850/30 transition">
                        <td className="py-2.5 px-3 text-zinc-200 font-bold">{sale.productName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sale.branch === "branch1"
                                ? "bg-purple-950/40 text-purple-300 border border-purple-900/30"
                                : "bg-blue-950/40 text-blue-300 border border-blue-900/30"
                            }`}
                          >
                            {sale.branch === "branch1" ? "فرع 1" : "فرع 2"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-100 font-extrabold font-mono">{sale.quantity}</td>
                        <td className="py-2.5 px-3 text-zinc-300 font-mono">{sale.price} ج.م</td>
                        <td className="py-2.5 px-3 text-zinc-100 font-bold font-mono">{sale.total} ج.م</td>
                        {currentUser === "admin" && <td className="py-2.5 px-3 text-emerald-400 font-extrabold font-mono">+{sale.profit} ج.م</td>}
                        <td className="py-2.5 px-3 text-zinc-400 text-[10px]" dir="ltr">
                          {new Date(sale.date).toLocaleDateString("ar-EG")} {new Date(sale.date).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          {isCombined ? (
                            <span className="text-cyan-400 flex items-center gap-1 text-[10px] font-black bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-900/25">
                              <PlusCircle className="w-3 h-3 shrink-0" />
                              {sale.notes.substring(0, 45)}...
                            </span>
                          ) : sale.notes.includes("سحب") ? (
                            <span className="text-amber-300 flex items-center gap-1 text-[10px] font-semibold bg-amber-950/25 px-2 py-0.5 rounded border border-amber-900/25">
                              <Info className="w-3 h-3 text-amber-500 shrink-0" />
                              {sale.notes}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[10px] whitespace-normal max-w-[150px] inline-block">{sale.notes}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              // Intelligently fetch consolidated combined or single receipt details
                              const compiled = getConsolidatedReceipt(sale);
                              setViewingReceipt(compiled);
                            }}
                            className="bg-zinc-950 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 p-2 rounded-xl border border-zinc-800 hover:border-emerald-500/20 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center inline-flex"
                            title={isCombined ? "عرض وطباعة هذه الفاتورة المجمعة بالكامل" : "طباعة فاتورة حرارية"}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Consolidated Thermal Receipt Modal Overlay - fully compatible / unified invoice display */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white text-zinc-900 border border-zinc-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col space-y-4">
            
            {/* Header of Receipt */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black tracking-widest text-black">BLACKHOURS</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">البيع بالتجزئة والجملة لقطع الهاتف المحمول والاكسسوارات</p>
              <p className="text-[10px] text-zinc-400">موقع الجرد: {viewingReceipt.branch === "branch1" ? "فرع 1 (الرئيسي)" : "فرع 2"}</p>
              <div className="border-b border-dashed border-zinc-300 my-2" />
            </div>

            {/* Invoice details */}
            <div className="space-y-1.5 text-[11px] text-zinc-600 font-mono">
              <p className="flex justify-between">
                <span>رقم الفاتورة:</span>
                <span className="font-bold text-black">{viewingReceipt.id}</span>
              </p>
              <p className="flex justify-between">
                <span>التاريخ والوقت:</span>
                <span>{new Date(viewingReceipt.date).toLocaleString("ar-EG")}</span>
              </p>
              <p className="flex justify-between font-sans">
                <span>البائع النشط:</span>
                <span className="font-bold text-zinc-700 capitalize">{viewingReceipt.soldBy || "system"}</span>
              </p>
              
              <div className="border-b border-dashed border-zinc-350 my-2" />
              
              {/* Product matrix column */}
              <p className="text-xs font-black text-black flex justify-between pb-1">
                <span>اسم ومواصفات الصنف</span>
                <span>الكمية × السعر</span>
              </p>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {viewingReceipt.itemsList ? (
                  viewingReceipt.itemsList.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs font-semibold text-zinc-800 flex justify-between items-start gap-2">
                      <span className="text-[11px] font-sans text-right">{item.name}</span>
                      <span className="text-left whitespace-nowrap">{item.qty} × {item.price} ج.م</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-semibold text-zinc-800 flex justify-between">
                    <span>{viewingReceipt.productName}</span>
                    <span>{viewingReceipt.quantity} × {viewingReceipt.price} ج.م</span>
                  </div>
                )}
              </div>
              
              <div className="border-b border-dashed border-zinc-350 my-2" />
              
              <p className="flex justify-between text-base font-black text-black pt-1">
                <span>الإجمالي النهائي للطلب:</span>
                <span>{viewingReceipt.total} ج.م</span>
              </p>
              
              {viewingReceipt.notes && (
                <p className="text-[10px] text-zinc-500 mt-2 bg-zinc-100 p-2 rounded-xl border border-zinc-200 leading-relaxed font-sans">
                  <strong>مذكرات الفاتورة:</strong> {viewingReceipt.notes}
                </p>
              )}
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] text-zinc-550 font-black font-sans">•• شكراً لتعاملكم مع Blackhours ••</p>
              <p className="text-[9px] text-zinc-405 leading-relaxed font-sans">نظام الموازنة والمزامنة الفورية لمستودعات الفروع</p>
            </div>

            {/* Buttons with standard target actions */}
            <div className="grid grid-cols-2 gap-2 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-black text-white hover:bg-zinc-800 font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة الفاتورة
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="bg-zinc-250 text-zinc-800 hover:bg-zinc-300 font-bold py-2.5 px-3 rounded-xl text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
