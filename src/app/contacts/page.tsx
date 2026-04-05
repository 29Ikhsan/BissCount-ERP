'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users,
  Building2,
  Search,
  Plus,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactsDirectory() {
  const router = useRouter();
  const { t, formatCurrency } = useLanguage();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch('/api/contacts');
        const data = await res.json();
        if (data.contacts) {
          setContacts(data.contacts);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContacts();
  }, []);


  const getFilteredContacts = () => {
    let filtered = contacts;
    if (activeTab === 'CUSTOMERS') {
      filtered = filtered.filter(c => c.type === 'Customer' || c.type === 'Both');
    } else if (activeTab === 'VENDORS') {
      filtered = filtered.filter(c => c.type === 'Vendor' || c.type === 'Both');
    }
    
    if (searchQuery) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const filteredData = getFilteredContacts();

  // KPIs
  const totalReceivables = contacts.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
  const totalPayables = contacts.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);
  const totalCustomers = contacts.filter(c => c.type === 'Customer' || c.type === 'Both').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{t('ContactsCRM')}</h1>
          <p className={styles.pageSubtitle}>{t('ContactsSubtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => router.push('/contacts/new')}>
            <UserPlus size={16} /> New Contact
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          Consulting Database CRM ledgers...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCardBlue}>
              <div className={styles.kpiLabel}>TOTAL ACCOUNTS RECEIVABLE</div>
              <div className={styles.kpiValue}>{formatCurrency(totalReceivables)}</div>
              <div className={styles.kpiDesc}>Money owed to you by customers</div>
            </div>
            <div className={styles.kpiCardRed}>
              <div className={styles.kpiLabel}>TOTAL ACCOUNTS PAYABLE</div>
              <div className={styles.kpiValue}>{formatCurrency(totalPayables)}</div>
              <div className={styles.kpiDesc}>Money you owe to vendors</div>
            </div>
            <div className={styles.kpiCardPurple}>
              <div className={styles.kpiLabel}>BENCHMARKED ENTITIES</div>
              <div className={styles.kpiValue}>{contacts.length}</div>
              <div className={styles.kpiDesc}>Engaged natively with ledgers</div>
            </div>
          </div>

          {/* Directory List Container */}
          <div className={styles.listContainer}>
            <div className={styles.toolbar}>
              <div className={styles.tabContainer}>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('ALL')}
                >
                  All Contacts
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'CUSTOMERS' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('CUSTOMERS')}
                >
                  Customers (AR)
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'VENDORS' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('VENDORS')}
                >
                  Vendors (AP)
                </button>
              </div>
              
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or email..." 
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <table className={styles.contactTable}>
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>CONTACT NAME</th>
                  <th style={{ width: '15%' }}>TYPE</th>
                  <th style={{ width: '25%' }}>PHONE / EMAIL</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>OUTSTANDING BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((contact) => {
                  const utilPercent = contact.creditLimit > 0 ? (contact.balance / contact.creditLimit) * 100 : 0;
                  let utilClass = styles.limitFill;
                  if (utilPercent > 75) utilClass = styles.limitFillWarning;
                  if (utilPercent > 90) utilClass = styles.limitFillDanger;

                  return (
                    <tr key={contact.id}>
                      <td>
                        <div className={styles.contactInfoRow}>
                          <div className={styles.contactAvatar} style={{ backgroundColor: contact.bg, color: contact.color }}>
                            {contact.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className={styles.contactDetails}>
                            <span className={styles.contactName}>{contact.name}</span>
                            <span className={styles.contactEmail}>{contact.code}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          contact.type === 'Customer' ? styles.badgeCustomer :
                          contact.type === 'Vendor' ? styles.badgeVendor : styles.badgeBoth
                        }`}>
                          {contact.type}
                        </span>
                      </td>
                      <td>
                        <div className={styles.contactDetails}>
                          <span className={styles.contactName}>{contact.phone}</span>
                          <span className={styles.contactEmail}>{contact.email}</span>
                        </div>
                      </td>
                      <td className={styles.textRight}>
                        {contact.balance === 0 ? (
                          <span className={styles.moneyTextSecondary}>{formatCurrency(0)}</span>
                        ) : (
                          <>
                            <div className={contact.balance > 0 ? styles.moneyTextSuccess : styles.moneyTextDanger}>
                              {contact.balance > 0 ? 'To Receive: ' : 'To Pay: '}
                              {formatCurrency(contact.balance)}
                            </div>
                            {contact.type === 'Customer' && contact.creditLimit > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                                  Credit Limit: {formatCurrency(contact.creditLimit)}
                                </span>
                                <div className={styles.limitBar}>
                                  <div className={utilClass} style={{ width: `${Math.min(utilPercent, 100)}%` }}></div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No Contacts Found. Try adding a new Client or Vendor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
