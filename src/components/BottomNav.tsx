import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export function BottomNav() {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ to, label, Icon, primary, end }) =>
          primary ? (
            <NavLink key={to} to={to} className="relative flex flex-1 flex-col items-center justify-center">
              <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white shadow-lg shadow-green-700/30 ring-4 ring-slate-100">
                <Icon className="h-7 w-7" />
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-green-800">{label}</span>
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-green-700' : 'text-slate-400'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
