import Link from 'next/link';
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
  ShoppingCart,
  Users,
  Briefcase,
  Code2,
  Terminal
} from 'lucide-react';
import styles from './Sidebar.module.css';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Contacts / CRM', icon: Users, path: '/contacts' },
  { name: 'Cost Centers', icon: Briefcase, path: '/projects' },
  { name: 'Cash & Bank', icon: Landmark, path: '/banking' },
  { name: 'Journal', icon: BookOpen, path: '/journal' },
  { name: 'Invoices', icon: FileText, path: '/invoices' },
  { name: 'Purchases', icon: ShoppingCart, path: '/purchases' },
  { name: 'Expenses', icon: CreditCard, path: '/expenses' },
  { name: 'Inventory', icon: Box, path: '/inventory' },
  { name: 'Assets', icon: Archive, path: '/assets' },
  { name: 'Closing', icon: Lock, path: '/closing' },
  { name: 'AI Analyst', icon: BrainCircuit, path: '/analytics' },
  { name: 'Reports', icon: BarChart, path: '/reports' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span>B</span>
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.companyName}>Bizzcount</h1>
          <span className={styles.companySubtitle}>ENTERPRISE ERP</span>
        </div>
      </div>
      
      <div className={styles.menuLabel}>MAIN MENU</div>
      
      <nav className={styles.nav}>
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link href={item.path} className={styles.navItem}>
                <item.icon className={styles.icon} size={20} />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
