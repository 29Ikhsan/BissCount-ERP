'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, LogOut, FileText, User, Settings, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { data: session, status } = useSession();
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowResults(true);
        } catch (error) {
          console.error('Search failed');
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (path: string) => {
    router.push(path);
    setSearchQuery('');
    setShowResults(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'ACCOUNT': return <Settings size={14} />;
      case 'INVOICE': return <FileText size={14} />;
      case 'CONTACT': return <User size={14} />;
      default: return <LinkIcon size={14} />;
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.searchContainer} ref={searchRef}>
        <Search className={styles.searchIcon} size={18} />
        <input 
          type="text" 
          placeholder={t('SearchAnything')} 
          className={styles.searchInput} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
        />
        {isSearching && <Loader2 size={14} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />}
        
        {showResults && (
          <div className={styles.searchResults}>
            {searchResults.length > 0 ? (
              searchResults.map((res) => (
                <div key={`${res.type}-${res.id}`} className={styles.resultItem} onClick={() => handleResultClick(res.path)}>
                   <div className={styles.resultIcon}>{getResultIcon(res.type)}</div>
                   <div className={styles.resultInfo}>
                      <span className={styles.resultTitle}>{res.title}</span>
                      {res.subtitle && <span className={styles.resultSubtitle}>{res.subtitle}</span>}
                   </div>
                   <span className={styles.resultBadge}>{t(res.type === 'ACCOUNT' ? 'ViewAccount' : res.type === 'INVOICE' ? 'ViewInvoice' : 'ViewContact')}</span>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                {t('NoResults')} "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <div className={styles.languageToggle}>
          <button 
            className={`${styles.langBtn} ${locale === 'en' ? styles.langActive : ''}`}
            onClick={() => setLocale('en')}
            title="Switch to English"
          >
            EN
          </button>
          <button 
            className={`${styles.langBtn} ${locale === 'id' ? styles.langActive : ''}`}
            onClick={() => setLocale('id')}
            title="Ganti ke Bahasa Indonesia"
          >
            ID
          </button>
        </div>
 
        <button className={styles.iconButton} title={t('Notifications')}>
          <div className={styles.notificationDot}></div>
          <Bell size={20} />
        </button>
        <button className={styles.iconButton} title={t('HelpCenter')}>
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
            <img src={`https://ui-avatars.com/api/?name=${session?.user?.name || 'Guest'}&background=random`} alt="Avatar" />
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
