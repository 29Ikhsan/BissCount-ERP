'use client';

import { 
  User, 
  Building2, 
  ShieldCheck, 
  Bell, 
  HelpCircle,
  LogOut,
  Pencil,
  Lock,
  ChevronDown,
  Info,
  BookOpen,
  Code2,
  Terminal as TerminalIcon,
  Check
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    jobTitle: '',
    timezone: '',
    avatarUrl: ''
  });
  const [org, setOrg] = useState({
    name: '',
    taxId: '',
    address: '',
    fiscalYear: '',
    currency: 'IDR',
    inventoryMethod: 'AVERAGE'
  });
  const [security, setSecurity] = useState({
    twoFactor: true,
    sessions: 2
  });
  const [notifications, setNotifications] = useState({
    financial: { email: true, push: true, sms: false },
    operations: { email: true, push: false, sms: false },
    system: { email: true, push: true, sms: true }
  });
  const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          if (data.user.notifications) setNotifications(data.user.notifications);
        }
        if (data.tenant) {
          setOrg({ ...data.tenant, currency: 'IDR' });
          if (data.tenant.logoUrl) setOrgLogo(data.tenant.logoUrl);
        }
      } catch (e) {
        console.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', data: { ...profile, notifications } })
      });
      if (res.ok) {
        setToast({ visible: true, message: 'Profile changes saved and logged to audit trail.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      alert('Failed to save profile');
    }
  };

  const handleSaveOrg = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'organization', data: { ...org, logoUrl: orgLogo } })
      });
      if (res.ok) {
        setToast({ visible: true, message: 'Organization data updated successfully.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      alert('Failed to save organization details');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setOrgLogo(dataUrl);
      
      // Auto-save logo to DB immediately for better UX
      try {
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'organization', data: { ...org, logoUrl: dataUrl } })
        });
        setToast({ visible: true, message: 'Logo perusahaan berhasil diperbarui di database.' });
      } catch (err) {
        console.error('Failed to auto-save logo');
      }
      setTimeout(() => setToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setOrgLogo(null);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'organization', data: { ...org, logoUrl: '' } })
      });
      setToast({ visible: true, message: 'Logo berhasil dihapus.' });
    } catch (err) {
      console.error('Failed to remove logo');
    }
    if (logoInputRef.current) logoInputRef.current.value = '';
    setTimeout(() => setToast(null), 3000);
  };

  // Removed handleSave mockup

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];
  return (
    <div className={styles.container}>
      <div className={styles.settingsLayout}>
        {/* Settings Navigation */}
        <aside className={styles.settingsNav}>
          <div className={styles.navHeader}>
            <h2 className={styles.navTitle}>Settings</h2>
            <p className={styles.navSubtitle}>Manage your ERP workspace</p>
          </div>
          
          <ul className={styles.navList}>
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={activeTab === item.id ? styles.navItemActive : styles.navItem}
                onClick={() => setActiveTab(item.id)}
                style={{ cursor: 'pointer' }}
              >
                <item.icon size={18} /> {item.label}
              </li>
            ))}
            <li className={styles.navItem} style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px', marginTop: '12px' }}>
              <Link href="/settings/coa" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', width: '100%' }}>
                <BookOpen size={18} /> Chart of Accounts
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/settings/developer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', width: '100%' }}>
                <Code2 size={18} /> Developer API
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/terminal" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', width: '100%' }}>
                <TerminalIcon size={18} /> Terminal / CLI
              </Link>
            </li>
          </ul>

          <div className={styles.navFooter}>
            <div className={styles.navAction}>
              <HelpCircle size={16} /> Support
            </div>
            <div className={styles.navAction}>
              <LogOut size={16} /> Logout
            </div>
          </div>
        </aside>

        {/* Main Settings Content */}
        <div className={styles.settingsContent}>
          {toast?.visible && (
            <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} /> {toast.message}
            </div>
          )}

          {activeTab === 'profile' ? (
            <>
              <div className={styles.contentHeader}>
                <div className={styles.breadcrumbs}>ACCOUNT CONFIGURATION</div>
                <h1 className={styles.pageTitle}>Personal Profile</h1>
                <p className={styles.pageSubtitle}>Update your personal information and manage how you appear across the Bizzcount organization. These settings help maintain your digital identity within the ledger.</p>
              </div>

              {/* Profile Form */}
              <div className={styles.profileFormGroup}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    <img src="https://i.pravatar.cc/150?u=alex" alt="Alex Mitchell" className={styles.avatarImg} />
                    <button className={styles.editAvatarBtn}>
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Avatar & Identity</h3>
                    <p className={styles.sectionDesc}>Recommended: 400x400px JPG or PNG. Your avatar is visible to all workspace members.</p>
                    <div className={styles.avatarActions}>
                      <button className={styles.btnSecondary}>Change Photo</button>
                      <button className={styles.btnGhostDanger}>Remove</button>
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>FULL LEGAL NAME</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className={styles.inputField} 
                    />
                    <span className={styles.inputHelp}>As it appears on official financial documents.</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>PROFESSIONAL EMAIL</label>
                    <input 
                      type="text" 
                      value={profile.jobTitle} 
                      onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
                      className={styles.inputField} 
                    />
                    <span className={styles.inputHelp}>Used for critical system notifications and ledger approvals.</span>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>ORGANIZATIONAL ROLE</label>
                    <div className={styles.inputWithIcon}>
                      <input type="text" defaultValue="Senior Financial Controller" className={styles.inputField} disabled />
                      <Lock size={16} className={styles.inputIconRight} />
                    </div>
                    <span className={styles.inputHelp}>Roles are managed by the System Administrator.</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>AUDIT TIMEZONE</label>
                    <div className={styles.inputWithIcon}>
                      <select className={styles.inputField}>
                        <option>Eastern Standard Time (EST) - GMT-5</option>
                      </select>
                      <ChevronDown size={16} className={styles.inputIconRight} />
                    </div>
                  </div>
                </div>

                <div className={styles.formFooter}>
                  <div className={styles.lastModified}>
                    <strong>Last modification</strong><br/>
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} via Web Platform
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.btnGhost} onClick={() => window.location.reload()}>Reset Defaults</button>
                    <button className={styles.btnPrimary} onClick={handleSaveProfile}>Save Changes ⏎</button>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className={styles.infoCards}>
                <div className={styles.infoCard}>
                  <ShieldCheck size={20} className={styles.infoIconBlue} />
                  <h4 className={styles.infoCardTitle}>Security Ledger</h4>
                  <p className={styles.infoCardText}>All profile changes are logged in the global audit trail to ensure compliance with financial reporting standards.</p>
                </div>
                <div className={styles.infoCardGreen}>
                  <ShieldCheck size={20} className={styles.infoIconGreen} />
                  <h4 className={styles.infoCardTitle}>Verified Status</h4>
                  <p className={styles.infoCardText}>Your account has been verified by the organization administrator. Direct changes to role require re-verification.</p>
                </div>
                <div className={styles.infoCardSolidBlue}>
                  <Info size={20} className={styles.infoIconWhite} />
                  <h4 className={styles.infoCardTitleWhite}>Need help?</h4>
                  <p className={styles.infoCardTextWhite}>If you're having trouble updating your details, please contact the institutional support team for immediate assistance.</p>
                </div>
              </div>

              {/* Login History */}
              <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                  <h3 className={styles.sectionTitleLarge}>Login History</h3>
                  <p className={styles.sectionDesc}>Recent access logs for your account</p>
                  <button className={styles.viewLogBtn}>VIEW FULL AUDIT LOG</button>
                </div>
                
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>DEVICE / BROWSER</th>
                      <th>LOCATION</th>
                      <th>DATE & TIME</th>
                      <th className={styles.textRight}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className={styles.deviceInfo}>
                          <div className={styles.deviceIcon}>💻</div>
                          <div>
                            <div className={styles.deviceName}>Chrome on macOS</div>
                            <div className={styles.deviceIp}>IP: 192.168.1.45</div>
                          </div>
                        </div>
                      </td>
                      <td>New York, USA</td>
                      <td>Oct 24, 2023 14:30</td>
                      <td className={styles.textRight}>
                        <span className={styles.badgeCurrent}>CURRENT SESSION</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className={styles.deviceInfo}>
                          <div className={styles.deviceIcon}>📱</div>
                          <div>
                            <div className={styles.deviceName}>iOS Application</div>
                            <div className={styles.deviceIp}>IP: 10.0.4.122</div>
                          </div>
                        </div>
                      </td>
                      <td>New York, USA</td>
                      <td>Oct 23, 2023 09:15</td>
                      <td className={styles.textRight}>
                        <span className={styles.badgeSignedOut}>SIGNED OUT</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'organization' ? (
            <>
              <div className={styles.contentHeader}>
                <div className={styles.breadcrumbs}>CORPORATE ENTITY MANAGEMENT</div>
                <h1 className={styles.pageTitle}>Organization Profile</h1>
                <p className={styles.pageSubtitle}>Define your institutional identity, fiscal parameters, and global currency defaults for consistent financial reporting across the group.</p>
              </div>

              <div className={styles.profileFormGroup}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>LEGAL ENTITY NAME</label>
                    <input 
                      type="text" 
                      value={org.name} 
                      onChange={(e) => setOrg({...org, name: e.target.value})}
                      className={styles.inputField} 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>TAX IDENTIFICATION (NPWP/NIB)</label>
                    <input 
                      type="text" 
                      value={org.taxId} 
                      onChange={(e) => setOrg({...org, taxId: e.target.value})}
                      className={styles.inputField} 
                    />
                  </div>
                  <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                    <label>REGISTERED BUSINESS ADDRESS</label>
                    <input 
                      type="text" 
                      value={org.address} 
                      onChange={(e) => setOrg({...org, address: e.target.value})}
                      className={styles.inputField} 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>FISCAL YEAR CYCLE</label>
                    <select 
                      className={styles.inputField}
                      value={org.fiscalYear}
                      onChange={(e) => setOrg({...org, fiscalYear: e.target.value})}
                    >
                      <option>January to December</option>
                      <option>April to March</option>
                      <option>July to June</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>BASE ACCOUNTING CURRENCY</label>
                    <input 
                      type="text" 
                      value={org.currency} 
                      disabled
                      className={styles.inputField} 
                    />
                    <span className={styles.inputHelp}>Managed in Currency Settings.</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>INVENTORY VALUATION METHOD</label>
                    <select 
                      className={styles.inputField}
                      value={org.inventoryMethod}
                      onChange={(e) => setOrg({...org, inventoryMethod: e.target.value})}
                    >
                      <option value="AVERAGE">Average (Moving Average)</option>
                      <option value="FIFO">FIFO (First-In-First-Out)</option>
                    </select>
                    <span className={styles.inputHelp}>Determines how COGS is calculated.</span>
                  </div>
                </div>

                <div className={styles.formFooter}>
                   <div style={{ color: '#0F3B8C', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <ShieldCheck size={16} /> ADMINISTRATOR ACCESS REQUIRED
                   </div>
                   <div className={styles.formActions}>
                    <button className={styles.btnPrimary} onClick={handleSaveOrg}>Save Organization Details</button>
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div style={{ marginTop: '32px', padding: '24px', border: '1px solid #E5E7EB', borderRadius: '12px', background: '#F9FAFB' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px', letterSpacing: '0.05em' }}>LOGO PERUSAHAAN</h3>
                  <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Logo ini akan muncul otomatis di Sales Order, Invoice, dan dokumen finansial lainnya. Format: PNG atau JPG, maksimal 2MB.</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                    {/* Preview Box */}
                    <div style={{ width: '180px', height: '100px', border: '2px dashed #D1D5DB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden', flexShrink: 0 }}>
                      {orgLogo ? (
                        <img src={orgLogo} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                          <Building2 size={32} style={{ margin: '0 auto 4px' }} />
                          <div style={{ fontSize: '11px' }}>Belum ada logo</div>
                        </div>
                      )}
                    </div>

                    {/* Upload Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input 
                        ref={logoInputRef}
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml" 
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                      />
                      <button 
                        className={styles.btnPrimary}
                        onClick={() => logoInputRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Pencil size={15} /> {orgLogo ? 'Ganti Logo' : 'Upload Logo'}
                      </button>
                      {orgLogo && (
                        <button 
                          className={styles.btnGhostDanger}
                          onClick={handleRemoveLogo}
                        >
                          Hapus Logo
                        </button>
                      )}
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>PNG, JPG, SVG • Maks. 2MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'security' ? (
            <>
              <div className={styles.contentHeader}>
                <div className={styles.breadcrumbs}>ACCESS RECOVERY & HARDENING</div>
                <h1 className={styles.pageTitle}>Security Settings</h1>
                <p className={styles.pageSubtitle}>Protect your financial workspace with institutional-grade authentication protocols and active session monitoring.</p>
              </div>

              <div className={styles.profileFormGroup}>
                <h3 className={styles.sectionTitleLarge}>Authentication</h3>
                <div className={styles.formGrid} style={{ marginTop: '20px' }}>
                  <div className={styles.inputGroup}>
                    <label>CURRENT PASSWORD</label>
                    <input type="password" placeholder="••••••••" className={styles.inputField} />
                  </div>
                  <div style={{ visibility: 'hidden' }}></div>
                  <div className={styles.inputGroup}>
                    <label>NEW PASSWORD</label>
                    <input type="password" placeholder="Min. 12 characters" className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>CONFIRM NEW PASSWORD</label>
                    <input type="password" placeholder="Re-enter password" className={styles.inputField} />
                  </div>
                </div>
                <button className={styles.btnPrimary} style={{ marginTop: '20px' }} onClick={() => setToast({ visible: true, message: 'Password updated. Please log in again if prompted.' })}>Update Password</button>
                
                <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className={styles.sectionTitle}>Two-Factor Authentication (2FA)</h3>
                      <p className={styles.sectionDesc}>Adds an additional layer of security to your account by requiring more than just a password to log in.</p>
                    </div>
                    <button 
                      className={security.twoFactor ? styles.btnGhost : styles.btnPrimary}
                      onClick={() => setSecurity({...security, twoFactor: !security.twoFactor})}
                    >
                      {security.twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'notifications' ? (
            <>
              <div className={styles.contentHeader}>
                <div className={styles.breadcrumbs}>COMMUNICATION PREFERENCES</div>
                <h1 className={styles.pageTitle}>Notifications</h1>
                <p className={styles.pageSubtitle}>Configure how and when you want to receive alerts about financial activity, approvals, and system events.</p>
              </div>

              <div className={styles.profileFormGroup}>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>NOTIFICATION CATEGORY</th>
                      <th style={{ textAlign: 'center' }}>EMAIL</th>
                      <th style={{ textAlign: 'center' }}>PUSH (BROWSER)</th>
                      <th style={{ textAlign: 'center' }}>SMS / WHATSAPP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(notifications).map(([category, channels]) => (
                      <tr key={category}>
                        <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {category} Alerts
                          <div style={{ fontWeight: 400, color: '#64748B', fontSize: '12px' }}>
                            {category === 'financial' ? 'Invoices, Payments, Expenses' : 
                             category === 'operations' ? 'Approvals, Assignments, Tasks' : 
                             'System Maintenance, Login Alerts'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={channels.email} 
                            onChange={() => setNotifications({...notifications, [category]: {...channels, email: !channels.email}})}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={channels.push}
                            onChange={() => setNotifications({...notifications, [category]: {...channels, push: !channels.push}})}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={channels.sms}
                            onChange={() => setNotifications({...notifications, [category]: {...channels, sms: !channels.sms}})}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.formFooter} style={{ borderTop: 'none', paddingTop: '20px' }}>
                  <button className={styles.btnPrimary} style={{ marginLeft: 'auto' }} onClick={() => setToast({ visible: true, message: 'Notification preferences saved.' })}>Save Preferences</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', textAlign: 'center', minHeight: '60vh', width: '100%' }}>
              <div style={{ backgroundColor: '#F1F5F9', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                <Lock size={48} color="#64748B" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Section Under Construction</h2>
              <p style={{ color: '#64748B', maxWidth: '400px' }}>
                The <strong>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</strong> module is scheduled for the next deployment cycle.
              </p>
              <button className={styles.btnPrimary} style={{ marginTop: '24px' }} onClick={() => setActiveTab('profile')}>
                Return to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
