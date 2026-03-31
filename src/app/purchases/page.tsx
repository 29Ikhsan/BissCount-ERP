'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Download,
  Filter,
  ArrowUpDown,
  Upload,
  ClipboardList,
  Store,
  Package,
  Receipt,
  X,
  RotateCcw,
  Ban,
  Printer
} from 'lucide-react';
import { generateDocumentPDF } from '@/lib/pdfGenerator';
import styles from './page.module.css';

// --- Initial Dummy State Data ---
const initialVendorBills = [
  { id: '#BILL-2024-001', client: 'Amazon Web Services', clientAvatar: 'AW', clientBg: '#FCE7F3', date: 'Oct 12, 2023', amount: '$4,500.00', status: 'PAID', paidAmount: 4500 },
  { id: '#BILL-2024-002', client: 'WeWork', clientAvatar: 'WW', clientBg: '#E2E8F0', date: 'Oct 15, 2023', amount: '$12,450.00', status: 'PENDING', paidAmount: 0 },
];

const initialRequisitions = [
  { id: '#PR-2024-005', client: 'IT Department', clientAvatar: 'IT', clientBg: '#DBEAFE', date: 'Oct 25, 2023', amount: '$5,000.00', status: 'DRAFT', paidAmount: 0 },
  { id: '#PR-2024-006', client: 'Marketing Team', clientAvatar: 'MK', clientBg: '#D1FAE5', date: 'Oct 26, 2023', amount: '$15,000.00', status: 'PENDING', paidAmount: 0 }
];

const initialPurchaseOrders = [
  { id: '#PO-2024-004', client: 'Dell Computers (Vendor)', clientAvatar: 'DC', clientBg: '#FEF08A', date: 'Oct 20, 2023', amount: '$8,200.00', status: 'APPROVED', paidAmount: 0 },
];

const initialGoodsReceipts = [
  { id: '#GR-2024-003', client: 'Staples Office (Vendor)', clientAvatar: 'ST', clientBg: '#FFEDD5', date: 'Oct 22, 2023', amount: '$1,500.00', status: 'RECEIVED', paidAmount: 0 }
];

const payableSummary = [
  { bucket: 'Current', amount: 85000, color: '#10B981', percentage: 65 },
  { bucket: '1-30 Days', amount: 25000, color: '#F59E0B', percentage: 20 },
  { bucket: '31-60 Days', amount: 12000, color: '#F97316', percentage: 10 },
  { bucket: '61-90 Days', amount: 4500, color: '#EF4444', percentage: 4 },
  { bucket: '90+ Days', amount: 1500, color: '#7F1D1D', percentage: 1 },
];

