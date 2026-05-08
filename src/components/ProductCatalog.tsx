import { useState } from "react";
import { Product } from "@/src/data/mockProducts";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, PackageSearch } from "lucide-react";

interface ProductCatalogProps {
  products: Product[];
  loading: boolean;
}

export default function ProductCatalog({ products, loading }: ProductCatalogProps) {
  const [filter, setFilter] = useState("הכל");

  const filteredProducts = products.filter(p => 
    filter === "הכל" || p.category === filter
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="font-bold animate-pulse">טוען קטלוג מוצרים...</p>
      </div>
    );
  }

  return (
    <section className="py-12 relative">
      <div className="absolute -left-10 top-0 h-full w-[1px] bg-black/5 hidden xl:block"></div>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
        <div className="relative">
          <div className="absolute -top-6 right-0 text-[10px] text-brand-accent font-black uppercase tracking-[0.4em] opacity-80">Collection 2024 / Artistic</div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-serif italic text-white mb-2"
          >
            קטלוג מוצרים <span className="font-sans not-italic font-black text-2xl ml-2 opacity-20 text-brand-accent">/01</span>
          </motion.h2>
          <p className="text-brand-secondary max-w-sm text-sm leading-relaxed">
            אוצרות מובחרת של פתרונות בנייה ועיצוב. כל מוצר נבחר בקפידה עבור פרויקטים הדורשים שלמות אמנותית ועמידות מקסימלית.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {["הכל", "צבעים", "דבקים", "כלי עבודה"].map((cat) => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-none ${
                filter === cat 
                ? "bg-brand-accent text-black shadow-[0_0_20px_rgba(197,160,89,0.3)]" 
                : "bg-white/5 text-brand-secondary border border-white/5 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[40vh] flex flex-col items-center justify-center text-gray-400 gap-4 border-2 border-dashed border-gray-100 rounded-[32px]"
          >
            <PackageSearch className="w-12 h-12 opacity-20" />
            <p className="text-lg">לא נמצאו מוצרים בקטגוריה זו</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
