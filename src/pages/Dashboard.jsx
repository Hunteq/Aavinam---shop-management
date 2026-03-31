import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { isToday, format } from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import {
  TrendingUp,
  Droplets,
  Beer,
  Scale,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Package,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user, t, language } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [products, setProducts] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setProducts(storage.get('dsms_products'));
    setStockLogs(storage.get('dsms_stock_logs'));
    setCashEntries(storage.get('dsms_cash_entries') || []);
    setActivities(storage.get('dsms_activity_logs') || []);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const todaysLogs = stockLogs.filter(log => isToday(new Date(log.timestamp))).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate current levels and sales
    const levels = {};
    const productSales = {};
    products.forEach(p => {
      levels[p.id] = 0;
      productSales[p.id] = { sold: 0, revenue: 0, name: p.name, category: p.category };
    });

    todaysLogs.forEach(log => {
      if (log.type === 'OPENING') levels[log.productId] = log.amount;
      else if (log.type === 'FRESH') levels[log.productId] += log.amount;
      else if (log.type === 'CHECKPOINT' || log.type === 'CHECK') {
        const sold = levels[log.productId] - log.amount;
        if (sold > 0) {
          productSales[log.productId].sold += sold;
          productSales[log.productId].revenue += sold * (products.find(p => p.id === log.productId)?.price || 0);
        }
        levels[log.productId] = log.amount;
      }
      else if (log.type === 'SALE') {
        productSales[log.productId].sold += log.amount;
        productSales[log.productId].revenue += log.amount * (products.find(p => p.id === log.productId)?.price || 0);
        levels[log.productId] -= log.amount;
      }
      else if (log.type === 'ADJUST') levels[log.productId] += log.amount;
    });

    const totalSales = Object.values(productSales).reduce((acc, curr) => acc + curr.revenue, 0);
    const totalLiters = Object.values(productSales).reduce((acc, curr) => acc + curr.sold, 0);
    const dairyLiters = Object.values(productSales).filter(p => p.category === 'Dairy').reduce((acc, curr) => acc + curr.sold, 0);
    const juiceLiters = Object.values(productSales).filter(p => p.category === 'Juice').reduce((acc, curr) => acc + curr.sold, 0);

    // Alerts
    const lowStock = products.filter(p => {
      const pLogs = stockLogs.filter(l => isToday(new Date(l.timestamp)) && l.productId === p.id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      let current = 0;
      pLogs.forEach(l => {
        if (l.type === 'OPENING') current = l.amount;
        else if (l.type === 'FRESH' || l.type === 'CHECKPOINT' || l.type === 'CHECK') {
          if (l.isFresh) current += l.amount;
          else current = l.amount;
        } else if (l.type === 'SALE') current -= l.amount;
        else if (l.type === 'ADJUST') current += l.amount;
      });
      return p.enabled && current < 10;
    });

    const lastCashAudit = cashEntries.length > 0 ? cashEntries[cashEntries.length - 1] : null;

    return {
      totalSales,
      totalLiters,
      dairyLiters,
      juiceLiters,
      lowStock,
      lastCashAudit,
      topProducts: Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 3)
    };
  }, [products, stockLogs, cashEntries]);

  const StatCard = ({ title, value, subValue, icon: Icon, color, isCurrency }) => (
    <div className="card stat-card-hover" style={{ border: '1px solid var(--border)', borderLeft: `5px solid ${color}` }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">{title}</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--foreground)' }}>
            {isCurrency ? `₹${value.toLocaleString()}` : value}
          </h3>
          {subValue && <p className="text-xs text-muted mt-1 font-medium">{subValue}</p>}
        </div>
        <div style={{ background: `${color}15`, padding: '12px', borderRadius: '14px', color: color }}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('welcome_back')}, {user?.username}</h2>
          <p className="text-sm text-muted">{t('system_status_msg')}</p>
        </div>
        <div className="clock-wrapper">
          <div className="digital-clock-card">
             <div className="clock-time">
              <span className="time-main">{format(currentTime, 'hh:mm:ss')}</span>
              <span className="time-ampm">{format(currentTime, 'a', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</span>
            </div>
            <div className="clock-date">
              <span className="date-day">{format(currentTime, 'EEEE', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</span>
              <span className="date-full">{format(currentTime, 'MMM dd, yyyy', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md-grid-2 lg-grid-4 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard title={t('today_revenue')} value={stats.totalSales} isCurrency icon={IndianRupee} color="#3b82f6" subValue={t('expected_from_sales')} />
        <StatCard title={t('dairy_sales')} value={stats.dairyLiters} subValue={t('liters_today')} icon={Droplets} color="#2563eb" />
        <StatCard title={t('juice_sales')} value={stats.juiceLiters} subValue={t('liters_today')} icon={Beer} color="#f59e0b" />
        {isAdmin && (
          <>
            <StatCard
              title={t('cash_difference')}
              value={stats.lastCashAudit ? stats.lastCashAudit.difference : 0}
              isCurrency
              icon={AlertTriangle}
              color={stats.lastCashAudit?.difference === 0 ? '#10b981' : stats.lastCashAudit?.difference < 0 ? '#ef4444' : '#f59e0b'}
              subValue={stats.lastCashAudit ? (stats.lastCashAudit.difference < 0 ? t('shortage') : stats.lastCashAudit.difference > 0 ? t('excess') : t('balanced')) : t('no_audit_yet')}
            />
            <StatCard
              title={t('profit_loss')}
              value={stats.totalSales} // Placeholder, should be totalSales - expenses
              isCurrency
              icon={TrendingUp}
              color="#8b5cf6"
              subValue={t('revenue_selling_price')}
            />
          </>
        )}
      </div>

      <div className="grid lg-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }} className="mb-6">{t('contribution')}</h3>
            <div className="grid gap-6">
              {stats.topProducts.map(p => (
                <div key={p.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.category === 'Dairy' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                    </div>
                    <div className="text-sm font-bold">₹{p.revenue.toLocaleString()}</div>
                  </div>
                  <div style={{ height: '10px', background: 'var(--secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.revenue / (stats.totalSales || 1)) * 100}%`, background: p.category === 'Dairy' ? '#3b82f6' : '#f59e0b', borderRadius: '5px' }}></div>
                  </div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider">{p.sold} {t('liters_sold')}</div>
                </div>
              ))}
              {stats.topProducts.length === 0 && <div className="text-center p-4 text-muted">{t('sales_data_empty')}</div>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Critical Alerts Card */}
          <div className="card" style={{ border: '1px solid #fee2e2', background: 'rgba(239, 68, 68, 0.02)' }}>
            <h3 style={{ fontSize: '1.125rem', color: '#ef4444', fontWeight: 800 }} className="flex items-center gap-2 mb-6">
              <AlertTriangle size={20} /> {t('attention_required')}
            </h3>
            <div className="grid gap-4">
              {stats.lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="text-red-500" size={18} />
                  <div>
                    <div className="text-xs font-bold text-red-700">{t('low_stock')}: {p.name}</div>
                    <div className="text-[10px] text-red-500 font-medium">{t('reorder_immediately')}</div>
                  </div>
                </div>
              ))}
              {isAdmin && stats.lastCashAudit && stats.lastCashAudit.difference !== 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <AlertTriangle className="text-orange-500" size={18} />
                  <div>
                    <div className="text-xs font-bold text-orange-700">{t('audit_discrepancy')}: ₹{Math.abs(stats.lastCashAudit.difference)}</div>
                    <div className="text-[10px] text-orange-500 font-medium">{stats.lastCashAudit.difference < 0 ? t('shortage') : t('excess')} {t('in_last_audit')}</div>
                  </div>
                </div>
              )}
              {stats.lowStock.length === 0 && (!isAdmin || !stats.lastCashAudit || stats.lastCashAudit.difference === 0) && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <div>
                    <div className="text-sm font-bold text-green-700">{t('system_healthy')}</div>
                    <div className="text-xs text-green-600">{t('no_alerts')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .lg-grid { grid-template-columns: 1fr !important; }
        }
        .stat-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
        }
        .digital-clock-card {
          background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 20px;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 220px;
          border: 1px solid rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .clock-time {
          font-family: 'JetBrains Mono', 'Monaco', monospace;
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .time-main {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: 1px;
          line-height: 1;
        }
        .time-ampm {
          font-size: 0.85rem;
          font-weight: 700;
          opacity: 0.9;
        }
        .clock-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .date-day {
          font-weight: 800;
          color: #bfdbfe;
        }
        .date-full {
          font-weight: 600;
        }
        .clock-wrapper {
          display: flex;
          align-items: flex-end;
          width: auto;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        @media (max-width: 1024px) {
          .clock-wrapper {
            width: 100%;
            margin-top: 8px;
          }
          .digital-clock-card {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
          }
          .clock-time {
            margin-bottom: 0;
          }
          .time-main {
            font-size: 1.75rem;
          }
          .clock-date {
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
          }
          .date-day {
            font-size: 0.85rem;
            color: #94a3b8;
          }
          .date-full {
            font-size: 0.7rem;
            color: #64748b;
          }
        }
        
        @media (max-width: 640px) {
          .digital-clock-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
            gap: 16px;
            background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
            border-radius: 20px;
            box-shadow: 0 15px 25px -5px rgba(37, 99, 235, 0.4);
          }
          .clock-time {
            gap: 8px;
          }
          .time-main {
            font-size: 2.25rem;
            font-weight: 900;
            letter-spacing: 2px;
          }
          .time-ampm {
            font-size: 1rem;
          }
          .clock-date {
            flex-direction: row;
            align-items: center;
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 16px;
          }
          .date-day {
            font-size: 1rem;
            color: #fff;
          }
          .date-full {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
