import { NavLink } from 'react-router-dom';
import { AppLogo } from './CropIcon';
import { NAV_ITEMS } from './navItems';
import { PlusIcon } from './icons';

export function SidebarNav() {
  return (
    <aside className="no-print hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <AppLogo className="h-9" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.filter((i) => !i.primary).map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/new"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-700 px-3 py-3 text-sm font-semibold text-white shadow-md shadow-green-700/20 transition hover:bg-green-800"
        >
          <PlusIcon className="h-5 w-5" />
          Tạo phiếu thu mua
        </NavLink>
      </nav>
      <div className="border-t border-slate-100 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `block rounded-xl px-3 py-2.5 text-sm font-medium ${
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`
          }
        >
          Tài khoản
        </NavLink>
      </div>
    </aside>
  );
}
