import { useState } from 'react';
import { useCustomerStore } from '../../store/customerStore';
import { useOrderStore } from '../../store/orderStore';
import Sidebar from '../../components/Sidebar';
import { 
  Search, Plus, Edit, Trash, X, Save, User, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, ShoppingBag, Receipt
} from 'lucide-react';
import { Customer, Order } from '../../types';

export default function Customers() {
  const { 
    customers, 
    filteredCustomers, 
    searchCustomers, 
    updateCustomer, 
    deleteCustomer 
  } = useCustomerStore();
  
  const { orders } = useOrderStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchCustomers(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer) return;

    // Validate form data
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields.');
      return;
    }

    // Update customer
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
    };

    updateCustomer(updatedCustomer);
    resetForm();
    setShowEditModal(false);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      deleteCustomer(selectedCustomer.id);
      setShowDeleteModal(false);
    }
  };

  // Get orders for a specific customer
  const getCustomerOrders = (customerName: string) => {
    return orders.filter(order => 
      order.customerName?.toLowerCase() === customerName.toLowerCase()
    );
  };

  // Toggle customer row expansion
  const toggleCustomerExpansion = (customerId: string) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(customerId);
      setExpandedOrderId(null);
      setExpandedReceipt(null);
    }
  };

  // Toggle order details expansion
  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  // Toggle receipt expansion
  const toggleReceiptExpansion = (orderId: string) => {
    if (expandedReceipt === orderId) {
      setExpandedReceipt(null);
    } else {
      setExpandedReceipt(orderId);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between mb-4">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-md text-sm">
              Customers are automatically added when orders are processed
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Purchases
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Purchase
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <>
                      <tr 
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleCustomerExpansion(customer.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="ml-4 flex items-center">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              {expandedCustomerId === customer.id ? 
                                <ChevronUp className="h-4 w-4 ml-2 text-gray-400" /> : 
                                <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {customer.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          ${customer.totalPurchases.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {customer.lastPurchase}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(customer);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(customer);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {expandedCustomerId === customer.id && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            <div className="border rounded-lg overflow-hidden">
                              <div className="bg-gray-100 px-4 py-2 font-medium flex items-center">
                                <ShoppingBag className="h-4 w-4 mr-2 text-gray-500" />
                                <span>Order History</span>
                              </div>
                              
                              {getCustomerOrders(customer.name).length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">
                                  No order history found
                                </div>
                              ) : (
                                <div className="divide-y">
                                  {getCustomerOrders(customer.name).map((order) => (
                                    <div key={order.id} className="p-4">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer"
                                        onClick={() => toggleOrderExpansion(order.id)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm font-medium">Order #{order.id.substring(0, 8)}</span>
                                          <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                            ${order.total.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            className="flex items-center gap-1 text-xs text-blue-600"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleReceiptExpansion(order.id);
                                            }}
                                          >
                                            <Receipt className="h-3 w-3" />
                                            {expandedReceipt === order.id ? 'Hide Receipt' : 'View Receipt'}
                                          </button>
                                          {expandedOrderId === order.id ? 
                                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                          }
                                        </div>
                                      </div>
                                      
                                      {expandedOrderId === order.id && (
                                        <div className="mt-3 pl-3 border-l-2 border-gray-200">
                                          <div className="grid grid-cols-2 gap-4 mb-2">
                                            <div>
                                              <p className="text-xs text-gray-500">Subtotal</p>
                                              <p className="text-sm">${order.subtotal.toFixed(2)}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-500">Tax</p>
                                              <p className="text-sm">${order.tax.toFixed(2)}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-500">Discount</p>
                                              <p className="text-sm text-green-600">-${order.discount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-500">Total</p>
                                              <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                                            </div>
                                          </div>
                                          
                                          <p className="text-xs font-medium mt-2 mb-1">Items:</p>
                                          <div className="space-y-1">
                                            {order.items.map((item) => (
                                              <div key={item.id} className="text-xs flex justify-between">
                                                <span>{item.product.name} x {item.quantity}</span>
                                                <span>${(item.price * (1 - (item.discount || 0)/100) * item.quantity).toFixed(2)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {expandedReceipt === order.id && (
                                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                          <div className="text-center mb-4">
                                            <h3 className="font-bold">TapCart</h3>
                                            <p className="text-xs text-gray-500 mb-1">
                                              {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                            <p className="text-xs mb-1">
                                              <span className="font-medium">Order ID:</span> {order.id}
                                            </p>
                                            <p className="text-xs">
                                              <span className="font-medium">Customer:</span> {order.customerName || 'Guest'}
                                            </p>
                                          </div>
                                          
                                          <div className="border-t border-b py-2 mb-2">
                                            {order.items.map((item) => (
                                              <div key={item.id} className="flex justify-between text-xs mb-1">
                                                <div>
                                                  <p>{item.product.name}</p>
                                                  <p className="text-gray-500">
                                                    ${(item.price * (1 - (item.discount || 0)/100)).toFixed(2)} x {item.quantity}
                                                    {item.discount ? <span className="text-green-600"> (-{item.discount}%)</span> : null}
                                                  </p>
                                                </div>
                                                <p>${(item.price * (1 - (item.discount || 0)/100) * item.quantity).toFixed(2)}</p>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          <div className="text-xs">
                                            <div className="flex justify-between mb-1">
                                              <span>Subtotal</span>
                                              <span>${order.subtotal.toFixed(2)}</span>
                                            </div>
                                            {order.discount > 0 && (
                                              <div className="flex justify-between mb-1 text-green-600">
                                                <span>Discount</span>
                                                <span>-${order.discount.toFixed(2)}</span>
                                              </div>
                                            )}
                                            <div className="flex justify-between mb-1">
                                              <span>Tax</span>
                                              <span>${order.tax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold pt-1 border-t">
                                              <span>Total</span>
                                              <span>${order.total.toFixed(2)}</span>
                                            </div>
                                          </div>
                                          
                                          <p className="text-center text-xs mt-3 text-gray-500">Thank you for shopping with us!</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium">Edit Customer</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Update Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this customer? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}