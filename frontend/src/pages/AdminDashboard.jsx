import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, orders, users, transactions, settings, security
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [settings, setSettings] = useState({ minDeposit: 20, depositBonusThreshold: 100, depositBonusPercentage: 20 });
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState('add');

  const [products, setProducts] = useState([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    category: 'United States US',
    courier: 'UPS',
    name: '',
    price: '',
    desc: '',
    badge: '',
    badgeColor: '#d9534f',
    active: true
  });

  const standardCategories = [
    'United States US',
    'Canada CA',
    'Germany DE',
    'United Kingdom UK',
    'France FR',
    'Insider Scans "Only tracking needed"'
  ];

  const categoryOptions = Array.from(new Set([
    ...standardCategories,
    ...products.map(p => p.category).filter(Boolean)
  ]));

  const standardCouriers = [
    'UPS',
    'FedEx',
    'USPS',
    'DHL',
    'Canada Post',
    'Purolator',
    'DPD',
    'GLS',
    'Hermes',
    'DHL Express'
  ];

  const courierOptions = Array.from(new Set([
    ...standardCouriers,
    ...products.map(p => p.courier).filter(Boolean)
  ]));

  const standardMethodNames = [
    'FTID',
    'FTIDV3',
    'FTIDNA',
    'LIT',
    'UPS RTS Manual',
    'Rts insider city/any state'
  ];

  const methodOptions = Array.from(new Set([
    ...standardMethodNames,
    ...products.map(p => p.name).filter(Boolean)
  ]));

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  }, [navigate]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      handleLogout();
      return;
    }

    try {
      const [uRes, oRes, pRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/orders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/products`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/settings`, { headers: getAuthHeaders() })
      ]);

      if (uRes.status === 401 || uRes.status === 403 || oRes.status === 401 || oRes.status === 403) {
        handleLogout();
        return;
      }

      const uData = await uRes.json();
      const oData = await oRes.json();
      const pData = await pRes.json();
      const sData = await sRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
      setOrders(Array.isArray(oData) ? oData : []);
      setProducts(Array.isArray(pData) ? pData : []);
      if (sData && sData.minDeposit) setSettings(sData);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    }
  }, [getAuthHeaders, handleLogout]);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    const token = localStorage.getItem('admin_token');
    if (!adminData || adminData === "undefined" || !token) {
      navigate('/admin/login');
    } else {
      setAdmin(JSON.parse(adminData));
      fetchData();
    }
  }, [navigate, fetchData]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct 
        ? `${API_BASE_URL}/api/admin/products/${editingProduct._id}`
        : `${API_BASE_URL}/api/admin/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price)
        })
      });

      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }

      if (res.ok) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        setProductForm({
          category: productCategoryFilter !== 'All' ? productCategoryFilter : 'United States US',
          courier: 'UPS',
          name: '',
          price: '',
          desc: '',
          badge: '',
          badgeColor: '#d9534f',
          active: true
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== productId));
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting product');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Settings saved successfully!');
      else alert('Failed to save settings');
    } catch (err) {
      alert('Error saving settings');
    }
  };

  const handleBalanceUpdate = async (e) => {
    e.preventDefault();
    if (!balanceAmount || isNaN(Number(balanceAmount))) return alert('Invalid amount');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${balanceModalUser._id}/balance`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: balanceAction, amount: Number(balanceAmount) })
      });
      if (res.ok) {
        setBalanceModalUser(null);
        setBalanceAmount('');
        fetchData();
        alert('Balance updated successfully!');
      } else {
        alert('Failed to update balance');
      }
    } catch (err) {
      alert('Error updating balance');
    }
  };

  const handleToggleProductActive = async (product) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${product._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !product.active })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (orderId, updateObj) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/order/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateObj)
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }
    setDeletingId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/order/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.filter(o => o._id !== orderId));
      } else {
        alert(data.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Delete order error:', err);
      alert('Error deleting order');
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: data.message || 'Password updated successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Server connection error.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Derived real transactions from paid/confirmed orders (NO dummy data)
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid' || o.txHash);

  if (!admin) return <div style={{ color: '#fff', padding: '20px' }}>Loading Admin Panel...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#141617', position: 'relative' }}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      {/* Responsive Sidebar */}
      <div style={{ 
        width: '250px', backgroundColor: '#1c1e1f', padding: '30px 20px', borderRight: '1px solid #2a2a2a', 
        display: 'flex', flexDirection: 'column', gap: '30px', boxSizing: 'border-box',
        position: 'fixed', top: 0, bottom: 0, left: isSidebarOpen ? 0 : '-250px',
        transition: 'left 0.3s ease', zIndex: 50
      }} className="admin-sidebar">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo text_large weight_bold transform_uppercase" style={{ color: '#fff' }}>
             FTID<span className="color_secondary">.Admin</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="hide-desktop" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>
             <i className='bx bx-x'></i>
          </button>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '15px', color: '#fff' }}>Menu</div>
          <button onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'dashboard' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bxs-dashboard'></i> Dashboard Overview
          </button>
          <button onClick={() => { setCurrentView('orders'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'orders' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-cart'></i> Manage Orders ({orders.length})
          </button>
          <button onClick={() => { setCurrentView('transactions'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'transactions' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-money'></i> Deposit Transactions ({paidOrders.length})
          </button>
          <button onClick={() => { setCurrentView('products'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'products' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-purchase-tag-alt'></i> Products & Pricing ({products.length})
          </button>
          <button onClick={() => { setCurrentView('users'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'users' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-user'></i> Manage Users ({users.length})
          </button>
          <button onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'settings' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-cog'></i> System Settings
          </button>
          <button onClick={() => { setCurrentView('security'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'security' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-lock-alt'></i> Admin Security
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', marginLeft: 0 }} className="admin-main-content">
        
        {/* Topbar */}
        <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1e1f', borderBottom: '1px solid #2a2a2a' }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }} className="admin-menu-btn">
             <i className='bx bx-menu'></i>
          </button>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: 'auto' }}>
            <div style={{ color: '#fff', fontSize: '14px' }}>🔒 <strong>{admin.username}</strong></div>
            <button onClick={handleLogout} className="button_solid p_2 radius_medium weight_bold" style={{ border: 'none', cursor: 'pointer', backgroundColor: '#e74c3c', fontSize: '12px' }}>
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ padding: '20px', flex: 1, boxSizing: 'border-box' }}>
          
          {currentView === 'dashboard' && (
            <div>
              <h2 className="text_xlarge mb_4">Dashboard Overview</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="bg_secondary radius_medium p_6" style={{ flex: '1 1 300px', borderLeft: '4px solid #4caf50' }}>
                  <div className="text_small color_neutral mb_2">Total Revenue (Paid)</div>
                  <div className="text_xxlarge weight_bold" style={{ color: '#4caf50' }}>
                    ${orders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + (o.price || 0), 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg_secondary radius_medium p_6" style={{ flex: '1 1 300px', borderLeft: '4px solid #ff9800' }}>
                  <div className="text_small color_neutral mb_2">Total Orders</div>
                  <div className="text_xxlarge weight_bold">{orders.length}</div>
                </div>
                <div className="bg_secondary radius_medium p_6" style={{ flex: '1 1 300px', borderLeft: '4px solid #03a9f4' }}>
                  <div className="text_small color_neutral mb_2">Registered Users</div>
                  <div className="text_xxlarge weight_bold">{users.length}</div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'transactions' && (
            <div className="bg_secondary radius_medium p_6" style={{ overflowX: 'auto' }}>
              <h3 className="text_large mb_4">Verified Deposit Transactions</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th className="p_2">Order ID</th>
                    <th className="p_2">User</th>
                    <th className="p_2">Currency</th>
                    <th className="p_2">Amount</th>
                    <th className="p_2">TX Hash</th>
                    <th className="p_2">Date</th>
                    <th className="p_2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paidOrders.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #333' }}>
                      <td className="p_2 color_neutral" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{t._id.slice(-8)}</td>
                      <td className="p_2">{t.userId?.email || 'Guest'}</td>
                      <td className="p_2" style={{ fontWeight: 'bold' }}>{t.paymentCurrency || 'Crypto'}</td>
                      <td className="p_2" style={{ color: '#4caf50', fontWeight: 'bold' }}>${t.price || 0}</td>
                      <td className="p_2" style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.txHash ? t.txHash : 'Manual Approval'}
                      </td>
                      <td className="p_2" style={{ fontSize: '12px' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p_2">
                        <span style={{ 
                            color: '#4caf50',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px'
                        }}>Paid</span>
                      </td>
                    </tr>
                  ))}
                  {paidOrders.length === 0 && <tr><td colSpan="7" className="p_4 align_center color_neutral">No confirmed payment transactions found yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {currentView === 'orders' && (
            <div className="bg_secondary radius_medium p_6" style={{ overflowX: 'auto' }}>
              <h3 className="text_large mb_4">Manage Orders ({orders.length})</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '950px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th className="p_2">Type</th>
                    <th className="p_2">User</th>
                    <th className="p_2">Details</th>
                    <th className="p_2">File</th>
                    <th className="p_2">Price</th>
                    <th className="p_2">Status</th>
                    <th className="p_2">Payment</th>
                    <th className="p_2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} style={{ borderBottom: '1px solid #333' }}>
                      <td className="p_2">
                        <span style={{ fontWeight: 'bold', color: '#ff8c00' }}>{o.type}</span>
                        <div style={{ fontSize: '11px', color: '#888' }}>{o.method || o.country}</div>
                      </td>
                      <td className="p_2" style={{ fontSize: '13px' }}>{o.userId?.email || 'Guest'}</td>
                      <td className="p_2" style={{ fontSize: '12px', maxWidth: '200px' }}>
                        {o.trackingNumber && <div><strong>Track:</strong> {o.trackingNumber}</div>}
                        {o.note && <div style={{ color: '#aaa', fontStyle: 'italic' }}>"{o.note}"</div>}
                        {o.txHash && <div style={{ fontSize: '10px', color: '#00f2fe', fontFamily: 'monospace' }}>TX: {o.txHash.slice(0, 10)}...</div>}
                      </td>
                      <td className="p_2">
                        {o.fileData && o.fileData.data ? (
                          <a 
                            href={o.fileData.data} 
                            download={o.fileData.filename || 'user_attachment'}
                            style={{ backgroundColor: '#007bff', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            📎 {o.fileData.filename ? (o.fileData.filename.length > 15 ? o.fileData.filename.slice(0, 12) + '...' : o.fileData.filename) : 'File'}
                          </a>
                        ) : (
                          <span style={{ color: '#666', fontSize: '12px' }}>No file</span>
                        )}
                      </td>
                      <td className="p_2" style={{ color: '#4caf50', fontWeight: 'bold' }}>${o.price || 0}</td>
                      <td className="p_2">
                        <select 
                          value={o.status || 'Pending Payment'} 
                          onChange={(e) => handleStatusChange(o._id, { status: e.target.value })}
                          style={{ padding: '6px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}
                        >
                          <option value="Pending Payment">Pending Payment</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p_2">
                        <select 
                          value={o.paymentStatus || 'Pending Payment'} 
                          onChange={(e) => handleStatusChange(o._id, { paymentStatus: e.target.value })}
                          style={{ padding: '6px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}
                        >
                          <option value="Pending Payment">Pending Payment</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>
                      <td className="p_2">
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleStatusChange(o._id, { status: 'Completed', paymentStatus: 'Paid' })}
                            style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                            title="Approve order and mark as paid"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(o._id)}
                            disabled={deletingId === o._id}
                            style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', opacity: deletingId === o._id ? 0.5 : 1 }}
                            title="Delete order permanently"
                          >
                            {deletingId === o._id ? 'Deleting...' : '🗑️ Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="8" className="p_4 align_center color_neutral">No orders found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {currentView === 'users' && (
            <div className="bg_secondary radius_medium p_6" style={{ overflowX: 'auto' }}>
              <h3 className="text_large mb_4">Manage Users ({users.length})</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th className="p_2">Name</th>
                    <th className="p_2">Email</th>
                    <th className="p_2">Credits</th>
                    <th className="p_2">Joined</th>
                    <th className="p_2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #333' }}>
                      <td className="p_2">{u.name}</td>
                      <td className="p_2">{u.email}</td>
                      <td className="p_2" style={{ color: '#4caf50', fontWeight: 'bold' }}>${u.credits}</td>
                      <td className="p_2">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p_2">
                        <button onClick={() => setBalanceModalUser(u)} style={{ backgroundColor: '#2196f3', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                          💰 Edit Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                   {users.length === 0 && <tr><td colSpan="5" className="p_4 align_center color_neutral">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="bg_secondary radius_medium p_6">
              <h3 className="text_large mb_4">System Settings</h3>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Minimum Deposit ($)</label>
                  <input type="number" step="any" value={settings.minDeposit} onChange={e => setSettings({...settings, minDeposit: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Deposit Bonus Threshold ($)</label>
                  <input type="number" step="any" value={settings.depositBonusThreshold} onChange={e => setSettings({...settings, depositBonusThreshold: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Deposit Bonus Percentage (%)</label>
                  <input type="number" step="any" value={settings.depositBonusPercentage} onChange={e => setSettings({...settings, depositBonusPercentage: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none' }} />
                </div>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Settings</button>
              </form>
            </div>
          )}

          {currentView === 'security' && (
            <div className="bg_secondary radius_medium p_6">
              <h3 className="text_large mb_2">Admin Security</h3>
              <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>Update your administrative login password.</p>
              
              {passwordMsg.text && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  maxWidth: '500px',
                  backgroundColor: passwordMsg.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                  border: `1px solid ${passwordMsg.type === 'success' ? '#4caf50' : '#ef5350'}`,
                  color: passwordMsg.type === 'success' ? '#81c784' : '#ef5350'
                }}>
                  {passwordMsg.type === 'success' ? '✅ ' : '⚠️ '} {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '13px', fontWeight: '600' }}>Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '13px', fontWeight: '600' }}>New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password (min. 6 characters)"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '13px', fontWeight: '600' }}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  style={{
                    background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginTop: '6px'
                  }}
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {currentView === 'products' && (
            <div className="bg_secondary radius_medium p_6" style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 className="text_large" style={{ margin: 0 }}>Products & Pricing ({products.length})</h3>
                  <p style={{ color: '#999', fontSize: '13px', margin: '4px 0 0 0' }}>Manage store categories, couriers, methods, and prices in real-time.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    const initialCategory = productCategoryFilter !== 'All' ? productCategoryFilter : 'United States US';
                    setProductForm({
                      category: initialCategory,
                      courier: 'UPS',
                      name: '',
                      price: '',
                      desc: '',
                      badge: '',
                      badgeColor: '#d9534f',
                      active: true
                    });
                    setIsProductModalOpen(true);
                  }}
                  style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  + Add New Product
                </button>
              </div>

              {/* Category Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
                {['All', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    style={{
                      backgroundColor: productCategoryFilter === cat ? '#00f2fe' : '#2a2a2a',
                      color: productCategoryFilter === cat ? '#000' : '#ccc',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Products Table */}
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '750px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th className="p_2">Category / Country</th>
                    <th className="p_2">Courier</th>
                    <th className="p_2">Method Name</th>
                    <th className="p_2">Price ($)</th>
                    <th className="p_2">Badge</th>
                    <th className="p_2">Status</th>
                    <th className="p_2" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => productCategoryFilter === 'All' || p.category === productCategoryFilter)
                    .map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td className="p_2" style={{ fontSize: '13px', color: '#fff' }}>{p.category}</td>
                      <td className="p_2" style={{ fontSize: '13px', color: '#00f2fe' }}>{p.courier}</td>
                      <td className="p_2" style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{p.name}</td>
                      <td className="p_2" style={{ fontSize: '14px', color: '#4caf50', fontWeight: 'bold' }}>${p.price}</td>
                      <td className="p_2">
                        {p.badge ? (
                          <span style={{ backgroundColor: p.badgeColor || '#d9534f', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                            {p.badge}
                          </span>
                        ) : (
                          <span style={{ color: '#666', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td className="p_2">
                        <button
                          onClick={() => handleToggleProductActive(p)}
                          style={{
                            backgroundColor: p.active ? '#1b5e20' : '#424242',
                            color: p.active ? '#81c784' : '#aaa',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {p.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p_2" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                category: p.category,
                                courier: p.courier,
                                name: p.name,
                                price: p.price,
                                desc: p.desc || '',
                                badge: p.badge || '',
                                badgeColor: p.badgeColor || '#d9534f',
                                active: p.active
                              });
                              setIsProductModalOpen(true);
                            }}
                            style={{ backgroundColor: '#2196f3', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="7" className="p_4 align_center color_neutral">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(5, 7, 10, 0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: '16px', overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: '#12151a',
            background: 'linear-gradient(145deg, #161a22 0%, #0e1014 100%)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '20px',
            width: '100%', maxWidth: '520px',
            padding: '24px 20px', color: '#fff', boxSizing: 'border-box',
            maxHeight: '90vh', overflowY: 'auto', margin: 'auto',
            position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              aria-label="Close modal"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#aaa', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', outline: 'none'
              }}
            >
              ✕
            </button>

            <h3 style={{ marginTop: 0, color: '#00f2fe', fontSize: '20px', fontWeight: '700', marginBottom: '20px', paddingRight: '35px' }}>
              {editingProduct ? '✏️ Edit Product / Method' : '➕ Add New Product / Method'}
            </h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category / Country</label>
                <select
                  value={categoryOptions.includes(productForm.category) ? productForm.category : '__custom__'}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setProductForm({ ...productForm, category: '' });
                    } else {
                      setProductForm({ ...productForm, category: e.target.value });
                    }
                  }}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px', marginBottom: (!categoryOptions.includes(productForm.category) || productForm.category === '') ? '8px' : '0' }}
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat} style={{ backgroundColor: '#161a22', color: '#fff' }}>{cat}</option>
                  ))}
                  <option value="__custom__" style={{ backgroundColor: '#161a22', color: '#00f2fe' }}>➕ Type Custom Category / Country...</option>
                </select>
                {(!categoryOptions.includes(productForm.category) || productForm.category === '') && (
                  <input
                    type="text"
                    required
                    placeholder='Enter new custom category (e.g. United Kingdom UK)'
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid #00f2fe', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px', marginTop: '6px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Courier</label>
                <select
                  value={courierOptions.includes(productForm.courier) ? productForm.courier : '__custom__'}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setProductForm({ ...productForm, courier: '' });
                    } else {
                      setProductForm({ ...productForm, courier: e.target.value });
                    }
                  }}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px', marginBottom: (!courierOptions.includes(productForm.courier) || productForm.courier === '') ? '8px' : '0' }}
                >
                  {courierOptions.map(cour => (
                    <option key={cour} value={cour} style={{ backgroundColor: '#161a22', color: '#fff' }}>{cour}</option>
                  ))}
                  <option value="__custom__" style={{ backgroundColor: '#161a22', color: '#00f2fe' }}>➕ Type Custom Courier...</option>
                </select>
                {(!courierOptions.includes(productForm.courier) || productForm.courier === '') && (
                  <input
                    type="text"
                    required
                    placeholder='Enter new custom courier (e.g. Royal Mail, DPD)'
                    value={productForm.courier}
                    onChange={e => setProductForm({ ...productForm, courier: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid #00f2fe', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px', marginTop: '6px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Method Name</label>
                <select
                  value={methodOptions.includes(productForm.name) ? productForm.name : '__custom__'}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setProductForm({ ...productForm, name: '' });
                    } else {
                      setProductForm({ ...productForm, name: e.target.value });
                    }
                  }}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px', marginBottom: (!methodOptions.includes(productForm.name) || productForm.name === '') ? '8px' : '0' }}
                >
                  {methodOptions.map(mName => (
                    <option key={mName} value={mName} style={{ backgroundColor: '#161a22', color: '#fff' }}>{mName}</option>
                  ))}
                  <option value="__custom__" style={{ backgroundColor: '#161a22', color: '#00f2fe' }}>➕ Type Custom Method Name...</option>
                </select>
                {(!methodOptions.includes(productForm.name) || productForm.name === '') && (
                  <input
                    type="text"
                    required
                    placeholder='Enter new custom method name (e.g. FTID, LIT)'
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid #00f2fe', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px', marginTop: '6px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price ($ USD)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder='70'
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Badge Color</label>
                  <input
                    type="color"
                    value={productForm.badgeColor}
                    onChange={e => setProductForm({ ...productForm, badgeColor: e.target.value })}
                    style={{ width: '100%', height: '45px', padding: '2px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Badge Text (Optional)</label>
                <input
                  type="text"
                  placeholder='e.g. Click to read description or Label is required'
                  value={productForm.badge}
                  onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#8a94a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder='Detailed description shown to user when clicking description badge'
                  value={productForm.desc}
                  onChange={e => setProductForm({ ...productForm, desc: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#161a22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0' }}>
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={productForm.active}
                  onChange={e => setProductForm({ ...productForm, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00f2fe' }}
                />
                <label htmlFor="activeCheck" style={{ fontSize: '13px', color: '#ccc', cursor: 'pointer', fontWeight: '600' }}>Active in Store Catalog</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ccc', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 15px rgba(0,242,254,0.3)' }}
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Modal */}
      {balanceModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1c1e1f', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
            <h3 style={{ color: '#fff', marginTop: 0, fontSize: '18px' }}>Update Balance</h3>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>User: <strong style={{color: '#fff'}}>{balanceModalUser.email}</strong></p>
            
            <form onSubmit={handleBalanceUpdate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '13px' }}>Action</label>
                <select value={balanceAction} onChange={e => setBalanceAction(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#12151a', color: '#fff', border: '1px solid #333', borderRadius: '6px', outline: 'none' }}>
                  <option value="add">Add Funds</option>
                  <option value="cut">Cut Funds</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '13px' }}>Amount ($)</label>
                <input type="number" step="any" required value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#12151a', color: '#fff', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setBalanceModalUser(null)} style={{ padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Update Balance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 992px) {
          .admin-sidebar { left: 0 !important; }
          .admin-main-content { margin-left: 250px !important; }
          .hide-desktop { display: none !important; }
          .admin-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
