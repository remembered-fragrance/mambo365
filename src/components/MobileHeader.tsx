import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../data/AuthProvider';
import { AppLogo } from './CropIcon';
import { UserIcon } from './icons';

export function MobileHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const isProfile = location.pathname === '/profile';
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link to="/" className="shrink-0" aria-label="Trang chủ">
        <AppLogo className="h-8" />
      </Link>
      <Link
        to="/profile"
        className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium transition ${
          isProfile ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
        }`}
        aria-label="Tài khoản"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
          {initial}
        </span>
        <span className="hidden min-[380px]:inline">Tài khoản</span>
        <UserIcon className="h-4 w-4 min-[380px]:hidden" />
      </Link>
    </header>
  );
}
