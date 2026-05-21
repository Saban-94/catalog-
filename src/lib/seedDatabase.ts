import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { MOCK_PRODUCTS } from "../data/mockProducts";

export async function seedInventoryToFirestore() {
  try {
    console.log("מתחיל הזרקת נתונים ל-Firestore...");
    
    for (const product of MOCK_PRODUCTS) {
      // שימוש ב-SKU בתור ה-ID של המסמך ב-Firestore
      const docRef = doc(db, "inventory", product.sku);
      
      await setDoc(docRef, {
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        specs: product.specs || {},
        image: product.image,
        driveFolderLink: product.driveFolderLink || "",
        tutorialLink: product.tutorialLink || "",
        relatedSkus: product.relatedSkus || []
      });
      console.log(`הוזרק בהצלחה: ${product.sku}`);
    }
    
    alert("הזרקת נתונים הסתיימה בהצלחה! אפשר לרענן את העמוד.");
  } catch (error) {
    console.error("שגיאה בהזרקת נתונים:", error);
    alert("שגיאה בהזרקת נתונים, בדוק את הקונסול.");
  }
}
