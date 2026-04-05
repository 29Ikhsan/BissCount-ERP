
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  address: 'address',
  fiscalYear: 'fiscalYear',
  logoUrl: 'logoUrl',
  taxId: 'taxId',
  inventoryMethod: 'inventoryMethod'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  avatarUrl: 'avatarUrl',
  jobTitle: 'jobTitle',
  notifications: 'notifications',
  timezone: 'timezone'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  type: 'type',
  role: 'role',
  name: 'name',
  email: 'email',
  phone: 'phone',
  website: 'website',
  currency: 'currency',
  paymentTerms: 'paymentTerms',
  address: 'address',
  city: 'city',
  postalCode: 'postalCode',
  country: 'country',
  taxId: 'taxId',
  idType: 'idType',
  idNumber: 'idNumber',
  tkuId: 'tkuId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  type: 'type',
  balance: 'balance',
  tenantId: 'tenantId'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  date: 'date',
  description: 'description',
  reference: 'reference',
  tenantId: 'tenantId'
};

exports.Prisma.JournalLineScalarFieldEnum = {
  id: 'id',
  journalEntryId: 'journalEntryId',
  accountId: 'accountId',
  debit: 'debit',
  credit: 'credit',
  costCenterId: 'costCenterId'
};

exports.Prisma.CostCenterScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  budget: 'budget',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNo: 'invoiceNo',
  clientName: 'clientName',
  date: 'date',
  dueDate: 'dueDate',
  amount: 'amount',
  status: 'status',
  tenantId: 'tenantId',
  contactId: 'contactId',
  costCenterId: 'costCenterId',
  discountAmount: 'discountAmount',
  grandTotal: 'grandTotal',
  taxAmount: 'taxAmount',
  paidAmount: 'paidAmount',
  taxPeriod: 'taxPeriod',
  taxYear: 'taxYear',
  fakturStatus: 'fakturStatus',
  fakturType: 'fakturType',
  transactionCode: 'transactionCode',
  additionalInfo: 'additionalInfo',
  supportDoc: 'supportDoc',
  supportDocPeriod: 'supportDocPeriod',
  facilityCap: 'facilityCap',
  sellerTkuId: 'sellerTkuId'
};

exports.Prisma.InvoiceItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  productId: 'productId',
  sku: 'sku',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  total: 'total',
  taxAmount: 'taxAmount',
  taxId: 'taxId',
  taxRate: 'taxRate',
  itemType: 'itemType',
  uomCode: 'uomCode',
  baseValueOther: 'baseValueOther',
  ppnRate: 'ppnRate',
  ppnbmRate: 'ppnbmRate',
  ppnbmAmount: 'ppnbmAmount'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  date: 'date',
  merchant: 'merchant',
  category: 'category',
  amount: 'amount',
  status: 'status',
  employeeName: 'employeeName',
  receiptUrl: 'receiptUrl',
  approverId: 'approverId',
  tenantId: 'tenantId',
  costCenterId: 'costCenterId',
  grandTotal: 'grandTotal',
  taxAmount: 'taxAmount',
  taxPeriod: 'taxPeriod',
  taxYear: 'taxYear',
  contactId: 'contactId'
};

exports.Prisma.ExpenseItemScalarFieldEnum = {
  id: 'id',
  expenseId: 'expenseId',
  accountId: 'accountId',
  description: 'description',
  amount: 'amount',
  taxId: 'taxId',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  whtRate: 'whtRate',
  whtAmount: 'whtAmount',
  total: 'total',
  taxObjectCode: 'taxObjectCode',
  tkuId: 'tkuId',
  workerStatus: 'workerStatus',
  position: 'position',
  ptkpStatus: 'ptkpStatus',
  passportNo: 'passportNo',
  facilityCap: 'facilityCap'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  sku: 'sku',
  name: 'name',
  category: 'category',
  price: 'price',
  cost: 'cost',
  tenantId: 'tenantId',
  preferredSupplierId: 'preferredSupplierId',
  taxId: 'taxId'
};

exports.Prisma.WarehouseScalarFieldEnum = {
  id: 'id',
  name: 'name',
  location: 'location',
  tenantId: 'tenantId'
};

exports.Prisma.InventoryLevelScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  warehouseId: 'warehouseId',
  quantity: 'quantity',
  minQuantity: 'minQuantity',
  tenantId: 'tenantId'
};

exports.Prisma.BOMItemScalarFieldEnum = {
  id: 'id',
  finishedProductId: 'finishedProductId',
  rawProductId: 'rawProductId',
  quantityRequired: 'quantityRequired'
};

exports.Prisma.ProductionOrderScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  status: 'status',
  productId: 'productId',
  quantity: 'quantity',
  startDate: 'startDate',
  endDate: 'endDate',
  tenantId: 'tenantId',
  warehouseId: 'warehouseId'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  id: 'id',
  poNumber: 'poNumber',
  supplier: 'supplier',
  date: 'date',
  expectedDate: 'expectedDate',
  status: 'status',
  tenantId: 'tenantId',
  amount: 'amount',
  contactId: 'contactId',
  costCenterId: 'costCenterId',
  discountAmount: 'discountAmount',
  grandTotal: 'grandTotal',
  taxAmount: 'taxAmount',
  type: 'type'
};

