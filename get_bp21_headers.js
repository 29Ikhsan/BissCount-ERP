const xlsx = require('xlsx');
const workbook2 = xlsx.readFile('/Users/ikhsan/Downloads/BP21 Excel to XML v.4.xlsx');
console.log(xlsx.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]], { header: 1 })[2]);
