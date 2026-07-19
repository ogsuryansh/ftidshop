import React from 'react';

export default function ReceiptsSubmitOrder() {
  return (
    <div style={{ padding: '20px 0', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>New receipt order</h2>
      
      <div style={{ backgroundColor: '#31708f', color: '#d9edf7', padding: '15px 20px', borderRadius: '6px', marginBottom: '30px', fontSize: '14px', lineHeight: '1.5' }}>
        If any information is missing, we will complete it using the most appropriate details available from the tracking information. Please ensure all data is provided in English only
      </div>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Category</label>
          <select style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}>
            <option>Select category</option>
            <option>United States Receipt</option>
            <option>Canada Receipt</option>
            <option>Italy Receipts</option>
            <option>Germany Receipts</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button type="button" style={{ backgroundColor: '#ff8c00', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Create</button>
        </div>
      </form>
    </div>
  );
}
