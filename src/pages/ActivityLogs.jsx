import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import {
  History,
  Search,
  Filter,
  Clock,
  User,
  Activity as ActivityIcon,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X,
  CreditCard,
  Trash2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const ActivityLogs = () => {
  const { t, language } = useAuth();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showBulkReset, setShowBulkReset] = useState(false);
  const [resetRange, setResetRange] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Dynamic font sizing for localized strings
  const isEnglish = language === 'English';
  const modalTitleSize = isEnglish ? '1.25rem' : '1.1rem';
  const modalSubSize = isEnglish ? '0.875rem' : '0.8rem'; // text-sm is 0.875rem

  useEffect(() => {
    setLogs(storage.get('dsms_activity_logs'));
  }, []);

  const filteredLogs = logs.filter(log => {
    const details = log.details || '';
    const username = log.user?.username || 'System';
    const matchesSearch = details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'All' || log.type?.includes(filterAction);
    return matchesSearch && matchesAction;
  }).reverse(); // Latest first

  const handleBulkReset = () => {
    let logsToKeep = [];
    const now = new Date();

    logsToKeep = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      let isTarget = false;

      if (resetRange === 'today') {
        isTarget = isToday(logDate);
      } else if (resetRange === 'yesterday') {
        isTarget = isYesterday(logDate);
      } else if (resetRange === '7days') {
        isTarget = isWithinInterval(logDate, { start: subDays(now, 7), end: now });
      } else if (resetRange === 'month') {
        isTarget = isWithinInterval(logDate, { start: startOfMonth(now), end: endOfMonth(now) });
      } else if (resetRange === 'custom') {
        if (!customStart || !customEnd) return true; // Don't delete if dates missing
        try {
          isTarget = isWithinInterval(logDate, { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) });
        } catch (e) { return true; }
      }
      return !isTarget; // Keep if it's NOT in the target range to delete
    });

    setLogs(logsToKeep);
    storage.set('dsms_activity_logs', logsToKeep);
    storage.logActivity({ username: 'Admin', role: 'ADMIN' }, 'BULK_DELETE_LOGS', `Cleared audit logs for range: ${resetRange}`);
    setShowBulkReset(false);
  };

  const deleteLog = (id) => {
    setDeleteConfirm({ id, message: t('confirm_delete_audit_warning') });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      const updated = logs.filter(l => l.id !== deleteConfirm.id);
      setLogs(updated);
      storage.set('dsms_activity_logs', updated);
    }
    setDeleteConfirm(null);
  };

  const getActionStyles = (type) => {
    if ((type || '').includes('PRICE')) return { bg: '#eff6ff', color: '#1d4ed8', icon: '₹' };
    if ((type || '').includes('STOCK')) return { bg: '#f0fdf4', color: '#16a34a', icon: '📦' };
    if ((type || '').includes('RESET')) return { bg: '#fef2f2', color: '#ef4444', icon: '🔄' };
    if ((type || '').includes('AUTH') || (type || '').includes('LOGIN')) return { bg: '#faf5ff', color: '#7e22ce', icon: '🔐' };
    return { bg: '#f8fafc', color: '#64748b', icon: '⚡' };
  };

  return (
    <div className="grid gap-6 animate-in">
      <div className="logs-page-header flex justify-between items-center gap-4">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('audit_trail')}</h2>
          <p className="text-sm text-muted font-medium">{t('audit_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBulkReset(true)} className="btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-2">
            <Trash2 size={16} /> <span>{t('reset_logs')}</span>
          </button>
          <div className="admin-badge">
            <ShieldCheck size={18} /> <span>{t('admin_only_access')}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="responsive-filter-bar mb-8">
          <div className="filter-search-container">
            <Search size={20} className="text-muted flex-shrink-0" />
            <input
              type="text"
              placeholder={t('search_logs_placeholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-select-container">
            <Filter size={18} className="text-muted flex-shrink-0" />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="All">{t('all_activities')}</option>
              <option value="STOCK">{t('stock_updates')}</option>
              <option value="PRICE">{t('price_changes')}</option>
              <option value="ADD">{t('new_entries')}</option>
              <option value="RESET">{t('reset_actions')}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-20 bg-secondary/20 rounded-2xl border-2 border-dashed border-border/50">
              <History size={48} className="mx-auto text-muted opacity-20 mb-4" />
              <p className="font-bold text-muted">{t('no_activities_recorded')}</p>
              <p className="text-xs text-muted mt-1">{t('try_broadening_search')}</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const type = log.type || log.action || '';
              const description = log.description || log.details || '';
              const username = log.user?.username || log.username || 'System';
              const role = log.user?.role || 'SYSTEM';

              const styles = getActionStyles(type);
              return (
                <div key={log.id || index} className="group flex gap-5 p-5 items-start bg-secondary/10 hover:bg-secondary/30 border border-transparent hover:border-border/60 rounded-2xl transition-all duration-300">
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: styles.bg,
                    color: styles.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                  }}>
                    {styles.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--foreground)' }}>
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-border/50 text-muted-foreground uppercase tracking-widest leading-normal">
                          {log.id?.substring(0, 6) || '---'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted bg-white px-3 py-1.5 rounded-full border border-border/40">
                        <Clock size={12} className="text-primary" />
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.925rem', color: 'var(--foreground)', lineHeight: 1.6 }} className="mb-4">
                      {description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: '28px',
                          height: '28px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 900
                        }}>
                          {username[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-muted">
                          <span className="text-primary">{username}</span>
                          <span className="mx-2 opacity-50">•</span>
                          <span className="uppercase tracking-tighter">{role}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary" style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(log)}>
                          {t('view_details')} <ArrowRight size={14} />
                        </div>
                        <button onClick={() => deleteLog(log.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 bg-transparent border-none cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="flex items-center gap-2">
                <ActivityIcon size={24} className="text-primary" /> {t('audit_record_details')}
              </h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">{t('action_type')}</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{(selectedLog.type || selectedLog.action || 'UNKNOWN').replace('_', ' ')}</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">{t('timestamp')}</div>
                  <div style={{ fontWeight: 700 }}>{format(new Date(selectedLog.timestamp), 'MMM dd, yyyy', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</div>
                  <div className="text-xs text-muted">{format(new Date(selectedLog.timestamp), 'HH:mm:ss a', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</div>
                </div>
              </div>

              <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <User size={16} className="text-muted" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{t('performer_info')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div style={{ fontWeight: 700 }}>{selectedLog.user?.username || selectedLog.username || 'System'}</div>
                  <div className="text-xs font-bold text-primary bg-blue-50 px-2 py-1 rounded border border-blue-100">{selectedLog.user?.role || 'SYSTEM'}</div>
                </div>
              </div>

              <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard size={16} className="text-muted" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{t('system_log_entry')}</span>
                </div>
                <div style={{ fontWeight: 600, lineHeight: 1.6 }}>{selectedLog.description || selectedLog.details || 'No additional details provided.'}</div>
              </div>

              <div className="text-center mt-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{t('entry_id')}: {selectedLog.id || '---'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reset Modal */}
      {showBulkReset && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '92%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-5">
              <h3 style={{ fontSize: modalTitleSize, fontWeight: 800, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertCircle size={22} className="flex-shrink-0" /> {t('reset_audit_logs')}
              </h3>
              <button onClick={() => setShowBulkReset(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>

            <p style={{ fontSize: modalSubSize, fontWeight: 500, lineHeight: 1.5 }} className="mb-6 text-muted-foreground">{t('reset_logs_warning_subtitle')}</p>

            <div className="grid gap-4 mb-6">
              <div>
                <label className="text-sm font-bold mb-2 block">{t('date_range')}</label>
                <select
                  className="w-full"
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '0.95rem' }}
                  value={resetRange}
                  onChange={(e) => setResetRange(e.target.value)}
                >
                  <option value="today">{t('today')}</option>
                  <option value="yesterday">{t('yesterday')}</option>
                  <option value="7days">{t('last_7_days')}</option>
                  <option value="month">{t('this_month')}</option>
                  <option value="custom">{t('custom_range')}</option>
                </select>
              </div>

              {resetRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold mb-2 block">{t('start_date')}</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full"
                      style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-2 block">{t('end_date')}</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full"
                      style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-btn-row">
              <button onClick={() => setShowBulkReset(false)} className="btn-secondary flex-1" style={{ fontSize: isEnglish ? '0.9rem' : '0.8rem', padding: '10px' }}>{t('cancel')}</button>
              <button
                onClick={handleBulkReset}
                className="flex-1 text-center rounded-xl border transition-colors"
                style={{ fontWeight: 800, padding: isEnglish ? '10px 20px' : '10px 12px', fontSize: isEnglish ? '0.9rem' : '0.78rem', borderColor: '#fecaca', background: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              >
                {t('clear_selected')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '92%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: modalTitleSize, fontWeight: 800, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertCircle size={22} className="flex-shrink-0" /> {t('confirm_deletion')}
              </h3>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <p style={{ fontSize: modalSubSize, fontWeight: 500, lineHeight: 1.5 }} className="mb-6 text-muted-foreground">{deleteConfirm.message}</p>
            <div className="modal-btn-row">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1" style={{ fontSize: isEnglish ? '0.9rem' : '0.8rem', padding: '10px' }}>{t('cancel')}</button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 text-center rounded-xl border transition-colors"
                style={{ fontWeight: 800, padding: isEnglish ? '10px 20px' : '10px 12px', fontSize: isEnglish ? '0.9rem' : '0.78rem', borderColor: '#fecaca', background: '#fef2f2', color: '#ef4444' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              >
                {t('yes_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-in {
          animation: slideUp 0.4s cubic-bezier(0, 0, 0.2, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Delete confirmation modal responsive fixes */
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

export default ActivityLogs;
