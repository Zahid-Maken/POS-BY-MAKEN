import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Package, DollarSign, ShoppingCart, Users, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useProductStore } from '../../store/productStore';
import { useOrderStore } from '../../store/orderStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// Helper function to get date ranges
const getLast5Weeks = () => {
  const today = new Date();
  const weeks = [];
  for (let i = 4; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 7);
    weeks.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return weeks;
};

export default function AdminDashboard() {
  const { products, resetProductSales } = useProductStore();
  const { orders, resetDailySales, revertDailySales } = useOrderStore();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    todaySales: 0,
    todayVisitors: 0,
    revenueChange: 0,
    ordersChange: 0,
    salesChange: 0,
    visitorsChange: 0,
  });

  // Generate some semi-random realistic sales data for the chart
  const [salesData, setSalesData] = useState<number[]>([]);
  const [weekLabels] = useState<string[]>(getLast5Weeks());

  useEffect(() => {
    // Calculate stats based on products and orders
    const totalSold = products.reduce((sum, product) => sum + product.sold, 0);
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Get today's sales from orders
    const today = new Date().toLocaleDateString();
    const todaysOrders = orders.filter(order => {
      return new Date(order.createdAt).toLocaleDateString() === today;
    });
    const todaySales = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Today's visitors (estimated based on orders)
    const todayVisitors = Math.max(todaysOrders.length * 2.5, 0);
    
    // Simulate some change percentages 
    // In a real app, you would calculate these based on comparing with previous periods
    const revenueChange = Math.round((Math.random() * 20) - 5);
    const ordersChange = Math.round((Math.random() * 20) - 8);
    const salesChange = Math.round((Math.random() * 15));
    const visitorsChange = Math.round((Math.random() * 10));
    
    // Create weekly sales data from orders
    const weeklySalesData = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Go back i weeks
      
      // Get orders for this week
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - 3); // 3 days before
      
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 3); // 3 days after
      
      // Sum orders in this week
      const weekRevenue = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        })
        .reduce((sum, order) => sum + order.total, 0);
      
      weeklySalesData.push(weekRevenue || Math.round((totalRevenue / 5) * (0.7 + (Math.random() * 0.6))));
    }
    
    setStats({
      totalRevenue,
      totalOrders: orders.length,
      todaySales,
      todayVisitors,
      revenueChange,
      ordersChange,
      salesChange,
      visitorsChange,
    });
    
    setSalesData(weeklySalesData);
    
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
  }, [products, orders]);

  const chartData = {
    labels: weekLabels,
    datasets: [
      {
        fill: true,
        label: 'Revenue',
        data: salesData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const StatCard = ({ icon: Icon, label, value, change }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500">{label}</div>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="text-2xl font-semibold mb-2">{value}</div>
      <div className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </div>
    </div>
  );

  const [showRevertButton, setShowRevertButton] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleResetSales = () => {
    // Implementation of reset sales logic
    try {
      // Backup the sales data for the chart before resetting
      const currentSalesData = [...salesData];
      const currentTotalRevenue = stats.totalRevenue;
      
      resetDailySales();
      resetProductSales(true); // Reset today's product sales data
      
      // Reset dashboard stats to zero except revenue overview and totalRevenue
      setStats({
        totalRevenue: currentTotalRevenue,
        totalOrders: stats.totalOrders,
        todaySales: 0,
        todayVisitors: 0,
        revenueChange: 0,
        ordersChange: 0,
        salesChange: 0,
        visitorsChange: 0
      });
      
      // Restore the revenue overview chart data
      setSalesData(currentSalesData);
      
      setIsResetModalOpen(false);
      setShowRevertButton(true);
      
      setMessage({ 
        type: 'success', 
        text: 'Today\'s sales data has been reset successfully. Total revenue and revenue overview are preserved.' 
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
    // Implementation of revert sales logic
    try {
      revertDailySales();
      setShowRevertButton(false);
      
      // Data will be recalculated in useEffect when orders state changes
      
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
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

        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            change={stats.revenueChange}
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Checkouts"
            value={stats.totalOrders}
            change={stats.ordersChange}
          />
          <StatCard
            icon={Package}
            label="Today's Sales"
            value={`$${stats.todaySales.toLocaleString()}`}
            change={stats.salesChange}
          />
          <StatCard
            icon={Users}
            label="Today's Visitors"
            value={stats.todayVisitors.toLocaleString()}
            change={stats.visitorsChange}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
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