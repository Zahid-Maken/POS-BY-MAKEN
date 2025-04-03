import { useState, useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import Sidebar from '../../components/Sidebar';
import { Clock, RefreshCw, RotateCcw, AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { Order } from '../../types';

export default function Sales() {
  const { orders, resetDailySales, revertDailySales } = useOrderStore();
  const [dailyOrders, setDailyOrders] = useState<Order[]>([]);
  const [historicalOrders, setHistoricalOrders] = useState<Order[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [showRevertButton, setShowRevertButton] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Get today's date
    const today = new Date().toLocaleDateString();
    
    // Split orders into daily and historical
    const todaysOrders = orders.filter(order => {
      return new Date(order.createdAt).toLocaleDateString() === today;
    });
    
    const older = orders.filter(order => {
      return new Date(order.createdAt).toLocaleDateString() !== today;
    });
    
    setDailyOrders(todaysOrders);
    setHistoricalOrders(older);
    
    // Check if we have backed up sales data to show the revert button
    try {
      const orderStore = JSON.parse(localStorage.getItem('order-storage') || '{}');
      const hasBackup = orderStore.state && 
                        orderStore.state.dailySalesBackup && 
                        orderStore.state.dailySalesBackup.length > 0;
      setShowRevertButton(hasBackup);
    } catch (e) {
      console.error('Error checking for sales backup', e);
    }
  }, [orders]);

  const handleResetSales = () => {
    try {
      resetDailySales();
      setIsResetModalOpen(false);
      setShowRevertButton(true);
      
      // Clear daily orders immediately
      setDailyOrders([]);
      
      setMessage({ 
        type: 'success', 
        text: 'Today\'s sales data has been reset successfully. You can revert this action if needed.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'There was a problem resetting the sales data.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleRevertSales = () => {
    try {
      revertDailySales();
      setShowRevertButton(false);
      setMessage({ 
        type: 'success', 
        text: 'Sales data has been restored successfully.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'There was a problem reverting the sales data.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Calculate daily total
  const dailyTotal = dailyOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sales</h1>
          <div className="flex space-x-3">
            {showRevertButton && (
              <button
                onClick={handleRevertSales}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                <RotateCcw className="w-4 h-4" />
                Revert Sales Reset
              </button>
            )}
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Today's Sales
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            <div className="flex items-start">
              {message.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
              <p>{message.text}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-400" />
                Today's Sales
              </h2>
              <div className="text-lg font-semibold text-emerald-600">
                ${dailyTotal.toFixed(2)}
              </div>
            </div>
          </div>
          
          {dailyOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyOrders.map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.cashierId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No sales recorded today
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Sales History</h2>
          </div>
          
          {historicalOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalOrders.map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.cashierId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No sales history available
            </div>
          )}
        </div>
      </div>

      {/* Reset Sales Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Reset Today's Sales Data</h3>
              <p className="text-gray-600 mb-6">
                This will clear all sales data from today. This action can be reverted, but it may affect reporting. 
                Are you sure you want to continue?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetSales}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reset Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}