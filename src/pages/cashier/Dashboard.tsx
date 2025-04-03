import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { Package, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { useProductStore } from '../../store/productStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';

export default function CashierDashboard() {
  const { products } = useProductStore();
  const { orders, getTodaySales, getPendingOrders } = useOrderStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    // Calculate stats based on orders and products
    const pendingOrders = getPendingOrders().length;
    
    // Get today's sales amount
    const today = new Date().toLocaleDateString();
    const todaysOrders = orders.filter(order => 
      new Date(order.createdAt).toLocaleDateString() === today && 
      order.status === 'completed' &&
      order.cashierId === user?.username
    );
    const todaySales = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Get total completed orders by this cashier
    const completedOrders = orders.filter(
      order => order.status === 'completed' && order.cashierId === user?.username
    ).length;
    
    setStats({
      todaySales,
      totalOrders: completedOrders,
      pendingOrders,
    });
  }, [products, orders, getPendingOrders, user]);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500">{label}</div>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );

  const RecentOrdersTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.slice(0, 5).map((product) => (
            <tr key={product.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{product.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ${product.price.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  product.status === 'in-stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.status === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const PendingOrdersList = () => {
    const pendingOrders = getPendingOrders();
    const navigate = useNavigate();
    
    const handleLoadOrder = (orderId: string) => {
      // Store the order ID in sessionStorage to be loaded by POS component
      sessionStorage.setItem('loadPendingOrderId', orderId);
      navigate('/cashier/pos');
    };
    
    if (pendingOrders.length === 0) {
      return <p className="text-gray-500">No pending orders</p>;
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{order.id.substring(0, 6)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {order.items.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-700">
                    ${order.total.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleLoadOrder(order.id)}
                    className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm"
                  >
                    Load Order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user?.username}</h1>
          <p className="text-gray-500">Here's what's happening today</p>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Today's Sales"
            value={`$${stats.todaySales.toLocaleString()}`}
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={stats.totalOrders}
          />
          <StatCard
            icon={Clock}
            label="Pending Orders"
            value={stats.pendingOrders}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Pending Orders</h2>
          <PendingOrdersList />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Products</h2>
          {products.length > 0 ? (
            <RecentOrdersTable />
          ) : (
            <p className="text-gray-500">No products available</p>
          )}
        </div>
      </div>
    </div>
  );
} 