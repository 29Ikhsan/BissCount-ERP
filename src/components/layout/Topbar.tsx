'use client';

import { Search, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { data: session, status } = useSession();
  return (
    <header className={styles.topbar}>
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={18} />
        <input 
          type="text" 
          placeholder="Search reports, fiscal years, or audits..." 
          className={styles.searchInput} 
        />
      </div>
      
      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <div className={styles.notificationDot}></div>
          <Bell size={20} />
        </button>
        <button className={styles.iconButton}>
          <HelpCircle size={20} />
        </button>
        
        <div className={styles.profile}>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>
              {status === 'loading' ? 'Loading...' : session?.user?.name || 'Guest User'}
            </span>
            <span className={styles.profileRole}>
              {(session?.user as any)?.role || 'Unauthenticated'}
            </span>
          </div>
          <div className={styles.avatar}>
            <img src="https://ui-avatars.com/api/?name=Ikhsan+Administrator&background=random" alt="Avatar" />
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
