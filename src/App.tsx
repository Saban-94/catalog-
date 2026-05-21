/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, loginWithGoogle } from "./lib/firebase";
import Header from "./components/Header";
import NoaSidebar from "./components/NoaSidebar";
import ProductCatalog from "./components/ProductCatalog";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, LogIn, Construction, Sparkles } from "lucide-react";
import { cn } from "./lib/utils";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
        <p className="font-bold text-gray-400">מתחבר למערכת ח.סבן...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 text-right">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] -right-20 w-[600px] h-[600px] bg-gray-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-red-50/20 rounded-full blur-[100px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-[40px] p-10 shadow-2xl shadow-black/5 text-center"
        >
          <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl">
             <span className="text-white font-bold text-4xl">ס</span>
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-3">ברוכים הבאים לקטלוג ה-AI</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            של ח.סבן חומרי בנין 1994 בע"מ.
            <br />
            התחברו כדי לצפות במלאי, נתונים טכניים וייעוץ חכם.
          </p>

          <button 
            onClick={loginWithGoogle}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            <LogIn className="w-5 h-5" /> התחברות עם Google
          </button>

          <div className="mt-10 pt-10 border-t border-gray-50 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <Construction className="w-5 h-5 text-gray-300" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Construction</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-5 h-5 text-gray-300" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">AI Powered</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] -right-20 w-[600px] h-[600px] bg-gray-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-red-50/20 rounded-full blur-[100px]"></div>
      </div>

      <Header />
      
      <div className="flex">
        {/* Sidebar Space Placeholder - The sidebar is fixed */}
        <div className={cn("shrink-0 transition-all duration-500", user ? (loading ? "w-0" : "w-16 lg:w-[320px]") : "w-0")}></div>
        
        <main className="flex-1 px-12 pt-32 pb-20 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <ProductCatalog />
          </motion.div>

          <footer className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-400 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">ח.סבן</span>
              <span>© 2026 כל הזכויות שמורות</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-black transition-colors">תנאי שימוש</a>
              <a href="#" className="hover:text-black transition-colors">פרטיות</a>
              <a href="#" className="hover:text-black transition-colors">צור קשר</a>
            </div>
            <div className="text-[10px] uppercase tracking-widest bg-gray-50 px-4 py-1 rounded-full text-gray-300">
              Artistic AI Platform v2.0
            </div>
          </footer>
        </main>
      </div>

      <NoaSidebar />
    </div>
  );
}
