'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  History,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';

export default function ContactProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/contacts/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d.contact);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loader}></div>
      <p>Synchronizing Institutional Profile Intelligence...</p>
    </div>
  );

  if (!data) return <div className={styles.error}>Contact not found</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={18}/></button>
          <div className={styles.avatarLarge}>
            {data.name.charAt(0)}
          </div>
          <div className={styles.headerTitleGroup}>
            <div className={styles.entityStatus}>
               <span className={styles.statusDot}></span> 
               {data.role === 'Customer' ? 'Commercial Client' : data.role === 'Vendor' ? 'Strategic Supplier' : 'Partner'}
            </div>
            <h1 className={styles.title}>{data.name}</h1>
            <p className={styles.subtitle}>{data.company || 'Private Entity'} • {data.country || 'International Operations'}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.btnSecondary}><MoreVertical size={16}/></button>
           <button className={styles.btnPrimary}>Create New Transaction</button>
        </div>
      </div>

      {/* Financial Overview Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total Receivables (AR)</div>
           <div className={styles.metricValue} style={{ color: '#279C5A' }}>Rp {data.receivables.toLocaleString()}</div>
           <div className={styles.metricSub}>UNPAID SALES INVOICES</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Total Payables (AP)</div>
           <div className={styles.metricValue} style={{ color: '#EF4444' }}>Rp {data.payables.toLocaleString()}</div>
           <div className={styles.metricSub}>OUTSTANDING VENDOR PAYMENTS</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Net Position</div>
           <div className={styles.metricValue}>Rp {data.totalBalance.toLocaleString()}</div>
           <div className={styles.metricSub}>INSTITUTIONAL BALANCE</div>
        </div>
        <div className={styles.metricCard}>
           <div className={styles.metricLabel}>Risk Assessment</div>
           <div className={styles.metricValue}>Stable</div>
           <div className={styles.metricSub}>COMPLIANCE GRADE A</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
         {/* Left Side: Information & CRM */}
         <div className={styles.sideCol}>
            <div className={styles.panel}>
               <h3 className={styles.panelTitle}><Building size={16}/> Business Intelligence</h3>
               <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                     <Mail size={14}/> <span>{data.email || 'N/A'}</span>
                  </div>
                  <div className={styles.infoItem}>
                     <Phone size={14}/> <span>{data.phone || 'N/A'}</span>
                  </div>
                  <div className={styles.infoItem}>
                     <Globe size={14}/> <span>{data.website || 'N/A'}</span>
                  </div>
                  <div className={styles.infoItem}>
                     <MapPin size={14}/> <span>{data.address || 'N/A'}, {data.city}</span>
                  </div>
               </div>

               <div className={styles.taxBadge}>
                  <ShieldCheck size={14} color="#279C5A"/> 
                  <span>Verified Tax ID: {data.taxId || 'Pending Verification'}</span>
               </div>
            </div>

            <div className={styles.panel}>
               <h3 className={styles.panelTitle}><TrendingUp size={16}/> Active Opportunities</h3>
               <div className={styles.dealList}>
                  {data.opportunities.length > 0 ? data.opportunities.map((opp: any) => (
                     <div key={opp.id} className={styles.dealItem}>
                        <div className={styles.dealMain}>
                           <div className={styles.dealTitle}>{opp.title}</div>
                           <div className={styles.dealVal}>Rp {opp.value.toLocaleString()}</div>
                        </div>
                        <div className={styles.dealStage}>{opp.stage}</div>
                     </div>
                  )) : (
                     <div className={styles.emptyMsg}>No active opportunities</div>
                  )}
               </div>
               <button className={styles.viewAllBtn}>Explore Pipeline <ChevronRight size={14}/></button>
            </div>
         </div>

         {/* Right Side: Ledger & Activity */}
         <div className={styles.mainCol}>
            <div className={styles.panel}>
               <div className={styles.panelHeaderContainer}>
                  <h3 className={styles.panelTitle}><History size={16}/> Financial Realizations</h3>
                  <div className={styles.tabGroup}>
                     <button className={styles.activeTab}>Invoices</button>
                     <button className={styles.tab}>Purchase Orders</button>
                  </div>
               </div>

               <table className={styles.table}>
                  <thead>
                     <tr>
                        <th>REFERENCE #</th>
                        <th>DATE</th>
                        <th>STATUS</th>
                        <th className={styles.numeric}>AMOUNT</th>
                        <th className={styles.textRight}>ACTION</th>
                     </tr>
                  </thead>
                  <tbody>
                     {data.invoices.length > 0 ? data.invoices.map((inv: any) => (
                        <tr key={inv.id}>
                           <td className={styles.refNo}>#{inv.invoiceNo}</td>
                           <td>{new Date(inv.date).toLocaleDateString()}</td>
                           <td>
                              <span className={`${styles.statusBadge} ${styles[inv.status.toLowerCase()]}`}>
                                 {inv.status}
                              </span>
                           </td>
                           <td className={styles.numeric}>Rp {(inv.grandTotal || inv.amount).toLocaleString()}</td>
                           <td className={styles.textRight}>
                              <button className={styles.iconBtn}><ExternalLink size={14}/></button>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan={5} className={styles.empty}>No recent invoices found.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
