import { useState, useEffect, useRef } from "react";
import { Send, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { cn } from "@/src/lib/utils";
import { db, auth } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: "user" | "noa";
  content: string;
  data?: any;
}

interface NoaSidebarProps {
  products: Product[];
}

import { Product } from "@/src/data/mockProducts";

export default function NoaSidebar({ products }: NoaSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: "noa", content: "שלום! אני נועה, המלווה הדיגיטלית של ח.סבן. איך אוכל לעזור לך עם מוצרי הבנייה שלנו היום?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    // Prepare context from products
    const inventoryContext = products.map(p => 
      `Product: ${p.name}, SKU: ${p.sku}, Category: ${p.category}, Stock: ${p.stock}, Price: ₪${p.price}, Unit: ${p.unit}, Specs: ${JSON.stringify(p.specs)}`
    ).join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: currentInput,
        config: {
          systemInstruction: `You are Noa, a professional female AI assistant for "H. Saban Construction Materials 1994 Ltd". 
          Your tone is professional, helpful, and expert. You speak ONLY Hebrew.
          
          Here is the current LIVE inventory context:
          ${inventoryContext}

          Your goal is to assist with technical specs (drying time, coverage, application), inventory availability, and product recommendations based on the provided list.
          If a product has 0 stock, let the user know it is currently out of stock but can be ordered.
          Always maintain the professional Saban brand personality.`
        }
      });

      const aiText = response.text || "סליחה, נתקלתי בקושי קטן. אשמח שתנסה שוב.";
      const noaMessage: Message = { role: "noa", content: aiText };
      setMessages(prev => [...prev, noaMessage]);

      // 1. Log to Firestore (Pillar 8/10 compliant)
      if (auth.currentUser) {
        await addDoc(collection(db, "ai_logs"), {
          userId: auth.currentUser.uid,
          userQuery: currentInput,
          aiResponse: aiText,
          sku: "General",
          timestamp: serverTimestamp()
        });
      }

      // 2. Log to Sheets (Proxy via server)
      fetch("/api/log-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userQuery: currentInput, 
          aiResponse: aiText, 
          sku: "General" 
        }),
      }).catch(err => console.error("Sheets log failed:", err));

    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 bottom-0 z-40 bg-brand-noa transition-all duration-500 ease-in-out flex flex-col shadow-2xl",
      isOpen ? "w-[320px]" : "w-16"
    )}>
      {/* Header / Toggle */}
      <div className="p-8 pb-4 text-center border-b border-white/5">
        <div className={cn("transition-all duration-500", isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 invisible")}>
          <div className="relative mx-auto mb-4 w-20 h-20">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-accent shadow-[0_0_20px_rgba(197,160,89,0.3)]">
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                <span className="text-brand-accent font-serif text-3xl font-bold italic tracking-tighter">N</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-brand-noa"></div>
          </div>
          <h2 className="font-serif font-bold text-white text-lg">נועה — מומחית AI</h2>
          <p className="text-[10px] text-brand-accent font-black uppercase tracking-widest mt-1 opacity-80">Professional Consultant</p>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-4 top-8 p-1.5 hover:bg-white/5 rounded-full transition-colors"
        >
          {isOpen ? <Minimize2 className="w-4 h-4 text-gray-500" /> : <Maximize2 className="w-4 h-4 text-gray-500" />}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Chat Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === "user" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex flex-col max-w-[90%]",
                    msg.role === "user" ? "mr-auto items-end" : "ml-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 text-xs leading-relaxed transition-all",
                    msg.role === "user" 
                      ? "bg-brand-accent text-white rounded-lg rounded-br-none" 
                      : "bg-white/5 text-gray-300 rounded-lg rounded-bl-none border-r-2 border-brand-accent"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] font-bold text-gray-600 mt-1 uppercase tracking-widest">
                    {msg.role === "noa" ? "Noa AI" : "You"}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/5">
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="שאל אותי על מפרטי מוצרים..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pr-4 pl-10 focus:border-brand-accent/50 focus:bg-white/[0.08] transition-all outline-none text-xs text-white resize-none h-[80px]"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="absolute left-2 bottom-2 p-2 text-brand-accent hover:text-white transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="pb-6 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                <Sparkles className="w-3 h-3 text-brand-accent" />
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Saban-AI v2.4</span>
             </div>
          </div>
        </>
      )}

      {!isOpen && (
        <div className="flex-1 flex flex-col items-center py-6 gap-6">
          <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
