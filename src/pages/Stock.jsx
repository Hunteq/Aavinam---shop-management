import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { isToday, format, startOfDay, endOfDay } from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import {
  Plus,
  History,
  AlertCircle,
  AlertTriangle,
  Save,
  Edit3,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
  ShoppingCart,
  RotateCcw,
  PlusCircle,
  X,
  Trash2
} from 'lucide-react';

const Stock = () => {
  const { user, t, language } = useAuth();
  const isEnglish = language === 'English';
  const headerFontSize = isEnglish ? '1.125rem' : '1rem';
  const subFontSize = isEnglish ? '0.75rem' : '0.68rem';
  const buttonFontSize = isEnglish ? '0.8125rem' : '0.75rem';
  const isAdmin = user.role === 'ADMIN';
  const [products, setProducts] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [modalType, setModalType] = useState('FRESH'); // OPENING, FRESH, CHECK, ADJUST
  const [formData, setFormData] = useState({ productId: '', amount: '', reason: '', saleUnit: 'L' });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [updateType, setUpdateType] = useState('CHECK'); // For scheduled updates

  useEffect(() => {
    const allProducts = storage.get('dsms_products');
    setProducts(allProducts.filter(p => p.enabled));

    // Load all logs
    const allLogs = storage.get('dsms_stock_logs');
    setStockLogs(allLogs);

    const settings = storage.get('dsms_settings');
    setTimeSlots(settings.timeSlots || []);
  }, []);

  // Filter logs for today
  const todaysLogs = useMemo(() => {
    return stockLogs.filter(log => isToday(new Date(log.timestamp)));
  }, [stockLogs]);

  const calculateProductStats = (productId) => {
    const logs = todaysLogs.filter(l => l.productId === productId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const product = products.find(p => p.id === productId);
    if (!product) return { opening: 0, fresh: 0, sold: 0, remaining: 0, revenue: 0 };

    let opening = 0;
    let freshTotal = 0;
    let lastLevel = 0;
    let totalSold = 0;
    let hasOpening = false;

    let revenue = 0;
    const GLASS_SIZE = 0.25; // 250ml per glass

    logs.forEach(log => {
      if (log.type === 'OPENING') {
        opening += log.amount;
        lastLevel += log.amount;
        hasOpening = true;
      } else if (log.type === 'FRESH') {
        freshTotal += log.amount;
        lastLevel += log.amount;
      } else if (log.type === 'CHECKPOINT' || log.type === 'CHECK') {
        const soldSinceLast = lastLevel - log.amount;
        if (soldSinceLast > 0) {
          totalSold += soldSinceLast;
          revenue += soldSinceLast * product.price;
        }
        lastLevel = log.amount;
      } else if (log.type === 'SALE') {
        if (log.unit === 'G' && product.category === 'Juice') {
          const literEquivalent = log.amount * GLASS_SIZE;
          totalSold += literEquivalent;
          lastLevel -= literEquivalent;
          revenue += log.amount * (product.pricePerGlass || 0);
        } else {
          totalSold += log.amount;
          lastLevel -= log.amount;
          revenue += log.amount * product.price;
        }
      } else if (log.type === 'ADJUST') {
        lastLevel += log.amount;
      }
    });

    return {
      opening,
      fresh: freshTotal,
      sold: totalSold,
      remaining: lastLevel,
      revenue
    };
  };

  // Pre-calculate summary stats for all products to ensure reactivity
  const summaryStats = useMemo(() => {
    const statsMap = {};
    products.forEach(p => {
      statsMap[p.id] = calculateProductStats(p.id);
    });
    return statsMap;
  }, [products, todaysLogs]);

  const handleSave = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);

    let type = modalType;
    let isFresh = modalType === 'FRESH';

    if (modalType === 'SCHEDULED') {
      type = updateType;
      isFresh = updateType === 'FRESH';
    }

    const newLog = {
      id: Date.now().toString(),
      productId: formData.productId,
      type: type,
      amount: Number(formData.amount),
      timestamp: new Date().toISOString(),
      username: user.username,
      userId: user.id,
      reason: formData.reason || (modalType === 'SCHEDULED' ? `Check: ${selectedSlot.label}` : ''),
      unit: (modalType === 'SALE' || (modalType === 'SCHEDULED' && updateType === 'SALE')) && product?.category === 'Juice' ? formData.saleUnit : 'L',
      isFresh: isFresh
    };

    const updatedLogs = [...stockLogs, newLog];
    setStockLogs(updatedLogs);
    storage.set('dsms_stock_logs', updatedLogs);
    storage.logActivity(user, `STOCK_${type}`, `Stock update for ${product?.name}: ${formData.amount}L`);

    setShowModal(false);
    setFormData({ productId: '', amount: '', reason: '', saleUnit: 'L' });
  };

  const resetDay = () => {
    if (!isAdmin) return;
    const remainingLogs = stockLogs.filter(log => !isToday(new Date(log.timestamp)));
    setStockLogs(remainingLogs);
    storage.set('dsms_stock_logs', remainingLogs);
    storage.logActivity(user, 'RESET_DAY', 'Daily stock logs cleared');
    setShowResetConfirm(false);
  };

  const deleteLog = (id) => {
    if (!isAdmin) return;
    setDeleteConfirm({ id, type: 'log', message: t('confirm_delete_log_warning') });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm?.type === 'log') {
      const updated = stockLogs.filter(l => l.id !== deleteConfirm.id);
      setStockLogs(updated);
      storage.set('dsms_stock_logs', updated);
      storage.logActivity(user, 'DELETE_STOCK_LOG', `Deleted log entry ID: ${deleteConfirm.id}`);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="grid gap-6">
      <div className="stock-page-header flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('stock_control_system')}</h2>
          <p className="text-sm text-muted">{t('track_refrigeration')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-2"
            style={{ background: '#10b981' }}
            onClick={() => { setModalType('OPENING'); setShowModal(true); }}>
            <Package size={18} /> {t('opening_stock')}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => { setModalType('FRESH'); setShowModal(true); }}>
            <PlusCircle size={18} /> {t('fresh_stock')}
          </button>
          <button className="btn-primary flex items-center gap-2"
            style={{ background: '#3b82f6' }}
            onClick={() => { setModalType('SALE'); setShowModal(true); }}>
            <ShoppingCart size={18} /> {t('record_sale')}
          </button>
        </div>
      </div>

      {/* Time Slots Area */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            <Clock size={20} className="text-primary" /> {t('daily_schedule_checks')}
          </h3>
          <span className="text-xs text-muted font-medium bg-secondary px-2 py-1 rounded-full">
            {t('staff_updates_msg')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', paddingBottom: '16px' }}>
          {timeSlots.map(slot => (
            <button
              key={slot.id}
              onClick={() => { 
                setSelectedSlot(slot); 
                setModalType('SCHEDULED'); 
                const label = slot.label.toLowerCase();
                if (label.includes('fresh')) setUpdateType('FRESH');
                else if (label.includes('opening')) setUpdateType('OPENING');
                else setUpdateType('CHECK');
                setShowModal(true); 
              }}
              className="checkpoint-card"
            >
              <div className="time">{slot.time}</div>
              <div className="label">{slot.label}</div>
              <div className="action">{t('update_level')} <ArrowRight size={14} /></div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Today's Summary Table */}
        <div className="card">
          <h3 className="mb-6 flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            <TrendingUp size={20} className="text-primary" /> {t('todays_stock_summary')}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '8px 16px' }}>{t('product')}</th>
                  <th style={{ padding: '8px 16px' }}>{t('opening_stock')}</th>
                  <th style={{ padding: '8px 16px' }}>{t('fresh_stock')}</th>
                  <th style={{ padding: '8px 16px' }}>{t('quantity_sold')}</th>
                  <th style={{ padding: '8px 16px' }}>{t('balance')}</th>
                  <th style={{ padding: '8px 16px' }}>{t('revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const stats = summaryStats[p.id] || { opening: 0, fresh: 0, sold: 0, remaining: 0, revenue: 0 };
                  return (
                    <tr key={p.id} style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>{p.name}</td>
                      <td style={{ padding: '12px 16px' }}>{stats.opening} L</td>
                      <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>+{stats.fresh} L</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>{stats.sold} L</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: stats.remaining < 10 ? '#ef4444' : 'var(--foreground)'
                        }}>
                          {stats.remaining} {t('liter_abbr')}
                        </span>
                        {stats.remaining < 10 && <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{t('low_level')}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#10b981', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                        ₹{stats.revenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('todays_logs')}</h3>
            {/* {isAdmin && (
              <button onClick={() => { setModalType('ADJUST'); setShowModal(true); }} className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 text-orange-600 border border-orange-200">
                Manual Adjust
              </button>
            )} */}
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px' }}>{t('time')}</th>
                  <th style={{ padding: '12px' }}>{t('product')}</th>
                  <th style={{ padding: '12px' }}>{t('type')}</th>
                  <th style={{ padding: '12px' }}>{t('value')}</th>
                  {isAdmin && <th style={{ padding: '12px' }}>{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {todaysLogs.slice().reverse().map(log => {
                  const product = products.find(p => p.id === log.productId);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{format(new Date(log.timestamp), 'HH:mm', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: 600 }}>{product?.name || '---'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: log.type === 'SALE' ? '#dbeafe' : log.type === 'FRESH' ? '#dcfce7' : log.type === 'OPENING' ? '#f1f5f9' : (log.type === 'CHECKPOINT' || log.type === 'CHECK') ? '#e0f2fe' : '#ffedd5',
                          color: log.type === 'SALE' ? '#1d4ed8' : log.type === 'FRESH' ? '#166534' : log.type === 'OPENING' ? '#475569' : (log.type === 'CHECKPOINT' || log.type === 'CHECK') ? '#0369a1' : '#9a3412',
                        }}>
                          {log.type === 'CHECKPOINT' || log.type === 'CHECK' ? t('check') : 
                           log.type === 'SALE' ? t('sale') : 
                           log.type === 'FRESH' ? t('fresh') : 
                           log.type === 'OPENING' ? t('opening') : 
                           log.type === 'ADJUST' ? t('adjustment') : log.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: 700 }}>
                        {log.type === 'FRESH' ? '+' : log.type === 'SALE' ? '-' : ''}{log.amount}{log.unit === 'L' ? t('liter_abbr') : log.unit === 'G' ? t('glass_abbr') : (log.unit || t('liter_abbr'))}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => deleteLog(log.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ border: '1px solid #fee2e2' }}>
          <h3 style={{ fontSize: '1.125rem', color: '#ef4444', fontWeight: 700 }} className="mb-4 flex items-center gap-2">
            <AlertCircle size={20} /> {t('danger_zone')}
          </h3>
          <div className="flex flex-col gap-4">
            {showResetConfirm ? (
              <div className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <div style={{ fontWeight: 800, fontSize: headerFontSize }} className="text-red-700">{t('confirm_daily_reset')}</div>
                </div>
                <p style={{ fontSize: subFontSize }} className="text-red-600 mb-4 font-medium">{t('reset_warning')}</p>
                <div className="flex gap-3">
                  <button
                    onClick={resetDay}
                    className="danger-confirm-btn"
                    style={{ fontSize: buttonFontSize }}
                  >
                    {t('reset_everything')}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="danger-cancel-btn"
                    style={{ fontSize: buttonFontSize }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full text-left p-4 rounded-xl border border-red-100 hover:bg-red-50 transition-colors group"
              >
                <div className="flex justify-between items-center mb-1">
                  <div style={{ fontWeight: 800, fontSize: headerFontSize }} className="text-red-700">{t('clear_today_data')}</div>
                  <RotateCcw size={16} className="text-red-400 group-hover:-rotate-90 transition-transform duration-500" />
                </div>
                <p style={{ fontSize: subFontSize }} className="text-red-500 font-medium">{t('clear_data_subtitle')}</p>
              </button>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {modalType === 'SCHEDULED' ? `${t('update')}: ${selectedSlot?.label}` : `${t('new_entry')} (${modalType === 'OPENING' ? t('opening') : modalType === 'FRESH' ? t('fresh') : modalType === 'SALE' ? t('sale') : modalType})`}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>

            {modalType === 'SCHEDULED' && (
              <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-border/50">
                <label className="text-sm block mb-2 font-medium">{t('update_category')}</label>
                <select
                  value={updateType}
                  onChange={e => setUpdateType(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', fontWeight: 600 }}
                >
                  <option value="OPENING">{t('opening_stock')}</option>
                  <option value="FRESH">{t('fresh_stock')}</option>
                  <option value="SALE">{t('record_sale')}</option>
                  {/* <option value="CHECKPOINT">Standard Checkpoint (Current Level)</option> */}
                </select>
              </div>
            )}

            <form onSubmit={handleSave} className="grid gap-6">
              <div>
                <label className="text-sm block mb-2 font-medium">{t('select_product')}</label>
                <select
                  value={formData.productId}
                  onChange={e => setFormData({ ...formData, productId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="">{t('choose_product')}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-2 font-medium">
                  {modalType === 'SCHEDULED'
                    ? (updateType === 'FRESH' || updateType === 'OPENING'
                      ? t('qty_added_liter')
                      : updateType === 'SALE'
                        ? t('qty_sold_liter')
                        : t('current_stock_liter'))
                    : modalType === 'SALE'
                      ? t('qty_sold_liter')
                      : t('quantity_liter')}
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1.125rem', fontWeight: 600 }}
                />
              </div>
              {(modalType === 'SALE' || (modalType === 'SCHEDULED' && updateType === 'SALE')) && products.find(p => p.id === formData.productId)?.category === 'Juice' && (
                <div>
                  <label className="text-sm block mb-2 font-medium">Sale Unit</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, saleUnit: 'L' })}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: formData.saleUnit === 'L' ? 'var(--primary)' : 'var(--background)', color: formData.saleUnit === 'L' ? 'white' : 'var(--foreground)', fontWeight: 700 }}
                    >{t('liter')}</button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, saleUnit: 'G' })}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: formData.saleUnit === 'G' ? 'var(--primary)' : 'var(--background)', color: formData.saleUnit === 'G' ? 'white' : 'var(--foreground)', fontWeight: 700 }}
                    >{t('per_glass')}</button>
                  </div>
                </div>
              )}
              {modalType === 'ADJUST' && (
                <div>
                  <label className="text-sm block mb-2 font-medium">{t('reason_note_mandatory')}</label>
                  <textarea
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    required
                    placeholder={t('provide_reason_placeholder')}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', minHeight: '80px' }}
                  />
                </div>
              )}
              {modalType === 'OPENING' && (
                <div>
                  <label className="text-sm block mb-2 font-medium">{t('audit_notes_optional')}</label>
                  <textarea
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    placeholder={t('provide_reason_placeholder')}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)', minHeight: '80px' }}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '10px 20px' }}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>{t('save_entry')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: isEnglish ? '1.25rem' : '1.1rem', fontWeight: 800, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertTriangle size={24} /> {t('confirm_deletion')}
              </h3>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <p style={{ fontSize: isEnglish ? '0.875rem' : '0.8rem', fontWeight: 500 }} className="text-muted-foreground mb-6">{deleteConfirm.message}</p>
            <div className="modal-btn-row">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1" style={{ fontSize: buttonFontSize }}>{t('cancel')}</button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 text-center rounded-xl border transition-colors"
                style={{ fontWeight: 800, padding: isEnglish ? '10px 20px' : '10px 14px', borderColor: '#fecaca', background: '#fef2f2', color: '#ef4444', fontSize: buttonFontSize }}
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
        @media (max-width: 1024px) {
          .lg-grid { grid-template-columns: 1fr !important; }
        }
        .checkpoint-card {
          min-width: 160px; 
          padding: 20px; 
          background: var(--card); 
          border: 1px solid var(--border);
          border-radius: 16px;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .checkpoint-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .checkpoint-card .time {
          font-weight: 800;
          font-size: 1.125rem;
          color: var(--primary);
        }
        .checkpoint-card .label {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          font-weight: 500;
          line-height: 1.2;
          height: 2.4em;
          overflow: hidden;
        }
        .checkpoint-card .action {
          margin-top: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted-foreground);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .checkpoint-card:hover .action {
          color: var(--primary);
        }
        .danger-confirm-btn {
          flex: 1;
          padding: 10px;
          background: #ef4444;
          color: white;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.8125rem;
          border: none;
          transition: all 0.2s;
          box-shadow: 0 4px 12px -2px rgba(239, 68, 68, 0.3);
        }
        .danger-confirm-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px -2px rgba(239, 68, 68, 0.4);
        }
        .danger-cancel-btn {
          flex: 1;
          padding: 10px;
          background: white;
          color: #475569;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.8125rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        .danger-cancel-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
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

export default Stock;
