import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Milk, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { user, login, t, language, changeLanguage } = useAuth();
  const navigate = useNavigate();

  const languages = [
    { code: 'English', label: 'English', flag: '🇺🇸' },
    { code: 'Tamil', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'Hindi', label: 'हिन्दी', flag: '🇮🇳' }
  ];

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-vh-100" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '20px' }}>
      
      {/* Language Picker Overlay */}
      <div className="glass flex items-center gap-1 mb-8 p-1 px-2" style={{ borderRadius: '20px' }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center gap-2 px-4 py-2 transition-all duration-300 ${language === lang.code ? 'bg-white shadow-sm' : 'hover:bg-white/40'}`}
            style={{ 
              borderRadius: '16px', 
              fontSize: '0.875rem', 
              fontWeight: language === lang.code ? '600' : '400',
              border: 'none',
              cursor: 'pointer',
              color: language === lang.code ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>

      <div className="card glass shadow-xl" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div className="flex items-center gap-3 justify-center mb-6">
          <img src="/favicon.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' }}>{t('system_login')}</h1>
        </div>

        <p className="text-muted text-center mb-8" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
          {t('login_subtitle')}
        </p>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
            {t(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid" style={{ gap: '20px' }} autoComplete="off">
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#475569' }}>{t('username')}</label>
            <div className="flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-blue-500/20" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', background: 'white' }}>
              <UserIcon size={20} className="text-muted" style={{ opacity: 0.6 }} />
              <input
                type="text"
                placeholder={t('enter_username')}
                autoComplete="off"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#475569' }}>{t('password')}</label>
            <div className="flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-blue-500/20" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', background: 'white', position: 'relative' }}>
              <Lock size={20} className="text-muted" style={{ opacity: 0.6 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('enter_password')}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', paddingRight: '2.5rem', fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary mt-6 hover:scale-[1.02] active:scale-[0.98] transition-all" 
            style={{ padding: '14px', borderRadius: '12px', fontWeight: '600', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {t('login_button')}
          </button>
        </form>

        <div className="mt-8 text-center" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          {t('default')} {t('username')}/{t('password')} : <span className="font-mono font-bold" style={{ color: '#64748b' }}>admin/password</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
