const XLSX = require('xlsx');

function dumpExcel() {
  const workbook = XLSX.readFile('sample_pk.xlsx');
  console.log("Sheet Names:", workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    if (data.length > 0) {
      console.log("First 4 rows:");
      console.log(JSON.stringify(data.slice(0, 4), null, 2));
    } else {
      console.log("Empty Sheet");
    }
  });
}

dumpExcel();
