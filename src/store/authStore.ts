import { create } from 'zustand';
import { User } from '../types';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  users: User[];
  isFirstLogin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  createAdmin: (password: string, recoveryQuestion: string, recoveryAnswer: string) => void;
  createCashier: (username: string, password: string) => void;
  updateCashierPassword: (username: string, newPassword: string) => void;
  changePassword: (username: string, oldPassword: string, newPassword: string) => Promise<void>;
  deleteCashier: (username: string) => void;
  resetPassword: (username: string, recoveryAnswer: string, newPassword: string) => Promise<void>;
  checkRecoveryAnswer: (username: string, answer: string) => Promise<boolean>;
  getRecoveryQuestion: (username: string) => string | null;
  completeOnboarding: () => void;
  getCashiers: () => User[];
}

// Initial users data - empty by default for first-time setup
const initialUsers: User[] = [];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: initialUsers,
      isFirstLogin: true,
      login: async (username: string, password: string) => {
        const user = get().users.find(u => u.username === username && u.password === password);
        if (!user) throw new Error('Invalid credentials');
        set({ user });
      },
      logout: () => set({ user: null }),
      createAdmin: (password: string, recoveryQuestion: string, recoveryAnswer: string) => {
        const newAdmin = {
          username: '@admin',
          password,
          role: 'admin' as const,
          recoveryQuestion,
          recoveryAnswer,
        };
        set(state => ({ 
          users: [...state.users, newAdmin],
          isFirstLogin: false
        }));
      },
      createCashier: (username: string, password: string) => {
        const formattedUsername = username.startsWith('@cashier') ? username : `@cashier${username}`;
        const newCashier = {
          username: formattedUsername,
          password,
          role: 'cashier' as const,
        };
        set(state => ({ users: [...state.users, newCashier] }));
      },
      updateCashierPassword: (username: string, newPassword: string) => {
        set(state => ({
          users: state.users.map(user => 
            user.username === username ? { ...user, password: newPassword } : user
          )
        }));
      },
      changePassword: async (username: string, oldPassword: string, newPassword: string) => {
        const user = get().users.find(u => u.username === username);
        if (!user) throw new Error('User not found');
        if (user.password !== oldPassword) throw new Error('Current password is incorrect');
        
        set(state => ({
          users: state.users.map(u => 
            u.username === username ? { ...u, password: newPassword } : u
          )
        }));
      },
      deleteCashier: (username: string) => {
        // Only allow deleting cashier accounts, not admin
        if (!username.includes('@cashier')) {
          throw new Error('Cannot delete non-cashier accounts');
        }
        
        set(state => ({
          users: state.users.filter(user => user.username !== username)
        }));
      },
      resetPassword: async (username: string, recoveryAnswer: string, newPassword: string) => {
        const user = get().users.find(u => u.username === username);
        if (!user) throw new Error('User not found');
        if (user.recoveryAnswer !== recoveryAnswer) throw new Error('Incorrect recovery answer');
        
        set(state => ({
          users: state.users.map(u => 
            u.username === username ? { ...u, password: newPassword } : u
          )
        }));
      },
      checkRecoveryAnswer: async (username: string, answer: string) => {
        const user = get().users.find(u => u.username === username);
        return user?.recoveryAnswer === answer;
      },
      getRecoveryQuestion: (username: string) => {
        const user = get().users.find(u => u.username === username);
        return user?.recoveryQuestion || null;
      },
      completeOnboarding: () => {
        set({ isFirstLogin: false });
      },
      getCashiers: () => {
        return get().users.filter(user => user.username.includes('@cashier'));
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);