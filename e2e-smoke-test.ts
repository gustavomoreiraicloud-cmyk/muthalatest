import { supabase } from "./src/integrations/supabase/client";

async function runSmokeTest() {
  console.log("🚀 Iniciando Testes E2E de Fumaça (Smoke Tests)...");

  // 1. Teste de Conexão com Banco de Dados
  console.log("📡 Testando conexão com Supabase...");
  const { data: settings, error: dbError } = await supabase.from("store_settings").select("*").limit(1);
  if (dbError) throw new Error("Falha na conexão com o banco: " + dbError.message);
  console.log("✅ Conexão DB: OK");

  // 2. Teste de Carregamento do Cardápio
  console.log("🍔 Testando carregamento do cardápio...");
  const { data: menu, error: menuError } = await supabase.from("menu_items").select("*").eq("available", true).limit(5);
  if (menuError || !menu) throw new Error("Falha ao carregar itens do cardápio.");
  console.log(`✅ Cardápio: OK (${menu.length} itens encontrados)`);

  // 3. Teste de Autenticação (Opcional - apenas verificação de estado)
  console.log("🔐 Verificando estado da Auth...");
  const { data: { session } } = await supabase.auth.getSession();
  console.log(session ? "👤 Usuário logado" : "🌐 Navegação anônima disponível");

  console.log("✨ Todos os testes críticos de produção passaram!");
}

runSmokeTest().catch(err => {
  console.error("❌ ERRO NO TESTE E2E:", err);
  process.exit(1);
});
