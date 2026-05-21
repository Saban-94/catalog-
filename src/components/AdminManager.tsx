import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase";
import { Product, MOCK_PRODUCTS } from "@/src/data/mockProducts";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  X, 
  Check, 
  Package, 
  ChevronRight, 
  FileText, 
  Video, 
  Layers, 
  Database, 
  Settings, 
  HelpCircle, 
  Download, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import Papa from "papaparse";

//--- Error Handling Pattern as per firebase-integration skill ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["צבעים", "דבקים וחומרי מליטה", "כלי עבודה"]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [sortBy, setSortBy] = useState<"sku" | "name" | "price" | "stock">("name");
  
  // Modals & Forms State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // New Product Form state
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("צבעים");
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newStock, setNewStock] = useState<number>(0);
  const [newUnit, setNewUnit] = useState("יחידה");
  const [newImage, setNewImage] = useState("");
  const [newDriveFolder, setNewDriveFolder] = useState("");
  const [newTutorial, setNewTutorial] = useState("");
  const [newRelatedSkus, setNewRelatedSkus] = useState("");
  const [newDryingTime, setNewDryingTime] = useState("");
  const [newCoverage, setNewCoverage] = useState("");
  const [newApplication, setNewApplication] = useState("");
  const [newCustomSpecs, setNewCustomSpecs] = useState<string>("{\n  \n}");

  // Batch CSV Injection State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState("");
  const [csvSuccessMessage, setCsvSuccessMessage] = useState("");
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  // Dynamic Categories from Firestore Config
  const [newCategoryName, setNewCategoryName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize dynamic lists & products from Firestore realtime
  useEffect(() => {
    const qProducts = query(collection(db, "inventory"));
    
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const rawName = data.name || data.productName || "מוצר ללא שם";
        items.push({
          id: doc.id,
          sku: data.sku || doc.id,
          name: rawName,
          category: data.category || "כללי",
          price: Number(data.price) || 0,
          stock: Number(data.stock !== undefined ? data.stock : (data.currentStock !== undefined ? data.currentStock : 0)) || 0,
          unit: data.unit || "יחידה",
          image: data.image || data.imageUrl || "https://picsum.photos/seed/saban/400/300",
          specs: data.specs || {},
          driveFolderLink: data.driveFolderLink || "",
          tutorialLink: data.tutorialLink || "",
          relatedSkus: data.relatedSkus || []
        });
      });
      setProducts(items);

      // Extract unique categories dynamically too
      const uniqueCats = Array.from(new Set(items.map(p => p.category).filter(Boolean)));
      if (uniqueCats.length > 0) {
        setCategories(prev => {
          const combined = Array.from(new Set([...prev, ...uniqueCats]));
          return combined;
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in AdminManager onSnapshot:", error);
      setLoading(false);
    });

    return () => unsubProducts();
  }, []);

  // Save Dynamic Category Helper to Firestore as metadata or local
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (!categories.includes(cat)) {
      setCategories([...categories, cat]);
      setNewCategoryName("");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  // Create Product Document 
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) {
      alert("נא למלא מק\"ט ושם מוצר");
      return;
    }

    const cleanSku = newSku.trim().toUpperCase();
    const cleanName = newName.trim();

    // Parse specs JSON safely
    let parsedSpecs: any = {
      dryingTime: newDryingTime.trim() || undefined,
      coverage: newCoverage.trim() || undefined,
      applicationMethod: newApplication.trim() || undefined,
    };

    try {
      if (newCustomSpecs.trim()) {
        const extra = JSON.parse(newCustomSpecs);
        parsedSpecs = { ...parsedSpecs, ...extra };
      }
    } catch (e) {
      alert("מבנה ה-JSON של המפרט הטכני הנוסף אינו תקין. נא לתקן.");
      return;
    }

    const productPayload = {
      sku: cleanSku,
      name: cleanName,
      productName: cleanName, // Compatibility with product ordering query
      category: newCategory,
      price: Number(newPrice) || 0,
      stock: Number(newStock) || 0,
      unit: newUnit,
      image: newImage.trim() || `https://picsum.photos/seed/${cleanSku.toLowerCase()}/400/300`,
      imageUrl: newImage.trim() || `https://picsum.photos/seed/${cleanSku.toLowerCase()}/400/300`,
      driveFolderLink: newDriveFolder.trim(),
      tutorialLink: newTutorial.trim(),
      relatedSkus: newRelatedSkus.split(",").map(s => s.trim()).filter(Boolean),
      specs: parsedSpecs,
      updatedAt: new Date().toISOString()
    };

    try {
      // Document ID set matches the SKU
      const docRef = doc(db, "inventory", cleanSku);
      await setDoc(docRef, productPayload);
      
      // Reset State
      setNewSku("");
      setNewName("");
      setNewPrice(0);
      setNewStock(0);
      setNewUnit("יחידה");
      setNewImage("");
      setNewDriveFolder("");
      setNewTutorial("");
      setNewRelatedSkus("");
      setNewDryingTime("");
      setNewCoverage("");
      setNewApplication("");
      setNewCustomSpecs("{\n  \n}");
      
      setIsAddModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `inventory/${cleanSku}`);
    }
  };

  // Update Product Document
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const docRef = doc(db, "inventory", editingProduct.sku);
      
      // Update with matching structure
      await setDoc(docRef, {
        sku: editingProduct.sku,
        name: editingProduct.name,
        productName: editingProduct.name, // Compatibility
        category: editingProduct.category,
        price: Number(editingProduct.price) || 0,
        stock: Number(editingProduct.stock) || 0,
        unit: editingProduct.unit,
        image: editingProduct.image,
        imageUrl: editingProduct.image,
        driveFolderLink: editingProduct.driveFolderLink || "",
        tutorialLink: editingProduct.tutorialLink || "",
        relatedSkus: editingProduct.relatedSkus || [],
        specs: editingProduct.specs || {},
        updatedAt: new Date().toISOString()
      });

      setEditingProduct(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `inventory/${editingProduct.sku}`);
    }
  };

  // Delete Product Document
  const handleDeleteProduct = async (sku: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק לצמיתות את מוצר ${sku}?`)) return;

    try {
      const docRef = doc(db, "inventory", sku);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${sku}`);
    }
  };

  // CSV Drag and Drop / Choose File
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvError("");
      setCsvSuccessMessage("");
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvPreview(results.data.slice(0, 5));
        },
        error: (error) => {
          setCsvError(`שגיאה בפענוח קובץ ה-CSV: ${error.message}`);
        }
      });
    }
  };

  // Upload and Inject CSV Products
  const handleBulkUploadCsv = async () => {
    if (!csvFile) return;
    setIsUploadingCsv(true);
    setCsvError("");
    setCsvSuccessMessage("");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let failCount = 0;

        for (const row of results.data as any[]) {
          const skuRaw = row.sku || row.Sku || row.SKU || row["מק\"ט"] || "";
          const nameRaw = row.name || row.Name || row.productName || row.ProductName || row["שם מוצר"] || "";
          
          if (!skuRaw || !nameRaw) {
            failCount++;
            continue;
          }

          const cleanSku = skuRaw.trim().toUpperCase();
          const cleanName = nameRaw.trim();
          const category = row.category || row.Category || row["קטגוריה"] || "כללי";
          const price = parseFloat(row.price || row.Price || row["מחיר"] || "0") || 0;
          const stock = parseInt(row.stock || row.Stock || row.currentStock || row["מלאי"] || "0", 10) || 0;
          const unit = row.unit || row.Unit || row["יחידה"] || "יחידה";
          const image = row.image || row.Image || row.imageUrl || row.ImageUrl || row["תמונה"] || "";

          // build custom specs
          let specsObj: any = {};
          if (row.dryingTime || row["זמן ייבוש"]) specsObj.dryingTime = row.dryingTime || row["זמן ייבוש"];
          if (row.coverage || row["כושר כיסוי"]) specsObj.coverage = row.coverage || row["כושר כיסוי"];
          if (row.applicationMethod || row["אופן יישום"]) specsObj.applicationMethod = row.applicationMethod || row["אופן יישום"];

          // merge row raw specs if any JSON
          if (row.specs) {
            try {
              const extra = JSON.parse(row.specs);
              specsObj = { ...specsObj, ...extra };
            } catch {
              // try comma separation
              row.specs.split(",").forEach((item: string) => {
                const parts = item.split(":");
                if (parts.length === 2) {
                  specsObj[parts[0].trim()] = parts[1].trim();
                }
              });
            }
          }

          const payload = {
            sku: cleanSku,
            name: cleanName,
            productName: cleanName,
            category,
            price,
            stock,
            unit,
            image: image || `https://picsum.photos/seed/${cleanSku.toLowerCase()}/400/300`,
            imageUrl: image || `https://picsum.photos/seed/${cleanSku.toLowerCase()}/400/300`,
            driveFolderLink: row.driveFolderLink || row.DriveFolderLink || "",
            tutorialLink: row.tutorialLink || row.TutorialLink || "",
            relatedSkus: row.relatedSkus ? row.relatedSkus.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
            specs: specsObj,
            updatedAt: new Date().toISOString()
          };

          try {
            await setDoc(doc(db, "inventory", cleanSku), payload);
            successCount++;
          } catch (err) {
            console.error(`Failing row SKU: ${cleanSku}`, err);
            failCount++;
          }
        }

        setCsvSuccessMessage(`הזרקת CSV הושלמה בהצלחה! ${successCount} מוצרים עודכנו/נוספו. נכשלו: ${failCount}.`);
        setIsUploadingCsv(false);
        setCsvFile(null);
        setCsvPreview([]);
      },
      error: (err) => {
        setCsvError(`נכשל בהזרקת קבצים: ${err.message}`);
        setIsUploadingCsv(false);
      }
    });
  };

  // Advanced Raw Specs Editor changes
  const handleEditSpecValue = (key: string, value: any) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      specs: {
        ...editingProduct.specs,
        [key]: value
      }
    });
  };

  const handleAddSpecField = (key: string, value: string) => {
    if (!editingProduct || !key.trim()) return;
    setEditingProduct({
      ...editingProduct,
      specs: {
        ...editingProduct.specs,
        [key.trim()]: value
      }
    });
  };

  const handleRemoveSpecField = (key: string) => {
    if (!editingProduct) return;
    const copiedSpecs = { ...editingProduct.specs };
    delete copiedSpecs[key];
    setEditingProduct({
      ...editingProduct,
      specs: copiedSpecs
    });
  };

  // Filter & Search Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "הכל" || p.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "sku") return a.sku.localeCompare(b.sku);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price") return b.price - a.price;
    if (sortBy === "stock") return b.stock - a.stock;
    return 0;
  });

  // Export Inventory to CSV helper
  const handleExportCsv = () => {
    const records = products.map(p => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      image: p.image,
      driveFolderLink: p.driveFolderLink || "",
      tutorialLink: p.tutorialLink || "",
      relatedSkus: p.relatedSkus?.join(",") || "",
      specs: JSON.stringify(p.specs || {})
    }));

    const csvOutput = Papa.unparse(records);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Saban_Inventory_Backup_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 text-right" dir="rtl">
      
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-black/[0.03] pb-10">
        <div>
          <span className="text-[10px] text-brand-accent font-black uppercase tracking-[0.4em] block mb-2">SABAN ENGINE v2.5</span>
          <h1 className="text-5xl font-serif font-black text-brand-primary">מרכז שליטה ומלאי</h1>
          <p className="text-gray-400 text-sm mt-1">ניהול מלאי, ייבוא נתונים ובקרת איכות על קטלוג המוצרים של ח.סבן.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-brand-primary text-white font-black text-xs uppercase tracking-wider rounded-none flex items-center gap-2 hover:bg-brand-accent transition-all shadow-xl"
          >
            <Plus className="w-4 h-4" /> מוצר חדש
          </button>
          
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-6 py-3 bg-white border border-gray-100 text-brand-primary font-black text-xs uppercase tracking-wider rounded-none flex items-center gap-2 hover:border-black transition-all"
          >
            <Layers className="w-4 h-4" /> ניהול קטגוריות
          </button>

          <button 
            onClick={handleExportCsv}
            className="px-6 py-3 bg-white border border-gray-100 text-gray-500 font-bold text-xs rounded-none flex items-center gap-2 hover:text-black hover:border-black transition-all"
            title="ייצוא קובץ גיבוי"
          >
            <Download className="w-4 h-4" /> גיבוי CSV
          </button>
        </div>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 p-8 shadow-sm relative overflow-hidden">
          <Database className="absolute bottom-4 left-4 w-12 h-12 text-gray-50 opacity-10" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">סה"כ פריטים במערכת</p>
          <p className="text-4xl font-serif font-black text-brand-primary">{products.length}</p>
        </div>
        <div className="bg-white border border-gray-100 p-8 shadow-sm relative overflow-hidden">
          <AlertCircle className="absolute bottom-4 left-4 w-12 h-12 text-red-500/10 opacity-10" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">פריטים שאזלו</p>
          <p className={`text-4xl font-serif font-black ${products.filter(p => p.stock <= 0).length > 0 ? "text-brand-accent animate-pulse" : "text-brand-primary"}`}>
            {products.filter(p => p.stock <= 0).length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 p-8 shadow-sm relative overflow-hidden">
          <Package className="absolute bottom-4 left-4 w-12 h-12 text-gray-50 opacity-10" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">שווי מלאי מוערך</p>
          <p className="text-4xl font-serif font-black text-brand-primary">
            ₪{products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-100 p-8 shadow-sm relative overflow-hidden">
          <Settings className="absolute bottom-4 left-4 w-12 h-12 text-gray-50 opacity-10" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">קטגוריות פעילות</p>
          <p className="text-4xl font-serif font-black text-brand-primary">{categories.length}</p>
        </div>
      </div>

      {/* Bulk CSV Injection Panel */}
      <div className="bg-white border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-brand-accent"></div>
          <div>
            <h3 className="text-xl font-serif font-black text-brand-primary">ייבוא ועדכון מהיר (Bulk CSV Injection)</h3>
            <p className="text-xs text-gray-400">הזרקת קובץ CSV כדי לעדכן או לייצר עשרות מוצרים בבת אחת.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-1 border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleCsvChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              ref={fileInputRef}
            />
            <Upload className="w-10 h-10 text-brand-accent mb-3" />
            <h4 className="font-bold text-sm text-brand-primary">שחרר קובץ CSV כאן, או לחץ לבחירה</h4>
            <p className="text-[10px] text-gray-400 mt-1">יתקבלו עמודות: sku, name, category, price, stock, unit, image, specs</p>
            {csvFile && (
              <div className="mt-4 px-3 py-1 bg-brand-primary text-white text-[11px] font-mono">
                {csvFile.name}
              </div>
            )}
          </div>

          {/* Table Preview / Errors & Success */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            {csvPreview.length > 0 ? (
              <div className="overflow-x-auto border border-gray-100 rounded-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-black">
                    <tr>
                      <th className="p-2">מק"ט (SKU)</th>
                      <th className="p-2">שם מוצר</th>
                      <th className="p-2">קטגוריה</th>
                      <th className="p-2">מחיר</th>
                      <th className="p-2">מלאי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-50 text-gray-500">
                        <td className="p-2 font-mono">{row.sku || row.Sku || row.SKU || ""}</td>
                        <td className="p-2 font-bold text-brand-primary">{row.name || row.Name || row.productName || ""}</td>
                        <td className="p-2">{row.category || row.Category || "כללי"}</td>
                        <td className="p-2">₪{row.price || row.Price || 0}</td>
                        <td className="p-2">{row.stock || row.Stock || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-gray-400 p-2 italic text-left">* תצוגה מקדימה של 5 השורות הראשונות</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50/30 border border-gray-100 p-6 text-gray-300">
                לא נטען קובץ תואם כרגע
              </div>
            )}

            {csvError && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 border-r-4 border-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{csvError}</p>
              </div>
            )}

            {csvSuccessMessage && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 border-r-4 border-green-500 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <p>{csvSuccessMessage}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              {csvFile && (
                <button 
                  onClick={() => {
                    setCsvFile(null);
                    setCsvPreview([]);
                    setCsvSuccessMessage("");
                    setCsvError("");
                  }}
                  className="px-4 py-2 border border-gray-100 text-gray-400 text-xs hover:border-black hover:text-black transition-all"
                >
                  נקה
                </button>
              )}
              <button 
                onClick={handleBulkUploadCsv}
                disabled={!csvFile || isUploadingCsv}
                className="px-6 py-3 bg-brand-primary text-white font-black text-xs uppercase tracking-wider disabled:opacity-30 hover:bg-brand-accent transition-all flex items-center gap-2"
              >
                {isUploadingCsv ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> מזרים נתונים...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" /> בצע הזרקה לקטלוג
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Actions Rail */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input 
              type="text" 
              placeholder="חפש לפי מק'ט, שם מוצר או קטגוריה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-sm py-2.5 pr-10 pl-4 focus:ring-1 focus:ring-brand-accent transition-all outline-none text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-black">סנן לפי קטגוריה:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-100 rounded-sm py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-brand-accent"
              >
                <option value="הכל">כל הקטגוריות ({products.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-black">מיין לפי:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-gray-100 rounded-sm py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-brand-accent"
              >
                <option value="name">שם מוצר (א-ת)</option>
                <option value="sku">מק"ט חברת סבן</option>
                <option value="price">מחיר מהגבוה לנמוך</option>
                <option value="stock">מלאי מוגבל ראשון</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real Table */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-300">
            <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
            <p className="text-sm font-bold animate-pulse">טוען רשומות מלאי מ-Firestore...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1A1A1A] text-white uppercase font-black tracking-widest text-[9px]">
                <tr>
                  <th className="p-4">תמונת מוצר</th>
                  <th className="p-4">מק"ט (Document ID)</th>
                  <th className="p-4">שם המוצר</th>
                  <th className="p-4">קטגוריה</th>
                  <th className="p-4">מחיר יחידה</th>
                  <th className="p-4">מלאי זמין (Stock)</th>
                  <th className="p-4">מפרט מפתח</th>
                  <th className="p-4 text-left">פעולות בעלים</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const outOfStock = p.stock <= 0;
                  return (
                    <tr key={p.sku} className={cn("hover:bg-gray-50/70 transition-colors", outOfStock && "bg-brand-accent/[0.01]")}>
                      <td className="p-4">
                        <div className="w-12 h-12 bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center rounded-sm">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className={cn("w-full h-full object-contain", outOfStock && "grayscale opacity-50")}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-900">{p.sku}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-serif font-bold text-sm text-brand-primary">{p.name}</p>
                          <div className="flex gap-2 mt-1">
                            {p.driveFolderLink && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] uppercase tracking-wider bg-gray-100 text-gray-600 px-1 py-0.5 font-bold rounded-sm">
                                <FileText className="w-2.5 h-2.5" /> Google Drive
                              </span>
                            )}
                            {p.tutorialLink && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] uppercase tracking-wider bg-red-50 text-red-600 px-1 py-0.5 font-bold rounded-sm">
                                <Video className="w-2.5 h-2.5" /> Tutorial
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 font-bold">{p.category}</td>
                      <td className="p-4 font-black text-brand-primary">₪{p.price} <span className="text-gray-400 font-normal">/ {p.unit}</span></td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            outOfStock ? "bg-red-500 animate-pulse" : "bg-green-500"
                          )}></div>
                          <span className={cn("font-bold", outOfStock ? "text-red-500" : "text-gray-900")}>
                            {outOfStock ? "מיוחד (0 במלאי)" : `${p.stock} יח'`}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">
                        <div className="space-y-0.5 max-w-[200px] truncate text-[10px]">
                          {p.specs.dryingTime && <p><span className="font-black">ייבוש:</span> {p.specs.dryingTime}</p>}
                          {p.specs.coverage && <p><span className="font-black">כיסוי:</span> {p.specs.coverage}</p>}
                        </div>
                      </td>
                      <td className="p-4 text-left">
                        <div className="inline-flex gap-2">
                          <button 
                            onClick={() => setEditingProduct(p)}
                            className="p-2 border border-blue-100 bg-blue-50/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all rounded-sm"
                            title="ערוך מוצר"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.sku)}
                            className="p-2 border border-red-500/10 bg-red-50/10 text-red-700 hover:bg-red-700 hover:text-white transition-all rounded-sm"
                            title="מחק מוצר"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Package className="w-12 h-12 opacity-10" />
            <p className="text-sm font-bold">לא נמצאו פריטי מלאי העונים להגדרות החיפוש.</p>
          </div>
        )}
      </div>

      {/* Categories modal helper */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border text-right border-gray-100 w-full max-w-lg p-8 relative shadow-2xl rounded-sm"
            >
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-serif font-black text-brand-primary mb-2">ניהול קטגוריות</h3>
              <p className="text-xs text-gray-400 mb-6 font-medium">יצירה, עדכון או מחיקה של קטגוריות זמינות בקטלוג ח.סבן.</p>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="שם קטגוריה חדש..."
                  className="flex-1 bg-gray-50 border border-gray-100 py-3 px-4 outline-none focus:border-brand-accent transition-all text-xs text-right"
                />
                <button 
                  onClick={handleAddCategory}
                  className="px-6 py-3 bg-brand-primary text-white font-black text-xs uppercase hover:bg-brand-accent transition-all"
                >
                  הוסף
                </button>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat} className="flex justify-between items-center bg-gray-50/50 p-3 border border-gray-100">
                    <span className="font-bold text-xs text-brand-primary">{cat}</span>
                    <button 
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Dialog */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white border border-gray-100 w-full max-w-4xl p-8 relative shadow-2xl rounded-sm my-8"
            >
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-3xl font-serif font-black text-brand-primary mb-2">עריכת פריט קטלוג</h3>
              <p className="text-xs text-gray-400 mb-8 font-medium">עדכון מיידי של פרמטרים ומפרט טכני במערכת המלאי הריאקטיבית.</p>

              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">שם המוצר</label>
                    <input 
                      type="text" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מק"ט (מזהה מסמך - לא ניתן לשינוי)</label>
                    <input 
                      type="text" 
                      value={editingProduct.sku}
                      className="w-full bg-gray-100 border border-gray-200 py-2.5 px-3 text-xs opacity-60 font-mono"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">קטגוריה</label>
                    <select 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs outline-none focus:border-brand-accent transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מחיר (₪)</label>
                    <input 
                      type="number" 
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">יחידת מידה</label>
                    <input 
                      type="text" 
                      value={editingProduct.unit}
                      onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מלאי במחסנים (Stock)</label>
                    <input 
                      type="number" 
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">כתובת תמונת מוצר (URL)</label>
                    <input 
                      type="text" 
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">קישור למחיצת Google Drive</label>
                    <input 
                      type="text" 
                      value={editingProduct.driveFolderLink || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, driveFolderLink: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">קישור לשיעור הדרכה (YouTube)</label>
                    <input 
                      type="text" 
                      value={editingProduct.tutorialLink || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tutorialLink: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מוצרי קרוס-סל (מקושרים, מופרדים בפסיקים)</label>
                    <input 
                      type="text" 
                      value={editingProduct.relatedSkus?.join(", ") || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, relatedSkus: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      placeholder="לדוגמא: SBN-001, SBN-002"
                    />
                  </div>
                </div>

                {/* Technical specs - Key Values */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-serif font-black text-brand-primary mb-3">מפרט טכני ראשי</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">זמן ייבוש</label>
                      <input 
                        type="text" 
                        value={editingProduct.specs?.dryingTime || ""}
                        onChange={(e) => handleEditSpecValue("dryingTime", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs"
                        placeholder="שעות פתיחה, ייבוש ראשוני וכו'"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">כושר כיסוי</label>
                      <input 
                        type="text" 
                        value={editingProduct.specs?.coverage || ""}
                        onChange={(e) => handleEditSpecValue("coverage", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs"
                        placeholder="מ''ר לליטר, ק''ג וכו'"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">שיטת יישום מומלצת</label>
                      <input 
                        type="text" 
                        value={editingProduct.specs?.applicationMethod || ""}
                        onChange={(e) => handleEditSpecValue("applicationMethod", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs"
                        placeholder="רולר, מאג' פנצ'ב, מברשת וכו'"
                      />
                    </div>
                  </div>

                  {/* Dynamic specification key values */}
                  <div className="mt-6">
                    <h5 className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-3">תכונות טכניות נוספות (Spec Attributes):</h5>
                    <div className="space-y-2">
                      {Object.entries(editingProduct.specs || {}).map(([key, value]) => {
                        if (["dryingTime", "coverage", "applicationMethod"].includes(key)) return null;
                        return (
                          <div key={key} className="flex gap-2 items-center text-xs">
                            <span className="font-bold text-brand-primary bg-gray-100 px-3 py-1 min-w-[120px]">{key}</span>
                            <input 
                              type="text" 
                              value={value} 
                              onChange={(e) => handleEditSpecValue(key, e.target.value)}
                              className="bg-gray-50 border border-gray-100 px-3 py-1 flex-1"
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSpecField(key)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex gap-2">
                       <input 
                         type="text" 
                         placeholder="מאפיין טכני חדש (למשל, חומר גלם)..." 
                         id="new-spec-key"
                         className="bg-gray-50 border border-gray-100 px-3 py-1.5 text-xs flex-1"
                       />
                       <input 
                         type="text" 
                         placeholder="ערך..." 
                         id="new-spec-val"
                         className="bg-gray-50 border border-gray-100 px-3 py-1.5 text-xs flex-1"
                       />
                       <button 
                         type="button" 
                         onClick={() => {
                           const keyEl = document.getElementById("new-spec-key") as HTMLInputElement;
                           const valEl = document.getElementById("new-spec-val") as HTMLInputElement;
                           if (keyEl && valEl && keyEl.value.trim() && valEl.value.trim()) {
                             handleAddSpecField(keyEl.value, valEl.value);
                             keyEl.value = "";
                             valEl.value = "";
                           }
                         }}
                         className="bg-brand-primary text-white text-xs px-4"
                       >
                         הוסף מאפיין
                       </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct(null)}
                    className="px-6 py-3 border border-gray-100 text-gray-400 text-xs hover:border-black hover:text-black transition-all"
                  >
                    ביטול
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-brand-primary text-white font-black text-xs uppercase tracking-wider hover:bg-brand-accent transition-all"
                  >
                    שמור שינויים בריל-טיים
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white border border-gray-100 w-full max-w-4xl p-8 relative shadow-2xl rounded-sm my-8"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-3xl font-serif font-black text-brand-primary mb-2">מוצר חדש קטלוג סבן</h3>
              <p className="text-xs text-gray-400 mb-8 font-medium">יצירת מוצר חדש והגדרת ה-SKU ישירות כמזהה מסמך ב-Firestore.</p>

              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מקט המוצר (SKU — יהפוך למזהה מסמך)</label>
                    <input 
                      type="text" 
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      placeholder="לדוגמא: SBN-501"
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">שם המוצר</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="למשל: צבע קירות חוץ אקרילי חזק"
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">קטגוריה</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs outline-none focus:border-brand-accent transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מחיר (₪)</label>
                    <input 
                      type="number" 
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">יחידת מידה</label>
                    <input 
                      type="text" 
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מלאי התחלתי במחסנים</label>
                    <input 
                      type="number" 
                      value={newStock}
                      onChange={(e) => setNewStock(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">כתובת תמונת מוצר (URL)</label>
                    <input 
                      type="text" 
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">קישור למחיצת Google Drive</label>
                    <input 
                      type="text" 
                      value={newDriveFolder}
                      onChange={(e) => setNewDriveFolder(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">קישור לשיעור הדרכה (YouTube)</label>
                    <input 
                      type="text" 
                      value={newTutorial}
                      onChange={(e) => setNewTutorial(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מוצרים מקושרים (מופרדים בפסיקים)</label>
                    <input 
                      type="text" 
                      value={newRelatedSkus}
                      onChange={(e) => setNewRelatedSkus(e.target.value)}
                      placeholder="SBN-001, SBN-002"
                      className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 outline-none focus:border-brand-accent transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-serif font-black text-brand-primary mb-3">מפרט טכני</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">זמן ייבוש</label>
                      <input 
                        type="text" 
                        value={newDryingTime}
                        onChange={(e) => setNewDryingTime(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs"
                        placeholder="שעות פתיחה, ייבוש ראשוני וכו'"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">כושר כיסוי</label>
                      <input 
                        type="text" 
                        value={newCoverage}
                        onChange={(e) => setNewCoverage(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs"
                        placeholder="מ''ר לליטר, ק''ג וכו'"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">שיטת יישום מומלצת</label>
                      <input 
                        type="text" 
                        value={newApplication}
                        onChange={(e) => setNewApplication(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 py-2.5 px-3 text-xs"
                        placeholder="רולר, פנצ'ב, מברשת וכו'"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5">מפרט טכני משלים (מבנה JSON חופשי)</label>
                    <textarea 
                      value={newCustomSpecs}
                      onChange={(e) => setNewCustomSpecs(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-3 px-4 outline-none focus:border-brand-accent transition-all font-mono text-xs text-left h-32"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 border border-gray-100 text-gray-400 text-xs hover:border-black hover:text-black transition-all"
                  >
                    ביטול
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-brand-primary text-white font-black text-xs uppercase tracking-wider hover:bg-brand-accent transition-all"
                  >
                    פרסם מוצר ל-Firestore
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
