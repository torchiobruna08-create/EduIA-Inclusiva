/* Cliente público Supabase — protegido pelas políticas RLS do banco. */
(() => {
  if (!window.supabase?.createClient) { console.error("Biblioteca Supabase não carregada."); return; }
  const SUPABASE_URL = "https://qektyvuvjjndfwuqxwfk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uKBu6i5xea1mOkFDtP4y7Q_3nYN0PyZ";
  window.eduiaSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
})();