import React, { useState } from "react";
import { Product } from "../types";
import { Package, Plus, Minimize2, Search, ArrowLeftRight, CheckCircle, Bell, Trash2, Edit } from "lucide-react";

interface StockManagerProps {
  items: Product[];
  onUpdateItems: (updatedItems: Product[]) => void;
  currentUser: "admin" | "user 1" | "user 2";
  onProposeEdit: (productId: string, productName: string, originalData: Partial<Product>, proposedData: Partial<Product>) => void;
  onAddLog: (actionType: "add_product" | "edit_request" | "edit_approved" | "transfer", details: string) => void;
}

export default function StockManager({ 
  items, 
  onUpdateItems,
  currentUser,
  onProposeEdit,
  onAddLog
}: StockManagerProps) {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "outB1" | "outB2">("all");
  const [sortBy, setSortBy] = useState<"name" | "totalStock" | "wholesalePrice" | "retailPrice">("name");

  // New item form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("شاشات");
  const [priceCost, setPriceCost] = useState<number | "">("");
  const [priceWholesale, setPriceWholesale] = useState<number | "">("");
  const [priceRetail, setPriceRetail] = useState<number | "">("");
  const [maxDiscountProfitPercent, setMaxDiscountProfitPercent] = useState<number>(50);
  const [stockBranch1, setStockBranch1] = useState(0);
  const [stockBranch2, setStockBranch2] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [compatibleMobiles, setCompatibleMobiles] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Edit item form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriceCost, setEditPriceCost] = useState<number | "">("");
  const [editPriceWholesale, setEditPriceWholesale] = useState<number | "">("");
  const [editPriceRetail, setEditPriceRetail] = useState<number | "">("");
  const [editMaxDiscountProfitPercent, setEditMaxDiscountProfitPercent] = useState<number>(50);
  const [editStockBranch1, setEditStockBranch1] = useState(0);
  const [editStockBranch2, setEditStockBranch2] = useState(0);
  const [editMinStockAlert, setEditMinStockAlert] = useState(5);
  const [editCompatibleMobiles, setEditCompatibleMobiles] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Stock transfers
  const [transferProductId, setTransferProductId] = useState("");
  const [transferFrom, setTransferFrom] = useState<"branch1" | "branch2">("branch1");
  const [transferQty, setTransferQty] = useState(1);
  const [transferMsg, setTransferMsg] = useState("");

  // States to add custom dynamic categories easily
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false);
  const [editCustomCategoryName, setEditCustomCategoryName] = useState("");

  const defaultCategories = ["شاشات", "باغات وزجاج", "بطاريات", "فلاتات وشواحن", "إكسسوارات", "أدوات صيانة"];
  const dynamicCategories = Array.from(new Set([
    ...defaultCategories,
    ...items.map((it) => it.category).filter(Boolean)
  ]));

  const startEditing = (item: Product) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setIsEditCustomCategory(false);
    setEditCustomCategoryName("");
    setEditPriceCost(item.priceCost !== undefined ? item.priceCost : item.priceWholesale);
    setEditPriceWholesale(item.priceWholesale);
    setEditPriceRetail(item.priceRetail);
    setEditMaxDiscountProfitPercent(item.maxDiscountProfitPercent !== undefined ? item.maxDiscountProfitPercent : 50);
    setEditStockBranch1(item.stockBranch1);
    setEditStockBranch2(item.stockBranch2);
    setEditMinStockAlert(item.minStockAlert);
    setEditCompatibleMobiles(item.compatibleMobiles?.join(", ") || "");
    setEditImageUrl(item.imageUrl || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;

    const item = items.find((it) => it.id === editingId);
    if (!item) return;

    // Use customized category if enabled
    const finalEditCategory = isEditCustomCategory ? editCustomCategoryName.trim() : editCategory;
    if (!finalEditCategory) {
      alert("⚠️ يرجى تحديد القسم الخاص بالمنتج أولاً.");
      return;
    }

    const proposed = {
      name: editName.trim(),
      category: finalEditCategory,
      priceCost: Number(editPriceCost) || 0,
      priceWholesale: Number(editPriceWholesale) || 0,
      priceRetail: Number(editPriceRetail) || 0,
      maxDiscountProfitPercent: Number(editMaxDiscountProfitPercent) || 50,
      stockBranch1: Number(editStockBranch1) || 0,
      stockBranch2: Number(editStockBranch2) || 0,
      minStockAlert: Number(editMinStockAlert) || 5,
      compatibleMobiles: editCompatibleMobiles.split(",").map((s) => s.trim()).filter(Boolean),
      imageUrl: editImageUrl,
    };

    if (currentUser !== "admin") {
      onProposeEdit(editingId, item.name, item, proposed);
      alert(`⚠️ نظرًا لأنك لست الأدمن، فقد تم إرسال طلب تحديث الصنف [${item.name}] للأدمن حتى يُوافق عليه لتجنب التلاعب بالفروع.`);
      setEditingId(null);
      setIsEditCustomCategory(false);
      setEditCustomCategoryName("");
      return;
    }

    const updated = items.map((it) => {
      if (it.id === editingId) {
        return {
          ...it,
          ...proposed,
          lastModifiedBy: "admin",
          lastModifiedAt: new Date().toISOString()
        };
      }
      return it;
    });

    onUpdateItems(updated);
    onAddLog("edit_approved", `قام الأدمن بتحديث الصنف مباشرة: [${item.name}] بسعر تكلفة: ${proposed.priceCost}، جملة: ${proposed.priceWholesale}، وتجزئة: ${proposed.priceRetail}.`);
    setEditingId(null);
    setIsEditCustomCategory(false);
    setEditCustomCategoryName("");
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Use customized category if enabled
    const finalCategory = isCustomCategory ? customCategoryName.trim() : category;
    if (!finalCategory) {
      alert("⚠️ يرجى تعيين القسم أو طباعته بالـمربع المخصص لقسم جديد.");
      return;
    }

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: name.trim(),
      category: finalCategory,
      priceCost: Number(priceCost) || 0,
      priceWholesale: Number(priceWholesale) || 0,
      priceRetail: Number(priceRetail) || 0,
      maxDiscountProfitPercent: Number(maxDiscountProfitPercent) || 50,
      stockBranch1: Number(stockBranch1) || 0,
      stockBranch2: Number(stockBranch2) || 0,
      minStockAlert: Number(minStockAlert) || 5,
      compatibleMobiles: compatibleMobiles.split(",").map((s) => s.trim()).filter(Boolean),
      imageUrl,
      createdBy: currentUser,
      createdAt: new Date().toISOString()
    };

    onUpdateItems([...items, newProduct]);
    onAddLog(
      "add_product", 
      `قام الموظف [${currentUser}] بإدخال قطعة غيار جديدة: [${newProduct.name}] في المخازن؛ مخزن فرع1: ${newProduct.stockBranch1}، مخزن فرع2: ${newProduct.stockBranch2}.`
    );

    // Reset Form
    setName("");
    setPriceCost("");
    setPriceWholesale("");
    setPriceRetail("");
    setMaxDiscountProfitPercent(50);
    setStockBranch1(0);
    setStockBranch2(0);
    setMinStockAlert(5);
    setCompatibleMobiles("");
    setImageUrl("");
    setIsCustomCategory(false);
    setCustomCategoryName("");
    setCategory("شاشات");

    alert(`✅ تم تسجيل قطعة الغيار الجديدة ومزامنتها بنجاح بواسطة ${currentUser === "admin" ? "المدير العام" : currentUser}!`);
  };

  const handleUpdateStockDirect = (productId: string, branch: "branch1" | "branch2", amount: number) => {
    const item = items.find((it) => it.id === productId);
    if (!item) return;

    if (currentUser !== "admin") {
      const targetVal = branch === "branch1" ? item.stockBranch1 + amount : item.stockBranch2 + amount;
      if (targetVal < 0) return;

      const proposed = branch === "branch1" 
        ? { stockBranch1: targetVal } 
        : { stockBranch2: targetVal };

      onProposeEdit(productId, item.name, item, proposed);
      alert(`⚠️ نظرًا لأنك لست الأدمن، فقد تم إرسال طلب تعديل مخزن الصنف [${item.name}] بفارق عجز/زيادة للأدمن لاعتماده ومراجعة النشاط.`);
      return;
    }

    const updated = items.map((it) => {
      if (it.id === productId) {
        if (branch === "branch1") {
          return { ...it, stockBranch1: Math.max(0, it.stockBranch1 + amount) };
        } else {
          return { ...it, stockBranch2: Math.max(0, it.stockBranch2 + amount) };
        }
      }
      return it;
    });

    onUpdateItems(updated);
    onAddLog(
      "edit_approved", 
      `ضبط الأدمن مخزون [${item.name}] ${branch === "branch1" ? "بفرع 1" : "بفرع 2"} بمقدار ${amount > 0 ? "+" : ""}${amount} ق.`
    );
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId) return;

    const qty = Number(transferQty);
    if (qty <= 0) return;

    const product = items.find((item) => item.id === transferProductId);
    if (!product) return;

    if (transferFrom === "branch1") {
      if (product.stockBranch1 < qty) {
        alert("❌ خطأ: الكمية المراد نقلها من فرع 1 غير متوفرة بها!");
        return;
      }
    } else {
      if (product.stockBranch2 < qty) {
        alert("❌ خطأ: الكمية المراد نقلها من فرع 2 غير متوفرة بها!");
        return;
      }
    }

    const updated = items.map((item) => {
      if (item.id === transferProductId) {
        if (transferFrom === "branch1") {
          return {
            ...item,
            stockBranch1: item.stockBranch1 - qty,
            stockBranch2: item.stockBranch2 + qty,
          };
        } else {
          return {
            ...item,
            stockBranch1: item.stockBranch1 + qty,
            stockBranch2: item.stockBranch2 - qty,
          };
        }
      }
      return item;
    });

    onUpdateItems(updated);
    onAddLog("transfer", `قام الموظف [${currentUser}] بنقل عدد (${qty}) قطعة من صنف [${product.name}] من ${transferFrom === "branch1" ? "فرع 1" : "فرع 2"} إلى ${transferFrom === "branch1" ? "فرع 2" : "فرع 1"}.`);
    setTransferQty(1);
    setTransferMsg(`✅ تم تحويل عدّ {${qty}} قطعة من [${product.name}] بنجاح ومزامنة مخزن الفروع!`);

    setTimeout(() => {
      setTransferMsg("");
    }, 4000);
  };

  const handleQuickTransferOnePiece = (productId: string, direction: "b1to2" | "b2tob1") => {
    const product = items.find((it) => it.id === productId);
    if (!product) return;

    if (direction === "b1to2") {
      if (product.stockBranch1 < 1) {
        alert("❌ خطأ: مخزن فرع 1 فارغ لتنفيذ التحويل!");
        return;
      }
    } else {
      if (product.stockBranch2 < 1) {
        alert("❌ خطأ: مخزن فرع 2 فارغ لتنفيذ التحويل!");
        return;
      }
    }

    const updated = items.map((it) => {
      if (it.id === productId) {
        if (direction === "b1to2") {
          return {
            ...it,
            stockBranch1: it.stockBranch1 - 1,
            stockBranch2: it.stockBranch2 + 1,
          };
        } else {
          return {
            ...it,
            stockBranch1: it.stockBranch1 + 1,
            stockBranch2: it.stockBranch2 - 1,
          };
        }
      }
      return it;
    });

    onUpdateItems(updated);
    onAddLog(
      "transfer", 
      `قناة سريعة: نقل الموظف [${currentUser}] عدد (1) قطعة من صنف [${product.name}] من ${direction === "b1to2" ? "فرع 1" : "فرع 2"} إلى ${direction === "b1to2" ? "فرع 2" : "فرع 1"}.`
    );
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (currentUser !== "admin") {
      alert("❌ خطأ: لا يسمح بحذف الأصناف المخزنة نهائيًا إلا للمدير العام (admin) تجنبًا لتلف أو حجب البضائع.");
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من حذف الصنف [ ${name} ] نهائياً من كلا الفرعين؟`)) {
      const filtered = items.filter((it) => it.id !== id);
      onUpdateItems(filtered);
      onAddLog("edit_approved", `قام الأدمن بحذف صنف نهائيًا من المخازن: [${name}].`);
    }
  };

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.compatibleMobiles.some(compat => compat.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = item.stockBranch1 <= item.minStockAlert || item.stockBranch2 <= item.minStockAlert;
      } else if (stockFilter === "outB1") {
        matchesStock = item.stockBranch1 === 0;
      } else if (stockFilter === "outB2") {
        matchesStock = item.stockBranch2 === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "ar");
      } else if (sortBy === "totalStock") {
        return (b.stockBranch1 + b.stockBranch2) - (a.stockBranch1 + a.stockBranch2);
      } else if (sortBy === "wholesalePrice") {
        return b.priceWholesale - a.priceWholesale;
      } else if (sortBy === "retailPrice") {
        return b.priceRetail - a.priceRetail;
      }
      return 0;
    });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Quick Stock Transfer Helper */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
          <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-zinc-100 text-lg">تحويل البضاعة الفوري بين الفرعين</h3>
        </div>

        {transferMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{transferMsg}</span>
          </div>
        )}

        <form onSubmit={handleExecuteTransfer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Select Product */}
          <div className="md:col-span-2">
            <label className="block text-zinc-400 text-xs mb-1.5 font-medium">اختر البضاعة المراد تحويلها:</label>
            <select
              required
              value={transferProductId}
              onChange={(e) => setTransferProductId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="">-- اختر البضاعة --</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} [ف1: {it.stockBranch1} قطة | ف2: {it.stockBranch2} قطة]
                </option>
              ))}
            </select>
          </div>

          {/* Select Direction */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1.5 font-medium">خط السير والتحويل:</label>
            <select
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value as "branch1" | "branch2")}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="branch1">من فرع 1 ➜ لفرع 2</option>
              <option value="branch2">من فرع 2 ➜ لفرع 1</option>
            </select>
          </div>

          {/* Quantity */}
          <div className="flex gap-2">
            <div className="w-20">
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">العدد الكلي:</label>
              <input
                type="number"
                min="1"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={!transferProductId}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-100 font-semibold py-2 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5 h-10 shadow-md"
            >
              <ArrowLeftRight className="w-4 h-4" />
              تنفيذ التحويل
            </button>
          </div>
        </form>
      </div>

      {/* Add New Product Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
          <Plus className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-zinc-100 text-lg">إضافة بضائع وجملة جديدة لـ blackhours</h3>
        </div>

        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">اسم قطعة الغيار / إكسسوار الموبايل:</label>
              <input
                type="text"
                required
                placeholder="مثال: شاشة آيفون 13 برو ماكس (OLED) - باغة كاميرا S22..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Category */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-zinc-400 text-xs font-semibold">قسم قطع الغيار / الإكسسوار:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(!isCustomCategory);
                    if (!isCustomCategory) {
                      setCategory("");
                    } else {
                      setCategory("شاشات");
                    }
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850"
                >
                  {isCustomCategory ? "🔙 اختيار من القائمة" : "➕ إضافة قسم جديد"}
                </button>
              </div>
              {isCustomCategory ? (
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم القسم الجديد هنا"
                  value={customCategoryName}
                  onChange={(e) => {
                    setCustomCategoryName(e.target.value);
                    setCategory(e.target.value);
                  }}
                  className="w-full bg-zinc-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold outline-none focus:border-emerald-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                >
                  {dynamicCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cost Price */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5 font-bold">سعر تكلفة القطعة الأساسي (ج.م):</label>
              <input
                type="number"
                min="0"
                required
                placeholder="سعر التكلفة الاستيرادية"
                value={priceCost}
                onChange={(e) => setPriceCost(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-rose-300 font-bold outline-none focus:border-red-500/50"
              />
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5 font-bold">سعر البيع جملة (ج.م):</label>
              <input
                type="number"
                min="0"
                required
                placeholder="سعر بيع الجملة للمحلات"
                value={priceWholesale}
                onChange={(e) => setPriceWholesale(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Retail Price */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5 font-bold">سعر البيع قطاعي / تجزئة (ج.م):</label>
              <input
                type="number"
                min="0"
                required
                placeholder="سعر البيع للجمهور"
                value={priceRetail}
                onChange={(e) => setPriceRetail(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-mono outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Branch 1 Stock */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">مخزون فرع 1 (القطعة):</label>
              <input
                type="number"
                min="0"
                value={stockBranch1}
                onChange={(e) => setStockBranch1(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>

            {/* Branch 2 Stock */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">مخزون فرع 2 (القطعة):</label>
              <input
                type="number"
                min="0"
                value={stockBranch2}
                onChange={(e) => setStockBranch2(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
          </div>

          {/* Dynamic Helper Output Ledger for Sales Security */}
          {Number(priceRetail) > 0 && Number(priceCost) > 0 && (() => {
            const numericRetail = Number(priceRetail) || 0;
            const numericCost = Number(priceCost) || 0;
            const numericDiscountPercent = Number(maxDiscountProfitPercent) || 50;
            const profitVal = numericRetail - numericCost;
            const discountAmt = profitVal * (numericDiscountPercent / 100);
            const minimumSaleVal = numericRetail - discountAmt;

            return (
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-850 space-y-1.5 text-[11px] leading-relaxed">
                <span className="text-zinc-400 font-bold block mb-1">🧮 مؤشر الفوائد وحدود الخصم الآمنة للقطعة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <p className="text-zinc-300">
                    هامش الربح المتوقع قطاعي:{" "}
                    <strong className="text-emerald-400">{profitVal.toFixed(1)} ج.م</strong>
                  </p>
                  <p className="text-zinc-300">
                    قيمة الخصم القصوى المسموحة ({numericDiscountPercent}%):{" "}
                    <strong className="text-amber-500">{discountAmt.toFixed(1)} ج.م</strong>
                  </p>
                  <p className="text-zinc-300">
                    أقل سعر بيع زبون قطاعي مسموح به:{" "}
                    <strong className="text-cyan-400">{minimumSaleVal.toFixed(1)} ج.م</strong>
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Min Alert Level */}
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">حد الأمان ونقص المخزون (تنبيه):</label>
              <input
                type="number"
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-amber-400 outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>

            {/* Compatible Mobiles */}
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">موديلات الهواتف المتوافقة مع القطعة (افصل بفاصلة):</label>
              <input
                type="text"
                placeholder="مثال: iPhone 13 Pro Max, S22 Ultra..."
                value={compatibleMobiles}
                onChange={(e) => setCompatibleMobiles(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Product Image */}
            <div className="md:col-span-2">
              <label className="block text-zinc-400 text-xs mb-1.5 font-medium">صورة قطعة الغيار (اختياري - للماركت بليس):</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onloadend = () => setImageUrl(r.result as string);
                      r.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="create-product-image-upload"
                />
                <label
                  htmlFor="create-product-image-upload"
                  className="flex-1 bg-zinc-950 border border-dashed border-zinc-800 hover:border-emerald-500/40 rounded-xl px-4 py-3 text-xs text-center text-zinc-400 cursor-pointer hover:bg-zinc-900/50 transition flex items-center justify-center gap-2"
                >
                  📁 اختر صورة للمنتج (رفع من جهازك)
                </label>
                {imageUrl && (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 shrink-0 bg-zinc-950 flex items-center justify-center">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      إزالة
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-100 font-semibold py-2 rounded-xl transition text-xs shadow-md"
          >
            حفظ وإضافة الصنف الجديد
          </button>
        </form>
      </div>

      {/* Inventory Search & Catalog list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg">جرد ومخزون الفروع الموزع</h3>
              <p className="text-xs text-zinc-400">انقر على الأزرار (+ / -) لتحديث فوري لمخزون الفرع</p>
            </div>
          </div>

          {/* Search inputs */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الموديل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 rounded-xl pr-9 pl-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 w-full md:w-48"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="all">كل الأقسام</option>
              {dynamicCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Advanced Stock status filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="all font-sans">كل البضائع (تصفية)</option>
              <option value="low">⚠️ تحت خط الأمان (النواقص)</option>
              <option value="outB1">🚫 نفذت في فرع 1</option>
              <option value="outB2">🚫 نفذت في فرع 2</option>
            </select>

            {/* Smart sorting selection */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 outline-none focus:border-emerald-500/50"
            >
              <option value="name">ترتيب المسمى الألفبائي</option>
              <option value="totalStock">ترتيب المخزون (الأعلى كلياً)</option>
              <option value="wholesalePrice">ترتيب جملة (الأغلى سعراً)</option>
              <option value="retailPrice">ترتيب تجزئة (الأعلى سعراً)</option>
            </select>
          </div>
        </div>

        {/* Inline Edit Form Overlay */}
        {editingId && (
          <div className="bg-neutral-950 border border-emerald-500/30 rounded-2xl p-5 mb-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-400 font-bold" />
                <h4 className="font-bold text-sm text-zinc-100">تعديل بيانات الصنف: [ {editName} ]</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs text-neutral-400 hover:text-rose-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-xl cursor-pointer"
              >
                إلغاء التعديل ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">اسم قطعة الغيار / إكسسوار الموبايل:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-zinc-400 text-xs font-semibold">القسم:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomCategory(!isEditCustomCategory);
                        if (!isEditCustomCategory) {
                          setEditCategory("");
                        } else {
                          setEditCategory("شاشات");
                        }
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-zinc-800"
                    >
                      {isEditCustomCategory ? "🔙 اختيار من القائمة" : "➕ قسم جديد"}
                    </button>
                  </div>
                  {isEditCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسم القسم الجديد"
                      value={editCustomCategoryName}
                      onChange={(e) => {
                        setEditCustomCategoryName(e.target.value);
                        setEditCategory(e.target.value);
                      }}
                      className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                    >
                      {dynamicCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-bold">سعر تكلفة القطعة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPriceCost ?? ""}
                    onChange={(e) => setEditPriceCost(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">سعر الجملة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPriceWholesale ?? ""}
                    onChange={(e) => setEditPriceWholesale(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">سعر التجزئة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPriceRetail ?? ""}
                    onChange={(e) => setEditPriceRetail(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">حد الخصم (% من الربح):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editMaxDiscountProfitPercent ?? ""}
                    onChange={(e) => setEditMaxDiscountProfitPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-450 outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>

              {Number(editPriceRetail) > 0 && Number(editPriceCost) > 0 && (
                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850 space-y-1.5 text-[11px] leading-relaxed">
                  <span className="text-zinc-400 font-bold block">🧮 مؤشر الفوائد والخصوم المقترح للتعديل:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <p className="text-zinc-300">صافي ربح الصنف: <strong className="text-emerald-400">{(Number(editPriceRetail) - Number(editPriceCost))} ج.م</strong></p>
                    <p className="text-zinc-300">أقصى خصم مسموح به ({editMaxDiscountProfitPercent}%): <strong className="text-amber-500">{((Number(editPriceRetail) - Number(editPriceCost)) * (Number(editMaxDiscountProfitPercent) / 100)).toFixed(1)} ج.م</strong></p>
                    <p className="text-zinc-300">أقل سعر معتمد قطاعي: <strong className="text-cyan-400">{(Number(editPriceRetail) - (Number(editPriceRetail) - Number(editPriceCost)) * (Number(editMaxDiscountProfitPercent) / 100)).toFixed(1)} ج.م</strong></p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">مخزون فرع 1:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockBranch1}
                    onChange={(e) => setEditStockBranch1(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">مخزون فرع 2:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockBranch2}
                    onChange={(e) => setEditStockBranch2(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">حد الأمان للتنبيه:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editMinStockAlert}
                    onChange={(e) => setEditMinStockAlert(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-500 outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">موديلات الهواتف المتوافقة (افصل بفاصلة):</label>
                  <input
                    type="text"
                    value={editCompatibleMobiles}
                    onChange={(e) => setEditCompatibleMobiles(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Edit Product Image */}
                <div className="md:col-span-3">
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">صورة قطعة الغيار (اختياري):</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => setEditImageUrl(r.result as string);
                          r.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="edit-product-image-upload"
                    />
                    <label
                      htmlFor="edit-product-image-upload"
                      className="flex-1 bg-zinc-900 border border-dashed border-zinc-800 hover:border-emerald-500/40 rounded-xl px-4 py-3 text-xs text-center text-zinc-400 cursor-pointer hover:bg-zinc-950 transition flex items-center justify-center gap-2"
                    >
                      📁 استبدال أو رفع صورة جديدة
                    </label>
                    {editImageUrl && (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 shrink-0 bg-zinc-900 flex items-center justify-center">
                        <img src={editImageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setEditImageUrl("")}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          إزالة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-100 font-semibold py-2.5 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  حفظ وتطبيق التعديلات الحالية
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-medium py-2.5 px-6 rounded-xl transition text-xs cursor-pointer"
                >
                  إلغاء التغييرات
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Catalog Responsive View */}
        <div>
          {filteredItems.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 text-xs">لا توجد بضائع تطابق بحثك حالياً.</p>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (Visible on larger screens) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/40">
                      <th className="py-3 px-3 font-semibold">الصنف وقسمه</th>
                      <th className="py-3 px-3 font-semibold text-center">مخزون فرع 1</th>
                      <th className="py-3 px-3 font-semibold text-center">النقل السريع ⇆</th>
                      <th className="py-3 px-3 font-semibold text-center">مخزون فرع 2</th>
                      <th className="py-3 px-3 font-semibold text-center">إجمالي البضاعة</th>
                      <th className="py-3 px-3 font-semibold">التكاليف والأسعار والمكسب المسموح</th>
                      <th className="py-3 px-3 font-semibold">موديلات الهواتف</th>
                      <th className="py-3 px-3 font-semibold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isLowB1 = item.stockBranch1 <= item.minStockAlert;
                      const isLowB2 = item.stockBranch2 <= item.minStockAlert;
                      const totalStock = item.stockBranch1 + item.stockBranch2;

                      return (
                        <tr key={item.id} className="border-b border-zinc-850 hover:bg-zinc-850/20 transition">
                          {/* Name / Category */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} className="w-9 h-9 rounded-lg object-cover border border-zinc-800 shrink-0" alt="صنف" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-xs text-zinc-600 font-bold shrink-0">📦</div>
                              )}
                              <div>
                                <p className="font-semibold text-zinc-200 text-xs md:text-sm">{item.name}</p>
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded leading-none mt-1 inline-block">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Branch 1 Stock */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-850">
                              <button
                                onClick={() => handleUpdateStockDirect(item.id, "branch1", -1)}
                                className="w-5 h-5 flex items-center justify-center bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded font-bold text-xs"
                              >
                                -
                              </button>
                              <span
                                className={`w-10 text-center text-xs font-bold font-mono px-1 ${
                                  isLowB1 ? "text-amber-450 font-extrabold" : "text-zinc-200"
                                }`}
                              >
                                {item.stockBranch1}
                              </span>
                              <button
                                onClick={() => handleUpdateStockDirect(item.id, "branch1", 1)}
                                className="w-5 h-5 flex items-center justify-center bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                            {isLowB1 && (
                              <div className="text-[9px] text-amber-500 font-semibold flex items-center justify-center gap-0.5 mt-1">
                                <Bell className="w-2.5 h-2.5 animate-bounce" />
                                <span>ناقص</span>
                              </div>
                            )}
                          </td>

                          {/* Quick Transfer arrows */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <button
                                onClick={() => handleQuickTransferOnePiece(item.id, "b1to2")}
                                disabled={item.stockBranch1 < 1}
                                className="bg-zinc-900 hover:bg-zinc-800 text-[10px] text-emerald-400 hover:text-emerald-300 border border-zinc-800 px-2 py-0.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="تحويل قطعة واحدة من فرع 1 إلى فرع 2"
                              >
                                فرع1 ← فرع2 (١ق)
                              </button>
                              <button
                                onClick={() => handleQuickTransferOnePiece(item.id, "b2tob1")}
                                disabled={item.stockBranch2 < 1}
                                className="bg-zinc-900 hover:bg-zinc-800 text-[10px] text-amber-400 hover:text-amber-300 border border-zinc-800 px-2 py-0.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="تحويل قطعة واحدة من فرع 2 إلى فرع 1"
                              >
                                فرع2 ← فرع1 (١ق)
                              </button>
                            </div>
                          </td>

                          {/* Branch 2 Stock */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center bg-zinc-950 rounded-lg p-1 border border-zinc-850">
                              <button
                                onClick={() => handleUpdateStockDirect(item.id, "branch2", -1)}
                                className="w-5 h-5 flex items-center justify-center bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded font-bold text-xs"
                              >
                                -
                              </button>
                              <span
                                className={`w-10 text-center text-xs font-bold font-mono px-1 ${
                                  isLowB2 ? "text-amber-450 font-extrabold" : "text-zinc-200"
                                }`}
                              >
                                {item.stockBranch2}
                              </span>
                              <button
                                onClick={() => handleUpdateStockDirect(item.id, "branch2", 1)}
                                className="w-5 h-5 flex items-center justify-center bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                            {isLowB2 && (
                              <div className="text-[9px] text-amber-500 font-semibold flex items-center justify-center gap-0.5 mt-1">
                                <Bell className="w-2.5 h-2.5 animate-bounce" />
                                <span>ناقص</span>
                              </div>
                            )}
                          </td>

                          {/* Total Stock */}
                          <td className="py-3 px-3 text-center font-bold text-zinc-100 text-xs font-mono">{totalStock}</td>

                          {/* Financial values (Excludes cost for regular clerks to prevent leaks) */}
                          <td className="py-3 px-3">
                            {currentUser === "admin" && (
                              <p className="text-rose-400 font-bold text-[10.5px]">
                                تكلفة الشراء: <span className="font-mono text-zinc-100">{item.priceCost !== undefined ? item.priceCost : "—"} ج.م</span>
                              </p>
                            )}
                            <p className="text-zinc-300 text-[11px]">
                              بيع جملة: <span className="font-mono text-zinc-100 font-semibold">{item.priceWholesale} ج.م</span>
                            </p>
                            <p className="text-emerald-400 font-bold text-[11px]">
                              بيع قطاعي: <span className="font-mono">{item.priceRetail} ج.م</span>
                            </p>
                            <span className="text-[10px] text-amber-500 font-semibold block mt-0.5">
                              أقصى خصم: {item.maxDiscountProfitPercent !== undefined ? item.maxDiscountProfitPercent : 50}% من الربح
                            </span>
                          </td>

                          {/* Compatible mobiles */}
                          <td className="py-3 px-3 max-w-[140px] truncate text-zinc-400">
                            {item.compatibleMobiles?.join(", ") || "جميع الموديلات"}
                          </td>

                          {/* Direct Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditing(item)}
                                className="p-1.5 text-zinc-400 hover:text-emerald-450 rounded-lg hover:bg-emerald-500/10 transition cursor-pointer"
                                title="تعديل تفاصيل الصنف"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(item.id, item.name)}
                                className="p-1.5 text-zinc-400 hover:text-rose-450 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS LIST VIEW (Specially built for smartphone screens) */}
              <div className="lg:hidden space-y-4">
                {filteredItems.map((item) => {
                  const isLowB1 = item.stockBranch1 <= item.minStockAlert;
                  const isLowB2 = item.stockBranch2 <= item.minStockAlert;
                  const totalStock = item.stockBranch1 + item.stockBranch2;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`bg-zinc-950 rounded-2xl p-4 border ${
                        isLowB1 || isLowB2 ? "border-amber-500/20 bg-zinc-950/60" : "border-zinc-850"
                      } space-y-3.5`}
                    >
                      {/* Name & Badge Row */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-extrabold text-sm text-zinc-100">{item.name}</h5>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">
                              📌 {item.category}
                            </span>
                            {item.compatibleMobiles && item.compatibleMobiles.length > 0 && (
                              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded-lg truncate max-w-[170px]">
                                📱 {item.compatibleMobiles.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top quick Actions */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(item)}
                            className="p-2 text-zinc-400 hover:text-emerald-400 bg-zinc-900 rounded-xl border border-zinc-800 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-900 rounded-xl border border-zinc-800 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Stock counts block */}
                      <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-900">
                        {/* Branch 1 */}
                        <div className="text-center space-y-1">
                          <p className="text-[10px] text-zinc-400 font-medium">فرع 1 (الرئيسي)</p>
                          <p className={`text-base font-black font-mono ${isLowB1 ? "text-amber-450" : "text-zinc-100"}`}>
                            {item.stockBranch1}
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                              onClick={() => handleUpdateStockDirect(item.id, "branch1", -1)}
                              className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-bold"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleUpdateStockDirect(item.id, "branch1", 1)}
                              className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-emerald-400 rounded-lg border border-zinc-800 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Branch 2 */}
                        <div className="text-center space-y-1 border-r border-zinc-850">
                          <p className="text-[10px] text-zinc-400 font-medium">فرع 2 (الفرعي)</p>
                          <p className={`text-base font-black font-mono ${isLowB2 ? "text-amber-450" : "text-zinc-100"}`}>
                            {item.stockBranch2}
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                              onClick={() => handleUpdateStockDirect(item.id, "branch2", -1)}
                              className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs font-bold"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleUpdateStockDirect(item.id, "branch2", 1)}
                              className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-emerald-400 rounded-lg border border-zinc-800 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Instant Transfer Actions bar for ease of use */}
                      <div className="bg-zinc-900/40 p-2 rounded-xl text-center space-y-1.5 border border-zinc-900">
                        <span className="text-[9.5px] text-zinc-500 font-bold block mb-1">🔄 النقل الفوري بضغطة واحدة من الفون:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleQuickTransferOnePiece(item.id, "b1to2")}
                            disabled={item.stockBranch1 < 1}
                            className="bg-zinc-950 hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none text-[10px] text-emerald-400 py-2 px-2.5 rounded-lg font-bold border border-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>تحويل قطعة للفرع ② ➜</span>
                          </button>
                          <button
                            onClick={() => handleQuickTransferOnePiece(item.id, "b2tob1")}
                            disabled={item.stockBranch2 < 1}
                            className="bg-zinc-950 hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none text-[10px] text-amber-500 py-2 px-2.5 rounded-lg font-bold border border-amber-950 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>➜ تحويل قطعة للفرع ①</span>
                          </button>
                        </div>
                      </div>

                      {/* Pricing list panel for mobile */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1 border-t border-zinc-900">
                        {currentUser === "admin" && (
                          <div className="col-span-2 flex justify-between py-1 text-rose-450 font-bold">
                            <span>سعر التكلفة:</span>
                            <span>{item.priceCost !== undefined ? item.priceCost : "—"} ج.م</span>
                          </div>
                        )}
                        <div className="flex justify-between py-0.5">
                          <span className="text-zinc-500">الجملة:</span>
                          <span className="text-zinc-300 font-semibold">{item.priceWholesale} ج.م</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-zinc-500">القطاعي الافتراضي:</span>
                          <span className="text-emerald-400 font-extrabold">{item.priceRetail} ج.م</span>
                        </div>
                        <div className="col-span-2 flex justify-between py-0.5 text-[10.5px] text-amber-400 font-medium">
                          <span>حد الخصم المقبول:</span>
                          <span>{item.maxDiscountProfitPercent !== undefined ? item.maxDiscountProfitPercent : 50}% من الربح</span>
                        </div>
                        <div className="col-span-2 flex justify-between py-0.5 text-[10px] text-zinc-500">
                          <span>إجمالي القطع بالفروع:</span>
                          <span className="font-bold text-zinc-300">{totalStock} قطع</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
