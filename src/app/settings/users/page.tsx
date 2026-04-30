'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from './UsersPage.module.css';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  MoreVertical, 
  RefreshCw,
  Clock,
  X,
  UserPlus2,
  Check,
  Shield,
  Box,
  Target,
  Landmark,
  BarChart4,
  LayoutDashboard
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import RoleGuard from '@/components/common/RoleGuard';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

const AVAILABLE_MODULES = [
  { key: 'Operations', label: 'Operations', icon: Box },
  { key: 'CRM', label: 'CRM', icon: Target },
  { key: 'Finance', label: 'Finance', icon: Landmark },
  { key: 'HRM', label: 'HRM', icon: Users },
  { key: 'TaxCompliance', label: 'Taxation', icon: ShieldCheck },
  { key: 'AccountingReports', label: 'Accounting', icon: BarChart4 },
];

const ROLE_TEMPLATES: Record<string, { label: string, role: string, permissions: string[] }> = {
  DEFAULT: { label: 'All Modules (Default)', role: 'USER', permissions: ['Dashboard', 'Operations', 'CRM', 'Finance', 'HRM', 'TaxCompliance', 'AccountingReports'] },
  ACCOUNTANT: { label: 'Accountant (Finance, Tax, Reporting)', role: 'USER', permissions: ['Dashboard', 'Finance', 'TaxCompliance', 'AccountingReports'] },
  HR_STAFF: { label: 'HR Specialist', role: 'OPERATIONAL', permissions: ['Dashboard', 'HRM'] },
  SALES_REP: { label: 'Sales Representative', role: 'USER', permissions: ['Dashboard', 'CRM'] },
  OPERATOR: { label: 'Warehouse / Operations', role: 'OPERATIONAL', permissions: ['Dashboard', 'Operations'] },
  BLANK: { label: 'Blank Slate (Dashboard Only)', role: 'USER', permissions: ['Dashboard'] }
};

