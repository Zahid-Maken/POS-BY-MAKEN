import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CashierDashboard from './pages/cashier/Dashboard';
import Products from './pages/admin/Products';
import Sales from './pages/admin/Sales';
import AdminSettings from './pages/admin/Settings';
import CashierSettings from './pages/cashier/Settings';
import Customers from './pages/admin/Customers';
import POS from './pages/cashier/POS';

function PrivateRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const user = useAuthStore((state) => state.user);
  
  if (!user) return <Navigate to="/login" />;
  if (user.role !== allowedRole) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <PrivateRoute allowedRole="admin">
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <PrivateRoute allowedRole="admin">
              <Sales />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <PrivateRoute allowedRole="admin">
              <Customers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute allowedRole="admin">
              <AdminSettings />
            </PrivateRoute>
          }
        />
        
        {/* Cashier Routes */}
        <Route
          path="/cashier"
          element={
            <PrivateRoute allowedRole="cashier">
              <CashierDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/cashier/pos"
          element={
            <PrivateRoute allowedRole="cashier">
              <POS />
            </PrivateRoute>
          }
        />
        <Route
          path="/cashier/settings"
          element={
            <PrivateRoute allowedRole="cashier">
              <CashierSettings />
            </PrivateRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;