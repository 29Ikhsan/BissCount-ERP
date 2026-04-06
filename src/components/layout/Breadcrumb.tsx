'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const breadcrumbs = useMemo(() => {
    if (!pathname || pathname === '/') return [];
    
    const segments = pathname.split('/').filter((s) => s);
    const crumbs = segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      
      // Attempt to find a translation key
      let label = segment.charAt(0) + segment.slice(1).replace(/-/g, ' ');

      // Custom Mapping for common segments
      const keyMap: Record<string, string> = {
        'hrm': 'HRM',
        'crm': 'CRM',
        'taxation': 'TaxationDash',
        'invoices': 'Invoices',
        'purchases': 'Purchases',
        'expenses': 'Expenses',
        'inventory': 'Inventory',
        'assets': 'Assets',
        'journal': 'Journal',
        'reports': 'AccountingReports',
        'settings': 'Settings',
        'new': 'New',
        'employees': 'Employees',
        'payroll': 'Payroll',
      };

      if (keyMap[segment]) {
        label = t(keyMap[segment]);
      } else {
        // Fallback or capitalize
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      }

      return { label, path };
    });

    return crumbs;
  }, [pathname, t]);

  if (pathname === '/' || breadcrumbs.length === 0) return null;

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link href="/" className="breadcrumb-link home-link">
            <Home size={14} />
            <span>{t('Dashboard')}</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="breadcrumb-item">
            <ChevronRight className="breadcrumb-separator" size={14} />
            {index === breadcrumbs.length - 1 ? (
              <span className="breadcrumb-active" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.path} className="breadcrumb-link">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      <style jsx>{`
        .breadcrumb-nav {
          padding: 12px 24px;
          background: transparent;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .breadcrumb-list {
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          margin: 0;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .breadcrumb-link {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .home-link {
            color: #94A3B8;
        }

        .breadcrumb-link:hover {
          color: #0F172A;
        }

        .breadcrumb-separator {
          color: #cbd5e1;
        }

        .breadcrumb-active {
          color: #0F172A;
          font-weight: 600;
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumb;
