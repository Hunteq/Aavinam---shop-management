import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  isWithinInterval, 
  subDays, 
  startOfWeek, 
  startOfMonth,
  isSameDay
} from 'date-fns';
import { ta, hi, enUS } from 'date-fns/locale';
import { 
  FileText, 
  Download, 
  Filter, 
  PieChart as PieIcon, 
  BarChart as BarIcon,
  Calendar,
  Printer,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Share2,
  Phone,
  MessageSquare,
  X,
  FileDown
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as ChartTooltip 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const generateReportPDF = (reportData, dateRange, language) => {
  const doc = new jsPDF();
  
  // Add Header
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text('Dairy & Juice Shop Analytics', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  // Use a standard format that doesn't include non-Latin characters to prevent PDF corruption
  const timestamp = format(new Date(), 'dd-MMM-yyyy, hh:mm:ss a');
  doc.text(`Generated on: ${timestamp}`, 14, 30);
  doc.text(`Period: ${dateRange}`, 14, 35);
  
  // Summary Box
  doc.setDrawColor(200);
  doc.setFillColor(245, 248, 255);
  doc.rect(14, 45, 182, 35, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Revenue: INR ${reportData.financials.revenue.toLocaleString()}`, 20, 65);
  doc.text(`Total Expenses: INR ${reportData.financials.expenses.toLocaleString()}`, 20, 72);
  doc.text(`Net Profit: INR ${reportData.financials.profit.toLocaleString()}`, 110, 65);
  
  // Product Table
  const tableData = reportData.products.map(p => [
    p.name,
    p.category,
    `${p.sold} L`,
    `INR ${p.revenue.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Product', 'Category', 'Quantity Sold', 'Revenue']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { top: 90 }
  });

  return doc;
};

const ShareModal = ({ isOpen, onClose, reportData, dateRange, customRange, displayDateRange }) => {
  const { t, language } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!isOpen) return null;

  const getAdminMobile = () => {
    const users = storage.get('dsms_users') || [];
    const admin = users.find(u => u.role === 'ADMIN');
    return admin?.mobile || '';
  };

  const handleShare = (type) => {
    const targetMobile = mobileNumber || getAdminMobile();
    if (!targetMobile) {
      alert('Please enter a mobile number or ensure admin mobile is set in profile.');
      return;
    }

    setIsGenerating(true);
    
    // For web, we can't truly "attach" a PDF to WhatsApp/SMS link
    // But we can generate it, download it, and provide a link to the shop or a message
    const reportText = `*Dairy Shop Report (${displayDateRange})*%0A%0A` +
      `Total Revenue: ₹${reportData.financials.revenue.toLocaleString()}%0A` +
      `Total Expenses: ₹${reportData.financials.expenses.toLocaleString()}%0A` +
      `*Net Profit: ₹${reportData.financials.profit.toLocaleString()}*%0A%0A` +
      `Top Product: ${reportData.products[0]?.name || 'N/A'}%0A%0A` +
      `_Sent via Dairy Shop Management System_`;

    if (type === 'whatsapp') {
      window.open(`https://wa.me/91${targetMobile}?text=${reportText}`, '_blank');
    } else {
      window.open(`sms:+91${targetMobile}?body=${reportText.replace(/\*/g, '').replace(/%0A/g, '\n')}`, '_blank');
    }
    
    // Also trigger the PDF download since we can't send it via URL
    const doc = generateReportPDF(reportData, dateRange === 'Custom Range' ? `${customRange.start} to ${customRange.end}` : dateRange, language);
    doc.save(`DairyReport_${format(new Date(), 'yyyyMMdd')}.pdf`);
    
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: '95%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div className="flex justify-between items-center mb-6">
             <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('share_report')}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-secondary/30 p-3 rounded-xl border border-border/40">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1.5">{t('period_summary')}</div>
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-xl font-black text-primary">₹{reportData.financials.revenue.toLocaleString()}</div>
                        <div className="text-[10px] font-medium text-muted">{t('total_sales')} ({displayDateRange})</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-green-600">{t('profit')}: ₹{reportData.financials.profit.toLocaleString()}</div>
                        <div className="text-[10px] text-muted">{reportData.products.length} {t('products_sold')}</div>
                    </div>
                </div>
            </div>

            <div className="share-field-container">
              <label className="share-field-label">{t('mobile_number_admin')}</label>
              <div className="share-input-relative">
                <div className="share-input-icon">
                    <Phone />
                </div>
                <input 
                  type="tel" 
                  placeholder={getAdminMobile() ? `${t('admin_placeholder')} : ${getAdminMobile()}` : t('enter_10_digit')}
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  className="share-tel-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleShare('whatsapp')}
                disabled={isGenerating}
                className="share-option-card group whatsapp"
              >
                <div className="icon-badge">
                    <MessageSquare size={20} />
                </div>
                <div className="share-info">
                  <span className="share-label">WhatsApp</span>
                  <span className="share-desc">{t('message')}</span>
                </div>
              </button>

              <button 
                onClick={() => handleShare('sms')}
                disabled={isGenerating}
                className="share-option-card group sms"
              >
                <div className="icon-badge">
                    <Phone size={20} />
                </div>
                <div className="share-info">
                  <span className="share-label">SMS</span>
                  <span className="share-desc">{t('standard')}</span>
                </div>
              </button>
            </div>

            <button 
                onClick={() => {
                    const pdfDateRange = dateRange === 'Custom Range' ? `${customRange.start} to ${customRange.end}` : dateRange;
                    const doc = generateReportPDF(reportData, pdfDateRange, language);
                    doc.save(`DairyReport_${format(new Date(), 'yyyyMMdd')}.pdf`);
                }}
                className="pdf-download-btn"
            >
                <FileDown size={18} />
                <span>{t('download_analysis_pdf')}</span>
            </button>
          </div>

          <p className="text-[9px] text-center text-muted mt-6 uppercase tracking-[0.2em] font-medium">{t('secure_analytics_sharing')} • DSMS Premium</p>
      </div>
    </div>
  );
};

