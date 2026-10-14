import React from 'react';
import { API_BASE } from '../config';
import TrybitCheckout from './TrybitCheckout';
import PaymentModalLegacy from './PaymentModalLegacy';

// Payment for an EXISTING order (deposits, "pay now" from My Orders).
// Uses Trybit by default; falls back to the legacy manual-crypto modal if the backend reports provider 'manual'.
export default function PaymentModal({ order, onClose, onPaymentConfirmed }) {
  const [provider, setProvider] = React.useState(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/payment/provider`)
      .then(r => r.json())
      .then(d => setProvider(d.provider || 'trybit'))
      .catch(() => setProvider('trybit'));
  }, []);

  if (!order) return null;
  if (provider === null) return null;
  if (provider === 'manual') {
    return <PaymentModalLegacy order={order} onClose={onClose} onPaymentConfirmed={onPaymentConfirmed} />;
  }
  return (
    <TrybitCheckout
      apiBase={API_BASE}
      orderId={order._id}
      amount={order.price || 0}
      title={order.name || order.type || 'Service Order'}
      onClose={onClose}
      onPaid={onPaymentConfirmed}
    />
  );
}
