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
import { exportToCSV, triggerImport } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/context/ToastContext';

// Dummy fallback only shown when DB has no records yet
export default function OrderToCashHub() {
  const router = useRouter();
  const { t, formatCurrency, locale } = useLanguage();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('QUOTATIONS');
  
  const [quotations, setQuotations] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // Filtering & Search
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [agingSummary, setAgingSummary] = useState<any[]>([]);

  const buildAgingSummary = (invList: any[]) => {
    const now = Date.now();
    const buckets = [
      { bucket: 'Belum Jatuh Tempo', color: '#10B981', min: -Infinity, max: 0, amount: 0 },
      { bucket: '1-30 Hari', color: '#F59E0B', min: 0, max: 30, amount: 0 },
      { bucket: '31-60 Hari', color: '#F97316', min: 30, max: 60, amount: 0 },
      { bucket: '61-90 Hari', color: '#EF4444', min: 60, max: 90, amount: 0 },
      { bucket: '90+ Hari', color: '#7F1D1D', min: 90, max: Infinity, amount: 0 },
    ];
    let total = 0;
    invList.filter(i => i.status === 'PENDING' || i.status === 'PARTIAL').forEach(inv => {
      const daysOverdue = (now - new Date(inv.dueDate || inv.date).getTime()) / 86400000;
      const outstanding = inv.grandTotal - (inv.paidAmount || 0);
      buckets.forEach(b => { if (daysOverdue > b.min && daysOverdue <= b.max) { b.amount += outstanding; total += outstanding; } });
    });
    return buckets.map(b => ({ ...b, percentage: total > 0 ? Math.round((b.amount / total) * 100) : 0 }));
  };

  useEffect(() => {
    const fetchLiveInvoices = async () => {
      try {
        const res = await fetch('/api/invoices');
        const data = await res.json();
        if (data.invoices && data.invoices.length > 0) {
          const mapped = data.invoices.map((inv: any) => ({
            _dbId: inv.id,  // keep real DB id for PATCH calls
            id: inv.invoiceNo,
            client: inv.clientName,
            clientAvatar: inv.clientName.substring(0, 2).toUpperCase(),
            clientBg: '#DBEAFE',
            date: new Date(inv.date).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dueDate: inv.dueDate,
            amount: Number(inv.grandTotal ?? inv.amount),  // keep numeric
            paidAmount: Number(inv.paidAmount) || 0,
            status: inv.status,
          }));
          setInvoices(mapped);
          setAgingSummary(buildAgingSummary(data.invoices));
        }
      } catch (err) {
        console.error('Failed to fetch invoices', err);
      }
    };
    fetchLiveInvoices();
  }, [locale]);

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
      
      showToast(`Converted Quotation ${id} to Sales Order.`, 'success', () => {
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
      
      showToast(`Initiated Delivery Order ${newDO.id} for Sales Order ${id}.`, 'success', () => {
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
    
    showToast(`Marked Delivery ${id} as SHIPPED.`, 'info', () => {
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
      
      showToast(`Successfully billed Invoice ${newInv.id}.`, 'success', () => {
         setDeliveries(prevDeliveries);
         setInvoices(prevInvoices);
         setActiveTab('DELIVERIES');
      });
    }
  };

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, id: string, total: number, dbId?: string } | null>(null);
  const [paymentValue, setPaymentValue] = useState('');

  const handleRecordPaymentSubmit = async () => {
    if (!paymentModal) return;
    const payment = parseFloat(paymentValue.replace(/[^0-9.-]+/g, ''));
    
    if (isNaN(payment) || payment <= 0) {
      showToast('Nominal tidak valid.', 'error');
      return;
    }

    if (paymentModal.dbId) {
      try {
        const res = await fetch(`/api/invoices/${paymentModal.dbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment })
        });
        const data = await res.json();
        if (res.ok) {
          const updated = data.invoice;
          setInvoices(invoices.map(i => i.id === paymentModal.id ? {
            ...i,
            paidAmount: Number(updated.paidAmount),
            status: updated.status
          } : i));
          showToast(`Pembayaran ${formatCurrency(payment)} dicatat untuk Invoice ${paymentModal.id}.`, 'success');
          setPaymentModal(null);
          setPaymentValue('');
        } else {
          showToast(`Gagal: ${data.error}`, 'error');
        }
      } catch (e) {
        showToast('Koneksi gagal ke server.', 'error');
      }
    } else {
      // Offline/Local Fallback
      const prevInvoices = [...invoices];
      const updatedInvoices = invoices.map(i => {
        if (i.id === paymentModal.id) {
          const newPaid = (i.paidAmount || 0) + payment;
          return { ...i, paidAmount: newPaid, status: newPaid >= i.amount ? 'PAID' : 'PARTIAL' };
        }
        return i;
      });
      setInvoices(updatedInvoices);
      showToast(`Pembayaran ${formatCurrency(payment)} dicatat (Offline Mode).`, 'info', () => setInvoices(prevInvoices));
      setPaymentModal(null);
      setPaymentValue('');
    }
  };

  const handleRecordPayment = (id: string, currentAmount: number) => {
    const inv = invoices.find(i => i.id === id);
    setPaymentModal({ isOpen: true, id, total: currentAmount, dbId: inv?._dbId });
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
    
    showToast(`Document ${id} has been cancelled.`, 'warning', () => {
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

  // Apply Filter
  const filteredData = activeData.filter(doc => {
    const matchesStatus = filterStatus === 'All Statuses' || doc.status === filterStatus.toUpperCase();
    const matchesSearch = doc.client.toLowerCase().includes(searchQuery.toLowerCase()) || doc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Client', 'Date', 'Amount', 'Status'];
    const data = filteredData.map(d => ({
      id: d.id,
      client: d.client,
      date: d.date,
      amount: d.amount,
      status: d.status
    }));
    exportToCSV(`AKSIA_${activeTab.toLowerCase()}_export.csv`, headers, data);
  };

  const handleImportTrigger = () => {
    triggerImport((file) => {
      showToast(`Successfully imported records from ${file.name}. Processing...`, 'info');
    });
  };

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Sales & Receivables Hub</h1>
          <p className={styles.pageSubtitle}>Manage your entire Order-to-Cash pipeline: Quotes, Orders, Deliveries, and Invoices.</p>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleImportTrigger}>
            <Upload size={16} /> Import
          </button>
          <button className={styles.exportBtn} onClick={handleExport}>
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
            <h3 className={styles.sectionTitle}>{t('ARAging')}</h3>
            <p className={styles.sectionSubtitle}>{t('ARAgingSubtitle')}</p>
          </div>
          <div className={styles.agingGrid}>
            {agingSummary.map((item) => (
              <div key={item.bucket} className={styles.agingCard}>
                 <div className={styles.agingBucketLabel}>{item.bucket}</div>
                 <div className={styles.agingAmount}>{formatCurrency(item.amount)}</div>
                 <div className={styles.agingBarBg}>
                   <div className={styles.agingBarFill} style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
                 </div>
                 <div className={styles.agingPercentage}>{item.percentage}% dari total</div>
              </div>
            ))}
            {agingSummary.length === 0 && (
              <div style={{ color: '#64748b', fontSize: '13px', padding: '16px' }}>Tidak ada piutang yang outstanding.</div>
            )}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className={styles.tableSection}>
        <div className={styles.tableControls}>
          <div className={styles.filterGroup}>
            <div className={styles.selectWrapper}>
              <span className={styles.selectLabel}>STATUS:</span>
              <select className={styles.selectInput} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
            {paginatedData.map((doc) => (
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
                  <span className={styles.amountText}>{formatCurrency(doc.amount)}</span>
                  {(doc.paidAmount > 0) && doc.status !== 'PAID' && (
                    <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '2px', fontWeight: 600 }}>
                       Terbayar: {formatCurrency(doc.paidAmount)}
                    </div>
                  )}
                  {(doc.paidAmount > 0) && doc.status !== 'PAID' && (
                    <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: '2px', fontWeight: 600 }}>
                       Sisa: {formatCurrency(doc.amount - doc.paidAmount)}
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
            {filteredData.length === 0 && (
              <tr>
                 <td colSpan={6} style={{ textAlign: 'center', padding: '0px' }}>
                    <EmptyState 
                      title={`No ${activeTab.toLowerCase().replace('_', ' ')} found`}
                      description="You haven't created any records here yet, or no results match your current search/filter criteria."
                      actionLabel={`Create New ${activeTab.substring(0, activeTab.length - 1)}`}
                      actionHref={`/invoices/new?type=${activeTab.toLowerCase()}`}
                    />
                 </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {filteredData.length > 0 && (
          <div className={styles.pagination}>
            <span className={styles.showingText}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </span>
            <div className={styles.pageNumbers}>
               <button 
                 className={`${styles.pageBtn} ${currentPage === 1 ? styles.btnDisabled : ''}`} 
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
               >
                 &lt;
               </button>
               
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                   key={i + 1}
                   className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
                   onClick={() => handlePageChange(i + 1)}
                 >
                   {i + 1}
                 </button>
               ))}

               <button 
                 className={`${styles.pageBtn} ${currentPage === totalPages ? styles.btnDisabled : ''}`} 
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages}
               >
                 &gt;
               </button>
            </div>
          </div>
        )}
      </div>
      {/* Payment Modal */}
      {paymentModal?.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Payment for {paymentModal.id}</h3>
              <button 
                className={styles.closeBtn} 
                onClick={() => { setPaymentModal(null); setPaymentValue(''); }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.paymentSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Invoice</span>
                  <span className={styles.summaryValue}>{formatCurrency(paymentModal.total)}</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nominal Pembayaran (IDR)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>Rp</span>
                  <input 
                    type="number"
                    className={styles.inputText}
                    placeholder="Contoh: 500000"
                    value={paymentValue}
                    onChange={(e) => setPaymentValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRecordPaymentSubmit()}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnCancel} 
                onClick={() => { setPaymentModal(null); setPaymentValue(''); }}
              >
                Batal
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={handleRecordPaymentSubmit}
                disabled={!paymentValue}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
