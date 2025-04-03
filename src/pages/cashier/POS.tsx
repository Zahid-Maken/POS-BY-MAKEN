import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Printer, X, CheckCircle, AlertCircle, UserPlus, ChevronLeft, ChevronRight, Save, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useProductStore } from '../../store/productStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useCustomerStore } from '../../store/customerStore';
import { Product, OrderItem, Order } from '../../types';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

export default function POS() {
  const { products, recordSale, updateStock } = useProductStore();
  const { 
    addOrder, 
    addPendingOrder, 
    removePendingOrder, 
    getPendingOrders, 
    getPendingOrderById 
  } = useOrderStore();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { findOrCreateCustomer } = useCustomerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const receiptRef = useRef(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [error, setError] = useState('');
  const [currentOrderIndex, setCurrentOrderIndex] = useState(-1);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [expandTotals, setExpandTotals] = useState(true);

  // Generate a unique order ID
  const generateOrderId = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  };

  // Load pending orders and check for pending order to load from dashboard
  useEffect(() => {
    setPendingOrders(getPendingOrders());
    
    // Check if there's a pending order ID to load from Dashboard
    const pendingOrderIdToLoad = sessionStorage.getItem('loadPendingOrderId');
    if (pendingOrderIdToLoad) {
      loadPendingOrder(pendingOrderIdToLoad);
      
      // Find the index of the loaded order
      const orderIndex = getPendingOrders().findIndex(order => order.id === pendingOrderIdToLoad);
      if (orderIndex !== -1) {
        setCurrentOrderIndex(orderIndex);
      }
      
      // Clear the sessionStorage
      sessionStorage.removeItem('loadPendingOrderId');
    }
  }, [getPendingOrders]);
  
  // Generate new order ID when cart is empty and no current order
  useEffect(() => {
    if (cart.length === 0 && !currentOrderId) {
      setOrderId(generateOrderId());
      setCustomerName(''); // Clear customer name for new orders
    }
  }, [cart.length, currentOrderId]);

  // Focus on customer name input when a new order starts
  useEffect(() => {
    if (cart.length === 0 && !currentOrderId) {
      const customerNameInput = document.getElementById('customerName');
      if (customerNameInput) {
        customerNameInput.focus();
      }
    }
  }, [cart.length, currentOrderId, orderId]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.status === 'in-stock';
  });

  const addToCart = (product: Product) => {
    if (orderCompleted) {
      setOrderCompleted(false);
    }

    // Check if stock is available
    if (product.stock <= 0) {
      setError(`Sorry, ${product.name} is out of stock`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Check if adding one more would exceed available stock
      if (existingItem.quantity >= product.stock) {
        setError(`Cannot add more ${product.name}. Only ${product.stock} in stock.`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Update cart and reduce product stock
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      
      // Update product stock in real-time
      updateStock(product.id, product.stock - 1);
    } else {
      // Apply discount - either product-specific or universal
      const discount = product.discount || settings?.universalDiscount || 0;
      
      setCart([...cart, {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        quantity: 1,
        price: product.price,
        product,
        unit: product.unit || 'item',
        unitRate: product.unitRate || 1,
        discount: discount
      }]);
      
      // Update product stock in real-time
      updateStock(product.id, product.stock - 1);
    }
  };

  const removeFromCart = (itemId: string) => {
    const item = cart.find(item => item.id === itemId);
    if (item) {
      // Add back to stock when removing from cart
      const currentProduct = products.find(p => p.id === item.productId);
      if (currentProduct) {
        updateStock(currentProduct.id, currentProduct.stock + item.quantity);
      }
    }
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const currentItem = cart.find(item => item.id === itemId);
    if (!currentItem) return;
    
    const currentProduct = products.find(p => p.id === currentItem.productId);
    if (!currentProduct) return;
    
    const quantityDifference = quantity - currentItem.quantity;
    
    // Check if we have enough stock when increasing
    if (quantityDifference > 0) {
      const availableStock = currentProduct.stock;
      if (quantityDifference > availableStock) {
        setError(`Cannot add ${quantityDifference} more units of ${currentProduct.name}. Only ${availableStock} available.`);
        setTimeout(() => setError(''), 3000);
        return;
      }
    }
    
    // Update stock based on quantity change
    updateStock(currentProduct.id, currentProduct.stock - quantityDifference);
    
    // Update cart item quantity
    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  // Calculate totals with discounts
  const calculateTotals = () => {
    // Calculate item totals with product-specific discounts only
    const itemTotals = cart.map(item => {
      // Apply only product-specific discount here, not universal
      const productDiscountRate = item.product.discount ? item.product.discount / 100 : 0;
      const discountedPrice = item.price * (1 - productDiscountRate);
      return discountedPrice * item.quantity;
    });
    
    // Calculate subtotal (sum of all item totals with product-specific discounts)
    const subtotal = itemTotals.reduce((sum, itemTotal) => sum + itemTotal, 0);
    
    // Apply universal discount separately (if any)
    const universalDiscountRate = settings?.universalDiscount ? settings.universalDiscount / 100 : 0;
    const universalDiscountAmount = subtotal * universalDiscountRate;
    
    // Calculate final amount after universal discount
    const afterDiscountAmount = subtotal - universalDiscountAmount;
    
    // Apply tax rate from settings
    const taxRate = settings?.taxRate !== undefined ? settings.taxRate / 100 : 0.1; // Default to 10% if not set
    const tax = afterDiscountAmount * taxRate;
    
    // Calculate total product-specific discount amount (for display purposes)
    const regularTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const productDiscountAmount = regularTotal - subtotal;
    
    // Calculate final total
    const total = afterDiscountAmount + tax;
    
    return {
      subtotal,
      universalDiscountAmount,
      productDiscountAmount,
      afterDiscountAmount,
      tax,
      total
    };
  };
  
  const { subtotal, universalDiscountAmount, productDiscountAmount, afterDiscountAmount, tax, total } = calculateTotals();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  const clearCart = () => {
    // Return all items to stock when clearing cart
    cart.forEach(item => {
      const currentProduct = products.find(p => p.id === item.productId);
      if (currentProduct) {
        updateStock(currentProduct.id, currentProduct.stock + item.quantity);
      }
    });
    
    setCart([]);
    setOrderCompleted(false);
    setError('');
    setCurrentOrderId(null);
    
    // Generate new order ID and reset customer name
    setOrderId(generateOrderId());
    setCustomerName('');
    
    // Focus on customer name input
    setTimeout(() => {
      const customerNameInput = document.getElementById('customerName');
      if (customerNameInput) {
        customerNameInput.focus();
      }
    }, 0);
  };

  const handleNextCustomer = () => {
    if (currentOrderIndex < pendingOrders.length - 1) {
      // Go to next pending order
      setCurrentOrderIndex(currentOrderIndex + 1);
      loadPendingOrder(pendingOrders[currentOrderIndex + 1].id);
    } else {
      // Create new empty order
      setCart([]);
      setOrderCompleted(false);
      setError('');
      setSearchTerm('');
      setSelectedCategory('all');
      setCurrentOrderId(null);
      setCurrentOrderIndex(-1);
      
      // Generate new order ID and reset customer name
      setOrderId(generateOrderId());
      setCustomerName('');
      
      // Focus on customer name input
      setTimeout(() => {
        const customerNameInput = document.getElementById('customerName');
        if (customerNameInput) {
          customerNameInput.focus();
        }
      }, 0);
    }
  };

  const handlePreviousCustomer = () => {
    // If we have pending orders and we're not at the first one or before
    if (pendingOrders.length > 0 && currentOrderIndex > 0) {
      setCurrentOrderIndex(currentOrderIndex - 1);
      loadPendingOrder(pendingOrders[currentOrderIndex - 1].id);
    }
  };

  const loadPendingOrder = (orderId: string) => {
    // First clear the current cart
    clearCart();
    
    // Get pending order by ID
    const pendingOrder = getPendingOrderById(orderId);
    if (pendingOrder) {
      // Set cart to pending order items
      setCart(pendingOrder.items);
      setCurrentOrderId(orderId);
      setOrderCompleted(false);
      
      // Set customer name from the pending order
      if (pendingOrder.customerName) {
        setCustomerName(pendingOrder.customerName);
      }
      
      // Set order ID
      setOrderId(orderId);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Cannot checkout empty cart');
      return;
    }

    if (!user) {
      setError('Cashier not logged in');
      return;
    }

    setError('');

    try {
      // Calculate totals
      const { subtotal, universalDiscountAmount, productDiscountAmount, afterDiscountAmount, tax, total } = calculateTotals();
      
      // Create order object
      const newOrder: Order = {
        id: currentOrderId || orderId,
        subtotal,
        tax,
        discount: productDiscountAmount + universalDiscountAmount,
        universalDiscount: universalDiscountAmount,
        total,
        items: cart,
        createdAt: new Date().toISOString(),
        status: 'completed',
        cashierId: user.username,
        customerName: customerName || 'Guest',
      };

      // If this was a pending order, remove it
      if (currentOrderId) {
        removePendingOrder(currentOrderId);
      }

      // Add order to store
      addOrder(newOrder);
      
      // Update or create customer in the system
      findOrCreateCustomer(customerName || 'Guest', newOrder.id, total);

      // Update sold count for each product to reflect in dashboards
      cart.forEach(item => {
        // Record the sale for dashboard metrics
        recordSale(item.productId, item.quantity);
      });
      
      // Mark order as completed
      setOrderCompleted(true);
      
      // Update pending orders list
      setPendingOrders(getPendingOrders());
    } catch (err) {
      setError('Failed to complete order');
      console.error(err);
    }
  };

  const handleSavePending = () => {
    if (cart.length === 0) {
      setError('Cannot save empty cart');
      return;
    }

    if (!user) {
      setError('Cashier not logged in');
      return;
    }

    try {
      // Calculate totals
      const { subtotal, universalDiscountAmount, productDiscountAmount, afterDiscountAmount, tax, total } = calculateTotals();
      
      // Create pending order
      const newPendingOrder: Order = {
        id: currentOrderId || orderId,
        subtotal,
        tax,
        discount: productDiscountAmount + universalDiscountAmount,
        universalDiscount: universalDiscountAmount,
        total,
        items: cart,
        createdAt: new Date().toISOString(),
        status: 'pending',
        cashierId: user.username,
        customerName: customerName || 'Guest',
      };

      // If editing existing pending order, remove it first
      if (currentOrderId) {
        removePendingOrder(currentOrderId);
      }

      // Add to pending orders
      addPendingOrder(newPendingOrder);
      
      // Only create/update customer record for completed orders, not pending ones
      
      // Update local pending orders list
      setPendingOrders(getPendingOrders());
      
      // Reset current order
      clearCart();
      setError('');
      setSearchTerm('');
      setSelectedCategory('all');
      setCurrentOrderId(null);
      setCurrentOrderIndex(-1);
      
      // Show success message
      setError('Order saved as pending');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('Failed to save pending order');
      console.error(err);
    }
  };

  // Format to display discount on an item
  const getItemDisplayPrice = (item: OrderItem) => {
    if (!item.discount) return `$${item.price}`;
    
    return (
      <div>
        <span className="line-through text-gray-400">${item.price}</span>
        <span className="ml-1 text-green-600">${(item.price * (1 - item.discount/100)).toFixed(2)}</span>
        <span className="ml-1 text-xs text-green-600">(-{item.discount}%)</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex h-screen overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col h-full border-r">
          {/* Fixed header */}
          <div className="p-6 pb-0 flex-shrink-0">
            <div className="mb-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg flex-shrink-0 ${
                    selectedCategory === category
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable products grid */}
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={product.stock <= 0}
                >
                  <div className="text-left">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <div className="text-emerald-600 font-semibold mt-2">
                      {product.discount || settings?.universalDiscount ? (
                        <div>
                          <span className="line-through text-gray-400">${product.price}</span>
                          <span className="ml-1">${(product.price * (1 - (product.discount || settings?.universalDiscount || 0)/100)).toFixed(2)}</span>
                          <span className="ml-1 text-xs">(-{product.discount || settings?.universalDiscount}%)</span>
                        </div>
                      ) : (
                        <span>${product.price}</span>
                      )}
                      {product.unit ? <span className="text-sm font-normal text-gray-500"> per {product.unit}</span> : null}
                    </div>
                    <p className={`text-xs ${product.stock <= 3 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                      In stock: {product.stock} {product.unit || 'items'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white flex flex-col h-full">
          {/* Fixed header */}
          <div className="p-6 pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Current Order</h2>
                {currentOrderIndex !== -1 && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    #{currentOrderIndex + 1}/{pendingOrders.length}
                  </span>
                )}
              </div>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Order ID display */}
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-gray-600">Order ID:</label>
              <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                {orderId}
              </span>
            </div>
            
            {/* Customer name input */}
            <div className="mb-3">
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-600 mb-1">
                Customer Name:
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {error && (
              <div className={`${error.includes('saved') ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-l-4 p-3 mb-3 flex items-start`}>
                {error.includes('saved') ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <p className={`${error.includes('saved') ? 'text-green-700' : 'text-red-700'} text-sm`}>{error}</p>
              </div>
            )}

            {orderCompleted && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3 flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">Order completed successfully!</p>
              </div>
            )}
          </div>

          {/* Scrollable cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium">{item.product.name}</h3>
                  <div className="text-sm text-gray-500">
                    {getItemDisplayPrice(item)} per {item.unit}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed footer */}
          <div className="p-6 pt-3 border-t flex-shrink-0">
            <div 
              className="border rounded-lg overflow-hidden mb-4"
            >
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                onClick={() => setExpandTotals(!expandTotals)}
              >
                <span className="font-medium text-gray-700">Order Summary</span>
                {expandTotals ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {expandTotals && (
                <div className="p-3 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {productDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Product Discounts</span>
                      <span>-${productDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {universalDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Universal Discount ({settings?.universalDiscount}%)</span>
                      <span>-${universalDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax ({settings?.taxRate || 10}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {!expandTotals && (
                <div className="p-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || orderCompleted}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  {orderCompleted ? 'Order Completed' : 'Checkout'}
                </button>
                
                <button
                  onClick={handleNextCustomer}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600"
                >
                  {currentOrderIndex < pendingOrders.length - 1 ? (
                    <>
                      <ChevronRight className="w-5 h-5" />
                      Next
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      New
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSavePending}
                  disabled={cart.length === 0 || orderCompleted}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="w-5 h-5" />
                  Save as Pending
                </button>

                <button
                  onClick={handlePrint}
                  disabled={cart.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Hidden Receipt Template */}
          <div className="hidden">
            <div ref={receiptRef} className="p-6">
              <h2 className="text-center font-bold text-xl mb-4">TapCart</h2>
              <p className="text-center text-gray-500 text-sm mb-3">
                {new Date().toLocaleString()}
              </p>
              
              {/* Order ID and Customer Name */}
              <div className="mb-4">
                <p className="text-center text-sm mb-1">
                  <span className="font-medium">Order ID:</span> {orderId}
                </p>
                <p className="text-center text-sm">
                  <span className="font-medium">Customer:</span> {customerName || 'Guest'}
                </p>
              </div>
              
              <div className="mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between mb-2">
                    <div>
                      <p>{item.product.name}</p>
                      {item.discount ? (
                        <p className="text-sm text-gray-500">
                          ${(item.price * (1 - item.discount/100)).toFixed(2)} per {item.unit} x {item.quantity}
                          <span className="text-green-600"> (-{item.discount}%)</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          ${item.price} per {item.unit} x {item.quantity}
                        </p>
                      )}
                    </div>
                    <p>${(item.price * (1 - (item.discount || 0)/100) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {productDiscountAmount > 0 && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>Product Discounts</span>
                    <span>-${productDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {universalDiscountAmount > 0 && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>Universal Discount ({settings?.universalDiscount}%)</span>
                    <span>-${universalDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span>Tax ({settings?.taxRate || 10}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-center mt-6 text-gray-500">Thank you for shopping with us!</p>
              {orderCompleted && (
                <p className="text-center mt-2 text-green-600 font-medium">Paid</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}