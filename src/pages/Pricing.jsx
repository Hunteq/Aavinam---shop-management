import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import {
  IndianRupee,
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  ArrowRight,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  X,
  Trash2,
  Search
} from 'lucide-react';

const Pricing = () => {
  const { user, t, language } = useAuth();
  const [products, setProducts] = useState([]);
  const [priceLogs, setPriceLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [newGlassPrice, setNewGlassPrice] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setProducts(storage.get('dsms_products'));
    setPriceLogs(storage.get('dsms_price_logs'));
  }, []);

  const handleUpdatePrice = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const oldPrice = selectedProduct.price;
    const oldGlassPrice = selectedProduct.pricePerGlass || 0;
    const updatedPrice = Number(newPrice);
    const updatedGlassPrice = Number(newGlassPrice);

    // Update Product
    const updatedProducts = products.map(p =>
      p.id === selectedProduct.id ? { ...p, price: updatedPrice, pricePerGlass: updatedGlassPrice } : p
    );
    setProducts(updatedProducts);
    storage.set('dsms_products', updatedProducts);

    // Logs
    const changes = [];
    if (updatedPrice !== oldPrice) changes.push(`Liter: ₹${oldPrice}->₹${updatedPrice}`);
    if (selectedProduct.category === 'Juice' && updatedGlassPrice !== oldGlassPrice) {
      changes.push(`Glass: ₹${oldGlassPrice}->₹${updatedGlassPrice}`);
    }

    if (changes.length > 0) {
      if (updatedPrice !== oldPrice) {
        storage.logPriceChange(user, selectedProduct.id, oldPrice, updatedPrice, 'Liter');
      }
      if (selectedProduct.category === 'Juice' && updatedGlassPrice !== oldGlassPrice) {
        storage.logPriceChange(user, selectedProduct.id, oldGlassPrice, updatedGlassPrice, 'Glass');
      }
      storage.logActivity(user, 'PRICE_CHANGE', `Changed price for ${selectedProduct.name}: ${changes.join(', ')}`);
      storage.updateProductHistory(selectedProduct.id, 'PRICE_CHANGE', `Price updated: ${changes.join(', ')}`);
    }

    // Refresh Logs
    setPriceLogs(storage.get('dsms_price_logs'));

    setShowModal(false);
    setSelectedProduct(null);
    setNewPrice('');
    setNewGlassPrice('');
  };

  const handleDeleteLog = (id) => {
    const updated = priceLogs.filter(log => log.id !== id);
    setPriceLogs(updated);
    storage.set('dsms_price_logs', updated);
    setDeleteConfirmId(null);
  };

  const filteredProducts = products.filter(p => p.enabled && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('pricing_control')}</h2>
          <p className="text-sm text-muted">{t('pricing_subtitle')}</p>
        </div>
      </div>

      <div className="grid lg-grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Current Prices */}
        <div className="card">
          <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('active_selling_prices')}</h3>
            <div className="responsive-filter-bar" style={{ maxWidth: '300px' }}>
              <div className="filter-search-container" style={{ padding: '8px 12px' }}>
                <Search size={16} className="text-muted flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder={t('search_products_placeholder')} 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '12px 16px' }}>{t('product')}</th>
                  <th style={{ padding: '12px 16px' }}>{t('category')}</th>
                  <th style={{ padding: '12px 16px' }}>{t('liter_price')}</th>
                  <th style={{ padding: '12px 16px' }}>{t('glass_price')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} style={{ background: 'rgba(59, 130, 246, 0.03)', borderRadius: '12px' }}>
                    <td style={{ padding: '16px', fontWeight: 600, borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>{p.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        background: p.category === 'Dairy' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.category === 'Dairy' ? '#3b82f6' : '#f59e0b',
                        fontWeight: 600
                      }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{p.price.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>
                      {p.category === 'Juice' ? `₹${(p.pricePerGlass || 0).toFixed(2)}` : '---'}
                    </td>
                    <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setNewPrice(p.price);
                          setNewGlassPrice(p.pricePerGlass || 0);
                          setShowModal(true);
                        }}
                        className="btn-primary update-btn"
                      >
                        {t('update_price_btn')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <History size={20} className="text-primary" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('price_audit_log')}</h3>
          </div>
          <div className="flex flex-col gap-4" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
            {priceLogs.length === 0 ? (
              <div className="text-center p-8 text-muted border-2 border-dashed border-border rounded-xl">
                {t('no_price_changes')}
              </div>
            ) : (
              priceLogs.slice().reverse().map(log => {
                const product = products.find(p => p.id === log.productId);
                const isIncrease = log.newPrice > log.oldPrice;
                const isConfirming = deleteConfirmId === log.id;

                if (isConfirming) {
                  return (
                    <div key={log.id} style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', animation: 'fade-in 0.3s' }}>
                      <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.875rem', marginBottom: '8px' }}>{t('confirm_deletion')}?</div>
                      <p style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '12px' }}>{t('confirm_delete_price_log_warning')}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                        >
                          {t('delete')}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'white', border: '1px solid #d1d5db', color: '#374151', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={log.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{product?.name || 'Unknown Product'}</div>
                          {log.unit && (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: log.unit === 'Glass' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: log.unit === 'Glass' ? '#f59e0b' : '#3b82f6',
                              textTransform: 'uppercase'
                            }}>{log.unit}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }} className="flex items-center gap-1 mt-1">
                          <User size={12} /> {log.username}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }} className="flex items-center gap-3">
                        <div className="flex items-center gap-1"><Clock size={12} /> {format(new Date(log.timestamp), 'MMM dd, HH:mm', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</div>
                        <button
                          onClick={() => setDeleteConfirmId(log.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.5, transition: 'opacity 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.opacity = '1'}
                          onMouseOut={e => e.currentTarget.style.opacity = '0.5'}
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ textDecoration: 'line-through', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>₹{log.oldPrice}</span>
                        <ArrowRight size={14} className="text-muted" />
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: isIncrease ? '#ef4444' : '#10b981' }}>₹{log.newPrice}</span>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        background: isIncrease ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isIncrease ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}>
                        {isIncrease ? <UpIcon size={12} /> : <DownIcon size={12} />}
                        {isIncrease ? t('increase') : t('decrease')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('update_selling_price')}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <div className="mb-6 p-4" style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
              <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">{t('product_name')}</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{selectedProduct?.name}</div>
            </div>
            <form onSubmit={handleUpdatePrice} className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block mb-2 font-medium">{t('liter_price')} (₹)</label>
                  <div className="flex items-center gap-3" style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', background: 'var(--background)' }}>
                    <IndianRupee size={16} className="text-primary" />
                    <input
                      type="number"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.1rem', fontWeight: 700, background: 'transparent', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                {selectedProduct?.category === 'Juice' && (
                  <div>
                    <label className="text-sm block mb-2 font-medium">{t('glass_price')} (₹)</label>
                    <div className="flex items-center gap-3" style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', background: 'var(--background)' }}>
                      <IndianRupee size={16} className="text-warning" style={{ color: '#f59e0b' }} />
                      <input
                        type="number"
                        value={newGlassPrice}
                        onChange={e => setNewGlassPrice(e.target.value)}
                        required
                        step="0.01"
                        min="0"
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.1rem', fontWeight: 700, background: 'transparent', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '10px 20px' }}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>{t('update_price_btn')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .update-btn {
          padding: 8px 16px; 
          font-size: 0.875rem;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .lg-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .update-btn {
            padding: 6px 8px !important;
            font-size: 0.7rem !important;
            white-space: normal;
            line-height: 1.2;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Pricing;
