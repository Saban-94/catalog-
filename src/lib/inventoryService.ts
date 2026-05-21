// src/lib/inventoryService.ts
import { Product } from '../data/mockProducts';

// הכנס כאן את ה-URL שקיבלת אחרי ה-Deploy ב-Apps Script
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

export async function fetchInventory(): Promise<Product[]> {
  try {
    const response = await fetch(GAS_WEB_APP_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();

    // המרה לממשק Product
    return data.map((item: any, index: number): Product => ({
      id: String(index + 1),
      sku: item.sku,
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock,
      unit: "יחידה", // תוכל להוסיף עמודה בגיליון אם צריך
      specs: item.specs,
      image: `https://picsum.photos/seed/${item.sku}/400/300`, // תמונה זמנית לפי מק"ט
      driveFolderLink: item.driveFolderLink,
      tutorialLink: item.tutorialLink,
      relatedSkus: item.relatedSkus
    }));
  } catch (error) {
    console.error("Error fetching inventory from Google Sheets:", error);
    return []; // מחזיר מערך ריק כדי לא לשבור את ה-UI במקרה של שגיאה
  }
}

export async function updateStock(sku: string, change: number): Promise<boolean> {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ type: "STOCK_UPDATE", sku, change })
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error updating stock:", error);
    return false;
  }
}
