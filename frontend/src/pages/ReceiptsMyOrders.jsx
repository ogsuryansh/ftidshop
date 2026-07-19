import React from 'react';

export default function ReceiptsMyOrders() {
  return (
    <div style={{ padding: '20px 0', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>Orders</h2>
      <div style={{ overflowX: 'auto', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#fff', fontSize: '14px' }}>
              <th style={{ padding: '15px' }}>Order ID</th>
              <th style={{ padding: '15px' }}>Entry Name</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px' }}>Created At</th>
              <th style={{ padding: '15px' }}>Completed At</th>
              <th style={{ padding: '15px' }}>Cost</th>
              <th style={{ padding: '15px' }}>Options</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '14px', backgroundColor: '#222' }}>
              <td style={{ padding: '15px' }}>#R-1050</td>
              <td style={{ padding: '15px' }}>Apple Store Receipt</td>
              <td style={{ padding: '15px' }}>
                <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Completed</span>
              </td>
              <td style={{ padding: '15px' }}>2026-07-16 18:00</td>
              <td style={{ padding: '15px' }}>2026-07-16 18:45</td>
              <td style={{ padding: '15px' }}>$5.00</td>
              <td style={{ padding: '15px' }}>
                <button style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><i className='bx bx-download'></i> Download</button>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '14px' }}>
              <td style={{ padding: '15px' }}>#R-1051</td>
              <td style={{ padding: '15px' }}>Amazon Invoice (UK)</td>
              <td style={{ padding: '15px' }}>
                <span style={{ backgroundColor: '#f39c12', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Processing</span>
              </td>
              <td style={{ padding: '15px' }}>2026-07-18 10:20</td>
              <td style={{ padding: '15px' }}>-</td>
              <td style={{ padding: '15px' }}>$7.50</td>
              <td style={{ padding: '15px' }}>
                <button style={{ backgroundColor: '#444', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'not-allowed', fontSize: '12px' }} disabled><i className='bx bx-download'></i> Download</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
