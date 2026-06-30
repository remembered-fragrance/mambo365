import type { ComponentType } from 'react';
import { HistoryIcon, HomeIcon, PlusIcon, UsersIcon, WalletIcon } from './icons';

interface IconProps {
  className?: string;
}

export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly Icon: ComponentType<IconProps>;
  readonly end?: boolean;
  readonly primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tổng quan', Icon: HomeIcon, end: true },
  { to: '/history', label: 'Lịch sử', Icon: HistoryIcon },
  { to: '/new', label: 'Tạo phiếu', Icon: PlusIcon, primary: true },
  { to: '/debts', label: 'Công nợ', Icon: WalletIcon },
  { to: '/suppliers', label: 'Người bán', Icon: UsersIcon },
];
