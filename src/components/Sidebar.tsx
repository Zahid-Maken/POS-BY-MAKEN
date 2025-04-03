import { LayoutDashboard, Users, Package, ShoppingCart, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: `/${user?.role}` },
    ...(isAdmin ? [
      { icon: Users, label: 'Customers', path: '/admin/customers' },
      { icon: Package, label: 'Products', path: '/admin/products' },
    ] : [
      { icon: ShoppingCart, label: 'POS', path: '/cashier/pos' },
    ]),
    { icon: Settings, label: 'Settings', path: `/${user?.role}/settings` },
  ];

  return (
    <div className="w-64 bg-white h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <Package className="w-8 h-8 text-emerald-500" />
        <span className="text-xl font-bold">TapCart</span>
      </div>

      <nav className="flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
              location.pathname === item.path
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button
        onClick={() => logout()}
        className="flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  );
}