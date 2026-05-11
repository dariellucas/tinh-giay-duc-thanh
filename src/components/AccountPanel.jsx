import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword, createUserAccount } from '../services/authService';

const INITIAL_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const INITIAL_USER_FORM = {
  userName: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  role: 'sales',
  active: true,
};

function AccountPanel({ onClose }) {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [userStatus, setUserStatus] = useState({ type: '', message: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const updatePasswordForm = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordStatus({ type: '', message: '' });
  };

  const updateUserForm = (field, value) => {
    setUserForm((current) => ({ ...current, [field]: value }));
    setUserStatus({ type: '', message: '' });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordStatus({ type: 'error', message: 'Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Mật khẩu mới nhập lại không khớp.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(INITIAL_PASSWORD_FORM);
      setPasswordStatus({ type: 'success', message: 'Đã đổi mật khẩu thành công.' });
    } catch (error) {
      setPasswordStatus({ type: 'error', message: error?.message || 'Không đổi được mật khẩu.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setUserStatus({ type: '', message: '' });

    if (!userForm.userName.trim() || !userForm.displayName.trim() || !userForm.password) {
      setUserStatus({ type: 'error', message: 'Vui lòng nhập email, tên hiển thị và mật khẩu.' });
      return;
    }

    if (userForm.password.length < 8) {
      setUserStatus({ type: 'error', message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      setUserStatus({ type: 'error', message: 'Mật khẩu nhập lại không khớp.' });
      return;
    }

    setIsCreatingUser(true);
    try {
      const createdUser = await createUserAccount({
        userName: userForm.userName.trim(),
        displayName: userForm.displayName.trim(),
        password: userForm.password,
        role: userForm.role,
        active: userForm.active,
      });
      setUserForm(INITIAL_USER_FORM);
      setUserStatus({ type: 'success', message: `Đã tạo tài khoản ${createdUser.userName}.` });
    } catch (error) {
      setUserStatus({ type: 'error', message: error?.message || 'Không tạo được tài khoản.' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const renderStatus = (status) => {
    if (!status.message) return null;
    const isSuccess = status.type === 'success';
    const Icon = isSuccess ? CheckCircle2 : AlertCircle;
    return (
      <p className={`mt-3 flex items-start gap-2 text-sm font-medium ${isSuccess ? 'text-emerald-700' : 'text-red-600'}`}>
        <Icon size={16} className="mt-0.5 shrink-0" />
        <span>{status.message}</span>
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Tài khoản</p>
            <h2 className="text-xl font-bold text-slate-900">{user?.displayName || user?.userName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-5 flex items-center gap-3 text-blue-700">
              <LockKeyhole size={22} />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h3>
                <p className="text-sm text-slate-500">Áp dụng cho tài khoản đang đăng nhập.</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) => updatePasswordForm('currentPassword', event.target.value)}
                placeholder="Mật khẩu hiện tại"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) => updatePasswordForm('newPassword', event.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) => updatePasswordForm('confirmPassword', event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {renderStatus(passwordStatus)}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword && <Loader2 size={16} className="animate-spin" />}
              <span>{isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</span>
            </button>
          </form>

          <form onSubmit={handleCreateUser} className={`rounded-2xl border border-slate-200 p-5 ${isAdmin ? '' : 'opacity-60'}`}>
            <div className="mb-5 flex items-center gap-3 text-blue-700">
              <Mail size={22} />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tạo tài khoản mới</h3>
                <p className="text-sm text-slate-500">Chỉ tài khoản admin được sử dụng.</p>
              </div>
            </div>

            {!isAdmin ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                Tài khoản của bạn không có quyền tạo user mới.
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <input
                    type="text"
                    autoComplete="username"
                    value={userForm.userName}
                    onChange={(event) => updateUserForm('userName', event.target.value)}
                    placeholder="Email đăng nhập"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    value={userForm.displayName}
                    onChange={(event) => updateUserForm('displayName', event.target.value)}
                    placeholder="Tên hiển thị"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={userForm.role}
                      onChange={(event) => updateUserForm('role', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="sales">sales</option>
                      <option value="admin">admin</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={userForm.active}
                        onChange={(event) => updateUserForm('active', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Đang hoạt động
                    </label>
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={userForm.password}
                    onChange={(event) => updateUserForm('password', event.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={userForm.confirmPassword}
                    onChange={(event) => updateUserForm('confirmPassword', event.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {renderStatus(userStatus)}

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingUser && <Loader2 size={16} className="animate-spin" />}
                  <span>{isCreatingUser ? 'Đang tạo...' : 'Tạo tài khoản'}</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AccountPanel;
