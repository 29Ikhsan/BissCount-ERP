const xlsx = require('xlsx');

function readHeaders(filepath) {
  try {
    const workbook = xlsx.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON with header: 1 to get an array of arrays (rows)
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    // Assuming row index 0, 1, or 2 might be the header row. DJP files often have a title row.
    // Let's print the first 4 rows to see the structure.
    console.log(`\n=== File: ${filepath.split('/').pop()} ===`);
    for (let i = 0; i < Math.min(5, data.length); i++) {
        console.log(`Row ${i}:`, data[i]);
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
  }
}

readHeaders('/Users/ikhsan/Downloads/BPPU Excel to XML v.3.xlsx');
readHeaders('/Users/ikhsan/Downloads/BP21 Excel to XML v.4.xlsx');
readHeaders('/Users/ikhsan/Downloads/BPA1 Excel to XML.xlsx');
