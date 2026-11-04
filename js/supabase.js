(() => {
  // Admin tabs keep their login separate from the customer's shop session.
  const isAdminPage = /(?:^|\/)admin(?:\.html)?\/?$/.test(window.location.pathname);
  const options = isAdminPage
    ? { auth: { storageKey: 'sb-dfbxujmatcaqmpydoyoj-admin-auth-token' } }
    : {};
  window.BX_SUPABASE = supabase.createClient(
    'https://dfbxujmatcaqmpydoyoj.supabase.co',
    'sb_publishable_kvzyZc0wSMUUaTYNmq2BcQ_vO61DvhH',
    options
  );
})();
