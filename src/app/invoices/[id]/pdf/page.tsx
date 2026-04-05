'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function InvoicePDFView() {
  const { id } = useParams();
  const router = useRouter();
  const { formatCurrency } = useLanguage();
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [invRes, settingsRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch('/api/settings')
        ]);
        const invData = await invRes.json();
        const settingsData = await settingsRes.json();
        
        if (invData.invoice) setInvoice(invData.invoice);
        if (settingsData.tenant && settingsData.tenant.logoUrl) {
          setOrgLogo(settingsData.tenant.logoUrl);
        }

        // Attempt auto-print after data loads
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (e) {
        console.error('Failed to load PDF data');
      }
    }
    if (id) loadData();
  }, [id]);

  if (!invoice) return <div className={styles.printContainer}>Loading invoice...</div>;

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
            {orgLogo ? (
              <img 
                src={orgLogo} 
                alt="Company Logo" 
                style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px' }} 
              />
            ) : null}
            <div className={styles.brandName}>AKSIA GLOBAL CORP.</div>
            <div className={styles.brandAddress}>
              Jl. Jenderal Sudirman No.1, Jakarta, Indonesia<br/>
              hello@aksia.dev | +62 21 800 AKSIA
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
            {invoice?.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td className={styles.textCenter}>{item.quantity}</td>
                <td className={styles.textRight}>{formatCurrency(item.unitPrice)}</td>
                <td className={styles.textRight}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Tax (0%)</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className={styles.totalSummary}>
              <span>TOTAL DUE</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          Please transfer payments via Wire Transfer or ACH to AKSIA Global Corp. Account No: 1234-5678-9012.<br/>
          Thank you for your business! Document generated securely by AKSIA ERP.
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
