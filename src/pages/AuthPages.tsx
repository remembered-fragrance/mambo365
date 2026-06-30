import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthProvider';
import { AppLogo } from '../components/CropIcon';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';
  const [email, setEmail] = useState('demo@thumua365.vn');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  return (
    <AuthShell title="Đăng nhập" subtitle="Mỗi thương lái có dữ liệu riêng">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Mật khẩu">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
        </Field>
        <button type="submit" className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white">
          Đăng nhập
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to="/forgot-password" className="text-green-700">Quên mật khẩu?</Link>
        {' · '}
        <Link to="/register" className="text-green-700">Đăng ký</Link>
      </p>
      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        Demo: demo@thumua365.vn / demo123
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      register({ name, email, password, phone: phone || undefined });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    }
  };

  return (
    <AuthShell title="Đăng ký tài khoản" subtitle="Tạo tài khoản thương lái mới">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <Field label="Họ tên">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Số điện thoại">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Mật khẩu">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required minLength={6} />
        </Field>
        <button type="submit" className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white">
          Đăng ký
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Đã có tài khoản? <Link to="/login" className="text-green-700">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      resetPassword(email, password);
      setMsg('Đã đặt lại mật khẩu. Bạn có thể đăng nhập.');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu');
      setMsg('');
    }
  };

  return (
    <AuthShell title="Quên mật khẩu" subtitle="MVP: đặt mật khẩu mới trực tiếp (chưa gửi email)">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <Field label="Email đã đăng ký">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Mật khẩu mới">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required minLength={6} />
        </Field>
        <button type="submit" className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white">
          Đặt lại mật khẩu
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-green-700">← Về đăng nhập</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg lg:p-8">
        <div className="mb-6 flex justify-center">
          <AppLogo className="h-12" />
        </div>
        <h1 className="text-center text-xl font-bold text-slate-900">{title}</h1>
        <p className="mb-6 text-center text-sm text-slate-500">{subtitle}</p>
        {children}
      </div>
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
