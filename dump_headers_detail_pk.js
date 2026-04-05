const XLSX = require('xlsx');

function dumpHeaders() {
  const workbook = XLSX.readFile('sample_pk.xlsx');
  const sheetName = 'DetailFaktur';
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.log("Sheet DetailFaktur not found.");
    return;
  }
  
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log("--- Header Rows (DetailFaktur) ---");
  for(let i = 0; i < 4; i++) {
     if (data[i]) {
       console.log(`Row ${i}:`, JSON.stringify(data[i]));
     }
  }
}

dumpHeaders();
