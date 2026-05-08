import React, { useState } from 'react';
import { AlertCircle, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function LoginScreen() {
  const { login } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!userName.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        userName: userName.trim(),
        password,
      });
    } catch (loginError) {
      setError(loginError?.message || 'Sai tài khoản hoặc mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 font-sans text-slate-800">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-blue-600 px-8 py-7 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <LockKeyhole size={26} />
          </div>
          <h1 className="text-2xl font-bold">Phần mềm tính giá in Đức Thành</h1>
          <p className="mt-2 text-sm text-blue-100">Đăng nhập để sử dụng hệ thống tính giá và quản lý báo giá.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-8">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                placeholder="Nhập email đăng nhập"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-semibold text-slate-700">Mật khẩu</label>
            <div className="relative">
              <LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={17} className="animate-spin" />}
            <span>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
