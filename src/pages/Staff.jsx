import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Lock,
  User,
  Shield,
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const Staff = () => {
  const { user, t } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'STAFF', mobile: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Only get staff users, or all if needed. User wants staff management.
    const allUsers = storage.get('dsms_users');
    setUsers(allUsers.filter(u => u.role === 'STAFF'));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();

    // Validate if username already exists for new user
    if (!editingUser) {
      const allUsers = storage.get('dsms_users');
      if (allUsers.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        alert(t('username_exists'));
        return;
      }
    }

    if (editingUser) {
      const allUsers = storage.get('dsms_users');
      const updatedAll = allUsers.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
      storage.set('dsms_users', updatedAll);
      storage.logActivity(user, 'EDIT_STAFF', `Edited staff member: ${formData.username}`);
    } else {
      const newUser = {
        ...formData,
        id: Date.now().toString(),
        role: 'STAFF'
      };
      storage.addUser(newUser);
      storage.logActivity(user, 'ADD_STAFF', `Added staff member: ${formData.username}`);
    }

    // Refresh local state
    const refreshed = storage.get('dsms_users').filter(u => u.role === 'STAFF');
    setUsers(refreshed);

    setShowModal(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'STAFF', mobile: '' });
  };

  const handleDelete = (id, username) => {
    setDeleteConfirm({ id, username });
  };

  const confirmDelete = () => {
    storage.deleteUser(deleteConfirm.id);
    storage.logActivity(user, 'DELETE_STAFF', `Deleted staff member: ${deleteConfirm.username}`);

    const refreshed = storage.get('dsms_users').filter(u => u.role === 'STAFF');
    setUsers(refreshed);
    setDeleteConfirm(null);
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.mobile && u.mobile.includes(searchTerm))
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-column items-center justify-center p-12 text-center">
        <Shield size={48} className="text-muted mb-4 opacity-20" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('access_denied')}</h2>
        <p className="text-muted">{t('access_denied_subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="staff-page-header flex justify-between items-center gap-3">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{t('staff_management')}</h2>
          <p className="text-sm text-muted">{t('staff_management_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-2 justify-center" onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', role: 'STAFF', mobile: '' }); setShowModal(true); }}>
            <UserPlus size={18} /> {t('add_new_staff')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="responsive-filter-bar mb-6">
          <div className="filter-search-container" style={{ maxWidth: '400px' }}>
            <Search size={18} className="text-muted flex-shrink-0" />
            <input
              type="text"
              placeholder={t('search_staff_placeholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                <th style={{ padding: '12px 16px' }}>{t('staff_info')}</th>
                <th style={{ padding: '12px 16px' }}>{t('role')}</th>
                <th style={{ padding: '12px 16px' }}>{t('mobile')}</th>
                <th style={{ padding: '12px 16px' }}>{t('status')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <td style={{ padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                    <div className="flex items-center gap-3">
                      {/* <div style={{ width: '40px', height: '40px', background: 'var(--secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                        {u.username[0].toUpperCase()}
                      </div> */}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      fontWeight: 600,
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      {t(u.role.toLowerCase())}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{u.mobile || t('not_set')}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      {t('active')}
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right', minWidth: '160px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button onClick={() => { setEditingUser(u); setFormData({ username: u.username, password: u.password, role: u.role, mobile: u.mobile || '' }); setShowModal(true); }} style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', flexShrink: 0 }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(u.id, u.username)} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', flexShrink: 0 }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>
            {t('no_staff_members_found')}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingUser ? t('edit_staff') : t('add_new_staff')}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="grid gap-5">
              <div>
                <label className="text-sm block mb-1.5 font-medium">{t('username')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder={t('enter_username')}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm block mb-1.5 font-medium">{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder={t('enter_password')}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--muted-foreground)' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm block mb-1.5 font-medium">{t('mobile_number')} ({t('optional')})</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder={t('enter_10_digit')}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('cancel')}</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
                  {editingUser ? t('update_staff') : t('create_staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertCircle size={24} /> {t('delete_user')}
              </h3>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: 'none', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <div className="text-center mb-6">
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px', fontWeight: 800, fontSize: '1.1rem' }}>{deleteConfirm.username}</div>
              <p className="text-sm font-medium text-muted-foreground">{t('confirm_delete_staff_warning')}</p>
              <p className="text-[10px] uppercase font-bold text-red-500 mt-2 tracking-widest">{t('irreversible_action_warning')}</p>
            </div>
            <div className="modal-btn-row">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button
                onClick={confirmDelete}
                className="flex-1 text-center rounded-xl border transition-colors"
                style={{ fontWeight: 700, padding: '10px 20px', borderColor: '#fecaca', background: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              >
                {t('delete_user')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
