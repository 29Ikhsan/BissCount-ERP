import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/access-server';

// In a real application, this would interface with the Prisma Client / PostgreSQL DB.
// Since we're demonstrating the Open API, we generate realistic dummy data according to the schema.
const dummyLedgerData = [
  {
    transactionId: "TXN-2024-001",
    date: "2024-03-01T08:30:00Z",
    accountCode: "1001",
    accountName: "Cash in Bank",
    debit: 150000.00,
    credit: 0.00,
    description: "Initial Capital Deposit",
    reference: "DEP-001"
  },
  {
    transactionId: "TXN-2024-001",
    date: "2024-03-01T08:30:00Z",
    accountCode: "3001",
    accountName: "Owner Equity",
    debit: 0.00,
    credit: 150000.00,
    description: "Initial Capital Deposit",
    reference: "DEP-001"
  },
  {
    transactionId: "TXN-2024-002",
    date: "2024-03-05T14:15:00Z",
    accountCode: "5001",
    accountName: "Server Hosting",
    debit: 1200.00,
    credit: 0.00,
    description: "AWS Cloud Infrastructure - March",
    reference: "INV-AWS-331"
  },
  {
    transactionId: "TXN-2024-002",
    date: "2024-03-05T14:15:00Z",
    accountCode: "2001",
    accountName: "Accounts Payable",
    debit: 0.00,
    credit: 1200.00,
    description: "AWS Cloud Infrastructure - March",
    reference: "INV-AWS-331"
  }
];

export async function GET(request: Request) {
  const __auth = await requireSession();
  if (!__auth.ok) return __auth.response;

  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized access: Missing or invalid token" }, { status: 401 });
    }

    // 2. Parse Query Parameters (e.g. date ranges, accounts)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const accountCode = searchParams.get('accountCode');

    let filteredData = dummyLedgerData;

    // Optional Filtering (Simulating a database query)
    if (accountCode) {
      filteredData = filteredData.filter(entry => entry.accountCode === accountCode);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredData = filteredData.filter(entry => new Date(entry.date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredData = filteredData.filter(entry => new Date(entry.date) <= end);
    }

    // 3. Output standardized JSON
    return NextResponse.json({
      success: true,
      count: filteredData.length,
      data: filteredData,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "v1.0"
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}
