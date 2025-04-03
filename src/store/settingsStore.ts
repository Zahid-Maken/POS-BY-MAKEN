import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '../types';

interface SettingsState {
  settings: Settings;
  updateTaxRate: (rate: number) => void;
  updateUniversalDiscount: (discount: number) => void;
  getTaxRate: () => number;
  getUniversalDiscount: () => number;
}

// Default settings
const defaultSettings: Settings = {
  taxRate: 10, // 10% default tax rate
  universalDiscount: 0, // 0% default universal discount
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateTaxRate: (rate: number) => {
        if (rate < 0 || rate > 100) {
          console.error('Tax rate must be between 0 and 100');
          return;
        }
        
        set((state) => ({
          settings: { ...state.settings, taxRate: rate }
        }));
      },

      updateUniversalDiscount: (discount: number) => {
        if (discount < 0 || discount > 100) {
          console.error('Discount must be between 0 and 100');
          return;
        }
        
        set((state) => ({
          settings: { ...state.settings, universalDiscount: discount }
        }));
      },

      getTaxRate: () => {
        return get().settings.taxRate;
      },

      getUniversalDiscount: () => {
        return get().settings.universalDiscount;
      },
    }),
    {
      name: 'settings-storage',
    }
  )
); 