import { Info, Play, ExternalLink, Package, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Product } from "@/src/data/mockProducts";
import { cn } from "@/src/lib/utils";

interface ProductCardProps {
  product: Product;
  key?: string;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-transparent overflow-visible"
    >
      {/* Artistic Background Stack */}
      <div className="absolute inset-0 bg-white shadow-xl artistic-shadow rounded-sm -rotate-2 -z-10 transition-transform duration-500 group-hover:rotate-0"></div>
      
      <div className="relative bg-white rounded-sm overflow-hidden border border-gray-100 flex flex-col h-full">
        {/* Image Layer */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 flex items-center justify-center p-4">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="absolute top-4 right-4 bg-brand-accent text-white px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-widest shadow-lg">
            {product.category}
          </div>
          
          {/* Internal Tech Spec Overlay (Artistic Touch) */}
          <div className="absolute -bottom-2 -left-2 bg-brand-primary text-white p-4 max-w-[160px] rounded-tr-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20">
            <h4 className="text-[8px] text-brand-accent font-black uppercase tracking-widest mb-2 border-b border-white/10 pb-1">מפרט טכני</h4>
            {product.specs.dryingTime && (
              <div className="flex justify-between text-[9px] mb-1">
                <span className="opacity-60">ייבוש</span>
                <span className="font-bold">{product.specs.dryingTime}</span>
              </div>
            )}
            {product.specs.coverage && (
              <div className="flex justify-between text-[9px]">
                <span className="opacity-60">כיסוי</span>
                <span className="font-bold">{product.specs.coverage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Layer */}
        <div className="p-6 bg-white flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-serif text-lg font-bold text-brand-primary leading-tight line-clamp-2">{product.name}</h3>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="h-[1px] flex-1 bg-gray-100"></div>
            <span className="text-gray-300 text-[10px] font-mono tracking-widest uppercase">{product.sku}</span>
          </div>

          <div className="mt-auto">
            <div className="flex items-end gap-1 mb-4">
              <span className="text-2xl font-black text-brand-primary">₪{product.price}</span>
              <span className="text-gray-400 text-xs mb-1.5 font-medium">/ {product.unit}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  product.stock > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"
                )}></div>
                <span className="text-xs font-bold text-gray-500">
                  {product.stock > 0 ? `${product.stock} יח' במלאי` : "אזל"}
                </span>
              </div>
              <button className="p-2 border border-gray-100 rounded-sm hover:bg-brand-primary hover:text-white transition-all">
                <Package className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
