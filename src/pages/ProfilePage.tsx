import { useState } from 'react';
import { useAuth } from '../data/AuthProvider';
import { useStore } from '../data/useStore';
import type { WeightUnit } from '../domain/types';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100';

export function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { data, updateSettings } = useStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [businessName, setBusinessName] = useState(user?.businessName ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const saveProfile = () => {
    try {
      updateProfile({ name, phone, businessName });
      setMsg('Đã lưu thông tin cá nhân');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu');
    }
  };

  const savePassword = () => {
    try {
      changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setMsg('Đã đổi mật khẩu');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đổi mật khẩu');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Tài khoản</h1>

      {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Thông tin cá nhân</h2>
        <div className="space-y-3">
          <Field label="Email">
            <input value={user.email} disabled className={`${inputCls} bg-slate-50 text-slate-500`} />
          </Field>
          <Field label="Họ tên">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Số điện thoại">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tên vựa / hộ kinh doanh">
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
          </Field>
          <button onClick={saveProfile} className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white">
            Lưu thông tin
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Cài đặt nhập liệu</h2>
        <p className="mb-2 text-sm text-slate-500">Đơn vị khối lượng mặc định khi tạo phiếu</p>
        <div className="grid grid-cols-2 gap-2">
          {(['kg', 'hg'] as WeightUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => updateSettings({ defaultWeightUnit: u })}
              className={`rounded-xl border-2 py-2.5 text-sm font-medium ${
                data.settings.defaultWeightUnit === u
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              {u === 'kg' ? 'Kilogram (kg)' : 'Hectogram (hg)'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">302 hg = 30.2 kg — hệ thống luôn lưu thống nhất theo kg.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Đổi mật khẩu</h2>
        <div className="space-y-3">
          <Field label="Mật khẩu hiện tại">
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Mật khẩu mới">
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} />
          </Field>
          <button onClick={savePassword} className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white">
            Đổi mật khẩu
          </button>
        </div>
      </section>

      <button
        onClick={logout}
        className="w-full rounded-xl border border-rose-200 py-3 text-sm font-semibold text-rose-600"
      >
        Đăng xuất
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
