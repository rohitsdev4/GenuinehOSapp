const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('../Telegram Expense Bot Setup (1).xlsx', { cellDates: true });
  const mainSheet = workbook.Sheets['Main'];
  if (mainSheet) {
    const data = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
    console.log(`\n\n=== SHEET: Main ===`);
    console.log(`Total Rows: ${data.length}`);
    for (let i = 0; i < 3; i++) {
        console.log(`Row ${i}:`, data[i]);
    }
  } else {
    console.log("No Main sheet found. Available sheets:", workbook.SheetNames);
  }
} catch (err) {
  console.error(err);
}
