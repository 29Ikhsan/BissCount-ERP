'use client';
import { useState } from 'react';
import Link from 'next/link';

import { useLanguage } from '@/context/LanguageContext';
import { useSession } from 'next-auth/react';
import { canAccessModule, Role } from '@/lib/access';
import styles from './Sidebar.module.css';
import { 
  BarChart, 
  Settings, 
  FileText, 
  CreditCard, 
  Box, 
  LayoutDashboard,
  BookOpen,
  Lock,
  BrainCircuit,
  Archive,
  Landmark,
  PieChart,
  ShoppingCart,
  Users,
  Briefcase,
  Code2,
  Terminal,
  Bot,
  Shield,
  Target,
  TrendingUp,
  Play,
  User,
  UserCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', key: 'Dashboard' },
  { 
    name: 'Operations', 
    icon: Box, 
    path: '/inventory', 
    key: 'Operations',
    subItems: [
      { name: 'Inventory / Stock', icon: Archive, path: '/inventory', key: 'Inventory' },
      { name: 'Production Order', icon: Play, path: '/production', key: 'ProductionQueue' },
      { name: 'BOM Recipes', icon: Settings, path: '/production/bom', key: 'BOMRecipes' },
    ]
  },
  { 
    name: 'CRM', 
    icon: Target, 
    path: '/crm', 
    key: 'CRM',
    subItems: [
      { name: 'Dashboard', icon: BarChart, path: '/crm', key: 'CRMDashboard' },
      { name: 'Customers & Vendors', icon: Users, path: '/contacts', key: 'ContactsCRM' },
      { name: 'Prospects (Leads)', icon: Target, path: '/crm/leads', key: 'Leads' },
      { name: 'Sales Pipeline', icon: Landmark, path: '/crm/pipeline', key: 'Pipeline' },
    ]
  },
  { 
    name: 'Finance', 
    icon: Landmark, 
    path: '/invoices', 
    key: 'Finance',
    subItems: [
      { name: 'Invoices', icon: FileText, path: '/invoices', key: 'Invoices' },
      { name: 'Purchases', icon: ShoppingCart, path: '/purchases', key: 'Purchases' },
      { name: 'Cash & Bank', icon: Landmark, path: '/banking', key: 'CashBank' },
      { name: 'Expenses', icon: CreditCard, path: '/expenses', key: 'Expenses' },
    ]
  },
  { 
    name: 'HRM Dashboard', 
    icon: Users, 
    path: '/hrm', 
    key: 'HRM',
    subItems: [
      { name: 'Data Employee', icon: UserCheck, path: '/hrm/employees', key: 'DataEmployee' },
      { name: 'Payroll', icon: CreditCard, path: '/hrm/payroll', key: 'Payroll' },
    ]
  },
  { 
    name: 'Tax & Compliance', 
    icon: Shield, 
    path: '/taxation', 
    key: 'TaxCompliance',
    subItems: [
      { name: 'Taxation Dashboard', icon: LayoutDashboard, path: '/taxation', key: 'TaxationDash' },
      { name: 'PPN Keluaran (e-Faktur)', icon: FileText, path: '/taxation/ppn', key: 'PPNKeluaran' },
      { name: 'PPh Unifikasi (e-Bupot)', icon: BarChart, path: '/taxation/bppu', key: 'PPhUnifikasi' },
      { name: 'PPh Pasal 21 (Bupot 21)', icon: Users, path: '/taxation/pph21', key: 'PPh21' },
      { name: 'Asisten Pajak (TARA)', icon: Bot, path: '/tax-assistant', key: 'TaxAssistant' },
    ]
  },
  { 
    name: 'Accounting Reports', 
    icon: BarChart, 
    path: '/accounting/reports', 
    key: 'AccountingReports',
    subItems: [
      { name: 'Journal & Ledger', icon: BookOpen, path: '/accounting/ledger', key: 'Journal' },
      { name: 'Fixed Assets', icon: Archive, path: '/accounting/assets', key: 'Assets' },
      { name: 'Prepayments & Amortization', icon: TrendingUp, path: '/accounting/amortization', key: 'Amortization' },
      { name: 'Balance Sheet & P&L', icon: PieChart, path: '/accounting/reports', key: 'AccountingDash' },
      { name: 'Closing Period', icon: Lock, path: '/accounting/closing', key: 'Closing' },
      { name: 'Chart of Accounts', icon: FileText, path: '/settings/coa', key: 'COA' },
      { name: 'Financial Intelligence (FIRA)', icon: BrainCircuit, path: '/accounting/analytics', key: 'AIAnalyst' }
    ]
  },
  { 
    name: 'Settings', 
    icon: Settings, 
    path: '/settings', 
    key: 'Settings',
    subItems: [
      { name: 'Audit Log', icon: Shield, path: '/settings/audit', key: 'AuditLog' },
      { name: 'User Management', icon: Users, path: '/settings/users', key: 'UserManagement' }
    ]
  },
];

export default function Sidebar() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const userRole = (session?.user as any)?.role as Role || 'USER';
  const userPermissions = (session?.user as any)?.permissions || [];

  const filteredMenuItems = menuItems.filter(item => canAccessModule(userRole, item.key, userPermissions));

  const toggleSubMenu = (key: string, e: React.MouseEvent) => {
    setExpandedItems((prev: Record<string, boolean>) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandText}>
          <h1 className={styles.companyName}>AKSIA</h1>
          <span className={styles.companySubtitle}>ERP Powered by Artifical Intelegence</span>
        </div>
      </div>
      
      <div className={styles.menuLabel}>{t('MainMenu')}</div>
      
      <nav className={styles.nav}>
        <ul>
          {filteredMenuItems.map((item) => (
            <li key={item.key}>
              <div className={styles.navItemWrapper}>
                <Link href={item.path} className={styles.navItem}>
                  <item.icon className={styles.icon} size={20} />
                  <span>{t(item.key)}</span>
                </Link>
                {item.subItems && (
                  <button 
                    className={styles.toggleBtn} 
                    onClick={(e) => toggleSubMenu(item.key, e)}
                  >
                    {expandedItems[item.key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
              </div>
              {item.subItems && expandedItems[item.key] && (
                <ul className={styles.subItems}>
                  {item.subItems.map((sub: any) => (
                    <li key={sub.key}>
                      <Link href={sub.path} className={styles.subNavItem}>
                        <sub.icon size={16} />
                        <span>{t(sub.key)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
