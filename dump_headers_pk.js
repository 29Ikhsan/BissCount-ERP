const XLSX = require('xlsx');

function dumpHeaders() {
  const workbook = XLSX.readFile('sample_pk.xlsx');
  const sheetName = 'Faktur';
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.log("Sheet Faktur not found.");
    return;
  }
  
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log("--- Header Rows ---");
  // The first few rows usually contain the headers. Let's print rows 0 to 4.
  for(let i = 0; i < 4; i++) {
     if (data[i]) {
       console.log(`Row ${i}:`, JSON.stringify(data[i]));
     }
  }
}

dumpHeaders();
