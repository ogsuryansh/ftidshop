import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions] = useState([
    { id: 'TXN-001', user: 'john.doe@example.com', method: 'USDT (TRC20)', amount: 150, status: 'Success', date: '2026-07-19' },
    { id: 'TXN-002', user: 'jane.smith@example.com', method: 'TON', amount: 45, status: 'Processing', date: '2026-07-18' },
    { id: 'TXN-003', user: 'mike.ross@example.com', method: 'USDT (BEP20)', amount: 200, status: 'Failed', date: '2026-07-17' },
    { id: 'TXN-004', user: 'alex.w@example.com', method: 'BTC', amount: 75, status: 'Success', date: '2026-07-16' },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, orders, users

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      navigate('/admin/login');
    } else {
      setAdmin(JSON.parse(adminData));
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [uRes, oRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/users'),
        fetch('http://localhost:5000/api/admin/orders')
      ]);
      const uData = await uRes.json();
      const oData = await oRes.json();
      setUsers(uData);
      setOrders(oData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (orderId, updateObj) => {
    try {
      await fetch(`http://localhost:5000/api/admin/order/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateObj)
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  if (!admin) return <div style={{ color: '#fff', padding: '20px' }}>Loading...</div>;

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
          <button onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'dashboard' ? '#c38d5e' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bxs-dashboard'></i> Dashboard Overview
          </button>
          <button onClick={() => { setCurrentView('transactions'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'transactions' ? '#c38d5e' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-money'></i> Manage Transactions
          </button>
          <button onClick={() => { setCurrentView('orders'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'orders' ? '#c38d5e' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-cart'></i> Manage Orders
          </button>
          <button onClick={() => { setCurrentView('users'); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentView === 'users' ? '#c38d5e' : '#999', fontSize: '14px', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <i className='bx bx-user'></i> Manage Users
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
            <div style={{ color: '#fff', fontSize: '14px' }}><i className='bx bx-user-circle'></i> {admin.username}</div>
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
                  <div className="text_small color_neutral mb_2">Total Revenue</div>
                  <div className="text_xxlarge weight_bold">${orders.reduce((sum, o) => sum + (o.price || 0), 0)}</div>
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
              <h3 className="text_large mb_4">Deposit Transactions</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th className="p_2">TXN ID</th>
                    <th className="p_2">User</th>
                    <th className="p_2">Method</th>
                    <th className="p_2">Amount</th>
                    <th className="p_2">Date</th>
                    <th className="p_2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                      <td className="p_2 color_neutral">{t.id}</td>
                      <td className="p_2">{t.user}</td>
                      <td className="p_2">{t.method}</td>
                      <td className="p_2" style={{ color: '#4caf50', fontWeight: 'bold' }}>${t.amount}</td>
                      <td className="p_2">{t.date}</td>
                      <td className="p_2">
                          <span style={{ 
                              color: t.status === 'Success' ? '#4caf50' : t.status === 'Failed' ? '#f44336' : '#ff9800',
                              fontWeight: 'bold',
                              backgroundColor: t.status === 'Success' ? 'rgba(76, 175, 80, 0.1)' : t.status === 'Failed' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                              padding: '4px 8px', borderRadius: '4px'
                          }}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && <tr><td colSpan="6" className="p_4 align_center color_neutral">No transactions found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {currentView === 'orders' && (
            <div className="bg_secondary radius_medium p_6" style={{ overflowX: 'auto' }}>
              <h3 className="text_large mb_4">Manage Orders</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '850px' }}>
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
                        <button
                          onClick={() => handleStatusChange(o._id, { status: 'Completed', paymentStatus: 'Paid' })}
                          style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Approve All
                        </button>
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
              <h3 className="text_large mb_4">Manage Users</h3>
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
