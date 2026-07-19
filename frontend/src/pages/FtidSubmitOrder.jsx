import React from 'react';

export default function FtidSubmitOrder() {
  return (
    <div style={{ padding: '20px 0', maxWidth: '1000px', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff', fontWeight: '500' }}>New order</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Country</label>
          <input type="text" placeholder="Inside Store 'Only tracking needed'" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Courier</label>
          <input type="text" placeholder="UPS" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Methods</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> AMAZON (FTID V6) <span style={{ color: '#4caf50' }}>45$</span> <span style={{ backgroundColor: '#a94442', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>Click to read description</span>
            </label>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> CAR UT (Very Limited) <span style={{ color: '#4caf50' }}>45$</span> <span style={{ backgroundColor: '#a94442', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>Click to read description</span>
            </label>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> UPS LTD (must be in transit = yes) <span style={{ color: '#4caf50' }}>55$</span>
            </label>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> UPS RTS <span style={{ color: '#4caf50' }}>55$</span>
            </label>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> UPS LIT Store <span style={{ color: '#4caf50' }}>45$</span> <span style={{ backgroundColor: '#a94442', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>Click to read description</span>
            </label>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> UPS RTS WORLDWIDE <span style={{ color: '#4caf50' }}>75$</span> <span style={{ backgroundColor: '#a94442', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>Click to read description</span>
            </label>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input type="radio" name="method" /> AP LIT WORLDWIDE <span style={{ color: '#4caf50' }}>20$</span> <span style={{ backgroundColor: '#a94442', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>Click to read description</span>
            </label>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Tracking number</label>
          <input type="text" placeholder="Your package tracking number" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Note</label>
          <textarea placeholder="Optional notes for this order" rows="4" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>File (pdf, optional for insider LIT, RTS, PEBCA, LTD) - for uploading multiple files, select them once you have clicked browse</label>
          <input type="file" style={{ color: '#ccc', fontSize: '14px' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button type="button" style={{ backgroundColor: '#ff8c00', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}>Create</button>
        </div>
      </form>
    </div>
  );
}
