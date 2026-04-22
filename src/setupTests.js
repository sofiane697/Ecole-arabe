process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON || 'test-anon-key';

// Polyfill Web Crypto pour Jest — adminUtils utilise crypto.getRandomValues.
// Node ≥ 17 expose webcrypto, qui implémente l'API standard du navigateur.
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
