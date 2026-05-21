import { Menu, Search, ShoppingBag, LogOut, ShieldAlert } from "lucide-react";
import { auth, logout } from "@/src/lib/firebase";
import { cn } from "@/src/lib/utils";

interface HeaderProps {
  isAdminView?: boolean;
  setIsAdminView?: (value: boolean) => void;
}

export default function Header({ isAdminView = false, setIsAdminView }: HeaderProps) {
  const user = auth.currentUser;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/5 px-10 py-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-gray-50 rounded-full transition-colors" id="hamburger-menu">
          <Menu className="w-6 h-6 text-brand-primary" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary rounded-none flex items-center justify-center rotate-3 shadow-md">
            <span className="text-white font-serif font-bold text-xl">ס</span>
          </div>
          <div className="hidden md:block text-right">
            <h1 className="font-extrabold text-brand-primary text-xl tracking-tight">ח.סבן חומרי בנין 1994 בע"מ</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-brand-accent text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">AI KATALOG</span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Premium Art Selection</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden lg:block">
        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
          <input 
            type="text" 
            placeholder="חפש מוצרים, נתונים טכניים או סרטוני הדרכה..."
            className="w-full bg-gray-50 border-none rounded-full py-2 pr-10 pl-4 focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && setIsAdminView && (
          <button 
            onClick={() => setIsAdminView(!isAdminView)}
            className={cn(
              "px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-sm flex items-center gap-1.5",
              isAdminView 
                ? "bg-brand-accent text-white border-none shadow-md" 
                : "bg-white text-brand-primary border border-gray-100 hover:border-brand-primary hover:bg-gray-50"
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {isAdminView ? "חזרה לקטלוג" : "מנהל מלאי"}
          </button>
        )}

        {user && (
          <div className="flex items-center gap-3 px-3 py-1 border border-gray-100 rounded-full bg-gray-50/50">
            <div className="hidden sm:block text-left text-[10px]">
              <p className="font-bold text-gray-900 truncate max-w-[100px]">{user.displayName}</p>
              <button 
                onClick={logout}
                className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                 התנתק <LogOut className="w-2 h-2" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt={user.displayName || "User"} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ShoppingBag className="w-6 h-6 text-gray-800" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
