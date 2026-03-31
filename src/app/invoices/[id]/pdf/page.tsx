'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useParams, useRouter } from 'next/navigation';

export default function InvoicePDFView() {
  const { id } = useParams();
  const router = useRouter();
  
  // Using minimal mock data until dynamically plugged into `/api/invoices/[id]`
  // In a real scenario, useEffect fetches `id` from backend
  const [invoice, setInvoice] = useState({
    invoiceNo: id === 'demo' ? 'INV-2026-001' : id as string,
    clientName: 'PT Global Teknologi',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [
      { description: 'Cloud Architecture Setup', quantity: 1, unitPrice: 2000, total: 2000 },
      { description: 'Monthly Maintenance Support', quantity: 3, unitPrice: 500, total: 1500 }
    ],
    amount: 3500,
    status: 'PENDING'
  });

  useEffect(() => {
    // Attempt auto-print on successful render after a split second
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
           @page { margin: 0; }
           body { margin: 0; padding: 0 !important; background: white; -webkit-print-color-adjust: exact; }
           /* Hide global layout shells */
           aside, header { display: none !important; }
           .app-main, .app-content { padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; }
        }
      `}} />

      <div className={styles.printContainer}>
        {/* Header Section */}
        <div className={styles.invoiceHeader}>
          <div className={styles.brand}>
            <div className={styles.brandName}>BIZZCOUNT GLOBAL CORP.</div>
            <div className={styles.brandDetails}>
              123 Business Avenue, Suite 400<br/>
              Jakarta Selatan, ID 12190<br/>
              hello@bizzcount.com | +62 21 555 1234
            </div>
          </div>
          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceTitle} style={{ gridColumn: 'span 2'}}>TAX INVOICE</div>
            <div className={styles.metaLabel}>Invoice No.</div>
            <div className={styles.metaValue}>{invoice.invoiceNo}</div>
            <div className={styles.metaLabel}>Date Issued</div>
            <div className={styles.metaValue}>{invoice.date}</div>
            <div className={styles.metaLabel}>Due Date</div>
            <div className={styles.metaValue}>{invoice.dueDate}</div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className={styles.billingSection}>
          <div className={styles.billBox}>
            <div className={styles.billTitle}>Bill To:</div>
            <div className={styles.billContent}>
               <strong>{invoice.clientName}</strong><br/>
               Financial Department<br/>
               Sudirman Central Business District<br/>
               DKI Jakarta
            </div>
          </div>
          <div className={styles.billBox} style={{ textAlign: 'right' }}>
            <div className={styles.billTitle}>Payment Status:</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: invoice.status === 'PAID' ? '#10B981' : '#F59E0B' }}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className={styles.invoiceTable}>
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Description</th>
              <th className={styles.textCenter} style={{ width: '15%' }}>Qty / Hrs</th>
              <th className={styles.textRight} style={{ width: '15%' }}>Rate</th>
              <th className={styles.textRight} style={{ width: '20%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td className={styles.textCenter}>{item.quantity}</td>
                <td className={styles.textRight}>${item.unitPrice.toLocaleString()}</td>
                <td className={styles.textRight}>${item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${invoice.amount.toLocaleString()}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className={styles.totalSummary}>
              <span>TOTAL DUE</span>
              <span>${invoice.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          Please transfer payments via Wire Transfer or ACH to BizzCount Global Corp. Account No: 1234-5678-9012.<br/>
          Thank you for your business! Document generated securely by BizzCount ERP.
        </div>
        
        {/* On-Screen Print Tools (Hidden during print) */}
        <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center' }} className="print-hide">
           <button 
             onClick={() => window.print()}
             style={{ padding: '10px 20px', background: '#0F3B8C', color: 'white', borderRadius: '6px', cursor: 'pointer', border: 'none' }}
           >
             Reprint Document
           </button>
           <button 
             onClick={() => router.back()}
             style={{ padding: '10px 20px', background: '#E5E7EB', color: '#374151', borderRadius: '6px', cursor: 'pointer', border: 'none' }}
           >
             Close Preview
           </button>
        </div>
      </div>
    </>
  );
}
