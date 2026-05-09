import { supabase } from "./src/integrations/supabase/client";

async function runFullRegression() {
  console.log("🚀 Iniciando Regressão E2E Completa - Muthala Burger");
  const results = [];

  try {
    // 1. Configurações da Loja
    console.log("📡 [TEST] Store Settings...");
    const { data: settings, error: sErr } = await supabase.from("store_settings").select("*").maybeSingle();
    if (sErr || !settings) throw new Error("Configurações não encontradas");
    results.push("✅ Store Settings");

    // 2. Integridade do Cardápio
    console.log("🍔 [TEST] Menu Integrity...");
    const { data: menu, error: mErr } = await supabase.from("menu_items").select("*");
    if (mErr || !menu || menu.length === 0) throw new Error("Cardápio vazio ou erro na busca");
    results.push(`✅ Menu (${menu.length} itens)`);

    // 3. Regras de Frete
    console.log("🛵 [TEST] Delivery Ranges...");
    const { data: ranges, error: rErr } = await supabase.from("delivery_ranges").select("*").eq("active", true);
    if (rErr) throw new Error("Erro ao buscar faixas de frete");
    results.push(`✅ Delivery Ranges (${ranges?.length || 0} ativos)`);

    // 4. Sistema de Cupons
    console.log("🎫 [TEST] Coupons...");
    const { data: coupons, error: cErr } = await supabase.from("coupons").select("*").limit(1);
    if (cErr) throw new Error("Erro na tabela de cupons");
    results.push("✅ Coupon System");

    // 5. Histórico de Pedidos (Apenas leitura para não poluir)
    console.log("🛒 [TEST] Orders Access...");
    const { error: oErr } = await supabase.from("orders").select("id").limit(1);
    if (oErr) throw new Error("Erro ao acessar tabela de pedidos");
    results.push("✅ Orders System");

    console.log("\n📊 RELATÓRIO FINAL:");
    results.forEach(r => console.log(r));
    console.log("\n✨ REGRESSÃO CONCLUÍDA COM SUCESSO!");
  } catch (err) {
    console.error("\n❌ FALHA NA REGRESSÃO:", err.message);
    process.exit(1);
  }
}

runFullRegression();