export default function UserManagementPage() {
  const { data: session, update: updateSession } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    templateKey: 'DEFAULT'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.map((u: any) => ({
          ...u,
          permissions: Array.isArray(u.permissions) ? u.permissions : []
        })));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTogglePermission = async (userId: string, moduleKey: string, currentPermissions: string[]) => {
    const safePermissions = Array.isArray(currentPermissions) ? currentPermissions : [];
    const isAdding = !safePermissions.includes(moduleKey);
    const newPermissions = isAdding 
      ? [...safePermissions, moduleKey] 
      : safePermissions.filter(p => p !== moduleKey);

    setUpdating(userId);
    try {
      const res = await fetch('/api/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissions: newPermissions }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPermissions } : u));
        
        // AUTO-REFRESH: If editing self, sync session immediately
        if (userId === (session?.user as any)?.id) {
          await updateSession({ permissions: newPermissions });
          showToast(`Access updated for ${moduleKey}. Sidebar refreshed automatically.`, 'success');
        } else {
          showToast(`Access updated for ${moduleKey}. (User must sign out/in to sync)`, 'success');
        }
      }
    } catch (err: any) {
      const errorMsg = err?.details ? `Sync Failure: ${err.details}` : 'Failed to sync permissions.';
      showToast(errorMsg, 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <RoleGuard moduleKey="Settings">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleInfo}>
            <div className={styles.pageBadge}><ShieldCheck size={14} /> SECURITY & ACCESS</div>
            <h1>Institutional User Governance</h1>
            <p>Admin-level control for role assignments and access privileges across Bizzcount modules.</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.refreshBtn} onClick={fetchUsers} disabled={loading}>
               <RefreshCw size={16} className={loading ? styles.spin : ''}/>
            </button>
            <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
              <UserPlus2 size={18}/> Provision User
            </button>
          </div>
        </header>

        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleIcon}>
                  <UserPlus2 size={24} color="#279C5A" />
                  <div>
                    <h3>Provision New System User</h3>
                    <p>Onboard a new member to your institutional workspace.</p>
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const selectedTemplate = ROLE_TEMPLATES[formData.templateKey];
                  
                  const res = await fetch('/api/settings/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.name,
                      email: formData.email,
                      role: formData.role, // We let them override the master role if they want
                      permissions: selectedTemplate.permissions
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    showToast('Identity Provisioned: ' + formData.name, 'success');
                    setIsModalOpen(false);
                    setFormData({ name: '', email: '', role: 'USER', templateKey: 'DEFAULT' });
                    fetchUsers();
                  } else {
                    const errorMsg = data.details ? `Provisioning Error: ${data.details}` : (data.error || 'Failed to create user.');
                    showToast(errorMsg, 'error');
                  }
                } catch (err) {
                  showToast('Failed to communicate with authorization server.', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Alexander Hamilton"
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="alex@enterprise.com" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>System Access Template (Presets)</label>
                  <select 
                    value={formData.templateKey} 
                    onChange={(e) => {
                       const key = e.target.value;
                       const t = ROLE_TEMPLATES[key];
                       setFormData({...formData, templateKey: key, role: t.role});
                    }}
                  >
                    {Object.entries(ROLE_TEMPLATES).map(([key, t]) => (
                       <option key={key} value={key}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Initial Archetype Role (Master Level)</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="USER">GENERIC USER</option>
                    <option value="OPERATIONAL">OPERATIONAL STAFF</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                    <option value="SUPERADMIN">SUPERADMIN (FULL CONTROL)</option>
                  </select>
                </div>

                <div className={styles.provisionNote}>
                   The selected template will automatically populate the user's "Thick Mark" module matrix upon creation. You can easily prune their permissions later.
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Provisioning...' : 'Complete Provisioning'}
                  </button>
                </div>
                
                <div className={styles.passwordNote}>
                  Default password <code>Bizzcount123!</code> will be assigned.
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loaderArea}>
            <div className={styles.loader}></div>
            <p>Synchronizing Global User Directory...</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
               <div className={styles.searchBox}>
                  <Search size={16} />
                  <input type="text" placeholder="Search system users by name or email..." />
               </div>
            </div>
            
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Identity & Credentials</th>
                  <th>Joined Date</th>
                  <th>Module Access Matrix (Thick Mark)</th>
                  <th className={styles.textRight}>Master Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.name.charAt(0)}</div>
                        <div className={styles.userText}>
                          <div className={styles.userName}>{user.name} {user.id === (session?.user as any)?.id && <span className={styles.me}>YOU</span>}</div>
                          <div className={styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                       <div className={styles.dateInfo}>
                          <Clock size={12}/> {new Date(user.createdAt).toLocaleDateString()}
                       </div>
                    </td>
                    <td>
                        <div className={styles.matrixContainer}>
                           {AVAILABLE_MODULES.map((mod) => {
                             const isChecked = (Array.isArray(user.permissions) && user.permissions.includes(mod.key)) || user.role === 'SUPERADMIN';
                             return (
                               <div 
                                 key={mod.key} 
                                 className={`${styles.matrixItem} ${isChecked ? styles.matrixActive : ''}`}
                                 onClick={() => {
                                   if (updating) return;
                                   handleTogglePermission(user.id, mod.key, user.permissions);
                                 }}
                               >
                                 <mod.icon size={16} />
                                 <span className={styles.matrixLabel}>{mod.label}</span>
                                 {isChecked && <div className={styles.thickMark}><Check size={10} strokeWidth={4}/></div>}
                               </div>
                             );
                           })}
                        </div>
                    </td>
                    <td className={styles.textRight}>
                       <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()] || styles.defaultBadge}`}>
                          {user.role}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.securityWarning}>
           <Shield size={20} color="#EF4444"/>
           <div className={styles.warningText}>
              <strong>Governance Compliance Notice:</strong> Role modifications are logged immutably. 
              Elevating users to <code>ADMIN</code> grants full financial and forensic data access.
           </div>
        </div>
      </div>
    </RoleGuard>
  );
}
