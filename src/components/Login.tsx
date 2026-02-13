import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { Briefcase, ArrowLeft, Globe } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      showNotification('success', t('auth.signedInSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(t('auth.invalidCredentials'));
      showNotification('error', t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);

    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      showNotification('success', t('auth.resetEmailSent'));
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      setError(err.message || t('auth.resetEmailFailed'));
      showNotification('error', t('auth.resetEmailFailed'));
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
          <button
            onClick={() => setShowForgotPassword(false)}
            className={`flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{t('auth.backToSignIn')}</span>
          </button>

          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-900 p-3 rounded-lg">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            {t('auth.resetPassword')}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {t('auth.resetPasswordDesc')}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.emailAddress')}
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetLoading ? t('common.sending') : t('auth.sendResetLink')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-8">
          <div />
          <div className="bg-blue-900 p-3 rounded-lg">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-900 transition-colors"
            title={isRTL ? 'Switch to English' : 'التبديل للعربية'}
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm">{isRTL ? 'EN' : 'ع'}</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {t('auth.employeeManagementSystem')}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {t('auth.signInToContinue')}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.emailAddress')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-900 hover:text-blue-700 transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700 font-medium mb-2">{t('auth.demoAccounts')}</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>{t('auth.demoAdmin')}</p>
            <p>{t('auth.demoHR')}</p>
            <p>{t('auth.demoEmployee')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
