import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Power,
  Filter,
  X,
  History,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Products = () => {
  const { user, t, language } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Dairy', unit: 'Liter', price: '', pricePerGlass: '', enabled: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    setProducts(storage.get('dsms_products'));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    let updatedProducts = [...products];
    if (editingProduct) {
      updatedProducts = updatedProducts.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p);
      storage.logActivity(user, 'EDIT_PRODUCT', `Edited product: ${formData.name}`);
      storage.updateProductHistory(editingProduct.id, 'EDIT', `Product details updated: ${formData.name}`);
    } else {
      const newProduct = { ...formData, id: Date.now().toString(), history: [], price: Number(formData.price), pricePerGlass: Number(formData.pricePerGlass) };
      updatedProducts.push(newProduct);
      storage.logActivity(user, 'ADD_PRODUCT', `Added product: ${formData.name}`);
      // Initial history entry will be added by updateProductHistory if we call it after saving, 
      // but let's just push it to the newProduct object first since it's cleaner.
      newProduct.history.push({
        date: new Date().toISOString(),
        action: 'CREATE',
        details: 'Product created'
      });
    }
    setProducts(updatedProducts);
    storage.set('dsms_products', updatedProducts);
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', category: 'Dairy', unit: 'Liter', price: '', pricePerGlass: '', enabled: true });
  };

  const toggleStatus = (product) => {
    const updated = products.map(p => p.id === product.id ? { ...p, enabled: !p.enabled } : p);
    setProducts(updated);
    storage.set('dsms_products', updated);
    storage.logActivity(user, 'TOGGLE_PRODUCT', `${product.enabled ? 'Disabled' : 'Enabled'} ${product.name}`);
    storage.updateProductHistory(product.id, 'STATUS_CHANGE', `${product.enabled ? 'Disabled' : 'Enabled'} the product`);
  };

  const deleteProduct = (id) => {
    setDeleteConfirm({ id, message: t('confirm_delete_product_warning') });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      const updated = products.filter(p => p.id !== deleteConfirm.id);
      setProducts(updated);
      storage.set('dsms_products', updated);
      storage.logActivity(user, 'DELETE_PRODUCT', `Deleted product ID: ${deleteConfirm.id}`);
    }
    setDeleteConfirm(null);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid gap-6">
      <div className="prod-page-header flex justify-between items-center gap-3">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{t('product_management')}</h2>
          <p className="text-sm text-muted">{t('product_mgmt_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button className="btn-primary flex items-center gap-2 justify-center" onClick={() => { setEditingProduct(null); setFormData({ name: '', category: 'Dairy', unit: 'Liter', price: '', pricePerGlass: '', enabled: true }); setShowModal(true); }}>
              <Plus size={18} /> {t('add_new_product')}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="responsive-filter-bar mb-6">
          <div className="filter-search-container">
            <Search size={18} className="text-muted flex-shrink-0" />
            <input 
              type="text" 
              placeholder={t('search_products_placeholder')} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-select-container">
            <Filter size={18} className="text-muted flex-shrink-0" />
            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="All">{t('all_categories')}</option>
              <option value="Dairy">{t('dairy')}</option>
              <option value="Juice">{t('juice')}</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="prod-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                <th style={{ padding: '12px 16px' }}>{t('product_name')}</th>
                <th style={{ padding: '12px 16px' }}>{t('category')}</th>
                <th style={{ padding: '12px 16px' }}>{t('price')} ({t('liters')})</th>
                <th style={{ padding: '12px 16px' }}>{t('price')} ({t('glass')})</th>
                <th style={{ padding: '12px 16px' }}>{t('status')}</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} className="product-row" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <td style={{ padding: '16px', fontWeight: 600, borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>{p.name}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      background: p.category === 'Dairy' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: p.category === 'Dairy' ? '#3b82f6' : '#f59e0b',
                      fontWeight: 600,
                      border: `1px solid ${p.category === 'Dairy' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                    }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>₹{p.price}</td>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#f59e0b' }}>
                    {p.category === 'Juice' ? `₹${p.pricePerGlass || 0}` : '---'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: p.enabled ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                      {p.enabled ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {p.enabled ? t('enabled') : t('disabled')}
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right', minWidth: '160px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {isAdmin ? (
                        <>
                          <button onClick={() => { setSelectedProduct(p); setShowHistoryModal(true); }} style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', flexShrink: 0 }} title="View History"><History size={16} /></button>
                          <button onClick={() => { setEditingProduct(p); setFormData(p); setShowModal(true); }} style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', flexShrink: 0 }} title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => toggleStatus(p)} style={{ padding: '8px', borderRadius: '10px', background: p.enabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: p.enabled ? '#ef4444' : '#10b981', flexShrink: 0 }} title={p.enabled ? 'Disable' : 'Enable'}><Power size={16} /></button>
                          <button onClick={() => deleteProduct(p.id)} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', flexShrink: 0 }} title="Delete"><Trash2 size={16} /></button>
                        </>
                      ) : (
                        <button style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }} title="View Details"><Eye size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="prod-card-list">
          {filteredProducts.map(p => (
            <div key={p.id} className="p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</div>
                  <div className="text-xs text-muted mt-1">₹{p.price}/L {p.category === 'Juice' ? `· ₹${p.pricePerGlass || 0}/G` : ''}</div>
                </div>
                <span style={{ 
                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem',
                  background: p.category === 'Dairy' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: p.category === 'Dairy' ? '#3b82f6' : '#f59e0b', fontWeight: 700,
                  border: `1px solid ${p.category === 'Dairy' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                }}>{p.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: p.enabled ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                  {p.enabled ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {p.enabled ? t('enabled') : t('disabled')}
                </span>
                <div className="flex gap-2">
                  {isAdmin ? (
                    <>
                      <button onClick={() => { setSelectedProduct(p); setShowHistoryModal(true); }} style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }} title="View History"><History size={16} /></button>
                      <button onClick={() => { setEditingProduct(p); setFormData(p); setShowModal(true); }} style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => toggleStatus(p)} style={{ padding: '8px', borderRadius: '10px', background: p.enabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: p.enabled ? '#ef4444' : '#10b981' }}><Power size={16} /></button>
                      <button onClick={() => deleteProduct(p.id)} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <button style={{ padding: '8px', borderRadius: '10px', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}><Eye size={16} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>
            {t('no_products_found')}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingProduct ? t('edit_product') : t('add_new_product')}</h3>
              <button onClick={() => { setShowModal(false); setEditingProduct(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="grid gap-6">
              <div>
                <label className="text-sm block mb-2 font-medium">{t('product_name')}</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g. Cow Milk"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block mb-2 font-medium">{t('category')}</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option value="Dairy">{t('dairy')}</option>
                    <option value="Juice">{t('juice')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm block mb-2 font-medium">{t('price')} (₹ per {t('liter')})</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                {formData.category === 'Juice' && (
                  <div>
                    <label className="text-sm block mb-2 font-medium">{t('price')} (₹ per {t('glass')})</label>
                    <input 
                      type="number" 
                      value={formData.pricePerGlass}
                      onChange={e => setFormData({...formData, pricePerGlass: e.target.value})}
                      required
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingProduct(null); }} className="btn-secondary" style={{ padding: '10px 20px' }}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>{editingProduct ? t('update_product') : t('create_product')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="card delete-confirm-card" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }} className="flex items-center gap-2">
                <AlertCircle size={24} /> {t('confirm_deletion')}
              </h3>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            <p className="text-sm font-medium mb-6 text-muted-foreground">{deleteConfirm.message}</p>
            <div className="modal-btn-row">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button
                onClick={handleConfirmDelete}
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

      {/* History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('product_history')}</h3>
                <p className="text-sm text-muted">{selectedProduct.name}</p>
              </div>
              <button onClick={() => { setShowHistoryModal(false); setSelectedProduct(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={24} /></button>
            </div>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '8px' }}>
              {selectedProduct.history && selectedProduct.history.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {selectedProduct.history.slice().reverse().map((log, index) => (
                    <div key={index} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.action}</span>
                        <span className="text-xs text-muted">{format(new Date(log.date), 'MMM dd, yyyy HH:mm', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{log.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>
                  No history available for this product.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Products.responsiveStyles = `
  /* Table responsive handling is now in index.css */
  .prod-table-wrap { display: none; }
  .prod-card-list { display: flex; flex-direction: column; gap: 12px; }

  @media (min-width: 768px) {
    .prod-table-wrap { display: block; }
    .prod-card-list { display: none; }
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
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'products-responsive-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = Products.responsiveStyles;
    document.head.appendChild(style);
  }
}

export default Products;
