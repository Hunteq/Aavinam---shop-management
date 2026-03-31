import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { User, Lock, Save, CheckCircle2, AlertCircle, Edit2, X, LogOut, ArrowRightCircle, Globe } from 'lucide-react';

const Profile = () => {
  const { user, updateSession, logout, language, changeLanguage, t } = useAuth();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [newMobile, setNewMobile] = useState(user?.mobile || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSaveUsername = () => {
    if (newUsername.trim().length < 3) {
      setMessage({ type: 'error', text: t('username_min_3') });
      return;
    }
    if (newUsername.trim() === user.username) {
      setIsEditingUsername(false);
      return;
    }

    // Check if username already exists
    const users = storage.get('dsms_users');
    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase() && u.id !== user.id)) {
      setMessage({ type: 'error', text: t('username_exists') });
      return;
    }

    try {
      storage.updateUsername(user.id, newUsername.trim());
      updateSession(newUsername.trim(), user.mobile);
      setIsEditingUsername(false);
      storage.logActivity(user, 'CHANGE_USERNAME', `User changed their username to ${newUsername.trim()}`);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update username.' });
    }
  };

  const handleSaveMobile = () => {
    if (newMobile.trim() && !/^\d{10}$/.test(newMobile.trim())) {
      setMessage({ type: 'error', text: t('invalid_mobile_10') });
      return;
    }

    try {
      storage.updateUserMobile(user.id, newMobile.trim());
      updateSession(user.username, newMobile.trim());
      setIsEditingMobile(false);
      storage.logActivity(user, 'UPDATE_PROFILE', `User updated their mobile number to ${newMobile.trim()}`);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update mobile number.' });
    }
  };



  const handleUpdatePassword = (e) => {
    e.preventDefault();

    // In a real app, we'd verify the current password. 
    // Here we'll just check if the new passwords match.
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: t('password_mismatch') });
      return;
    }

    if (passwords.new.length < 4) {
      setMessage({ type: 'error', text: t('password_min_4') });
      return;
    }

    try {
      storage.updateUserPassword(user.id, passwords.new);
      storage.logActivity(user, 'CHANGE_PASSWORD', 'User updated their password');
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update password.' });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('profile_settings')}</h2>
          <p className="text-sm text-muted">{t('profile_subtitle')}</p>
        </div>
      </div>

      <div className="grid lg-grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        <div className="flex flex-col gap-6">
          {/* Avatar portion... keep as is */}
          <div className="card text-center flex flex-col items-center p-10">
            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '16px',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
            }}>
              {user?.username ? user.username[0].toUpperCase() : '?'}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="mb-2">
              {user?.username}
            </h3>
            <div className="role-badge mb-6">{t(user?.role?.toLowerCase())}</div>

            <div className="w-full text-left mt-2">
              <div className="grid md-grid-2 gap-4">
                <div className="profile-input-group">
                  <label className="text-sm block mb-2 font-semibold text-muted">{t('username')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="profile-input"
                      placeholder={t('username')}
                      onKeyDown={e => e.key === 'Enter' && handleSaveUsername()}
                    />
                    {newUsername !== user?.username && (
                      <div className="flex gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                        <button onClick={handleSaveUsername} className="save-action-btn save-action-confirm" title="Save">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => setNewUsername(user?.username)} className="save-action-btn save-action-cancel" title="Cancel">
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-input-group">
                  <label className="text-sm block mb-2 font-semibold text-muted">{t('mobile_number')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={newMobile}
                      onChange={e => setNewMobile(e.target.value)}
                      className="profile-input"
                      placeholder={t('enter_10_digit')}
                      onKeyDown={e => e.key === 'Enter' && handleSaveMobile()}
                    />
                    {newMobile !== (user?.mobile || '') && (
                      <div className="flex gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                        <button onClick={handleSaveMobile} className="save-action-btn save-action-confirm" title="Save">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => setNewMobile(user?.mobile || '')} className="save-action-btn save-action-cancel" title="Cancel">
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-input-group col-span-full mt-4">
                  <label className="text-sm block mb-4 font-semibold text-muted flex items-center gap-2">
                    <Globe size={16} className="text-primary" /> {t('language_preferences')}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'English', label: 'English', sub: t('default') },
                      { id: 'Tamil', label: 'தமிழ்', sub: 'Tamil' },
                      { id: 'Hindi', label: 'हिन्दी', sub: 'Hindi' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => changeLanguage(lang.id)}
                        className={`lang-btn ${language === lang.id ? 'active' : ''}`}
                      >
                        <span className="lang-label">{lang.label}</span>
                        <span className="lang-sub">{lang.sub}</span>
                        {language === lang.id && <CheckCircle2 size={14} className="check-icon" />}
                      </button>
                    ))}
                  </div>
                </div>

               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Security & Password Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="mb-6 flex items-center gap-2">
              <Lock size={20} className="text-primary" /> {t('security_password')}
            </h3>

            {message.text && (
              <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="grid gap-6">
              <div>
                <label className="text-sm block mb-2 font-semibold">{t('current_password')}</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)' }}
                  placeholder={t('current_password')}
                />
              </div>

              <div className="grid md-grid-2 gap-4 password-grid">
                <div>
                  <label className="text-sm block mb-2 font-semibold">{t('new_password')}</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)' }}
                    placeholder={t('at_least_4_chars')}
                  />
                </div>
                <div>
                  <label className="text-sm block mb-2 font-semibold">{t('confirm_password')}</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)' }}
                    placeholder={t('confirm_password')}
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <button type="submit" className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 py-3 px-8">
                  <Save size={18} /> {t('update_password')}
                </button>
              </div>
            </form>
          </div>

          {/* Logout Section - Mobile Tablet Focus */}
          <div className={`logout-card-container ${showLogoutConfirm ? 'confirming' : ''}`}>
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="btn-logout-trigger mobile-tablet-only"
              >
                <div className="flex items-center gap-3">
                  <div className="logout-icon-bg">
                    <LogOut size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-red-600">{t('sign_out_msg')}</div>
                    <div className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">{t('session_end_msg')}</div>
                  </div>
                </div>
                <ArrowRightCircle size={20} className="text-red-300" />
              </button>
            ) : (
              <div className="logout-confirmation-card animate-in slide-in-from-bottom-4 duration-300">
                <div className="confirmation-content">
                  <div className="warning-avatar">
                    <AlertCircle size={32} />
                  </div>
                  <h3>{t('ready_to_leave')}</h3>
                  <p>{t('logout_warning')}</p>

                  <div className="confirmation-actions">
                    <button onClick={logout} className="logout-confirm-btn">
                      {t('yes_logout')}
                    </button>
                    <button onClick={() => setShowLogoutConfirm(false)} className="logout-cancel-btn">
                      {t('stay_logged_in')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .lg-grid { 
          display: grid;
          grid-template-columns: 1fr 1.5fr; 
          gap: 24px; 
        }

        .col-span-full {
          grid-column: 1 / -1;
        }

        .lang-btn {
          flex: 1;
          min-width: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--background);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
        }

        .lang-btn:hover {
          border-color: var(--primary);
          background: rgba(37, 99, 235, 0.02);
          transform: translateY(-2px);
        }

        .lang-btn.active {
          border-color: var(--primary);
          background: rgba(37, 99, 235, 0.05);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }

        .lang-label {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-main);
        }

        .lang-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .check-icon {
          position: absolute;
          top: 6px;
          right: 6px;
          color: var(--primary);
        }
        
        @media (max-width: 1024px) {
          .lg-grid { grid-template-columns: 1fr !important; }
        }

        .md-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .md-grid-2 { grid-template-columns: 1fr; }
        }

        .password-grid {
          align-items: end;
        }

        .password-grid label {
          min-height: 2.5rem;
          display: flex;
          align-items: flex-end;
        }

        @media (max-width: 768px) {
          .password-grid label {
            min-height: auto;
            display: block;
          }
        }

        .profile-input {
          flex: 1;
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--background);
          font-weight: 500;
          color: var(--text-main);
          transition: all 0.2s;
        }

        .profile-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .save-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .save-action-confirm {
          color: #10b981;
          background: #ecfdf5;
          border: 1px solid #d1fae5;
        }

        .save-action-confirm:hover {
          background: #d1fae5;
          transform: scale(1.05);
        }

        .save-action-cancel {
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .save-action-cancel:hover {
          background: #e2e8f0;
          transform: scale(1.05);
        }

        .role-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          background: var(--bg-main);
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 4px;
          margin-bottom: 12px;
          border: 1px solid var(--border);
        }



        .logout-card-container {
          margin-top: 12px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-logout-trigger {
          width: 100%;
          background: white;
          border: 1px solid #fee2e2;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .btn-logout-trigger:hover {
          background: #fffafa;
          border-color: #fecaca;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.1);
        }

        .logout-icon-bg {
          background: #fef2f2;
          color: #ef4444;
          padding: 12px;
          border-radius: 12px;
          display: flex;
        }

        .logout-confirmation-card {
          background: white;
          border: 2px solid #ef4444;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(220, 38, 38, 0.15);
        }

        .confirmation-content h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 16px 0 8px;
        }

        .confirmation-content p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .warning-avatar {
          width: 64px;
          height: 64px;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .confirmation-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .logout-confirm-btn {
          background: #ef4444;
          color: white;
          padding: 14px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .logout-confirm-btn:hover {
          background: #dc2626;
          transform: scale(1.02);
        }

        .logout-cancel-btn {
          background: #f1f5f9;
          color: #475569;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .logout-cancel-btn:hover {
          background: #e2e8f0;
        }

        .mobile-tablet-only { display: flex; }

        @media (min-width: 1024px) {
          .mobile-tablet-only { display: none; }
          /* On desktop, users can use the sidebar logout, but we can show it here too if desired. 
             The user specifically asked to MOVE it for mobile/tablet. */
        }
      `}</style>
    </div>
  );
};

export default Profile;
