import React from 'react';
import TrybitCheckout from './TrybitCheckout';
import PrePaymentModalLegacy from './PrePaymentModalLegacy';

// Payment for a NEW order (order is created when the customer starts paying, settled by Trybit).
// Uses Trybit by default; falls back to the legacy manual-crypto modal if the backend reports provider 'manual'.
function PrePaymentModal({ orderData, apiBase, onClose, onPaymentConfirmed }) {
  const [provider, setProvider] = React.useState(null);

  React.useEffect(() => {
    fetch(`${apiBase}/api/payment/provider`)
      .then(r => r.json())
      .then(d => setProvider(d.provider || 'trybit'))
      .catch(() => setProvider('trybit'));
  }, [apiBase]);

  if (provider === null) return null;
  if (provider === 'manual') {
    return (
      <PrePaymentModalLegacy
        orderData={orderData}
        apiBase={apiBase}
        onClose={onClose}
        onPaymentConfirmed={onPaymentConfirmed}
      />
    );
  }
  return (
    <TrybitCheckout
      apiBase={apiBase}
      orderData={orderData}
      title={orderData.type}
      onClose={onClose}
      onPaid={onPaymentConfirmed}
    />
  );
}

export default PrePaymentModal;
