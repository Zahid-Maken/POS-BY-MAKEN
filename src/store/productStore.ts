import { create } from 'zustand';
import { Product } from '../types';
import { persist } from 'zustand/middleware';

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  searchTerm: string;
  categoryFilter: string;
  statusFilter: 'all' | 'in-stock' | 'out-of-stock';
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  batchDeleteProducts: (ids: string[]) => void;
  searchProducts: (term: string) => void;
  filterByCategory: (category: string) => void;
  filterByStatus: (status: 'all' | 'in-stock' | 'out-of-stock') => void;
  resetFilters: () => void;
  updateStock: (id: string, newStock: number) => void;
  recordSale: (productId: string, quantity: number) => void;
  resetProductSales: (todayOnly?: boolean) => void;
  applyFilters: (products: Product[]) => Product[];
}

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Initial products data
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Maggi',
    price: 430,
    stock: 43,
    category: 'Meal',
    sold: 1200,
    expiryDate: '11/12/22',
    status: 'in-stock',
    unit: 'pack',
    unitRate: 1
  },
  {
    id: '2',
    name: 'Coca Cola',
    price: 250,
    stock: 120,
    category: 'Beverage',
    sold: 1850,
    expiryDate: '23/05/23',
    status: 'in-stock',
    unit: 'liter',
    unitRate: 1.5
  },
  {
    id: '3',
    name: 'Bread',
    price: 150,
    stock: 30,
    category: 'Bakery',
    sold: 780,
    expiryDate: '05/03/23',
    status: 'in-stock',
    unit: 'item',
    unitRate: 1
  },
];

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      filteredProducts: initialProducts,
      searchTerm: '',
      categoryFilter: '',
      statusFilter: 'all',

      addProduct: (product) => {
        // Add ID if not provided
        const newProduct = product.id ? product : { ...product, id: generateId() };
        
        // Set status based on stock
        if (newProduct.stock <= 0 && newProduct.status !== 'out-of-stock') {
          newProduct.status = 'out-of-stock';
        } else if (newProduct.stock > 0 && newProduct.status !== 'in-stock') {
          newProduct.status = 'in-stock';
        }
        
        set((state) => {
          const updatedProducts = [...state.products, newProduct];
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        });
      },

      updateProduct: (product) =>
        set((state) => {
          const updatedProduct = { ...product };
          
          // Update status based on stock if necessary
          if (updatedProduct.stock <= 0 && updatedProduct.status !== 'out-of-stock') {
            updatedProduct.status = 'out-of-stock';
          } else if (updatedProduct.stock > 0 && updatedProduct.status !== 'in-stock') {
            updatedProduct.status = 'in-stock';
          }
          
          const updatedProducts = state.products.map((p) => 
            p.id === updatedProduct.id ? updatedProduct : p
          );
          
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        }),

      deleteProduct: (id) =>
        set((state) => {
          const updatedProducts = state.products.filter((p) => p.id !== id);
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        }),

      batchDeleteProducts: (ids) =>
        set((state) => {
          const updatedProducts = state.products.filter((p) => !ids.includes(p.id));
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        }),

      searchProducts: (term) =>
        set((state) => {
          const searchTerm = term.toLowerCase();
          return { 
            searchTerm,
            filteredProducts: get().applyFilters(state.products) 
          };
        }),

      filterByCategory: (category) =>
        set((state) => {
          return { 
            categoryFilter: category,
            filteredProducts: get().applyFilters(state.products) 
          };
        }),

      filterByStatus: (status) =>
        set((state) => {
          return { 
            statusFilter: status,
            filteredProducts: get().applyFilters(state.products) 
          };
        }),

      resetFilters: () =>
        set((state) => ({
          searchTerm: '',
          categoryFilter: '',
          statusFilter: 'all',
          filteredProducts: state.products
        })),

      updateStock: (id, newStock) =>
        set((state) => {
          const updatedProducts = state.products.map((p) => {
            if (p.id === id) {
              const updatedProduct = { ...p, stock: newStock };
              
              // Update status based on new stock
              if (newStock <= 0) {
                updatedProduct.status = 'out-of-stock';
              } else {
                updatedProduct.status = 'in-stock';
              }
              
              return updatedProduct;
            }
            return p;
          });
          
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        }),

      recordSale: (productId, quantity) =>
        set((state) => {
          const product = state.products.find(p => p.id === productId);
          if (!product) return state;

          // Only update the sold count, don't modify stock as it's handled separately
          const soldCount = product.sold + quantity;
          
          const updatedProducts = state.products.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                sold: soldCount,
              };
            }
            return p;
          });
          
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        }),

      resetProductSales: (todayOnly?: boolean) =>
        set((state) => {
          const updatedProducts = state.products.map((p) => {
            if (todayOnly && new Date(p.expiryDate).toDateString() !== new Date().toDateString()) {
              return { ...p, sold: 0 };
            }
            return { ...p, sold: 0 };
          });
          
          return { 
            products: updatedProducts,
            filteredProducts: get().applyFilters(updatedProducts)
          };
        }),

      // Helper function to apply all filters
      applyFilters: (products) => {
        const { searchTerm, categoryFilter, statusFilter } = get();
        
        return products.filter((product) => {
          // Apply search filter
          const matchesSearch = searchTerm
            ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.category.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
          
          // Apply category filter
          const matchesCategory = categoryFilter 
            ? product.category === categoryFilter 
            : true;
          
          // Apply status filter
          const matchesStatus = statusFilter !== 'all' 
            ? product.status === statusFilter 
            : true;
          
          return matchesSearch && matchesCategory && matchesStatus;
        });
      }
    }),
    {
      name: 'product-storage',
    }
  )
);