export default function ProcureToPayHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('REQUISITION');
  
  // Interactive State Storage
  const [requisitions, setRequisitions] = useState(initialRequisitions);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(initialPurchaseOrders);
  const [goodsReceipts, setGoodsReceipts] = useState(initialGoodsReceipts);
  const [vendorBills, setVendorBills] = useState(initialVendorBills);

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch('/api/purchases');
        const data = await res.json();
        if (data.purchaseOrders && data.purchaseOrders.length > 0) {
          const mapped = data.purchaseOrders.map((po: any) => ({
             id: po.poNumber,
             client: po.supplier,
             clientAvatar: po.supplier.substring(0, 2).toUpperCase(),
             clientBg: '#FEF08A',
             date: new Date(po.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
             amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(po.amount),
             status: po.status,
             paidAmount: 0
          }));
          setPurchaseOrders(mapped);
        }
      } catch (err) {
        console.error('Fetch PO failed', err);
      }
    };
    fetchPOs();
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
  const handleApproveRequisition = (id: string) => {
    const docIndex = requisitions.findIndex(q => q.id === id);
    if (docIndex > -1) {
      const doc = requisitions[docIndex];
      const newPO = { ...doc, id: doc.id.replace('PR', 'PO'), status: 'APPROVED' };
      
      const prevReqs = [...requisitions];
      const prevPOs = [...purchaseOrders];

      setRequisitions(requisitions.filter(q => q.id !== id));
      setPurchaseOrders([newPO, ...purchaseOrders]);
      setActiveTab('PURCHASE_ORDERS');
      
      triggerToast(`Converted Requisition ${id} to Purchase Order.`, () => {
         setRequisitions(prevReqs);
         setPurchaseOrders(prevPOs);
         setActiveTab('REQUISITION');
      });
    }
  };

  const handleReceiveGoods = (id: string) => {
    const docIndex = purchaseOrders.findIndex(s => s.id === id);
    if (docIndex > -1) {
      const doc = purchaseOrders[docIndex];
      const newGR = { ...doc, id: doc.id.replace('PO', 'GR'), status: 'PROCESSING' };
      
      const prevPOs = [...purchaseOrders];
      const prevGRs = [...goodsReceipts];

      setPurchaseOrders(purchaseOrders.filter(s => s.id !== id));
      setGoodsReceipts([newGR, ...goodsReceipts]);
      setActiveTab('GOODS_RECEIPT');
      
      triggerToast(`Initiated Goods Receipt ${newGR.id} for Purchase Order ${id}.`, () => {
         setPurchaseOrders(prevPOs);
         setGoodsReceipts(prevGRs);
         setActiveTab('PURCHASE_ORDERS');
      });
    }
  };

  const handleMarkInventoryReceived = (id: string) => {
    const prevGRs = [...goodsReceipts];
    
    const updatedGRs = goodsReceipts.map(d => {
      if (d.id === id) return { ...d, status: 'RECEIVED' };
      return d;
    });
    setGoodsReceipts(updatedGRs);
    
    triggerToast(`Inventory validated & received for ${id}.`, () => {
       setGoodsReceipts(prevGRs);
    });
  };

  const handleCreateVendorBill = (id: string) => {
    const docIndex = goodsReceipts.findIndex(d => d.id === id);
    if (docIndex > -1) {
      const doc = goodsReceipts[docIndex];
      const newBill = { ...doc, id: doc.id.replace('GR', 'BILL'), status: 'PENDING' };
      
      const prevGRs = [...goodsReceipts];
      const prevBills = [...vendorBills];

      setGoodsReceipts(goodsReceipts.filter(d => d.id !== id));
      setVendorBills([newBill, ...vendorBills]);
      setActiveTab('VENDOR_BILLS');
      
      triggerToast(`Successfully generated Vendor Bill ${newBill.id}.`, () => {
         setGoodsReceipts(prevGRs);
         setVendorBills(prevBills);
         setActiveTab('GOODS_RECEIPT');
      });
    }
  };

  const handleRecordPayment = (id: string, currentAmountStr: string) => {
    const invTotal = parseFloat(currentAmountStr.replace(/[^0-9.-]+/g, ""));
    const inputStr = window.prompt(`Enter actual payment sent to Vendor (Total Due: $${invTotal.toLocaleString()}):`, invTotal.toString());
    
    if (inputStr === null || inputStr === "") return; // user cancelled prompt
    
    const payment = parseFloat(inputStr.replace(/[^0-9.-]+/g, ""));
    if (isNaN(payment) || payment <= 0) {
       alert("Invalid payment amount entered.");
       return;
    }

    const prevBills = [...vendorBills];
    
    const updatedBills = vendorBills.map(inv => {
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
    setVendorBills(updatedBills);
    
    triggerToast(`Payment dispersal of $${payment.toLocaleString('en-US', {minimumFractionDigits: 2})} recorded for Bill ${id}.`, () => {
       setVendorBills(prevBills);
    });
  };

  const handleCancelDocument = (id: string) => {
    let targetArray: any[] = [];
    let setTargetArray: any = null;
    let prevArray: any[] = [];
    
    if (activeTab === 'REQUISITION') { targetArray = requisitions; setTargetArray = setRequisitions; prevArray = [...requisitions]; }
    else if (activeTab === 'PURCHASE_ORDERS') { targetArray = purchaseOrders; setTargetArray = setPurchaseOrders; prevArray = [...purchaseOrders]; }
    else if (activeTab === 'GOODS_RECEIPT') { targetArray = goodsReceipts; setTargetArray = setGoodsReceipts; prevArray = [...goodsReceipts]; }
    else { targetArray = vendorBills; setTargetArray = setVendorBills; prevArray = [...vendorBills]; }
    
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
    router.push(`/purchases/new?type=${activeTab.toLowerCase()}`);
  };

  // Select dataset based on Active Tab
  let activeData: any[] = [];
  if (activeTab === 'REQUISITION') activeData = requisitions;
  if (activeTab === 'PURCHASE_ORDERS') activeData = purchaseOrders;
  if (activeTab === 'GOODS_RECEIPT') activeData = goodsReceipts;
  if (activeTab === 'VENDOR_BILLS') activeData = vendorBills;

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
          <h1 className={styles.pageTitle}>Procure-to-Pay Hub</h1>
          <p className={styles.pageSubtitle}>Manage your entire purchasing pipeline: Requisitions, Orders, Goods Receipts, & Vendor Bills.</p>
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
            {activeTab === 'REQUISITION' ? 'New Requisition' :
             activeTab === 'PURCHASE_ORDERS' ? 'New Purchase Order' : 
             activeTab === 'GOODS_RECEIPT' ? 'New Goods Receipt' : 'New Vendor Bill'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div 
          className={`${styles.tabItem} ${activeTab === 'REQUISITION' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('REQUISITION')}
        >
          <ClipboardList size={16} /> 1. Requisitions
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'PURCHASE_ORDERS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
        >
          <Store size={16} /> 2. Purchase Orders
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'GOODS_RECEIPT' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('GOODS_RECEIPT')}
        >
          <Package size={16} /> 3. Goods Receipts
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'VENDOR_BILLS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('VENDOR_BILLS')}
        >
          <Receipt size={16} /> 4. Vendor Bills
        </div>
      </div>

      {/* A/P Aging Summary (Only show on Vendor Bills tab) */}
      {activeTab === 'VENDOR_BILLS' && (
        <div className={styles.agingSection}>
          <div className={styles.agingHeader}>
             <h3 className={styles.sectionTitle}>Accounts Payable Aging</h3>
             <p className={styles.sectionSubtitle}>Outstanding vendor balances categorized by days past due.</p>
          </div>
          <div className={styles.agingGrid}>
            {payableSummary.map((item) => (
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
                {activeTab === 'REQUISITION' && <><option>Draft</option><option>Pending</option><option>Cancelled</option></>}
                {activeTab === 'PURCHASE_ORDERS' && <><option>Approved</option><option>Cancelled</option></>}
                {activeTab === 'GOODS_RECEIPT' && <><option>Processing</option><option>Received</option><option>Cancelled</option></>}
                {activeTab === 'VENDOR_BILLS' && <><option>Paid</option><option>Pending</option><option>Overdue</option><option>Cancelled</option></>}
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
              <th>VENDOR / REQUESTER</th>
              <th>DATE</th>
              <th>LOGGED VALUE</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'center' }}>PIPELINE ACTION</th>
            </tr>
          </thead>
          <tbody>
            {activeData.map((doc) => (
              <tr key={doc.id} className={doc.status === 'CANCELLED' ? styles.cancelled : ''}>
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
                       Dispersed: ${(doc as any).paidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}
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
                      {activeTab === 'REQUISITION' && (
                         <button className={styles.actionPipelineBtn} onClick={() => handleApproveRequisition(doc.id)}>
                           Approve to PO
                         </button>
                      )}
                      {activeTab === 'PURCHASE_ORDERS' && (
                         <button className={styles.actionPipelineBtn} onClick={() => handleReceiveGoods(doc.id)}>
                           Receive Goods
                         </button>
                      )}
                      {activeTab === 'GOODS_RECEIPT' && doc.status !== 'RECEIVED' && (
                        <button className={styles.actionPipelineBtnOutline} onClick={() => handleMarkInventoryReceived(doc.id)}>
                          Validate Inventory
                        </button>
                      )}
                      {activeTab === 'GOODS_RECEIPT' && doc.status === 'RECEIVED' && (
                        <button className={styles.actionPipelineBtn} style={{ backgroundColor: '#10B981' }} onClick={() => handleCreateVendorBill(doc.id)}>
                          Convert to Bill
                        </button>
                      )}
                      {activeTab === 'VENDOR_BILLS' && (
                         <button className={styles.actionPipelineBtnOutline} onClick={() => handleRecordPayment(doc.id, doc.amount)}>
                           Pay Vendor
                         </button>
                      )}

                      {/* Universal Cancel Button */}
                      <button className={styles.actionCancelBtn} onClick={() => handleCancelDocument(doc.id)} title="Cancel or Void Document">
                        <Ban size={14} /> Cancel
                      </button>

                      {/* PDF Export Button */}
                      <button className={styles.actionPdfBtn} onClick={() => generateDocumentPDF(doc, activeTab)} title="Download PDF Document">
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
