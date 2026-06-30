import type { ComponentType } from 'react';
import { BoxIcon, HistoryIcon, HomeIcon, PlusIcon, QueueIcon, ToolIcon, UsersIcon, WalletIcon } from './icons';

interface IconProps {
  className?: string;
}

export interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly Icon: ComponentType<IconProps>;
  readonly end?: boolean;
  readonly primary?: boolean;
  readonly mobile?: boolean;
  readonly badge?: 'drafts';
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tổng quan', Icon: HomeIcon, end: true, mobile: true },
  { to: '/history', label: 'Lịch sử', Icon: HistoryIcon, mobile: true },
  { to: '/new', label: 'Tạo phiếu', Icon: PlusIcon, primary: true, mobile: true },
  { to: '/drafts', label: 'Phiếu nháp', Icon: QueueIcon, mobile: true, badge: 'drafts' },
  { to: '/debts', label: 'Công nợ', Icon: WalletIcon },
  { to: '/suppliers', label: 'Người bán', Icon: UsersIcon },
  { to: '/products', label: 'Mặt hàng', Icon: BoxIcon },
  { to: '/utilities', label: 'Tiện ích', Icon: ToolIcon, mobile: true },
];
