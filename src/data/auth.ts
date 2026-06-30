import type { UserProfile } from '../domain/types';

const USERS_KEY = 'thumua365:users';
const SESSION_KEY = 'thumua365:session';

interface StoredUser extends UserProfile {
  readonly passwordHash: string;
}

const hash = (password: string): string => btoa(unescape(encodeURIComponent(password)));

export const loadUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as StoredUser[];
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getSessionUserId = (): string | null => localStorage.getItem(SESSION_KEY);

export const setSession = (userId: string | null): void => {
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  const id = getSessionUserId();
  if (!id) return null;
  const user = loadUsers().find((u) => u.id === id);
  if (!user) return null;
  const { passwordHash: _, ...profile } = user;
  return profile;
};

export const registerUser = (input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): UserProfile => {
  const email = input.email.trim().toLowerCase();
  const users = loadUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error('Email đã được đăng ký');
  }
  const user: StoredUser = {
    id: `user-${Date.now().toString(36)}`,
    email,
    name: input.name.trim(),
    phone: input.phone?.trim(),
    passwordHash: hash(input.password),
  };
  saveUsers([...users, user]);
  setSession(user.id);
  const { passwordHash: _, ...profile } = user;
  return profile;
};

export const loginUser = (email: string, password: string): UserProfile => {
  const user = loadUsers().find(
    (u) => u.email === email.trim().toLowerCase() && u.passwordHash === hash(password),
  );
  if (!user) throw new Error('Email hoặc mật khẩu không đúng');
  setSession(user.id);
  const { passwordHash: _, ...profile } = user;
  return profile;
};

export const logoutUser = (): void => setSession(null);

export const updateProfile = (patch: Partial<UserProfile>): UserProfile => {
  const id = getSessionUserId();
  if (!id) throw new Error('Chưa đăng nhập');
  const users = loadUsers().map((u) =>
    u.id === id ? { ...u, ...patch, id: u.id, email: u.email } : u,
  );
  saveUsers(users);
  const user = users.find((u) => u.id === id)!;
  const { passwordHash: _, ...profile } = user;
  return profile;
};

export const changePassword = (current: string, next: string): void => {
  const id = getSessionUserId();
  if (!id) throw new Error('Chưa đăng nhập');
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0 || users[idx].passwordHash !== hash(current)) {
    throw new Error('Mật khẩu hiện tại không đúng');
  }
  const updated = [...users];
  updated[idx] = { ...updated[idx], passwordHash: hash(next) };
  saveUsers(updated);
};

export const resetPassword = (email: string, newPassword: string): void => {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email.trim().toLowerCase());
  if (idx < 0) throw new Error('Không tìm thấy tài khoản với email này');
  const updated = [...users];
  updated[idx] = { ...updated[idx], passwordHash: hash(newPassword) };
  saveUsers(updated);
};

export const ensureDemoUser = (): void => {
  const users = loadUsers();
  if (users.some((u) => u.email === 'demo@thumua365.vn')) return;
  const user: StoredUser = {
    id: 'user-demo',
    email: 'demo@thumua365.vn',
    name: 'Chủ vựa Demo',
    phone: '0900 000 000',
    passwordHash: hash('demo123'),
  };
  saveUsers([...users, user]);
};

export const dataKeyForUser = (userId: string): string => `thumua365:data:v2:${userId}`;
