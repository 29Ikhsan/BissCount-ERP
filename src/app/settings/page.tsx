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
  Terminal as TerminalIcon
} from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Settings() {
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
            <li className={styles.navItemActive}>
              <User size={18} /> Profile
            </li>
            <li className={styles.navItem}>
              <Building2 size={18} /> Organization
            </li>
            <li className={styles.navItem}>
              <ShieldCheck size={18} /> Security
            </li>
            <li className={styles.navItem}>
              <Bell size={18} /> Notifications
            </li>
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
          <div className={styles.contentHeader}>
            <div className={styles.breadcrumbs}>ACCOUNT CONFIGURATION</div>
            <h1 className={styles.pageTitle}>Personal Profile</h1>
            <p className={styles.pageSubtitle}>Update your personal information and manage how you appear across the Bizzcount organization. These settings help maintain your digital identity within the ledger.</p>
          </div>

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
                <input type="text" defaultValue="Alexander Mitchell" className={styles.inputField} />
                <span className={styles.inputHelp}>As it appears on official financial documents.</span>
              </div>
              <div className={styles.inputGroup}>
                <label>PROFESSIONAL EMAIL</label>
                <input type="email" defaultValue="alexander.m@bizzcount.io" className={styles.inputField} />
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
                September 14, 2023 at 08:42 AM via macOS Desktop
              </div>
              <div className={styles.formActions}>
                <button className={styles.btnGhost}>Cancel</button>
                <button className={styles.btnPrimary}>Save Changes ⏎</button>
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

        </div>
      </div>
    </div>
  );
}
