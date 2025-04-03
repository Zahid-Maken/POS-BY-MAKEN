import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer } from '../types';

interface CustomerState {
  customers: Customer[];
  filteredCustomers: Customer[];
  searchTerm: string;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  searchCustomers: (term: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  findOrCreateCustomer: (name: string, orderId: string, total: number) => Customer;
  resetSearch: () => void;
  applySearch: (customers: Customer[]) => Customer[];
}

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Initial customers data
const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St, City',
    totalPurchases: 5420,
    lastPurchase: '2023-03-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    address: '456 Oak Ave, Town',
    totalPurchases: 3150,
    lastPurchase: '2023-04-02',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    phone: '+1122334455',
    address: '789 Pine Rd, Village',
    totalPurchases: 7840,
    lastPurchase: '2023-03-28',
  },
];

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      filteredCustomers: initialCustomers,
      searchTerm: '',

      addCustomer: (customer) => {
        // Add ID if not provided
        const newCustomer = customer.id ? customer : { ...customer, id: generateId() };
        
        set((state) => ({
          customers: [...state.customers, newCustomer],
          filteredCustomers: get().applySearch([...state.customers, newCustomer])
        }));
      },

      updateCustomer: (customer) =>
        set((state) => {
          const updatedCustomers = state.customers.map((c) => 
            c.id === customer.id ? customer : c
          );
          
          return {
            customers: updatedCustomers,
            filteredCustomers: get().applySearch(updatedCustomers)
          };
        }),

      deleteCustomer: (id) =>
        set((state) => {
          const updatedCustomers = state.customers.filter((c) => c.id !== id);
          return {
            customers: updatedCustomers,
            filteredCustomers: get().applySearch(updatedCustomers)
          };
        }),

      searchCustomers: (term) =>
        set((state) => ({
          searchTerm: term,
          filteredCustomers: get().applySearch(state.customers)
        })),

      getCustomerById: (id) => {
        return get().customers.find(c => c.id === id);
      },

      resetSearch: () =>
        set((state) => ({
          searchTerm: '',
          filteredCustomers: state.customers
        })),

      // Helper function to apply search filter
      applySearch: (customers) => {
        const { searchTerm } = get();
        if (!searchTerm) return customers;
        
        const term = searchTerm.toLowerCase();
        return customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(term) ||
            customer.email.toLowerCase().includes(term) ||
            customer.phone.includes(term)
        );
      },

      findOrCreateCustomer: (name: string, orderId: string, total: number) => {
        const customers = get().customers;
        // First try to find the customer by name (case-insensitive)
        const existingCustomer = customers.find(
          c => c.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingCustomer) {
          // Update the customer's total purchases and last purchase date
          const updatedCustomer = {
            ...existingCustomer,
            totalPurchases: existingCustomer.totalPurchases + total,
            lastPurchase: new Date().toISOString().split('T')[0],
          };
          
          // Update the customer in the store
          get().updateCustomer(updatedCustomer);
          return updatedCustomer;
        } else {
          // Create a new customer with minimal information
          const newCustomer: Customer = {
            id: generateId(),
            name: name || 'Guest',
            email: '',
            phone: '',
            address: '',
            totalPurchases: total,
            lastPurchase: new Date().toISOString().split('T')[0],
          };
          
          // Add the new customer to the store
          get().addCustomer(newCustomer);
          return newCustomer;
        }
      },
    }),
    {
      name: 'customer-storage',
    }
  )
); 