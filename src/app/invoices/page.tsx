'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Download,
  Filter,
  ArrowUpDown,
  Upload,
  FileText,
  PackageCheck,
  Truck,
  FileDigit,
  X,
  RotateCcw,
  Ban,
  Printer
} from 'lucide-react';
import styles from './page.module.css';

// --- Initial Dummy State Data ---
const initialInvoices = [
  { id: '#INV-2024-001', client: 'Stark Industries', clientAvatar: 'SA', clientBg: '#DBEAFE', date: 'Oct 12, 2023', amount: '$45,000.00', status: 'PAID' },
  { id: '#INV-2024-002', client: 'Wayne Corp', clientAvatar: 'WC', clientBg: '#E2E8F0', date: 'Oct 15, 2023', amount: '$12,450.00', status: 'PENDING' },
];

const initialQuotations = [
  { id: '#QT-2024-001', client: 'LexCorp', clientAvatar: 'LC', clientBg: '#F3E8FF', date: 'Oct 25, 2023', amount: '$55,000.00', status: 'DRAFT' },
  { id: '#QT-2024-002', client: 'Wayne Corp', clientAvatar: 'WC', clientBg: '#E2E8F0', date: 'Oct 26, 2023', amount: '$15,000.00', status: 'SENT' }
];

const initialSalesOrders = [
  { id: '#SO-2024-001', client: 'Massive Dynamic', clientAvatar: 'MD', clientBg: '#D1FAE5', date: 'Oct 20, 2023', amount: '$8,200.00', status: 'ACCEPTED' },
];

const initialDeliveries = [
  { id: '#DO-2024-001', client: 'Hooli', clientAvatar: 'H', clientBg: '#DBEAFE', date: 'Oct 22, 2023', amount: '$104,500.00', status: 'SHIPPED' }
];

const agingSummary = [
  { bucket: 'Current', amount: 185000, color: '#10B981', percentage: 74 },
  { bucket: '1-30 Days', amount: 42000, color: '#F59E0B', percentage: 17 },
  { bucket: '31-60 Days', amount: 15000, color: '#F97316', percentage: 6 },
  { bucket: '61-90 Days', amount: 4500, color: '#EF4444', percentage: 2 },
  { bucket: '90+ Days', amount: 1890, color: '#7F1D1D', percentage: 1 },
];

