import React, { useEffect, useState } from 'react';
import PaymentModal from '../components/PaymentModal';
import API_BASE_URL from '../config';

export default function ReceiptsMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      fetch(`${API_BASE_URL}/api/orders/${user.id}`)
        .then(res => res.json())
        .then(data => {
          const receiptOrders = data.filter(o => o.type === 'Receipt');
          setOrders(receiptOrders);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const getStatusBadge = (status, paymentStatus) => {
    const currentStatus = status || paymentStatus || 'Pending Payment';
    let bgColor = '#f39c12';
    if (currentStatus === 'Pending Payment') bgColor = '#ff9800';
    else if (currentStatus === 'Processing') bgColor = '#17a2b8';
    else if (currentStatus === 'Completed' || currentStatus === 'Paid') bgColor = '#28a745';
    else if (currentStatus === 'Cancelled' || currentStatus === 'Failed') bgColor = '#dc3545';

    return (
      <span style={{ backgroundColor: bgColor, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
        {currentStatus}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px 0', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>My Receipt Orders</h2>
      <div style={{ overflowX: 'auto', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
        {loading ? (
          <div style={{ padding: '20px', color: '#ccc', textAlign: 'center' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '30px', color: '#888', textAlign: 'center' }}>No receipt orders found. Submit your first order above!</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#fff', fontSize: '14px' }}>
                <th style={{ padding: '15px' }}>Order ID</th>
                <th style={{ padding: '15px' }}>Category / Entry</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Created At</th>
                <th style={{ padding: '15px' }}>Cost</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={order._id || idx} style={{ borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '14px', backgroundColor: idx % 2 === 0 ? '#222' : 'transparent' }}>
                  <td style={{ padding: '15px', fontFamily: 'monospace' }}>#R-{order._id ? order._id.slice(-6) : idx + 100}</td>
                  <td style={{ padding: '15px' }}>{order.country || order.method || 'Receipt'}</td>
                  <td style={{ padding: '15px' }}>
                    {getStatusBadge(order.status, order.paymentStatus)}
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '15px', color: '#4caf50', fontWeight: 'bold' }}>${order.price || 0}</td>
                  <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                    {order.status === 'Pending Payment' && (
                      <button 
                        onClick={() => setSelectedPaymentOrder(order)} 
                        style={{ background: 'linear-gradient(135deg, #00f2fe, #7f00ff)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        Pay Now
                      </button>
                    )}
                    {order.fileData && order.fileData.data && (
                      <a 
                        href={order.fileData.data} 
                        download={order.fileData.filename || 'receipt_file'} 
                        style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Download 📎
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPaymentOrder && (
        <PaymentModal order={selectedPaymentOrder} onClose={() => setSelectedPaymentOrder(null)} />
      )}
    </div>
  );
}
