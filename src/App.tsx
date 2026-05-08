/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth, loginWithGoogle } from "./lib/firebase";
import Header from "./components/Header";
import NoaSidebar from "./components/NoaSidebar";
import ProductCatalog from "./components/ProductCatalog";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, LogIn, Construction, Sparkles } from "lucide-react";
import { cn } from "./lib/utils";
import { Product } from "./data/mockProducts";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "inventory"), orderBy("ProductName", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.sku || doc.id,
          sku: data.sku || "",
          name: data.ProductName || "",
          category: data.category || "General",
          price: data.price || 0,
          stock: data.currentStock || 0,
          unit: data.unit || "יחידה",
          image: data.image || "https://picsum.photos/seed/saban/400/300",
          specs: data.specs || {},
          ...data
        };
      }) as Product[];
      setProducts(prods);
      setProductsLoading(false);
    }, (error) => {
      console.error("Fetch Error:", error);
      setProductsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-brand-accent scale-110" />
        <p className="font-bold text-brand-secondary tracking-widest uppercase text-[10px]">Initializing Saban-AI Architecture...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-right relative overflow-hidden">
        {/* Artistic Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg bg-brand-card/40 backdrop-blur-3xl border border-white/5 rounded-none p-16 shadow-[0_40px_80px_rgba(0,0,0,0.5)] text-center group"
        >
          <div className="relative mb-12 inline-block">
             <div className="w-24 h-24 bg-brand-accent rounded-none flex items-center justify-center rotate-6 shadow-[0_0_40px_rgba(197,160,89,0.3)] group-hover:rotate-0 transition-transform duration-700">
                <span className="text-black font-serif font-black text-5xl">ס</span>
             </div>
             <div className="absolute inset-0 bg-brand-accent/20 blur-2xl -z-10 group-hover:bg-brand-accent/40 transition-colors"></div>
          </div>
          
          <h1 className="text-4xl font-serif italic text-white mb-4 leading-tight">ברוכים הבאים <br/> <span className="font-sans not-italic font-black text-xl text-brand-accent tracking-[0.2em] uppercase">Premium AI Catalog</span></h1>
          <p className="text-brand-secondary mb-12 leading-relaxed text-sm max-w-sm mx-auto">
            ח.סבן חומרי בנין 1994 בע"מ מזמינה אותך לחוויית רכישה דיגיטלית מתקדמת.
            גלה מלאי חי, נתונים טכניים ובינה מלאכותית לשירותך.
          </p>

          <button 
            onClick={loginWithGoogle}
            className="w-full py-5 bg-brand-accent text-black rounded-none font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all"
          >
            <LogIn className="w-4 h-4" /> התחברות מאובטחת עם Google
          </button>

          <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <Construction className="w-5 h-5 text-brand-accent opacity-50" />
              <span className="text-[9px] font-black text-brand-secondary uppercase tracking-[0.3em]">Construction</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-accent" />
              <span className="text-[9px] font-black text-brand-accent uppercase tracking-[0.3em]">AI Intelligence</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans selection:bg-brand-accent selection:text-black">
      <Header />
      
      <div className="flex">
        {/* Sidebar Space Placeholder */}
        <div className={cn("shrink-0 transition-all duration-700 ease-in-out", user ? (loading ? "w-0" : "w-16 lg:w-[320px]") : "w-0")}></div>
        
        <main className="flex-1 px-16 pt-40 pb-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <ProductCatalog products={products} loading={productsLoading} />
          </motion.div>

          <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-brand-secondary text-[11px] font-black uppercase tracking-[0.2em]">
            <div className="flex items-center gap-4">
              <span className="text-white font-serif italic text-lg lowercase">saban.</span>
              <span className="opacity-50 tracking-normal text-right">© 2026 Architectural Excellence</span>
            </div>
            <div className="flex gap-12">
              <a href="#" className="hover:text-brand-accent transition-colors">Legal</a>
              <a href="#" className="hover:text-brand-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-brand-accent transition-colors">Contact</a>
            </div>
            <div className="bg-brand-accent/10 px-6 py-2 rounded-none text-brand-accent border border-brand-accent/20">
              Saban-AI Platform v3.1.0
            </div>
          </footer>
        </main>
      </div>

      <NoaSidebar products={products} />
    </div>
  );
}
