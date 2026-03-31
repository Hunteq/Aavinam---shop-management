import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { isToday, format } from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import {
  IndianRupee,
  Plus,
  Trash2,
  Calendar,
  Tag,
  FileText,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  History,
  ArrowRight
} from 'lucide-react';

const Financials = () => {
  const { user, t, language } = useAuth();
  const isAdmin = user.role === 'ADMIN';

  // Dynamic font sizing for localized strings
  const isEnglish = language === 'English';
  const modalTitleSize = isEnglish ? '1.25rem' : '1.1rem';
  const modalSubSize = isEnglish ? '0.875rem' : '0.8rem';
  const [expenses, setExpenses] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: '', note: '' });
  const [cashForm, setCashForm] = useState({ actualCash: '', note: '' });

  useEffect(() => {
    setExpenses(storage.get('dsms_expenses') || []);
    setCashEntries(storage.get('dsms_cash_entries') || []);
    setProducts(storage.get('dsms_products'));
    setStockLogs(storage.get('dsms_stock_logs'));
  }, []);

  // Today's stats calculation
  const todayStats = useMemo(() => {
    const todaysLogs = stockLogs.filter(log => isToday(new Date(log.timestamp))).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const stats = {}; // productId -> { sold, revenue }
    const productMap = {}; // productId -> product details
    products.forEach(p => {
      stats[p.id] = { sold: 0, revenue: 0 };
      productMap[p.id] = p;
    });

    // Track current levels for each product to calculate sales at checkpoints
    const currentLevels = {};

    todaysLogs.forEach(log => {
      if (!currentLevels[log.productId]) currentLevels[log.productId] = 0;

      if (log.type === 'OPENING') {
        currentLevels[log.productId] = log.amount;
      } else if (log.type === 'FRESH') {
        currentLevels[log.productId] += log.amount;
      } else if (log.type === 'CHECKPOINT' || log.type === 'CHECK') {
        const sold = currentLevels[log.productId] - log.amount;
        if (sold > 0) {
          stats[log.productId].sold += sold;
          stats[log.productId].revenue += sold * (productMap[log.productId]?.price || 0);
        }
        currentLevels[log.productId] = log.amount;
      } else if (log.type === 'SALE') {
        stats[log.productId].sold += log.amount;
        stats[log.productId].revenue += log.amount * (productMap[log.productId]?.price || 0);
        currentLevels[log.productId] -= log.amount;
      } else if (log.type === 'ADJUST') {
        currentLevels[log.productId] += log.amount;
      }
    });

    let totalRevenue = 0;
    let dairyRevenue = 0;
    let juiceRevenue = 0;

    Object.keys(stats).forEach(id => {
      totalRevenue += stats[id].revenue;
      if (productMap[id]?.category === 'Dairy') dairyRevenue += stats[id].revenue;
      if (productMap[id]?.category === 'Juice') juiceRevenue += stats[id].revenue;
    });

    const totalExpenses = expenses.filter(ex => isToday(new Date(ex.timestamp))).reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalRevenue,
      dairyRevenue,
      juiceRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses
    };
  }, [stockLogs, products, expenses]);

  const handleAddExpense = (e) => {
    e.preventDefault();
    const newExpense = {
      id: Date.now().toString(),
      ...expenseForm,
      amount: Number(expenseForm.amount),
      timestamp: new Date().toISOString(),
      username: user.username,
      userId: user.id
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    storage.set('dsms_expenses', updated);
    storage.logActivity(user, 'ADD_EXPENSE', `Recorded expense: ${expenseForm.category} - ₹${expenseForm.amount}`);
    setShowExpenseModal(false);
    setExpenseForm({ category: 'Rent', amount: '', note: '' });
  };

  const handleAddCashEntry = (e) => {
    e.preventDefault();
    const expected = todayStats.netProfit;
    const actual = Number(cashForm.actualCash);

    const newEntry = {
      id: Date.now().toString(),
      expectedCash: expected,
      actualCash: actual,
      difference: actual - expected,
      note: cashForm.note,
      timestamp: new Date().toISOString(),
      username: user.username,
      userId: user.id
    };
    const updated = [newEntry, ...cashEntries];
    setCashEntries(updated);
    storage.set('dsms_cash_entries', updated);
    storage.logActivity(user, 'CASH_ENTRY', `Manual cash verification: ₹${actual} (Diff: ₹${actual - expected})`);
    setShowCashModal(true); // Close it after submit
    setShowCashModal(false);
    setCashForm({ actualCash: '', note: '' });
  };

  const deleteCashAudit = (id) => {
    setDeleteConfirm({ id, type: 'audit', message: t('confirm_delete_cash_audit_warning') });
  };

  const deleteExpense = (id) => {
    setDeleteConfirm({ id, type: 'expense', message: t('confirm_delete_expense_warning') });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm?.type === 'expense') {
      const updated = expenses.filter(ex => ex.id !== deleteConfirm.id);
      setExpenses(updated);
      storage.set('dsms_expenses', updated);
    } else if (deleteConfirm?.type === 'audit') {
      const updated = cashEntries.filter(en => en.id !== deleteConfirm.id);
      setCashEntries(updated);
      storage.set('dsms_cash_entries', updated);
      storage.logActivity(user, 'DELETE_CASH_AUDIT', `Deleted cash audit entry ID: ${deleteConfirm.id}`);
    }
    setDeleteConfirm(null);
  };

  if (!isAdmin) return <div className="card">{t('access_denied_admin')}</div>;

  return (
    <div className="grid gap-6">
      <div className="financials-header flex justify-between items-center gap-3">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('financial_control')}</h2>
          <p className="text-sm text-muted">{t('financial_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExpenseModal(true)} className="btn-secondary flex items-center gap-2" style={{ background: 'var(--bg-card)' }}>
            <TrendingDown size={18} /> <span>{t('record_expense')}</span>
          </button>
          <button onClick={() => setShowCashModal(true)} className="btn-primary flex items-center gap-2">
            <IndianRupee size={18} /> <span>{t('daily_cash_count')}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md-grid-4 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card stats-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="text-sm text-muted mb-1 font-medium">{t('expected_revenue_today')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>₹{todayStats.totalRevenue.toLocaleString()}</div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
            <span className="text-xs">{t('dairy')}: ₹{todayStats.dairyRevenue.toLocaleString()}</span>
            <span className="text-xs">{t('juice')}: ₹{todayStats.juiceRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="card stats-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="text-sm text-muted mb-1 font-medium">{t('expenses_today')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>₹{todayStats.totalExpenses.toLocaleString()}</div>
          <p className="text-xs mt-2 text-muted">{t('recorded_throughout_day')}</p>
        </div>
        <div className="card stats-card" style={{ borderLeft: `4px solid ${todayStats.netProfit >= 0 ? '#10b981' : '#ef4444'}` }}>
          <div className="text-sm text-muted mb-1 font-medium">{t('estimated_net_profit')}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: todayStats.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
            ₹{todayStats.netProfit.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {todayStats.netProfit >= 0 ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
            <span className="text-xs font-medium">{t('excludes_gst')}</span>
          </div>
        </div>
      </div>

      <div className="grid lg-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Cash Verification */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              <CheckCircle2 size={20} className="text-primary" /> {t('daily_cash_audits')}
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            {cashEntries.length === 0 ? (
              <div className="text-center p-8 text-muted border-2 border-dashed border-border rounded-xl">
                {t('no_cash_counts')}
              </div>
            ) : (
              cashEntries.slice().reverse().map(entry => {
                const isShortage = entry.difference < 0;
                const isBalanced = entry.difference === 0;
                const badgeBg = isShortage ? 'rgba(239, 68, 68, 0.1)' : isBalanced ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                const badgeColor = isShortage ? '#ef4444' : isBalanced ? '#3b82f6' : '#10b981';
                const badgeText = isShortage ? t('shortage') : isBalanced ? t('balanced') : t('excess');

                return (
                  <div key={entry.id} className="p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <IndianRupee size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{format(new Date(entry.timestamp), 'MMM dd, yyyy', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</div>
                          <div className="text-xs text-muted">{t('audited_by')} {entry.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: badgeBg,
                          color: badgeColor
                        }}>
                          {badgeText}
                        </div>
                        {isAdmin && (
                          <button onClick={() => deleteCashAudit(entry.id)} style={{ color: 'var(--muted-foreground)', background: 'none' }} className="hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/50">
                      <div>
                        <div className="text-xs text-muted mb-1">{t('expected')}</div>
                        <div style={{ fontWeight: 700 }}>₹{entry.expectedCash.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">{t('actual_count')}</div>
                        <div style={{ fontWeight: 700 }}>₹{entry.actualCash.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-xs text-muted mb-1">{t('difference')}</div>
                        <div style={{ fontWeight: 800, color: isShortage ? '#ef4444' : '#10b981' }}>
                          {entry.difference > 0 ? '+' : ''}₹{entry.difference.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {entry.note && (
                      <div className="mt-3 flex gap-2 items-start">
                        <AlertTriangle size={14} className="text-orange-500 mt-0.5" />
                        <span className="text-xs text-muted italic">{entry.note}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expenses List */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              <TrendingDown size={20} className="text-red-500" /> {t('expense_tracker')}
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '8px 16px' }}>{t('date_category')}</th>
                  <th style={{ padding: '8px 16px' }}>{t('amount')}</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice().reverse().map(ex => (
                  <tr key={ex.id} style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
                    <td style={{ padding: '12px 16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {ex.category === 'Rent' ? t('rent') : 
                         ex.category === 'Electricity' ? t('electricity') : 
                         ex.category === 'Staff Salary' ? t('staff_salary') : 
                         ex.category === 'Water Bill' ? t('water_bill') : 
                         ex.category === 'Maintenance' ? t('maintenance') : 
                         ex.category === 'Transport' ? t('transport') : t('misc')}
                      </div>
                      <div className="text-xs text-muted">{format(new Date(ex.timestamp), 'MMM dd | HH:mm', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#ef4444' }}>- ₹{ex.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                      <button onClick={() => deleteExpense(ex.id)} style={{ color: 'var(--muted-foreground)', background: 'none' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && (
              <div className="text-center p-8 text-muted">{t('no_expenses_recorded')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('record_expense')}</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddExpense} className="grid gap-6">
              <div>
                <label className="text-sm mb-2 block font-medium">{t('category')}</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value="Rent">{t('rent')}</option>
                  <option value="Electricity">{t('electricity')}</option>
                  <option value="Staff Salary">{t('staff_salary')}</option>
                  <option value="Water Bill">{t('water_bill')}</option>
                  <option value="Maintenance">{t('maintenance')}</option>
                  <option value="Transport">{t('transport')}</option>
                  <option value="Others">{t('misc')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm mb-2 block font-medium">{t('amount_rupee')}</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1.25rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label className="text-sm mb-2 block font-medium">{t('note_details')}</label>
                <textarea
                  value={expenseForm.note}
                  onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  placeholder={t('what_was_this_for')}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '80px' }}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary flex-1">{t('cancel')}</button>
                <button type="submit" className="btn-primary flex-1">{t('save_expense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {showCashModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('daily_cash_audit')}</h3>
              <button onClick={() => setShowCashModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCashEntry} className="grid gap-6">
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">{t('expected_physical_cash')}</div>
                <div style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--primary)' }}>₹{todayStats.netProfit.toLocaleString()}</div>
                <div className="mt-2 text-xs text-muted">{t('revenue_minus_expenses')}</div>
              </div>
              <div>
                <label className="text-sm mb-2 block font-medium">{t('manually_counted_cash')}</label>
                <div className="flex items-center gap-3" style={{ padding: '12px 16px', border: '2px solid var(--primary)', borderRadius: '12px', background: 'var(--background)' }}>
                  <IndianRupee size={24} className="text-primary" />
                  <input
                    type="number"
                    value={cashForm.actualCash}
                    onChange={e => setCashForm({ ...cashForm, actualCash: e.target.value })}
                    required
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.75rem', fontWeight: 900, background: 'transparent', color: 'var(--foreground)' }}
                    placeholder={t('enter_amount')}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm mb-2 block font-medium">{t('audit_notes_optional')}</label>
                <textarea
                  value={cashForm.note}
                  onChange={e => setCashForm({ ...cashForm, note: e.target.value })}
                  placeholder={t('reason_for_discrepancy')}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '80px' }}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCashModal(false)} className="btn-secondary flex-1">{t('cancel')}</button>
                <button type="submit" className="btn-primary flex-1">{t('confirm_audit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: modalTitleSize, fontWeight: 700, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertTriangle size={24} /> {t('confirm_deletion')}
              </h3>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <p style={{ fontSize: modalSubSize, fontWeight: 500, lineHeight: 1.5 }} className="mb-6 text-muted-foreground">{deleteConfirm.message}</p>
            <div className="modal-btn-row">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1" style={{ fontSize: isEnglish ? '0.9rem' : '0.8rem', padding: '10px' }}>{t('cancel')}</button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 text-center rounded-xl border transition-colors"
                style={{ fontWeight: 700, padding: isEnglish ? '10px 20px' : '10px 12px', fontSize: isEnglish ? '0.9rem' : '0.78rem', borderColor: '#fecaca', background: '#fef2f2', color: '#ef4444' }}
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
        .stats-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
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

export default Financials;
