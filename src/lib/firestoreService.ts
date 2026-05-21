import { collection, getDocs, query, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { Product } from "../data/mockProducts";

// שם הקולקשן ב-Firestore (וודא שזה השם המדויק אצלך)
const COLLECTION_NAME = "inventory"; 

/**
 * אופציה 1: שליפת מלאי חד-פעמית (קלאסי לטעינה רגילה)
 */
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sku: data.sku || "",
        name: data.name || "",
        category: data.category || "",
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        unit: data.unit || "יחידה",
        specs: data.specs || {},
        image: data.image || `https://picsum.photos/seed/${data.sku}/400/300`,
        driveFolderLink: data.driveFolderLink || "",
        tutorialLink: data.tutorialLink || "",
        relatedSkus: data.relatedSkus || []
      } as Product;
    });
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return [];
  }
}

/**
 * אופציה 2: האזנה בזמן אמת (Real-time Listener)
 * מתאים למקרים שבהם המלאי מתעדכן ממקורות שונים ורוצים שה-UI יתעדכן אוטומטית
 */
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  const q = query(collection(db, COLLECTION_NAME));
  
  // מחזיר את פונקציית ה-unsubscribe כדי לנקות את ההאזנה ב-unmount
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sku: data.sku || "",
        name: data.name || "",
        category: data.category || "",
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        unit: data.unit || "יחידה",
        specs: data.specs || {},
        image: data.image || `https://picsum.photos/seed/${data.sku}/400/300`,
        driveFolderLink: data.driveFolderLink || "",
        tutorialLink: data.tutorialLink || "",
        relatedSkus: data.relatedSkus || []
      } as Product;
    });
    callback(products);
  }, (error) => {
    console.error("Error listening to Firestore:", error);
    callback([]);
  });
}
