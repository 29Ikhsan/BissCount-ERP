'use client';

import { 
  Plus, 
  Download,
  Filter,
  Calendar,
  UploadCloud,
  ShieldCheck,
  CreditCard,
  Check,
  X as CloseIcon,
  RotateCcw,
  BrainCircuit,
  ShieldCheck as ShieldIcon,
  X,
  UploadCloud as UploadIcon,
  ArrowLeft,
  FileCheck,
  Store
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { exportToCSV } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function Expenses() {
  const router = useRouter();
  const { t, formatCurrency, locale } = useLanguage();
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [masterData, setMasterData] = useState({ accounts: [] as any[], taxes: [] as any[], costCenters: [] as any[] });

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [accRes, taxRes, ccRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/taxes'),
          fetch('/api/cost-centers')
        ]);
        const accData = await accRes.json();
        const taxData = await taxRes.json();
        const ccData = await ccRes.json();
        setMasterData({
          accounts: accData.accounts || [],
          taxes: taxData.taxes || [],
          costCenters: ccData.costCenters || []
        });
      } catch (e) {
        console.error("Failed to load master data for expenses");
      }
    }
    loadMasterData();
  }, []);

  const fetchLiveExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.expenses) {
        const mapped = data.expenses.map((exp: any) => {
          const dateObj = new Date(exp.date);
          // Aggregate WHT from items
          const whtTotal = exp.items?.reduce((acc: number, it: any) => acc + (it.whtAmount || 0), 0) || 0;
          
          return {
            id: exp.id,
            date: dateObj.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            merchant: exp.merchant,
            category: exp.category,
            employee: exp.employeeName,
            netAmount: formatCurrency(exp.amount),
            taxAmount: formatCurrency(exp.taxAmount),
            whtAmount: formatCurrency(whtTotal),
            totalAmount: formatCurrency(exp.grandTotal),
            rawTotal: exp.grandTotal // For sorting if needed
          };
        });
        setExpensesList(mapped);
      }
    } catch (e) {
      console.error('Error fetching expenses', e);
    }
  };

  const triggerToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchLiveExpenses();
  }, [locale]);

  const handleAction = async (id: string, action: string, overrides: any = {}) => {
    try {
      const payload = {
        status: action,
        merchant: overrides.merchant,
        date: overrides.date,
        costCenterId: overrides.costCenterId,
        items: overrides.items?.map((it: any) => ({
          accountId: it.accountId,
          description: it.description,
          amount: Number(it.amount),
          taxRate: Number(it.taxRate),
          whtRate: Number(it.whtRate),
          costCenterId: it.costCenterId
        }))
      };

      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setExpensesList(prev => prev.filter(e => e.id !== id));
        triggerToast(`Expense has been ${action}.`);
        setSelectedReview(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewItemChange = (itemId: string, field: string, value: any) => {
    setSelectedReview((prev: any) => ({
      ...prev,
      items: prev.items.map((it: any) => 
        it.id === itemId ? { ...it, [field]: value } : it
      )
    }));
  };

  const addReviewLine = () => {
    setSelectedReview((prev: any) => ({
      ...prev,
      items: [
        ...prev.items, 
        { id: `new-${Date.now()}`, accountId: '', description: '', amount: 0, taxRate: 0, whtRate: 0 }
      ]
    }));
  };

  const calcReviewSubtotal = () => selectedReview?.items?.reduce((acc: number, it: any) => acc + (Number(it.amount) || 0), 0) || 0;
  const calcReviewTax = () => selectedReview?.items?.reduce((acc: number, it: any) => acc + ((Number(it.amount) || 0) * (Number(it.taxRate) || 0) / 100), 0) || 0;
  const calcReviewWht = () => selectedReview?.items?.reduce((acc: number, it: any) => acc + ((Number(it.amount) || 0) * (Number(it.whtRate) || 0) / 100), 0) || 0;
  const calcReviewTotal = () => calcReviewSubtotal() + calcReviewTax() - calcReviewWht();

  const openReview = async (expense: any) => {
    // Fetch full data if items are missing
    const res = await fetch(`/api/expenses`);
    const data = await res.json();
    const fullExp = data.expenses.find((e: any) => e.id === expense.id);
    setSelectedReview(fullExp);
  };

  const handleExport = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Employee', 'Amount'];
    const data = filteredExpenses.map(e => ({
      date: e.date,
      merchant: e.merchant,
      category: e.category,
      employee: e.employee,
      amount: e.amount
    }));
    exportToCSV('BizzCount_Expenses.csv', headers, data);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const resX = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
      });
      const xData = await resX.json();
      
      if (!xData.success) throw new Error(xData.error || 'AI Extraction Failed');

      const { merchant, date, total_amount, tax_amount, category } = xData.extraction;
      
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: merchant || `Scan Result: ${file.name}`,
          date: date || new Date(),
          employeeName: 'Ikhsan (via DeepSeek AI)',
          items: [{
              description: `Extracted from ${file.name}`,
              amount: total_amount || 0,
              taxAmount: tax_amount || 0,
              categoryName: category || 'General Expense'
          }]
        })
      });

      if (res.ok) {
        setIsScanning(false);
        triggerToast(`DeepSeek Scan Complete: Extracted ${merchant || 'data'} from ${file.name}`);
        fetchLiveExpenses();
      } else {
        setIsScanning(false);
        triggerToast("DeepSeek Extraction Error. Please try again.");
      }
    } catch (err: any) {
      setIsScanning(false);
      triggerToast(err.message || "Network error during DeepSeek scan.");
    }
  };

  const handleScan = () => {
    fileInputRef.current?.click();
  };

  const filteredExpenses = expensesList.filter((e: any) => 
    filterCategory === 'All Categories' || e.category === filterCategory
  );

  return (
    <div className={styles.container}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={onFileChange} 
        accept="image/*,.pdf" 
      />
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Expenses</h1>
          <p className={styles.pageSubtitle}>Streamline your organizational spend. Review, approve, and audit financial claims with institutional-grade precision.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.exportBtn} onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className={styles.addBtn} onClick={() => router.push('/expenses/new')}>
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {toast?.visible && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {toast.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardBlue}>
          <div className={styles.kpiLabel}>TOTAL EXPENSES (MTD)</div>
          <div className={styles.kpiValue}>{formatCurrency(42850120)} <span className={styles.kpiTrend}>↗ 8.2%</span></div>
        </div>
        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiLabel}>PENDING APPROVAL</div>
          <div className={styles.kpiValueMain}>14 <span className={styles.kpiSub}>Requests</span></div>
        </div>
        <div className={styles.kpiCardDefault}>
          <div className={styles.kpiLabel}>AWAITING REIMBURSEMENT</div>
          <div className={styles.kpiValueMain}>{formatCurrency(3120000)} <span className={styles.kpiSub}>Approved</span></div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.tableSection}>
          <div className={styles.tableControls}>
            <div className={styles.filterGroup}>
              <select 
                className={styles.filterBtn} 
                style={{ appearance: 'none', paddingRight: '24px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option>All Categories</option>
                <option>Travel & Lodging</option>
                <option>Meals & Entertainment</option>
                <option>IT Infrastructure</option>
                <option>Office Supplies</option>
              </select>
              <button className={styles.filterBtn} onClick={() => triggerToast("Date range filtering is simulated.")}><Calendar size={14}/> Date Range</button>
            </div>
            <button className={styles.exportBtn} onClick={handleExport}>
              <Download size={14} /> Export CSV
            </button>
          </div>
          
          <table className={styles.expenseTable}>
            <thead>
              <tr>
                <th>DATE</th>
                <th>MERCHANT</th>
                <th>CATEGORY</th>
                <th>EMPLOYEE</th>
                <th>NET (BASE)</th>
                <th>VAT (+)</th>
                <th>WHT (-)</th>
                <th className={styles.textRight}>TOTAL (GRAND)</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr 
                  key={exp.id} 
                  onClick={() => openReview(exp)}
                  className={styles.clickableRow}
                >
                  <td>
                    <div className={styles.dateBlock}>
                      <span className={styles.dateMonth}>{exp.date.split(' ')[0]}</span>
                      <span className={styles.dateDay}>{exp.date.split(' ')[1].replace(',', '')}</span>
                      <span className={styles.dateYear}>{exp.date.split(' ')[2]}</span>
                    </div>
                  </td>
                  <td><span className={styles.merchantName}>{exp.merchant}</span></td>
                  <td>
                    <span className={`${styles.categoryBadge} ${exp.merchant.includes('Scan') ? styles.scanStatus : ''}`}>
                      {exp.merchant.includes('Scan') ? 'AWAITING REVIEW' : exp.category}
                    </span>
                  </td>
                  <td><span className={styles.employeeNameSubtle}>{exp.employee}</span></td>
                  <td><span className={styles.amountTextSmall}>{exp.netAmount}</span></td>
                  <td><span className={styles.taxAmountText}>{exp.taxAmount}</span></td>
                  <td><span className={styles.whtAmountText}>{exp.whtAmount}</span></td>
                  <td className={styles.textRight}><span className={styles.amountTextBold}>{exp.totalAmount}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleAction(exp.id, 'APPROVED')} 
                        style={{ background: '#D1FAE5', color: '#10B981', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleAction(exp.id, 'REJECTED')}
                        style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Reject"
                      >
                        <CloseIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                   <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No expenses matching your filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={styles.viewAllContainer}>
             <button className={styles.viewAllBtn}>View All Transactions</button>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.scanCard}>
            <h3 className={styles.scanTitle}>Smart Scan</h3>
            <p className={styles.scanDesc}>Upload receipts and our AI will automatically extract merchant, date, and tax details into your ledger.</p>
            <div className={styles.dropZone} onClick={handleScan}>
              {isScanning ? (
                <>
                  <RotateCcw size={32} className={styles.spinner} />
                  <div className={styles.scanningText}>Analyzing Receipt...</div>
                </>
              ) : (
                <>
                  <UploadCloud size={32} className={styles.uploadIcon} />
                  <div className={styles.uploadTextBold}>Drop files or click to upload</div>
                  <div className={styles.uploadTextFormat}>JPG, PDF, PNG UP TO 10MB</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.complianceCard}>
            <div className={styles.complianceHeader}>
              <ShieldCheck className={styles.complianceIcon} size={20} />
              <h3 className={styles.complianceTitle}>Compliance Center</h3>
            </div>
            
            <div className={styles.complianceList}>
              <div className={styles.complianceItem}>
                <div className={`${styles.compDot} ${styles.dotRed}`}></div>
                <div className={styles.compContent}>
                  <div className={styles.compName}>Missing Tax ID</div>
                  <div className={styles.compDesc}>United Airlines receipt is missing a valid VAT/Tax ID number for reimbursement.</div>
                  <button className={styles.compAction}>REQUEST EDIT</button>
                </div>
              </div>
              
              <div className={styles.complianceItem}>
                <div className={`${styles.compDot} ${styles.dotGreen}`}></div>
                <div className={styles.compContent}>
                  <div className={styles.compName}>Auto-Policy Match</div>
                  <div className={styles.compDesc}>CloudServer Pro matches the recurring 'IT Subscriptions' policy. Auto-approved.</div>
                </div>
              </div>

              <div className={styles.complianceItem}>
                <div className={`${styles.compDot} ${styles.dotGray}`}></div>
                <div className={styles.compContent}>
                  <div className={styles.compName}>Limit Warning</div>
                  <div className={styles.compDesc}>Department 'Marketing' has reached 90% of its quarterly travel budget.</div>
                </div>
              </div>
            </div>
            
            <button className={styles.policyBtn}>View Spending Policies</button>
          </div>

          <div className={styles.cardPromo}>
            <div className={styles.promoOverlay}></div>
            <div className={styles.promoContent}>
              <div className={styles.promoLabel}>COMING SOON</div>
              <h3 className={styles.promoTitle}>Corporate Credit Cards</h3>
              <p className={styles.promoDesc}>
                Unified spend management with physical cards for every employee.
              </p>
            </div>
          </div>
        </div>
      </div>
      {selectedReview && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalLarge}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className={styles.backBtnModal} onClick={() => setSelectedReview(null)}>
                  <ArrowLeft size={16} /> Back to Expenses
                </button>
                <h2 className={styles.modalTitleLarge}>Review & Adjust Scanned Expense</h2>
              </div>
              <div className={styles.topNavActions}>
                <button className={styles.draftBtn} onClick={() => setSelectedReview(null)}>Save as Draft</button>
                <button 
                  className={styles.submitBtn} 
                  onClick={() => handleAction(selectedReview.id, 'APPROVED', selectedReview)}
                >
                  <FileCheck size={16} /> Confirm & Post to Ledger
                </button>
              </div>
            </div>

            <div className={styles.modalContentGrid}>
              {/* Left Column: Form Details */}
              <div className={styles.mainModalPanel}>
                <div className={styles.panelHeaderRow}>
                   <h3 className={styles.panelHeading}>Record Scanned Expense</h3>
                   <span className={styles.statusBadgeUnsubmitted}>Unsubmitted</span>
                </div>

                <div className={styles.formSectionBox}>
                  <h4 className={styles.sectionHeading}><Store size={14} /> MERCHANT & PAYMENT DETAILS</h4>
                  <div className={styles.inputFormGrid}>
                    <div className={styles.inputGroup}>
                      <label>Merchant / Vendor Name</label>
                      <input 
                        type="text" 
                        value={selectedReview.merchant} 
                        onChange={(e) => setSelectedReview({...selectedReview, merchant: e.target.value})}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Date of Expense</label>
                      <input 
                        type="date" 
                        value={selectedReview.date?.split('T')[0]} 
                        onChange={(e) => setSelectedReview({...selectedReview, date: e.target.value})}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Payment Method</label>
                      <select defaultValue="Corporate Card (xxx-1234)">
                         <option>Corporate Card (xxx-1234)</option>
                         <option>Petty Cash</option>
                         <option>Direct Reimbursement</option>
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Reference / Receipt No.</label>
                      <input type="text" placeholder="#REC-xxx" defaultValue={selectedReview.receiptUrl} />
                    </div>
                  </div>
                </div>

                <div className={styles.formSectionBox}>
                  <h4 className={styles.sectionHeading}><FileCheck size={14} /> EXPENSE CATEGORIZATIONS</h4>
                  <div className={styles.tableItemsWrapper}>
                    <div className={styles.itemsTableHeader}>
                      <div style={{ flex: 1.5 }}>CATEGORY (COA)</div>
                      <div style={{ flex: 1.5 }}>DESCRIPTION</div>
                      <div style={{ flex: 1.2 }}>COST CENTER / PROJ</div>
                      <div style={{ flex: 0.8 }}>AMOUNT</div>
                      <div style={{ flex: 0.5 }}>VAT (%)</div>
                      <div style={{ flex: 0.5 }}>WHT (%)</div>
                    </div>
                    
                    {selectedReview.items?.map((item: any) => (
                      <div key={item.id} className={styles.itemTableRow}>
                        <div style={{ flex: 1.5 }}>
                          <select 
                            className={styles.rowSelect} 
                            value={item.accountId || ''}
                            onChange={(e) => handleReviewItemChange(item.id, 'accountId', e.target.value)}
                          >
                            <option value="">-- Account --</option>
                            {masterData.accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1.5 }}>
                          <input 
                            type="text" 
                            className={styles.rowInput} 
                            value={item.description}
                            onChange={(e) => handleReviewItemChange(item.id, 'description', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1.2 }}>
                          <select 
                            className={styles.rowSelect}
                            value={item.costCenterId || ''}
                            onChange={(e) => handleReviewItemChange(item.id, 'costCenterId', e.target.value)}
                          >
                            <option value="">-- No CC --</option>
                            {masterData.costCenters.map(cc => (
                              <option key={cc.id} value={cc.id}>{cc.code}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 0.8 }}>
                          <input 
                            type="number" 
                            className={styles.rowInput} 
                            value={item.amount}
                            onChange={(e) => handleReviewItemChange(item.id, 'amount', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 0.5 }}>
                          <input 
                            type="number" 
                            className={styles.rowInput} 
                            value={item.taxRate}
                            onChange={(e) => handleReviewItemChange(item.id, 'taxRate', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 0.5 }}>
                          <input 
                            type="number" 
                            className={styles.rowInput} 
                            value={item.whtRate || 0}
                            onChange={(e) => handleReviewItemChange(item.id, 'whtRate', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className={styles.addLineBtnModal} onClick={addReviewLine}>
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>
              </div>

              {/* Right Column: Summary */}
              <div className={styles.sideModalPanel}>
                 <div className={styles.summaryCardModal}>
                    <h3 className={styles.summaryTitleLarge}>Expense Summary</h3>
                    <div className={styles.summaryLine}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(calcReviewSubtotal())}</span>
                    </div>
                    <div className={styles.summaryLine}>
                      <span>Estimated Tax (VAT)</span>
                      <span>{formatCurrency(calcReviewTax())}</span>
                    </div>
                    <div className={styles.summaryLine}>
                      <span>WHT Deduction (PPh)</span>
                      <span style={{ color: '#EF4444' }}>-{formatCurrency(calcReviewWht())}</span>
                    </div>
                    <div className={styles.summaryTotalNet}>
                      <span>Total Request (Net)</span>
                      <span className={styles.netValueFinal}>{formatCurrency(calcReviewTotal())}</span>
                    </div>
                 </div>

                 <div className={styles.attachmentCardModal}>
                    <h3 className={styles.summaryTitleLarge}>Attachments & Receipts</h3>
                    <div className={styles.aiVerificationBadge}>
                       <BrainCircuit size={16} /> Verified by DeepSeek-V3
                    </div>
                    <div className={styles.receiptPreviewMock}>
                       <UploadCloud size={24} />
                       <span>Receipt.pdf</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
