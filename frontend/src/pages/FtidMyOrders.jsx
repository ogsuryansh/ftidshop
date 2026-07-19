import React from 'react';

export default function FtidMyOrders() {
  return (
    <div style={{ padding: '20px 0', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>My orders</h2>
      <div style={{ overflowX: 'auto', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#fff', fontSize: '14px' }}>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Country</th>
              <th style={{ padding: '15px' }}>Courier</th>
              <th style={{ padding: '15px' }}>Method</th>
              <th style={{ padding: '15px' }}>Cost</th>
              <th style={{ padding: '15px' }}>Tracking</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px' }}>Created at</th>
              <th style={{ padding: '15px' }}>Options</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '14px', backgroundColor: '#222' }}>
              <td style={{ padding: '15px' }}>#9021</td>
              <td style={{ padding: '15px' }}>USA</td>
              <td style={{ padding: '15px' }}>UPS</td>
              <td style={{ padding: '15px' }}>FTID 3</td>
              <td style={{ padding: '15px' }}>$15.00</td>
              <td style={{ padding: '15px' }}>1Z9999999999999999</td>
              <td style={{ padding: '15px' }}>
                <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Completed</span>
              </td>
              <td style={{ padding: '15px' }}>2026-07-17 14:00</td>
              <td style={{ padding: '15px' }}>
                <button style={{ backgroundColor: '#444', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><i className='bx bx-show'></i> View</button>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '14px' }}>
              <td style={{ padding: '15px' }}>#9022</td>
              <td style={{ padding: '15px' }}>UK</td>
              <td style={{ padding: '15px' }}>FedEx</td>
              <td style={{ padding: '15px' }}>LIT</td>
              <td style={{ padding: '15px' }}>$20.00</td>
              <td style={{ padding: '15px' }}>770012345678</td>
              <td style={{ padding: '15px' }}>
                <span style={{ backgroundColor: '#f39c12', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Pending</span>
              </td>
              <td style={{ padding: '15px' }}>2026-07-18 09:30</td>
              <td style={{ padding: '15px' }}>
                <button style={{ backgroundColor: '#444', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><i className='bx bx-show'></i> View</button>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '14px', backgroundColor: '#222' }}>
              <td style={{ padding: '15px' }}>#9023</td>
              <td style={{ padding: '15px' }}>Canada</td>
              <td style={{ padding: '15px' }}>DHL</td>
              <td style={{ padding: '15px' }}>RTS</td>
              <td style={{ padding: '15px' }}>$12.50</td>
              <td style={{ padding: '15px' }}>9912345678</td>
              <td style={{ padding: '15px' }}>
                <span style={{ backgroundColor: '#dc3545', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Failed</span>
              </td>
              <td style={{ padding: '15px' }}>2026-07-18 11:15</td>
              <td style={{ padding: '15px' }}>
                <button style={{ backgroundColor: '#444', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><i className='bx bx-show'></i> View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
