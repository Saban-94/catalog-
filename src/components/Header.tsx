import { Menu, Search, ShoppingBag, LogOut } from "lucide-react";
import { auth, logout } from "@/src/lib/firebase";

export default function Header() {
  const user = auth.currentUser;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-white/5 px-10 py-6 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors" id="hamburger-menu">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-accent rounded-none flex items-center justify-center rotate-3 shadow-[0_0_20px_rgba(197,160,89,0.3)]">
            <span className="text-black font-serif font-bold text-xl">ס</span>
          </div>
          <div className="hidden md:block text-right">
            <h1 className="font-extrabold text-white text-xl tracking-tight">ח.סבן חומרי בנין 1994 בע"מ</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-brand-accent text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">AI KATALOG</span>
              <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest">Premium Art Selection</p>
            </div>
          </div>
        </div>
      </div>
 
      <div className="flex-1 max-w-xl mx-8 hidden lg:block">
        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary group-focus-within:text-brand-accent transition-colors" />
          <input 
            type="text" 
            placeholder="חפש מוצרים, נתונים טכניים או סרטוני הדרכה..."
            className="w-full bg-white/5 border border-white/5 rounded-full py-2 pr-10 pl-4 focus:ring-2 focus:ring-brand-accent/20 transition-all outline-none text-sm text-white placeholder:text-brand-secondary/50"
          />
        </div>
      </div>
 
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3 px-3 py-1 border border-white/5 rounded-full bg-white/5">
            <div className="hidden sm:block text-left text-[10px]">
              <p className="font-bold text-white truncate max-w-[100px]">{user.displayName}</p>
              <button 
                onClick={logout}
                className="text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                 התנתק <LogOut className="w-2 h-2" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-accent/30 shadow-sm">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt={user.displayName || "User"} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
        <button className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
          <ShoppingBag className="w-6 h-6 text-white" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-accent rounded-full border border-black"></span>
        </button>
      </div>
    </header>
  );
}
