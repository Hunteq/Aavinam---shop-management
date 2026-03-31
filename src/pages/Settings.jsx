import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import Profile from './Profile';
import ActivityLogs from './ActivityLogs';
import Pricing from './Pricing';
import Products from './Products';
import Staff from './Staff';
import {
  Settings as SettingsIcon,
  Clock,
  Trash2,
  Save,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Download,
  Upload,
  Database,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileJson,
  Info,
  Users,
  X
} from 'lucide-react';
import { format, isToday } from 'date-fns';

const Settings = () => {
  const { user, t, language } = useAuth();
  const isEnglish = language === 'English';
  const headerFontSize = isEnglish ? '1.125rem' : '1.05rem';
  const subFontSize = isEnglish ? '0.75rem' : '0.68rem';
  const buttonFontSize = isEnglish ? '0.8rem' : '0.725rem';
  const isAdmin = user.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({ timeSlots: [], gstEnabled: false });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [slotDeleteConfirm, setSlotDeleteConfirm] = useState(null);

  useEffect(() => {
    setSettings(storage.get('dsms_settings'));
  }, []);

  const handleAddTimeSlot = () => {
    const newSlot = {
      id: Date.now().toString(),
      time: '00:00',
      label: 'New Check'
    };
    const updated = { ...settings, timeSlots: [...settings.timeSlots, newSlot] };
    setSettings(updated);
  };

  const confirmRemoveTimeSlot = (id) => {
    setSlotDeleteConfirm({ id, message: t('confirm_deletion_timeslot') });
  };

  const handleRemoveTimeSlot = () => {
    if (slotDeleteConfirm) {
      const updated = { ...settings, timeSlots: settings.timeSlots.filter(s => s.id !== slotDeleteConfirm.id) };
      setSettings(updated);
    }
    setSlotDeleteConfirm(null);
  };

  const handleUpdateSlot = (id, field, value) => {
    const updated = {
      ...settings,
      timeSlots: settings.timeSlots.map(s => s.id === id ? { ...s, [field]: value } : s)
    };
    setSettings(updated);
  };

  const saveSettings = () => {
    storage.set('dsms_settings', settings);
    storage.logActivity(user, 'UPDATE_SETTINGS', 'Updated system settings and time slots');
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const resetTodayData = () => {
    const allLogs = storage.get('dsms_stock_logs');
    const filtered = allLogs.filter(log => !isToday(new Date(log.timestamp)));
    storage.set('dsms_stock_logs', filtered);
    storage.logActivity(user, 'RESET_DAY', 'User performed a complete Day Reset');
    setMessage({ type: 'success', text: 'Daily data reset successfully.' });
    setShowResetConfirm(false);
  };

  const exportData = () => {
    const keys = ['dsms_products', 'dsms_stock_logs', 'dsms_price_logs', 'dsms_activity_logs', 'dsms_settings', 'dsms_expenses', 'dsms_cash_entries'];
    const data = {};
    keys.forEach(key => {
      data[key] = storage.get(key);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dairy_shop_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    storage.logActivity(user, 'BACKUP_DATA', 'Full system backup exported');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (window.confirm('WARNING: This will OVERWRITE all current data with the backup file. Proceed?')) {
          Object.keys(data).forEach(key => {
            if (key.startsWith('dsms_')) {
              storage.set(key, data[key]);
            }
          });
          storage.logActivity(user, 'RESTORE_DATA', 'System data restored from backup file');
          window.location.reload(); // Refresh to apply all data
        }
      } catch (err) {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid gap-6">
      {/* Settings Tabs */}
      <div className="settings-tabs hide-scrollbar">
        <button
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('profile')}
        </button>
        {isAdmin && (
          <button
            className={`settings-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            {t('staffs')}
          </button>
        )}
        {isAdmin && (
          <button
            className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            {t('system_config')}
          </button>
        )}
        {isAdmin && (
          <button
            className={`settings-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            {t('pricing')}
          </button>
        )}
        <button
          className={`settings-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          {t('products')}
        </button>

        {isAdmin && (
          <button
            className={`settings-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            {t('logs')}
          </button>
        )}

      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <Profile />}
      {activeTab === 'products' && <Products />}
      {activeTab === 'logs' && isAdmin && <ActivityLogs />}
      {activeTab === 'pricing' && isAdmin && <Pricing />}
      {activeTab === 'staff' && isAdmin && <Staff />}
      {activeTab === 'system' && isAdmin && (
        <div className="grid gap-6 animate-in">
          <div className="settings-header flex justify-between items-center gap-3">
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('system_configuration')}</h2>
              <p className="text-sm text-muted">{t('reports_subtitle')}</p>
            </div>
            <div className="flex gap-2">
              {message.text && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in slide-in-from-right duration-300 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <CheckCircle2 size={16} /> {message.text}
                </div>
              )}
              <button className="btn-primary flex items-center gap-2" onClick={saveSettings}>
                <Save size={18} /> {t('save_all_changes')}
              </button>
            </div>
          </div>

          <div className="grid lg-grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '24px' }}>
            <div className="flex flex-col gap-6">
              {/* Time Slots */}
              <div className="card">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div className="flex-1">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }} className="flex items-center gap-2">
                      <Clock size={18} className="text-primary" /> {t('operational_schedule')}
                    </h3>
                    <p className="hidden sm:block text-xs text-muted mt-1">{t('staff_record_checkpoints')}</p>
                  </div>
                  <button onClick={handleAddTimeSlot} className="btn-secondary flex items-center gap-1.5" style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Plus size={14} /> {t('add_slot')}
                  </button>
                </div>

                <div className="grid gap-4">
                  {settings.timeSlots.length > 0 ? settings.timeSlots.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                    <div key={slot.id} className="time-slot-card">
                      <div className="time-slot-time">
                        <span className="slot-label">{t('time')}</span>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={e => handleUpdateSlot(slot.id, 'time', e.target.value)}
                          className="slot-input-time"
                        />
                      </div>
                      <div className="time-slot-desc">
                        <span className="slot-label">{t('activity_description')}</span>
                        <input
                          type="text"
                          value={slot.label}
                          onChange={e => handleUpdateSlot(slot.id, 'label', e.target.value)}
                          placeholder="Activity..."
                          className="slot-input-text"
                        />
                      </div>
                      <button 
                        onClick={() => confirmRemoveTimeSlot(slot.id)} 
                        className="slot-delete-btn"
                        title="Remove slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )) : (
                    <div className="text-center p-8 text-muted border-2 border-dashed border-border rounded-2xl">
                      {t('no_time_slots')}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="mb-4">{t('operational_preferences')}</h3>
                <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="flex gap-3 items-start">
                    <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--primary)', color: 'white' }}>
                      <Info size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t('enable_gst')}</div>
                      <div className="text-xs text-muted max-w-sm">{t('gst_subtitle')}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.gstEnabled || false}
                      onChange={e => setSettings({ ...settings, gstEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Data Safety & Backup */}
              <div className="card" style={{ border: '1px solid var(--primary)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="mb-6 flex items-center gap-2">
                  <Database size={20} className="text-primary" /> {t('data_safety_cloud')}
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
                    <ShieldCheck size={24} className="flex-shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                      {t('local_browser_storage')}
                    </p>
                  </div>

                  <button onClick={exportData} className="btn-primary w-full flex items-center justify-center gap-3 py-4">
                    <Download size={20} /> {t('export_full_backup')}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-bold">{t('or')}</span></div>
                  </div>

                  <label className="btn-secondary w-full flex items-center justify-center gap-3 py-4 cursor-pointer hover:bg-secondary/80">
                    <Upload size={20} /> {t('restore_from_backup')}
                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(135deg, rgba(239,68,68,0.03), rgba(220,38,38,0.06))' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ef4444' }}>{t('maintenance_zone')}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('irreversible_operations')}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Clear Today - Medium Risk */}
                  <div style={{
                    borderRadius: '14px',
                    border: showResetConfirm ? '2px solid #f59e0b' : '1px solid rgba(245,158,11,0.3)',
                    background: showResetConfirm ? '#fffcf0' : 'rgba(245,158,11,0.04)',
                    overflow: 'hidden',
                    transition: 'all 0.3s'
                  }}>
                    {showResetConfirm ? (
                      <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3">
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={18} />
                          </div>
                          <div style={{ fontWeight: 800, color: '#92400e' }}>{t('confirm_reset')}?</div>
                        </div>
                        <p className="text-xs text-[#92400e] font-medium leading-relaxed">
                          {t('reset_warning')}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={resetTodayData}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f59e0b', color: 'white', fontWeight: 800, fontSize: buttonFontSize, border: 'none' }}
                          >
                            {t('yes_reset_now')}
                          </button>
                          <button
                            onClick={() => setShowResetConfirm(false)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'white', border: '1px solid #d1d5db', color: '#374151', fontWeight: 800, fontSize: buttonFontSize }}
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 p-4">
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}>
                          <RefreshCcw size={18} />
                        </div>
                        <div className="flex-1">
                          <div style={{ fontWeight: 800, color: '#92400e', fontSize: headerFontSize }}>{t('clear_today_data')}</div>
                          <p style={{ fontSize: subFontSize }} className="text-muted mt-1 mb-3">{t('clear_data_subtitle')}</p>
                          <button
                            onClick={() => setShowResetConfirm(true)}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#92400e', fontWeight: 800, fontSize: buttonFontSize, cursor: 'pointer' }}
                          >
                            {t('start_reset_process')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Factory Reset - High Risk */}
                  <div style={{ borderRadius: '14px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.04)', overflow: 'hidden' }}>
                    <div className="flex items-start gap-4 p-4">
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0, marginTop: '2px' }}>
                        <Trash2 size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontWeight: 800, color: '#ef4444', fontSize: headerFontSize }}>{t('factory_reset')}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '20px', background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.05em' }}>{t('high_risk')}</span>
                        </div>
                        <p style={{ fontSize: subFontSize }} className="text-muted mt-1 mb-3">{t('factory_reset_subtitle')}</p>
                        <button
                          onClick={() => setShowFactoryResetConfirm(true)}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.5)', background: '#ef4444', color: 'white', fontWeight: 800, fontSize: buttonFontSize, cursor: 'pointer' }}
                        >
                          {t('factory_reset_system')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 text-center">
                <div className="flex justify-center gap-2 mb-2">
                  <FileJson size={16} className="text-muted" />
                  <span className="text-[10px] text-muted font-bold uppercase">System Version 1.0.2 Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Slot Delete Confirmation Modal */}
      {slotDeleteConfirm && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertCircle size={24} /> {t('confirm_deletion')}
              </h3>
              <button onClick={() => setSlotDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <p className="text-sm font-medium mb-6 text-muted-foreground">{slotDeleteConfirm.message}</p>
            <div className="modal-btn-row">
              <button onClick={() => setSlotDeleteConfirm(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button
                onClick={handleRemoveTimeSlot}
                className="flex-1 text-center rounded-xl border transition-colors"
                style={{ fontWeight: 700, padding: '10px 20px', borderColor: '#fecaca', background: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              >
                {t('yes_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset Confirmation Modal */}
      {showFactoryResetConfirm && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '420px', border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 25px 50px -12px rgba(239,68,68,0.2)' }}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{t('factory_reset')}</h3>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{t('irreversible_operations')}</p>
                </div>
              </div>
              <button onClick={() => setShowFactoryResetConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>

            <div className="p-4 mb-6" style={{ borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm font-bold text-red-700 mb-2">⚠️ {t('delete_warning_list')}</p>
              <ul className="text-xs text-muted space-y-1" style={{ paddingLeft: '16px', listStyleType: 'disc' }}>
                <li>{t('products_pricing_history')}</li>
                <li>{t('stock_sales_records')}</li>
                <li>{t('financial_expenses_audits')}</li>
                <li>{t('activity_system_settings')}</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFactoryResetConfirm(false)}
                className="btn-secondary flex-1"
                style={{ borderRadius: '12px', padding: '12px', fontWeight: 800, fontSize: isEnglish ? '0.9rem' : '0.8rem' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  storage.clear();
                  window.location.href = '/login';
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 900,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: isEnglish ? '0.9rem' : '0.8rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                }}
              >
                {t('wipe_everything')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .settings-tabs {
          display: flex;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1rem;
          gap: 4px;
        }
        .settings-tabs::-webkit-scrollbar {
          display: none;
        }
        .settings-tab-btn {
          padding: 12px 14px;
          font-weight: 700;
          font-size: 0.8rem;
          white-space: nowrap;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .settings-tab-btn.active {
          border-bottom-color: var(--primary);
          color: var(--primary);
        }
        .settings-tab-btn:not(.active) {
          color: var(--text-muted);
        }
        .settings-tab-btn:hover:not(.active) {
          color: var(--foreground);
        }

        @media (min-width: 768px) {
          .settings-tab-btn {
            padding: 16px 24px;
            font-size: 0.875rem;
          }
          .settings-tabs {
            gap: 16px;
          }
        }

        @media (max-width: 1024px) {
          .lg-grid { grid-template-columns: 1fr !important; }
        }

        .settings-header {
          /* Handled in index.css */
        }

        .time-slot-card {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 12px;
          background: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .time-slot-card:hover {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .slot-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 4px;
          display: block;
          letter-spacing: 0.02em;
        }

        .slot-input-time {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-weight: 700;
          font-size: 0.9rem;
          background: var(--bg-card);
          width: 100px;
        }

        .slot-input-text {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 0.9rem;
          background: var(--bg-card);
          width: 100%;
        }

        .time-slot-time { flex-shrink: 0; }
        .time-slot-desc { flex: 1; }

        .slot-delete-btn {
          padding: 9px;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.06);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .slot-delete-btn:hover {
          background: #ef4444;
          color: white;
        }

        @media (max-width: 768px) {
          .time-slot-card {
            gap: 10px;
            padding: 10px;
          }
          .slot-input-time { width: 90px; padding: 7px 8px; }
          .slot-input-text { padding: 7px 10px; }
        }

        @media (max-width: 640px) {
          .time-slot-card {
            flex-wrap: nowrap !important;
            gap: 8px;
            padding: 8px;
          }
          .time-slot-time { order: 1; flex-shrink: 0; }
          .time-slot-desc { order: 2; flex: 1; min-width: 0; }
          .slot-delete-btn { order: 3; margin-left: 0; padding: 7px; }
          .slot-input-time { width: 85px; font-size: 0.8rem; padding: 6px; }
          .slot-input-text { font-size: 0.8rem; padding: 6px 10px; }
          .slot-label { font-size: 8px; margin-bottom: 2px; }
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .modal-btn-row {
          display: flex;
          flex-wrap: nowrap !important;
          gap: 12px;
          width: 100%;
        }
        
        .modal-btn-row > button {
          flex: 1 1 0%;
          min-width: 0;
        }

        @media (max-width: 480px) {
          .delete-confirm-card {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