const Reports = () => {
  const { user, t, language } = useAuth();
  const [dateRange, setDateRange] = useState('Today');
  const [customRange, setCustomRange] = useState({ 
    start: format(new Date(), 'yyyy-MM-dd', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS }), 
    end: format(new Date(), 'yyyy-MM-dd', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS }) 
  });
  
  const [products, setProducts] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const displayDateRange = (() => {
    switch(dateRange) {
      case 'Today': return t('today') || 'Today';
      case 'Yesterday': return t('yesterday') || 'Yesterday';
      case 'Last 7 Days': return t('last_7_days') || 'Last 7 Days';
      case 'This Month': return t('this_month') || 'This Month';
      case 'Custom Range': return t('custom_range') || 'Custom Range';
      default: return dateRange;
    }
  })();

  useEffect(() => {
    setProducts(storage.get('dsms_products'));
    setStockLogs(storage.get('dsms_stock_logs'));
    setExpenses(storage.get('dsms_expenses') || []);
  }, []);

  const reportData = useMemo(() => {
    let start, end;
    const now = new Date();

    if (dateRange === 'Today') {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (dateRange === 'Yesterday') {
      const yesterday = subDays(now, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
    } else if (dateRange === 'Last 7 Days') {
      start = startOfDay(subDays(now, 6));
      end = endOfDay(now);
    } else if (dateRange === 'This Month') {
      start = startOfMonth(now);
      end = endOfDay(now);
    } else {
      start = startOfDay(new Date(customRange.start));
      end = endOfDay(new Date(customRange.end));
    }

    const filteredLogs = stockLogs.filter(log => 
      isWithinInterval(new Date(log.timestamp), { start, end })
    ).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

    const filteredExpenses = expenses.filter(ex => 
      isWithinInterval(new Date(ex.timestamp), { start, end })
    );

    const stats = {};
    products.forEach(p => {
      stats[p.id] = { name: p.name, category: p.category, sold: 0, revenue: 0, price: p.price };
    });

    // Track levels per day within the interval to calculate sales
    // For simplicity in reports covering multiple days, we'll aggregate daily sales
    // We need to group logs by day
    const logsByDay = {};
    filteredLogs.forEach(log => {
      const day = format(new Date(log.timestamp), 'yyyy-MM-dd', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS });
      if (!logsByDay[day]) logsByDay[day] = [];
      logsByDay[day].push(log);
    });

    Object.keys(logsByDay).forEach(day => {
      const dayLogs = logsByDay[day];
      const levels = {};
      
      dayLogs.forEach(log => {
        if (!levels[log.productId]) levels[log.productId] = 0;
        
        if (log.type === 'OPENING') {
          levels[log.productId] += log.amount;
        } else if (log.type === 'FRESH') {
          levels[log.productId] += log.amount;
        } else if (log.type === 'CHECKPOINT' || log.type === 'CHECK') {
          const sold = levels[log.productId] - log.amount;
          if (sold > 0) {
            stats[log.productId].sold += sold;
            stats[log.productId].revenue += sold * stats[log.productId].price;
          }
          levels[log.productId] = log.amount;
        } else if (log.type === 'SALE') {
          stats[log.productId].sold += log.amount;
          stats[log.productId].revenue += log.amount * stats[log.productId].price;
          levels[log.productId] -= log.amount;
        } else if (log.type === 'ADJUST') {
          levels[log.productId] += log.amount;
        }
      });
    });

    const productResults = Object.values(stats).filter(s => s.sold > 0 || s.revenue > 0);
    const totalRevenue = productResults.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const dairyRevenue = productResults.filter(p => p.category === 'Dairy').reduce((acc, curr) => acc + curr.revenue, 0);
    const juiceRevenue = productResults.filter(p => p.category === 'Juice').reduce((acc, curr) => acc + curr.revenue, 0);

    const categories = [
      { name: 'Dairy', value: dairyRevenue, color: '#3b82f6' },
      { name: 'Juice', value: juiceRevenue, color: '#f59e0b' }
    ].filter(c => c.value > 0);

    return {
      products: productResults,
      categories,
      financials: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalRevenue - totalExpenses
      }
    };
  }, [dateRange, customRange, products, stockLogs, expenses]);

  const exportToCSV = () => {
    const headers = ['Product', 'Category', 'Liters Sold', 'Revenue (INR)'];
    const rows = reportData.products.map(p => [p.name, p.category, p.sold, p.revenue]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${dateRange.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd', { locale: language === 'Tamil' ? ta : language === 'Hindi' ? hi : enUS })}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="grid gap-6 print-container">
      <div className="reports-page-header no-print">
        <div className="header-info">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('reports_analytics')}</h2>
          <p className="text-sm text-muted">{t('reports_subtitle')}</p>
        </div>
        <div className="reports-actions">
          <button 
            onClick={() => setIsShareModalOpen(true)} 
            className="report-share-btn animate-in scale-in duration-500"
          >
            <Share2 size={18} />
            <span>{t('share_report')}</span>
          </button>
          
          <button 
            onClick={() => {
              const pdfDateRange = dateRange === 'Custom Range' ? `${customRange.start} to ${customRange.end}` : (dateRange || 'All Time');
              const doc = generateReportPDF(reportData, pdfDateRange, language);
              doc.save(`DairyReport_${format(new Date(), 'yyyyMMdd')}.pdf`);
            }} 
            className="report-pdf-btn"
          >
            <FileDown size={18} />
            <span>{t('download_pdf')}</span>
          </button>
          
          <button onClick={exportToCSV} className="report-csv-btn">
            <Download size={18} />
            <span>{t('export_csv')}</span>
          </button>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        reportData={reportData} 
        dateRange={dateRange}
        customRange={customRange}
        displayDateRange={displayDateRange}
      />

      {/* Filters - Hidden on Print */}
      <div className="reports-filters-card no-print">
        <div className="reports-filters-wrapper">
          <div className="filter-group main-filter">
            <Calendar size={20} className="text-primary" />
            <div className="filter-control">
              <span className="filter-label">{t('time_period')}</span>
              <select 
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="filter-select-main"
              >
                <option value="Today">{t('today')}</option>
                <option value="Yesterday">{t('yesterday')}</option>
                <option value="Last 7 Days">{t('last_7_days')}</option>
                <option value="This Month">{t('this_month')}</option>
                <option value="Custom Range">{t('custom_range')}</option>
              </select>
            </div>
          </div>
          
          {dateRange === 'Custom Range' && (
            <div className="filter-group custom-range animate-in fade-in duration-300">
              <div className="filter-control">
                <span className="filter-label">{t('start_date')}</span>
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={e => setCustomRange({...customRange, start: e.target.value})}
                  className="filter-date-input" 
                />
              </div>
              <div className="range-separator">
                <ChevronRight size={18} className="text-muted" />
              </div>
              <div className="filter-control">
                <span className="filter-label">{t('end_date')}</span>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={e => setCustomRange({...customRange, end: e.target.value})}
                  className="filter-date-input" 
                />
              </div>
            </div>
          )}
          
          <div className="report-info-badge">
            <Info size={16} />
            <span className="info-text">{t('generated_for')} {displayDateRange}</span>
          </div>
        </div>
      </div>

      <div className="grid lg-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        {/* Left Column: Summary and Chart */}
        <div className="flex flex-col gap-6">
          <div className="card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', border: 'none' }}>
            <div className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2">{t('total_period_revenue')}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{reportData.financials.revenue.toLocaleString()}</div>
            <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs opacity-70 mb-1">{t('total_expenses')}</div>
                <div style={{ fontWeight: 700 }}>₹{reportData.financials.expenses.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">{t('net_profit')}</div>
                <div style={{ fontWeight: 700 }}>₹{reportData.financials.profit.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="card no-print">
            <h3 className="mb-6 flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              <PieIcon size={20} className="text-primary" /> {t('category_distribution')}
            </h3>
            <div style={{ height: '300px' }}>
              {reportData.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.categories}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {reportData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted">
                  <PieIcon size={48} className="opacity-10 mb-2" />
                  <p>{t('no_sales_visualize')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Product Performance */}
        <div className="card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              <BarIcon size={20} className="text-primary" /> {t('product_performance')}
            </h3>
            <div className="text-xs text-muted font-bold uppercase tracking-widest">
              {t('liters_sold')} vs {t('revenue')}
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0 16px' }}>{t('product_details')}</th>
                  <th style={{ padding: '0 16px' }}>{t('category')}</th>
                  <th style={{ padding: '0 16px' }}>{t('total_sold')}</th>
                  <th style={{ padding: '0 16px', textAlign: 'right' }}>{t('total_revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.products.length > 0 ? reportData.products.sort((a,b) => b.revenue - a.revenue).map((p, index) => (
                  <tr key={index} className="report-row" style={{ background: 'rgba(59, 130, 246, 0.03)', borderRadius: '16px' }}>
                    <td style={{ padding: '16px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</div>
                      <div className="text-xs text-muted">{t('unit_price')}: ₹{p.price}/L</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                       <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        background: p.category === 'Dairy' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: p.category === 'Dairy' ? '#3b82f6' : '#f59e0b',
                        fontWeight: 700,
                        border: '1px solid currentColor'
                      }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-500" />
                        <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>{p.sold}</span>
                        <span className="text-xs text-muted font-medium">{t('liter')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.125rem', color: '#10b981' }}>₹{p.revenue.toLocaleString()}</div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted-foreground)' }}>
                       <FileText size={48} className="mx-auto opacity-10 mb-4" />
                       <p className="font-medium">{t('no_sales_recorded')}</p>
                       <p className="text-xs">Try selecting a different date range.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        /* Updated Share Modal Responsive Fields */
        .share-field-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .share-field-label {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-size: 9px;
          margin-bottom: 2px;
        }

        .share-input-relative {
          position: relative;
          width: 100%;
        }

        .share-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .share-input-icon svg {
          width: 14px;
          height: 14px;
        }

        .share-tel-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--background);
          font-weight: 700;
          outline: none;
          transition: all 0.2s;
          font-size: 13px;
        }

        .share-tel-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        @media (min-width: 640px) {
          .share-field-label { font-size: 10px; }
          .share-tel-input { 
            padding: 12px 16px 12px 42px; 
            font-size: 14px;
            border-radius: 12px;
          }
          .share-input-icon { left: 14px; }
          .share-input-icon svg { width: 16px; height: 16px; }
        }

        @media (min-width: 1024px) {
          .share-field-label { font-size: 11px; }
          .share-tel-input { padding: 14px 16px 14px 46px; font-size: 15px; }
          .share-input-icon { left: 16px; }
          .share-input-icon svg { width: 18px; height: 18px; }
        }

        .reports-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .reports-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .report-share-btn, .report-pdf-btn, .report-csv-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .report-share-btn {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary);
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        .report-share-btn:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(37, 99, 235, 0.2);
        }

        .report-pdf-btn {
          background: var(--bg-card);
          color: var(--text-main);
          border: 1px solid var(--border);
        }

        .report-pdf-btn:hover {
          background: var(--bg-main);
          border-color: var(--text-muted);
          transform: translateY(-2px);
        }

        .report-csv-btn {
          background: var(--primary);
          color: white;
          border: none;
        }

        .report-csv-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(37, 99, 235, 0.2);
        }

        @media (max-width: 1024px) {
          .reports-page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .reports-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .report-share-btn, .report-pdf-btn, .report-csv-btn {
            flex: 1;
            justify-content: center;
            padding: 12px 14px;
            font-size: 0.8125rem;
          }
        }

        @media (max-width: 640px) {
          .header-info p {
            display: none;
          }
          
          .reports-page-header h2 {
            font-size: 1.25rem !important;
          }

          .reports-actions {
            gap: 8px;
          }

          .report-share-btn, .report-pdf-btn, .report-csv-btn {
            padding: 10px 8px;
            gap: 6px;
          }

          .report-share-btn span, .report-pdf-btn span, .report-csv-btn span {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .report-share-btn span, .report-pdf-btn span, .report-csv-btn span {
            display: block; /* Keep text but maybe wrap */
          }
          
          .reports-actions {
             display: grid;
             grid-template-columns: 1fr 1fr;
             width: 100%;
          }

          .report-share-btn {
            grid-column: span 2;
          }
        }

        /* Share Modal Specifics */
        .share-option-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          border-radius: 16px;
          transition: all 0.3s;
          border: 1px solid var(--border);
        }

        .share-option-card.whatsapp {
          background: #f0fdf4;
          color: #166534;
          border-color: #dcfce7;
        }

        .share-option-card.whatsapp:hover {
          background: #dcfce7;
          transform: translateY(-4px);
        }

        .share-option-card.sms {
          background: #eff6ff;
          color: #1e40af;
          border-color: #dbeafe;
        }

        .share-option-card.sms:hover {
          background: #dbeafe;
          transform: translateY(-4px);
        }

        .icon-badge {
          padding: 8px;
          border-radius: 12px;
          color: white;
          transition: transform 0.3s;
        }

        .whatsapp .icon-badge { background: #25d366; }
        .sms .icon-badge { background: #2563eb; }

        .share-option-card:hover .icon-badge {
          transform: scale(1.1) rotate(5deg);
        }

        .share-info { display: flex; flex-direction: column; text-align: center; }
        .share-label { font-weight: 900; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .share-desc { font-size: 0.75rem; opacity: 0.7; }

        .pdf-download-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          background: var(--bg-main);
          color: var(--text-main);
          border: 2px dashed var(--border);
          font-weight: 800;
          font-size: 0.8125rem;
          transition: all 0.2s;
          margin-top: 4px;
        }

        .pdf-download-btn:hover {
          background: white;
          border-color: var(--primary);
          color: var(--primary);
        }

        @media (max-width: 1024px) {
          .lg-grid { grid-template-columns: 1fr !important; }
        }

        @media print {
          .no-print { display: none !important; }
          .print-container { 
            padding: 0 !important; 
            background: white !important; 
            color: black !important;
          }
          .card { 
            box-shadow: none !important; 
            border: 1px solid #eee !important;
            break-inside: avoid;
          }
          body { background: white !important; }
        }

        .reports-filters-card {
          background: var(--bg-card);
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
        }

        .reports-filters-wrapper {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 24px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-control {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .filter-select-main, .filter-date-input {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--background);
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-main);
          outline: none;
          transition: all 0.2s;
        }

        .filter-select-main:focus, .filter-date-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .custom-range {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 20px;
          border-left: 1.5px solid var(--border);
        }

        .range-separator {
          display: flex;
          align-items: center;
          padding-top: 16px;
        }

        .report-info-badge {
          margin-left: auto;
          background: rgba(37, 99, 235, 0.05);
          color: var(--primary);
          padding: 12px 18px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(37, 99, 235, 0.1);
        }

        .info-text {
          font-size: 0.8125rem;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .reports-filters-wrapper {
            gap: 20px;
          }
          
          .custom-range {
            padding-left: 0;
            border-left: none;
          }

          .report-info-badge {
            margin-left: 0;
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .reports-filters-card {
            padding: 16px;
          }
          
          .reports-filters-wrapper {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-group {
             justify-content: space-between;
          }

          .custom-range {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 8px;
          }

          .range-separator {
            padding-top: 20px;
          }
        }

        @media (max-width: 480px) {
          .filter-group.main-filter {
            background: rgba(var(--primary-rgb), 0.03);
            padding: 12px;
            border-radius: 12px;
          }
          
          .filter-select-main {
            width: 100%;
          }

          .custom-range {
            grid-template-columns: 1fr;
          }

          .range-separator {
            display: none;
          }
        }

        .report-row:hover {
          background: rgba(59, 130, 246, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default Reports;