export default function OrderToCashHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('QUOTATIONS');
  
  // Interactive State Storage
  const [quotations, setQuotations] = useState(initialQuotations);
  const [salesOrders, setSalesOrders] = useState(initialSalesOrders);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);

  useEffect(() => {
    const fetchLiveInvoices = async () => {
      try {
        const res = await fetch('/api/invoices');
        const data = await res.json();
        if (data.invoices && data.invoices.length > 0) {
          const mapped = data.invoices.map((inv: any) => ({
             id: inv.invoiceNo,
             client: inv.clientName,
             clientAvatar: inv.clientName.substring(0, 2).toUpperCase(),
             clientBg: '#E2E8F0',
             date: new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
             amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.amount),
             status: inv.status,
             paidAmount: 0
          }));
          // Merge with initial dummy data or replace entirely. Replacing entirely:
          setInvoices(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch invoices', err);
      }
    };
    fetchLiveInvoices();
  }, []);

  // Undo Toast State
  const [toast, setToast] = useState<{ visible: boolean, message: string, onUndo: () => void, timeoutId?: NodeJS.Timeout } | null>(null);

  const triggerToast = (message: string, undoFn: () => void) => {
    if (toast?.timeoutId) clearTimeout(toast.timeoutId);
    const timeoutId = setTimeout(() => {
      setToast(null);
    }, 6000); 
    setToast({ visible: true, message, onUndo: () => {
      undoFn();
      setToast(null);
      clearTimeout(timeoutId);
    }, timeoutId });
  };

  // --- Pipeline Conversion Handlers ---
  const handleApproveQuotation = (id: string) => {
    const docIndex = quotations.findIndex(q => q.id === id);
    if (docIndex > -1) {
      const doc = quotations[docIndex];
      const newSO = { ...doc, id: doc.id.replace('QT', 'SO'), status: 'ACCEPTED' };
      
      const prevQuotations = [...quotations];
      const prevSalesOrders = [...salesOrders];

      setQuotations(quotations.filter(q => q.id !== id));
      setSalesOrders([newSO, ...salesOrders]);
      setActiveTab('SALES_ORDERS');
      
      triggerToast(`Converted Quotation ${id} to Sales Order.`, () => {
         setQuotations(prevQuotations);
         setSalesOrders(prevSalesOrders);
         setActiveTab('QUOTATIONS');
      });
    }
  };

  const handleCreateDelivery = (id: string) => {
    const docIndex = salesOrders.findIndex(s => s.id === id);
    if (docIndex > -1) {
      const doc = salesOrders[docIndex];
      const newDO = { ...doc, id: doc.id.replace('SO', 'DO'), status: 'PROCESSING' };
      
      const prevSalesOrders = [...salesOrders];
      const prevDeliveries = [...deliveries];

      setSalesOrders(salesOrders.filter(s => s.id !== id));
      setDeliveries([newDO, ...deliveries]);
      setActiveTab('DELIVERIES');
      
      triggerToast(`Initiated Delivery Order ${newDO.id} for Sales Order ${id}.`, () => {
         setSalesOrders(prevSalesOrders);
         setDeliveries(prevDeliveries);
         setActiveTab('SALES_ORDERS');
      });
    }
  };

  const handleMarkShipped = (id: string) => {
    const prevDeliveries = [...deliveries];
    
    const updatedDeliveries = deliveries.map(d => {
      if (d.id === id) return { ...d, status: 'SHIPPED' };
      return d;
    });
    setDeliveries(updatedDeliveries);
    
    triggerToast(`Marked Delivery ${id} as SHIPPED.`, () => {
       setDeliveries(prevDeliveries);
    });
  };

  const handleCreateInvoice = (id: string) => {
    const docIndex = deliveries.findIndex(d => d.id === id);
    if (docIndex > -1) {
      const doc = deliveries[docIndex];
      const newInv = { ...doc, id: doc.id.replace('DO', 'INV'), status: 'PENDING' };
      
      const prevDeliveries = [...deliveries];
      const prevInvoices = [...invoices];

      setDeliveries(deliveries.filter(d => d.id !== id));
      setInvoices([newInv, ...invoices]);
      setActiveTab('INVOICES');
      
      triggerToast(`Successfully billed Invoice ${newInv.id}.`, () => {
         setDeliveries(prevDeliveries);
         setInvoices(prevInvoices);
         setActiveTab('DELIVERIES');
      });
    }
  };

  const handleRecordPayment = (id: string, currentAmountStr: string) => {
    const invTotal = parseFloat(currentAmountStr.replace(/[^0-9.-]+/g, ""));
    const inputStr = window.prompt(`Enter actual payment amount received (Total Due: $${invTotal.toLocaleString()}):`, invTotal.toString());
    
    if (inputStr === null || inputStr === "") return; // user cancelled prompt
    
    const payment = parseFloat(inputStr.replace(/[^0-9.-]+/g, ""));
    if (isNaN(payment) || payment <= 0) {
       alert("Invalid payment amount entered.");
       return;
    }

    const prevInvoices = [...invoices];
    
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === id) {
        const currentPaid = (inv as any).paidAmount || 0;
        const newPaid = currentPaid + payment;
        const totalRaw = parseFloat(inv.amount.replace(/[^0-9.-]+/g, ""));
        
        if (newPaid >= totalRaw) {
           return { ...inv, paidAmount: totalRaw, status: 'PAID' };
        } else {
           return { ...inv, paidAmount: newPaid, status: 'PARTIAL' };
        }
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    
    triggerToast(`Payment of $${payment.toLocaleString('en-US', {minimumFractionDigits: 2})} recorded for Invoice ${id}.`, () => {
       setInvoices(prevInvoices);
    });
  };

  const handleCancelDocument = (id: string) => {
    let targetArray: any[] = [];
    let setTargetArray: any = null;
    let prevArray: any[] = [];
    
    if (activeTab === 'QUOTATIONS') { targetArray = quotations; setTargetArray = setQuotations; prevArray = [...quotations]; }
    else if (activeTab === 'SALES_ORDERS') { targetArray = salesOrders; setTargetArray = setSalesOrders; prevArray = [...salesOrders]; }
    else if (activeTab === 'DELIVERIES') { targetArray = deliveries; setTargetArray = setDeliveries; prevArray = [...deliveries]; }
    else { targetArray = invoices; setTargetArray = setInvoices; prevArray = [...invoices]; }
    
    const updated = targetArray.map(doc => {
      if (doc.id === id) return { ...doc, status: 'CANCELLED' };
      return doc;
    });
    
    setTargetArray(updated);
    
    triggerToast(`Document ${id} has been cancelled.`, () => {
       setTargetArray(prevArray);
    });
  };

  const handleNewDocument = () => {
    router.push(`/invoices/new?type=${activeTab.toLowerCase()}`);
  };

  // Select dataset based on Active Tab
  let activeData: any[] = [];
  if (activeTab === 'QUOTATIONS') activeData = quotations;
  if (activeTab === 'SALES_ORDERS') activeData = salesOrders;
  if (activeTab === 'DELIVERIES') activeData = deliveries;
  if (activeTab === 'INVOICES') activeData = invoices;

  return (
    <div className={styles.container}>
      {/* Undo Toast Notification */}
      {toast?.visible && (
        <div className={styles.toastContainer}>
           <div className={styles.toastMessage}>
             <span style={{ marginRight: '8px' }}>✓</span> {toast.message}
           </div>
           <button className={styles.undoBtn} onClick={toast.onUndo}>
             <RotateCcw size={14} /> UNDO
           </button>
           <button className={styles.toastCloseBtn} onClick={() => {
              if (toast.timeoutId) clearTimeout(toast.timeoutId);
              setToast(null);
           }}>
             <X size={16} />
           </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Sales & Receivables Hub</h1>
          <p className={styles.pageSubtitle}>Manage your entire Order-to-Cash pipeline: Quotes, Orders, Deliveries, and Invoices.</p>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.exportBtn}>
            <Upload size={16} /> Import
          </button>
          <button className={styles.exportBtn}>
            <Download size={16} /> Export
          </button>
          <button className={styles.addBtn} onClick={handleNewDocument}>
            <Plus size={16} /> 
            {activeTab === 'QUOTATIONS' ? 'New Quotation' :
             activeTab === 'SALES_ORDERS' ? 'New Sales Order' : 
             activeTab === 'DELIVERIES' ? 'New Delivery' : 'New Invoice'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div 
          className={`${styles.tabItem} ${activeTab === 'QUOTATIONS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('QUOTATIONS')}
        >
          <FileText size={16} /> 1. Quotations
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'SALES_ORDERS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('SALES_ORDERS')}
        >
          <PackageCheck size={16} /> 2. Sales Orders
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'DELIVERIES' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('DELIVERIES')}
        >
          <Truck size={16} /> 3. Deliveries
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'INVOICES' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('INVOICES')}
        >
          <FileDigit size={16} /> 4. Invoices
        </div>
      </div>

      {/* A/R Aging Summary (Only show on Invoices tab) */}
      {activeTab === 'INVOICES' && (
        <div className={styles.agingSection}>
          <div className={styles.agingHeader}>
            <h3 className={styles.sectionTitle}>Accounts Receivable Aging</h3>
            <p className={styles.sectionSubtitle}>Outstanding invoice balances categorized by days past due.</p>
          </div>
          <div className={styles.agingGrid}>
            {agingSummary.map((item) => (
              <div key={item.bucket} className={styles.agingCard}>
                 <div className={styles.agingBucketLabel}>{item.bucket}</div>
                 <div className={styles.agingAmount}>${item.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                 <div className={styles.agingBarBg}>
                   <div className={styles.agingBarFill} style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
                 </div>
                 <div className={styles.agingPercentage}>{item.percentage}% of total</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className={styles.tableSection}>
        <div className={styles.tableControls}>
          <div className={styles.filterGroup}>
            <div className={styles.selectWrapper}>
              <span className={styles.selectLabel}>STATUS:</span>
              <select className={styles.selectInput}>
                <option>All Statuses</option>
                {activeTab === 'QUOTATIONS' && <><option>Draft</option><option>Sent</option><option>Cancelled</option></>}
                {activeTab === 'SALES_ORDERS' && <><option>Accepted</option><option>Cancelled</option></>}
                {activeTab === 'DELIVERIES' && <><option>Processing</option><option>Shipped</option><option>Cancelled</option></>}
                {activeTab === 'INVOICES' && <><option>Paid</option><option>Pending</option><option>Overdue</option><option>Cancelled</option></>}
              </select>
            </div>
            <div className={styles.selectWrapper}>
               <span className={styles.selectLabel}>DATE RANGE:</span>
               <select className={styles.selectInput}>
                 <option>Last 30 Days</option>
                 <option>This Month</option>
                 <option>This Year</option>
                 <option>Last Year</option>
               </select>
            </div>
          </div>
          <div className={styles.iconActions}>
             <button className={styles.iconBtn}><Filter size={18} /></button>
             <button className={styles.iconBtn}><ArrowUpDown size={18} /></button>
          </div>
        </div>
        
        <table className={styles.invoiceTable}>
          <thead>
            <tr>
              <th>DOCUMENT ID</th>
              <th>CLIENT / CUSTOMER</th>
              <th>DATE</th>
              <th>LOGGED AMOUNT</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'center' }}>PIPELINE ACTION</th>
            </tr>
          </thead>
          <tbody>
            {activeData.map((doc) => (
              <tr key={doc.id}>
                <td><span className={styles.invoiceId}>{doc.id}</span></td>
                <td>
                  <div className={styles.clientInfo}>
                    <div className={styles.clientAvatar} style={{backgroundColor: doc.clientBg}}>
                      {doc.clientAvatar}
                    </div>
                    <span className={styles.clientName}>{doc.client}</span>
                  </div>
                </td>
                <td><span className={styles.dateText}>{doc.date}</span></td>
                <td>
                  <span className={styles.amountText}>{doc.amount}</span>
                  {(doc as any).paidAmount > 0 && doc.status !== 'PAID' && (
                    <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '2px', fontWeight: 600 }}>
                       Paid: ${(doc as any).paidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </div>
                  )}
                  {(doc as any).paidAmount > 0 && doc.status !== 'PAID' && (
                    <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: '2px', fontWeight: 600 }}>
                       Due: ${(parseFloat(doc.amount.replace(/[^0-9.-]+/g, "")) - (doc as any).paidAmount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[doc.status.toLowerCase()] || styles.pending}`}>
                    {doc.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  {doc.status !== 'CANCELLED' && doc.status !== 'PAID' && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {/* Workflow specific primary buttons */}
                      {activeTab === 'QUOTATIONS' && (
                         <button className={styles.actionPipelineBtn} onClick={() => handleApproveQuotation(doc.id)}>
                           Approve to SO
                         </button>
                      )}
                      {activeTab === 'SALES_ORDERS' && (
                         <button className={styles.actionPipelineBtn} onClick={() => handleCreateDelivery(doc.id)}>
                           Create Delivery
                         </button>
                      )}
                      {activeTab === 'DELIVERIES' && doc.status !== 'SHIPPED' && (
                        <button className={styles.actionPipelineBtnOutline} onClick={() => handleMarkShipped(doc.id)}>
                          Mark Shipped
                        </button>
                      )}
                      {activeTab === 'DELIVERIES' && doc.status === 'SHIPPED' && (
                        <button className={styles.actionPipelineBtn} style={{ backgroundColor: '#10B981' }} onClick={() => handleCreateInvoice(doc.id)}>
                          Bill Invoice
                        </button>
                      )}
                      {activeTab === 'INVOICES' && (
                         <button className={styles.actionPipelineBtnOutline} onClick={() => handleRecordPayment(doc.id, doc.amount)}>
                           Record Payment
                         </button>
                      )}

                      {/* Universal Cancel Button */}
                      <button className={styles.actionCancelBtn} onClick={() => handleCancelDocument(doc.id)} title="Cancel or Void Document">
                        <Ban size={14} /> Cancel
                      </button>

                      {/* PDF Export Button */}
                      <button className={styles.actionPdfBtn} onClick={() => window.open(`/invoices/${doc.id.replace('#', '')}/pdf`, '_blank')} title="Download PDF Document">
                        <Printer size={14} /> Output
                      </button>
                    </div>
                  )}
                  {doc.status === 'PAID' && (
                     <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981' }}>CLEARED</span>
                  )}
                  {doc.status === 'CANCELLED' && (
                     <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>VOIDED</span>
                  )}
                </td>
              </tr>
            ))}
            {activeData.length === 0 && (
              <tr>
                 <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No records found in this pipeline stage.
                 </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {activeData.length > 0 && (
          <div className={styles.pagination}>
            <span className={styles.showingText}>Showing 1 to {activeData.length} records</span>
            <div className={styles.pageNumbers}>
               <button className={styles.pageBtn}>&lt;</button>
               <button className={`${styles.pageBtn} ${styles.activePage}`}>1</button>
               <button className={styles.pageBtn}>&gt;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
