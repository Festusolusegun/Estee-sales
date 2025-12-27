
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import { Product, CartItem, Order, User, Category, Unit } from './types';
import { 
  CartIcon, ChartIcon, ProductIcon, UserIcon, SearchIcon, NotificationIcon, CloseIcon, AdjustmentsIcon 
} from './components/Icons';
import AdminDashboard from './components/AdminDashboard';
import Chatbot from './components/Chatbot';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('estee_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('estee_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('estee_orders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentTab, setCurrentTab] = useState<'shop' | 'admin' | 'products' | 'orders' | 'auth' | 'customers'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'interest' | 'paid' | 'verified'>('all');
  
  const [customerSearchItem, setCustomerSearchItem] = useState('');
  const [selectedProductForLookup, setSelectedProductForLookup] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authData, setAuthData] = useState({ name: '', phone: '', password: '' });

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  useEffect(() => {
    localStorage.setItem('estee_products', JSON.stringify(products));
    localStorage.setItem('estee_orders', JSON.stringify(orders));
  }, [products, orders]);

  useEffect(() => {
    if (user) localStorage.setItem('estee_user', JSON.stringify(user));
    else localStorage.removeItem('estee_user');
  }, [user]);

  // Inventory & Price Management
  const updatePrice = (productId: string, unit: string, newPrice: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, pricePerUnit: { ...p.pricePerUnit, [unit]: newPrice } };
      }
      return p;
    }));
  };

  const updateStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  const handleAddProduct = (newP: Omit<Product, 'id' | 'adjustable'>) => {
    const product: Product = {
      ...newP,
      id: generateId(),
      adjustable: true
    };
    setProducts(prev => [product, ...prev]);
    setShowAddModal(false);
  };

  // Order & Cart logic
  const handlePlaceOrder = () => {
    if (!user) { setCurrentTab('auth'); setIsCartOpen(false); return; }
    const newOrder: Order = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      items: [...cart],
      total: cartTotal,
      status: 'interest',
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    setCurrentTab('orders');
  };

  const handleUploadReceipt = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'paid', receiptUrl: `https://picsum.photos/400/600?random=${orderId}` } : o));
  };

  const verifyOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'verified' } : o));
  };

  const addToCart = (product: Product, selectedUnit: Unit) => {
    const price = product.pricePerUnit[selectedUnit];
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.selectedUnit === selectedUnit);
      if (existing) {
        return prev.map(item => item.productId === product.id && item.selectedUnit === selectedUnit 
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: generateId(), productId: product.id, name: product.name, selectedUnit, quantity: 1, priceAtOrder: price }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0), [cart]);

  // Auth logic
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (authData.phone === '080admin') {
        setUser({ id: 'admin-1', name: 'Estee Admin', phone: authData.phone, role: 'admin' });
        setCurrentTab('admin');
      } else {
        setUser({ id: generateId(), name: authData.name || 'Bulk Buyer', phone: authData.phone, role: 'buyer' });
        setCurrentTab('shop');
      }
    } else {
      setUser({ id: generateId(), name: authData.name, phone: authData.phone, role: 'buyer' });
      setCurrentTab('shop');
    }
  };

  const quickAdminLogin = () => {
    setUser({ id: 'admin-1', name: 'Estee Admin', phone: '080admin', role: 'admin' });
    setCurrentTab('products');
  };

  // Data filtering for tables
  const filteredCustomers = useMemo(() => {
    const map = new Map<string, { id: string, name: string, phone: string, totalSpend: number, orders: Order[] }>();
    orders.forEach(o => {
      const data = map.get(o.userId) || { id: o.userId, name: o.userName, phone: o.userPhone, totalSpend: 0, orders: [] };
      const matchesItemSearch = customerSearchItem === '' || o.items.some(it => it.name.toLowerCase().includes(customerSearchItem.toLowerCase()));
      if (matchesItemSearch) {
        data.totalSpend += o.status === 'verified' ? o.total : 0;
        data.orders.push(o);
        map.set(o.userId, data);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders, customerSearchItem]);

  const buyersOfSelectedProduct = useMemo(() => {
    if (!selectedProductForLookup) return [];
    return orders.filter(o => o.items.some(it => it.productId === selectedProductForLookup));
  }, [orders, selectedProductForLookup]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] no-select">
      {/* Sidebar Nav */}
      <nav className="fixed left-0 top-0 h-full w-24 bg-white border-r border-slate-200 hidden lg:flex flex-col items-center py-10 z-50">
        <div className="w-14 h-14 bg-teal-600 rounded-3xl flex items-center justify-center mb-16 shadow-xl shadow-teal-200 cursor-pointer" onClick={() => setCurrentTab('shop')}>
          <span className="text-white font-black text-2xl">E</span>
        </div>
        <div className="flex-1 flex flex-col gap-10">
          <NavItem active={currentTab === 'shop'} onClick={() => setCurrentTab('shop')} icon={<ProductIcon />} label="Market" />
          {user?.role === 'admin' && (
            <>
              <NavItem active={currentTab === 'admin'} onClick={() => setCurrentTab('admin')} icon={<ChartIcon />} label="Stats" />
              <NavItem active={currentTab === 'products'} onClick={() => setCurrentTab('products')} icon={<AdjustmentsIcon />} label="Manager" />
              <NavItem active={currentTab === 'customers'} onClick={() => setCurrentTab('customers')} icon={<UserIcon />} label="Clients" />
            </>
          )}
          <NavItem active={currentTab === 'orders'} onClick={() => setCurrentTab('orders')} icon={<NotificationIcon />} label="Log" />
        </div>
        <button onClick={() => setCurrentTab('auth')} className={`p-4 rounded-3xl transition-all ${currentTab === 'auth' ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}>
          <UserIcon className="w-7 h-7" />
        </button>
      </nav>

      <main className="lg:ml-24 p-4 md:p-10 max-w-7xl mx-auto pb-32">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Estee Wholesales</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">{user?.role === 'admin' ? 'Command Center' : 'Premium Wholesale Hub'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80 group">
              <input 
                type="text" 
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-sm"
              />
            </div>
            
            <button 
              onClick={() => setCurrentTab('auth')} 
              className={`p-3.5 rounded-2xl transition-all flex items-center gap-2 group ${user ? 'bg-white text-slate-600 shadow-sm' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">
                {user ? user.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            <button onClick={() => setIsCartOpen(true)} className="relative bg-teal-600 text-white p-3.5 rounded-2xl shadow-xl shadow-teal-100 active:scale-95 transition-all">
              <CartIcon className="w-5 h-5" />
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
            </button>
          </div>
        </header>

        {/* Tab Content */}
        {currentTab === 'shop' && (
          <div className="space-y-8 animate-fade-in">
            {/* Admin Bypass Header */}
            {user?.role === 'admin' && (
              <div className="bg-slate-900 p-6 md:p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl shadow-slate-200">
                <div>
                  <h3 className="text-lg font-black leading-none">Market View (Admin Mode)</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Viewing as buyer.</p>
                </div>
                <button 
                  onClick={() => setCurrentTab('products')}
                  className="w-full md:w-auto bg-teal-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-teal-700 transition-all active:scale-95"
                >
                  <AdjustmentsIcon className="w-4 h-4" />
                  Inventory Manager
                </button>
              </div>
            )}

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <CategoryBtn active={selectedCategory === 'All'} onClick={() => setSelectedCategory('All')}>All</CategoryBtn>
              {CATEGORIES.map(cat => <CategoryBtn key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>{cat.split(' ')[0]}</CategoryBtn>)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

        {currentTab === 'admin' && user?.role === 'admin' && (
          <div className="space-y-12 animate-fade-in">
            <AdminDashboard orders={orders} products={products} payments={[]} onNavigateToManager={() => setCurrentTab('products')} />
            
            <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-50">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Verification Queue</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <FilterBtn active={adminOrderFilter === 'all'} onClick={() => setAdminOrderFilter('all')}>All</FilterBtn>
                  <FilterBtn active={adminOrderFilter === 'paid'} onClick={() => setAdminOrderFilter('paid')}>Paid</FilterBtn>
                </div>
              </div>
              <div className="space-y-3">
                {orders.filter(o => adminOrderFilter === 'all' || o.status === adminOrderFilter).map(o => (
                  <div key={o.id} className="p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-teal-200 transition-all">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${o.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {o.status === 'paid' ? <SearchIcon className="w-5 h-5"/> : <NotificationIcon className="w-5 h-5"/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-none mb-1">{o.userName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{o.userPhone}</p>
                      </div>
                    </div>
                    <div className="flex-1 md:px-6">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Order Total</p>
                       <p className="text-sm font-black text-slate-700">₦{o.total.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                       {o.receiptUrl && <button onClick={() => window.open(o.receiptUrl)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><SearchIcon className="w-4 h-4"/></button>}
                       {o.status === 'paid' && <button onClick={() => verifyOrder(o.id)} className="flex-1 md:flex-none bg-teal-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-teal-100">Verify Payment</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentTab === 'products' && user?.role === 'admin' && (
          <div className="space-y-8 animate-fade-in">
             <section className="bg-white p-6 md:p-14 rounded-[3rem] shadow-sm border border-slate-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Inventory Management</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Adjust market rates</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="w-full md:w-auto bg-teal-600 text-white px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-teal-100"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-50">
                      <th className="px-4 py-4">Item</th>
                      <th className="px-4 py-4">Price Matrix</th>
                      <th className="px-4 py-4">Stock</th>
                      <th className="px-4 py-4 text-center">Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-6">
                           <p className="font-black text-slate-800 text-base">{p.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</p>
                        </td>
                        <td className="px-4 py-6">
                          <div className="flex flex-wrap gap-2">
                            {p.supportedUnits.map(unit => (
                              <div key={unit} className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-slate-400 text-[8px] font-black">{unit.slice(0,3)}:</span>
                                <input 
                                  type="number"
                                  defaultValue={p.pricePerUnit[unit]}
                                  onBlur={(e) => updatePrice(p.id, unit, Number(e.target.value))}
                                  className="bg-transparent border-none text-[10px] font-black text-slate-800 p-0 w-16 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-6">
                           <input 
                              type="number"
                              defaultValue={p.stock}
                              onBlur={(e) => updateStock(p.id, Number(e.target.value))}
                              className="px-3 py-2 rounded-xl border w-20 text-[10px] font-black bg-slate-50 border-slate-200"
                            />
                        </td>
                        <td className="px-4 py-6 text-center">
                          <button onClick={() => setSelectedProductForLookup(p.id)} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-teal-600 transition-colors"><SearchIcon className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {currentTab === 'customers' && user?.role === 'admin' && (
          <div className="space-y-10 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-900">Client Directory</h2>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-50">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                    <th className="px-8 py-6">Customer</th>
                    <th className="px-8 py-6">Contact</th>
                    <th className="px-8 py-6 text-right">Procured Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCustomers.map((c, i) => (
                    <tr key={i}>
                      <td className="px-8 py-6 font-black text-slate-800">{c.name}</td>
                      <td className="px-8 py-6 font-bold text-slate-500 text-sm">{c.phone}</td>
                      <td className="px-8 py-6 text-right font-black text-teal-600 text-lg">₦{c.totalSpend.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'orders' && (
           <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black text-slate-900">Wholesale Log</h2>
              {orders.filter(o => o.userId === user?.id).length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No activity yet.</p>
                </div>
              ) : (
                orders.filter(o => o.userId === user?.id).map(o => (
                  <div key={o.id} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: #{o.id.slice(0,6)}</p>
                        <p className="text-slate-500 text-[10px] font-bold mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        o.status === 'verified' ? 'bg-teal-500 text-white' : 
                        o.status === 'paid' ? 'bg-green-500 text-white' : 'bg-amber-400 text-white'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="space-y-3 mb-8">
                       {o.items.map((it, idx) => (
                         <div key={idx} className="flex justify-between text-sm font-bold text-slate-700">
                            <span>{it.quantity}x {it.name} <span className="text-[10px] text-slate-400">({it.selectedUnit})</span></span>
                            <span>₦{(it.priceAtOrder * it.quantity).toLocaleString()}</span>
                         </div>
                       ))}
                       <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="font-black text-teal-600 text-2xl tracking-tight">₦{o.total.toLocaleString()}</span>
                          {o.status === 'interest' && (
                            <button onClick={() => handleUploadReceipt(o.id)} className="bg-slate-900 text-white font-black px-6 py-3.5 rounded-2xl text-[9px] uppercase tracking-widest flex items-center gap-2">
                              <SearchIcon className="w-4 h-4"/>
                              Upload Receipt
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        )}

        {/* Auth Tab */}
        {currentTab === 'auth' && (
          <div className="max-w-md mx-auto pt-10 animate-fade-in">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 text-center relative overflow-hidden">
               {user ? (
                 <>
                    <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                       <UserIcon className="text-teal-600 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 leading-none">{user.name}</h2>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-8">{user.phone}</p>
                    
                    {/* PWA INSTALL BUTTON */}
                    {deferredPrompt && (
                      <button 
                        onClick={handleInstallClick}
                        className="w-full bg-green-50 text-green-600 font-black py-4 rounded-2xl mb-4 text-[10px] uppercase tracking-widest border border-green-100 flex items-center justify-center gap-2"
                      >
                        <ProductIcon className="w-5 h-5" />
                        Install Estee Mobile App
                      </button>
                    )}

                    <div className="space-y-3">
                       {user.role === 'admin' && (
                         <button onClick={() => setCurrentTab('products')} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Open Command Center</button>
                       )}
                       <button onClick={() => {setUser(null); setCurrentTab('shop');}} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Sign Out</button>
                    </div>
                 </>
               ) : (
                 <>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 leading-none">Market Access</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Wholesale Portal</p>
                    
                    <button 
                      onClick={quickAdminLogin}
                      className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-6"
                    >
                      <AdjustmentsIcon className="w-4 h-4" />
                      Login as Administrator
                    </button>

                    <div className="relative flex items-center gap-3 mb-6">
                      <div className="flex-1 h-px bg-slate-100"></div>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">or customer login</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4 text-left">
                       {authMode === 'register' && (
                         <input required type="text" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none text-sm" placeholder="Business Name" />
                       )}
                       <input required type="tel" value={authData.phone} onChange={e => setAuthData({...authData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none text-sm" placeholder="Phone Number" />
                       <input required type="password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none text-sm" placeholder="PIN" />
                       <button type="submit" className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-teal-100 text-[11px] uppercase tracking-widest">
                          {authMode === 'login' ? 'Authenticate' : 'Establish Profile'}
                       </button>
                    </form>
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-teal-600">
                      {authMode === 'login' ? "New business? Register Profile" : "Existing Partner? Access Hub"}
                    </button>
                 </>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Admin Floating FAB */}
      {user?.role === 'admin' && (
        <div className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-[60]">
          <button 
            onClick={() => setCurrentTab('products')}
            className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white"
          >
            <AdjustmentsIcon className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
           <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">New Wholesale Item</h3>
              <AddProductForm onSave={handleAddProduct} onCancel={() => setShowAddModal(false)} />
           </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-left">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-teal-600 text-white">
              <h3 className="text-xl font-black">Market Basket</h3>
              <button onClick={() => setIsCartOpen(false)} className="hover:bg-white/10 rounded-xl p-2"><CloseIcon className="w-6 h-6"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest">Basket empty.</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl relative border border-slate-100 flex items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-slate-400 font-black text-[9px] uppercase">₦{item.priceAtOrder.toLocaleString()} / {item.selectedUnit}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-black text-slate-500">Qty: {item.quantity}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-[8px] font-black text-red-400 uppercase tracking-widest">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 font-black text-[9px] uppercase">Total</span>
                  <span className="text-2xl font-black text-slate-900">₦{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handlePlaceOrder} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl text-[10px] uppercase tracking-widest">Place Wholesale Interest</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex justify-around items-center h-20 lg:hidden z-50 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <MobileNavItem active={currentTab === 'shop'} onClick={() => setCurrentTab('shop')} icon={<ProductIcon />} />
        {user?.role === 'admin' && (
          <>
            <MobileNavItem active={currentTab === 'admin'} onClick={() => setCurrentTab('admin')} icon={<ChartIcon />} />
            <MobileNavItem active={currentTab === 'products'} onClick={() => setCurrentTab('products')} icon={<AdjustmentsIcon />} />
          </>
        )}
        <MobileNavItem active={currentTab === 'orders'} onClick={() => setCurrentTab('orders')} icon={<NotificationIcon />} />
        <MobileNavItem active={currentTab === 'auth'} onClick={() => setCurrentTab('auth')} icon={<UserIcon />} />
      </nav>

      <Chatbot products={products} />

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-left { animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

// UI Components
const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="group flex flex-col items-center">
    <div className={`p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-teal-600 text-white shadow-xl shadow-teal-100 -translate-y-1' : 'text-slate-300 hover:text-teal-600 hover:bg-teal-50'}`}>
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-all ${active ? 'text-teal-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}>{label}</span>
  </button>
);

const MobileNavItem: React.FC<MobileNavItemProps> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-3 transition-all duration-300 ${active ? 'text-teal-600 -translate-y-1' : 'text-slate-300'}`}>
    {React.cloneElement(icon, { className: "w-6 h-6" })}
  </button>
);

const CategoryBtn: React.FC<CategoryBtnProps> = ({ children, active, onClick }) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black transition-all border ${active ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>{children}</button>
);

const FilterBtn: React.FC<FilterBtnProps> = ({ children, active, onClick }) => (
  <button onClick={onClick} className={`px-5 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>{children}</button>
);

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const [selectedUnit, setSelectedUnit] = useState<Unit>(product.supportedUnits[0]);
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all flex flex-col border border-slate-50">
      <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative border border-slate-100">
        <img src={`https://picsum.photos/400/400?random=${product.id}`} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="font-black text-slate-900 text-sm leading-tight mb-2 tracking-tight">{product.name}</h3>
        <select 
          value={selectedUnit} 
          onChange={e => setSelectedUnit(e.target.value as Unit)}
          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 mb-4 focus:ring-2 focus:ring-teal-500/10 cursor-pointer"
        >
          {product.supportedUnits.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <p className="text-base font-black text-teal-600 tracking-tighter">₦{product.pricePerUnit[selectedUnit].toLocaleString()}</p>
        <button 
          onClick={() => onAdd(product, selectedUnit)}
          className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg hover:bg-teal-600 transition-all active:scale-90"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
    </div>
  );
};

const AddProductForm: React.FC<{onSave: (p: Omit<Product, 'id' | 'adjustable'>) => void, onCancel: () => void}> = ({onSave, onCancel}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    stock: 100,
    supportedUnits: [] as Unit[],
    pricePerUnit: {} as Record<string, number>
  });

  const availableUnits: Unit[] = ['Kongo', 'Portion', 'Bag', '5L-Bottle', '10L-Bottle', 'Kg', 'Crate', 'Carton'];

  const toggleUnit = (unit: Unit) => {
    setFormData(prev => {
      const units = prev.supportedUnits.includes(unit) 
        ? prev.supportedUnits.filter(u => u !== unit) 
        : [...prev.supportedUnits, unit];
      const prices = { ...prev.pricePerUnit };
      if (!prev.supportedUnits.includes(unit)) prices[unit] = 0;
      else delete prices[unit];
      return { ...prev, supportedUnits: units, pricePerUnit: prices };
    });
  };

  const handlePriceChange = (unit: string, val: string) => {
    setFormData(prev => ({ ...prev, pricePerUnit: { ...prev.pricePerUnit, [unit]: Number(val) } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.supportedUnits.length === 0) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Item Name</label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-slate-800 outline-none text-sm" />
        </div>
        <div>
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Category</label>
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-slate-800 outline-none text-xs">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Stock</label>
          <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-slate-800 outline-none text-sm" />
        </div>
      </div>
      <div>
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">Units & Rates</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {availableUnits.map(unit => (
            <button 
              type="button"
              key={unit} 
              onClick={() => toggleUnit(unit)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black border ${formData.supportedUnits.includes(unit) ? 'bg-teal-600 border-teal-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
            >
              {unit}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {formData.supportedUnits.map(unit => (
            <div key={unit}>
               <span className="text-[8px] font-black text-slate-400 uppercase">{unit} Price</span>
               <input required type="number" value={formData.pricePerUnit[unit]} onChange={e => handlePriceChange(unit, e.target.value)} className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border-none text-[10px] font-black" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase">Establish Item</button>
        <button type="button" onClick={onCancel} className="px-6 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase">Cancel</button>
      </div>
    </form>
  );
}

interface NavItemProps { active: boolean; onClick: () => void; icon: React.ReactElement; label: string; }
interface MobileNavItemProps { active: boolean; onClick: () => void; icon: React.ReactElement; }
interface CategoryBtnProps { children: React.ReactNode; active: boolean; onClick: () => void; }
interface FilterBtnProps { children: React.ReactNode; active: boolean; onClick: () => void; }
interface ProductCardProps { product: Product; onAdd: (product: Product, selectedUnit: Unit) => void; }

export default App;
