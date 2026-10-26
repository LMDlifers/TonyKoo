// The browser only uses this to hide expired share options. The Worker verifies the signature.
export function receiptIsCurrent(receipt) {
  if (typeof receipt !== 'string') return false;
  try {
    const part = receipt.split('.')[0];
    if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) return false;
    const encoded = part.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded + '='.repeat((4 - encoded.length % 4) % 4)));
    return Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch { return false; }
}
