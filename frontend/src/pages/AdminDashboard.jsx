import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, orders, users, transactions
  const [deletingId, setDeletingId] = useState(null);

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
      const [uRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/orders`, { headers: getAuthHeaders() })
      ]);

      if (uRes.status === 401 || uRes.status === 403 || oRes.status === 401 || oRes.status === 403) {
        handleLogout();
        return;
      }

      const uData = await uRes.json();
      const oData = await oRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
      setOrders(Array.isArray(oData) ? oData : []);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    }
  }, [getAuthHeaders, handleLogout]);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    const token = localStorage.getItem('admin_token');
    if (!adminData || !token) {
      navigate('/admin/login');
    } else {
      setAdmin(JSON.parse(adminData));
      fetchData();
    }
  }, [navigate, fetchData]);

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
          <button onClick={() => { setCurrentView('users'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'users' ? '#00f2fe' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-user'></i> Manage Users ({users.length})
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
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #333' }}>
                      <td className="p_2">{u.name}</td>
                      <td className="p_2">{u.email}</td>
                      <td className="p_2" style={{ color: '#4caf50', fontWeight: 'bold' }}>${u.credits}</td>
                      <td className="p_2">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                   {users.length === 0 && <tr><td colSpan="4" className="p_4 align_center color_neutral">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
