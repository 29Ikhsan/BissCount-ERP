const XLSX = require('xlsx');

function dumpExcel() {
  const workbook = XLSX.readFile('bpmp_template.xlsx');
  const sheetName = 'DATA';
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.log("Sheet DATA not found.");
    return;
  }
  
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log("--- Sheet: DATA ---");
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
}

dumpExcel();
