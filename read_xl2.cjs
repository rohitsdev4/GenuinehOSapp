const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('../Telegram Expense Bot Setup (1).xlsx', { cellDates: true });
  const mainSheet = workbook.Sheets['Main'];
  if (mainSheet) {
    const data = XLSX.utils.sheet_to_json(mainSheet);
    const types = new Set();
    const categories = new Set();
    data.forEach(row => {
        if (row['Type']) types.add(row['Type']);
        if (row['Category']) categories.add(row['Category']);
    });
    console.log("Unique Types:", Array.from(types));
    console.log("Unique Categories:", Array.from(categories));
    
    // Find some rows with Labour defined
    console.log("\nSample rows with Labour:");
    console.log(data.filter(r => r['Labour']).slice(0, 2));

    // Find some rows with Party defined
    console.log("\nSample rows with Party:");
    console.log(data.filter(r => r['Party']).slice(0, 2));
    
    // Find some rows with Payment Received
    console.log("\nSample rows with Payment Received or Income:");
    console.log(data.filter(r => r['Type'] && r['Type'].toLowerCase().includes('payment')).slice(0, 2));
  }
} catch (err) {
  console.error(err);
}
