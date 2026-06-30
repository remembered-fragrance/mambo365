import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { SidebarNav } from './SidebarNav';

export function Layout() {
  return (
    <div className="flex min-h-full bg-slate-100">
      <SidebarNav />
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-28 lg:px-8 lg:py-6 lg:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
