import React, { useState } from "react";
import { LogIn, ShieldCheck, Lock, User, Sparkles } from "lucide-react";

interface LoginScreenProps {
  onLogin: (user: "admin" | "user 1" | "user 2" | "customer") => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<"admin" | "user 1" | "user 2">("admin");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin") {
      onLogin(selectedUser);
      setErrorMsg("");
    } else {
      setErrorMsg("كلمة المرور غير صحيحة! يرجى إدخال كلمة المرور الصحيحة.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 text-right" dir="rtl">
      {/* Visual background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Brand visual header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl relative group">
            <div className="w-8 h-8 border-4 border-black rotate-45 transition transform duration-500 group-hover:rotate-180" />
            <Sparkles className="w-4 h-4 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white animate-pulse">BLACKHOURS</h1>
            <p className="text-[11px] text-neutral-400 mt-1 uppercase tracking-wider font-bold">مجموعة المحلات وماركت بليس قطع الغيار</p>
          </div>
        </div>

        {/* Enter as Customer Card Button (No authorization required!) */}
        <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6 text-center space-y-3 shadow-lg">
          <p className="text-xs font-black text-white">🛍️ ماركت بليس العملاء والمشترين</p>
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            تصفح الشاشات، البطاريات، الأغطية الخلفية، اطلب أونلاين بالدفع الإلكتروني أو عند الاستلام، وتتبع طلبك فوراً برقم الهاتف.
          </p>
          <button
            type="button"
            onClick={() => onLogin("customer")}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            زيارة معرض المنتجات والطلب السريع
          </button>
        </div>

        <div className="relative flex py-3 items-center">
          <div className="flex-grow border-t border-neutral-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-neutral-500 font-bold">أو دخول الموظفين / الإدارة</span>
          <div className="flex-grow border-t border-neutral-800"></div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5 mt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-400 mr-1">اختر حساب الموظف / الدور:</label>
            <div className="relative">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition rounded-xl px-4 py-2.5 pr-10 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 appearance-none font-bold"
              >
                <option value="admin">المدير العام للمجموعة (admin)</option>
                <option value="user 1">مُشرف فرع 1 - الرئيسي (user 1)</option>
                <option value="user 2">مُشرف فرع 2 - الفرعي (user 2)</option>
              </select>
              <User className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-400 mr-1">كلمة المرور المشتركة للتعديل والمبيعات:</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition rounded-xl px-4 py-2.5 pr-10 text-xs text-neutral-200 outline-none focus:border-cyan-500/50 font-mono tracking-widest text-center"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[9px] text-neutral-500 mr-1">كلمة مرور الموظفين الافتراضية هي: admin</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-300 text-xs rounded-xl flex items-center gap-2 animate-pulse justify-center">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-white hover:bg-neutral-200 text-black font-extrabold py-3 rounded-xl text-xs transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            دخول لوحة التحكم الإدارية
          </button>
        </form>

        {/* Footnotes */}
        <div className="text-center mt-6 text-[10px] text-neutral-500 font-bold">
          <p>© {new Date().getFullYear()} BLACKHOURS MOBILES GROUP</p>
          <p className="text-[9px] text-neutral-600 mt-1">مشفر فوريًا وبث ثنائي الاتجاه</p>
        </div>
      </div>
    </div>
  );
}