exports.Prisma.PurchaseOrderItemScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  productId: 'productId',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  taxId: 'taxId',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  total: 'total'
};

exports.Prisma.CurrencyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  rate: 'rate',
  lastUpdated: 'lastUpdated',
  tenantId: 'tenantId'
};

exports.Prisma.TaxScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  rate: 'rate',
  type: 'type',
  accountId: 'accountId',
  tenantId: 'tenantId'
};

exports.Prisma.BankStatementScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  importDate: 'importDate',
  tenantId: 'tenantId'
};

exports.Prisma.BankStatementLineScalarFieldEnum = {
  id: 'id',
  statementId: 'statementId',
  date: 'date',
  description: 'description',
  amount: 'amount',
  isReconciled: 'isReconciled',
  reconciledAt: 'reconciledAt',
  journalEntryId: 'journalEntryId'
};

exports.Prisma.FixedAssetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  category: 'category',
  purchaseDate: 'purchaseDate',
  cost: 'cost',
  residualValue: 'residualValue',
  usefulLife: 'usefulLife',
  accumulatedDepr: 'accumulatedDepr',
  status: 'status',
  tenantId: 'tenantId'
};

exports.Prisma.ClosedPeriodScalarFieldEnum = {
  id: 'id',
  month: 'month',
  year: 'year',
  closedAt: 'closedAt',
  closedBy: 'closedBy',
  tenantId: 'tenantId'
};

exports.Prisma.DepreciationRunScalarFieldEnum = {
  id: 'id',
  month: 'month',
  year: 'year',
  runAt: 'runAt',
  tenantId: 'tenantId'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  details: 'details',
  userId: 'userId',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.DepreciationHistoryScalarFieldEnum = {
  id: 'id',
  assetId: 'assetId',
  amount: 'amount',
  month: 'month',
  year: 'year',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.StockBatchScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  warehouseId: 'warehouseId',
  quantity: 'quantity',
  remainingQty: 'remainingQty',
  unitCost: 'unitCost',
  createdAt: 'createdAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  company: 'company',
  status: 'status',
  source: 'source',
  value: 'value',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  campaignId: 'campaignId'
};

exports.Prisma.OpportunityScalarFieldEnum = {
  id: 'id',
  title: 'title',
  value: 'value',
  stage: 'stage',
  probability: 'probability',
  expectedClose: 'expectedClose',
  contactId: 'contactId',
  leadId: 'leadId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingCampaignScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  budget: 'budget',
  actualSpend: 'actualSpend',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  department: 'department',
  jobTitle: 'jobTitle',
  salary: 'salary',
  joinDate: 'joinDate',
  status: 'status',
  ptkpStatus: 'ptkpStatus',
  npwp: 'npwp',
  nik: 'nik',
  address: 'address',
  bankName: 'bankName',
  bankNumber: 'bankNumber',
  bankHolder: 'bankHolder',
  bpjsKes: 'bpjsKes',
  bpjsKet: 'bpjsKet',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  month: 'month',
  year: 'year',
  grossPay: 'grossPay',
  allowances: 'allowances',
  deductions: 'deductions',
  biayaJabatan: 'biayaJabatan',
  iuranPensiun: 'iuranPensiun',
  pkp: 'pkp',
  pph21: 'pph21',
  terCategory: 'terCategory',
  terRate: 'terRate',
  netPay: 'netPay',
  status: 'status',
  notes: 'notes',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaxKnowledgeScalarFieldEnum = {
  id: 'id',
  category: 'category',
  question: 'question',
  answer: 'answer',
  keywords: 'keywords',
  references: 'references',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tenantId: 'tenantId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  User: 'User',
  Contact: 'Contact',
  Account: 'Account',
  JournalEntry: 'JournalEntry',
  JournalLine: 'JournalLine',
  CostCenter: 'CostCenter',
  Invoice: 'Invoice',
  InvoiceItem: 'InvoiceItem',
  Expense: 'Expense',
  ExpenseItem: 'ExpenseItem',
  Product: 'Product',
  Warehouse: 'Warehouse',
  InventoryLevel: 'InventoryLevel',
  BOMItem: 'BOMItem',
  ProductionOrder: 'ProductionOrder',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderItem: 'PurchaseOrderItem',
  Currency: 'Currency',
  Tax: 'Tax',
  BankStatement: 'BankStatement',
  BankStatementLine: 'BankStatementLine',
  FixedAsset: 'FixedAsset',
  ClosedPeriod: 'ClosedPeriod',
  DepreciationRun: 'DepreciationRun',
  AuditLog: 'AuditLog',
  DepreciationHistory: 'DepreciationHistory',
  StockBatch: 'StockBatch',
  Lead: 'Lead',
  Opportunity: 'Opportunity',
  MarketingCampaign: 'MarketingCampaign',
  Employee: 'Employee',
  Payroll: 'Payroll',
  TaxKnowledge: 'TaxKnowledge'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
