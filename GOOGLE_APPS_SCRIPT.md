# Google Apps Script (GAS) for H. Saban AI Catalog

Apply this script to your Google Spreadsheet via Extensions > Apps Script.

```javascript
/**
 * Bi-directional sync for H. Saban AI Catalog
 */

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName("AI_Logs") || ss.insertSheet("AI_Logs");
  const data = JSON.parse(e.postData.contents);
  
  if (data.type === "QA_LOG") {
    // Structure: [Timestamp, User Query, AI Response, Product SKU]
    logSheet.appendRow([new Date(), data.userQuery, data.aiResponse, data.sku]);
    return ContentService.createTextOutput("Logged Successfully").setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (data.type === "STOCK_UPDATE") {
    const inventorySheet = ss.getSheetByName("Inventory");
    if (!inventorySheet) return ContentService.createTextOutput("Inventory sheet not found").setMimeType(ContentService.MimeType.TEXT);
    
    const sku = data.sku;
    const change = data.change; // e.g., -1 for sale
    
    const rows = inventorySheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
       if (rows[i][0] == sku) { // Assuming SKU is in first column
         const currentStock = rows[i][4]; // Assuming Stock is in 5th column (Index 4)
         inventorySheet.getRange(i + 1, 5).setValue(currentStock + change);
         return ContentService.createTextOutput("Stock Updated Successfully").setMimeType(ContentService.MimeType.TEXT);
       }
    }
    return ContentService.createTextOutput("SKU not found").setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Sync logic to firestore (can be triggered by a button or timer)
 */
function syncInventoryToFirestore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName("Inventory");
  if (!inventorySheet) return;
  
  const data = inventorySheet.getDataRange().getValues();
  // Here you would normally use a library or fetch to sync to your backend API
  // For now, this is a placeholder for your custom sync logic.
}
```

## Google Sheets Schema Recommendation
Ensure your "Inventory" sheet has these columns:
1. SKU (מק"ט)
2. ProductName (שם מוצר)
3. Category (קטגוריה)
4. Price (מחיר)
5. Stock (מלאי)
6. Specs_JSON (נתונים טכניים)
7. Drive_Assets (לינק לדרייב)
8. Tutorial_Link (סרטון הדרכה)
9. Related_Items (מק"טים משלימים)
