import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Phone, Instagram, Clock, MessageCircle, Flame, Award, Leaf, ShoppingBag, Plus, Loader2 } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";
import burgerBacon from "@/assets/burger-bacon.jpg";
import muthalaLogo from "@/assets/muthala-logo.png";
import StatusBadge from "@/components/StatusBadge";
import ItemDetailDialog, { DetailItem } from "@/components/ItemDetailDialog";
import { useCart, formatBRL } from "@/hooks/useCart";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useMenu } from "@/hooks/useMenu";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { nextOpening, formatNextOpening, DEFAULT_HOURS } from "@/lib/businessHours";

const PHONE = "tel:+5518997962510";
const FALLBACK_IMG = "/placeholder.svg";

const CATEGORY_LABELS: Record<string, string> = {
  promocoes: "Promoções",
  hamburgueres: "Hambúrgueres",
  hotdogs: "Hot Dogs",
  porcoes: "Porções",
  bebidas: "Bebidas",
};

const reviews = [
  { name: "Alessandra Vieira Venceslau", text: "Gente do céu, que delícia, não sou de Assis mas demos o tiro certo, a casa é linda, o atendimento é vipíssimo e a comida, meu Deus, tá no hanking dos melhores hambúrguers da vida, pedi o Odin... espetacular!", rating: 5 },
  { name: "Bruno de Oliveira", text: "Hamburger maravilhoso, atendimento profissional, ambiente acolhedor. Tudo perfeito a começar pelo blend do hamburguer. Estão de parabéns!", rating: 5 },
  { name: "Juan Santos", text: "Lugar incrível, ambiente aconchegante e agradável, o lanche é sem explicação de bom, apenas peçam o Bjorn, realmente forjado pelos deuses.", rating: 5 },
  { name: "Dra. Sandra Regina", text: "Ambiente arejado, muitas opções de mesa. Achei interessante pois agrada famílias com crianças, casais e grupos de amigo. Os jogos são maravilhosos e os lanches suculentos!", rating: 5 },
  { name: "Manuella Caron", text: "Ambiente confortável e limpo, garçons gentis, o lanche é maravilhoso, o atendimento é rápido e eficiente. Recomendo muito!!", rating: 5 },
  { name: "Ana Luisa", text: "Lanches maravilhosos e dignos de nórdicos, ambiente muito aconchegante, atendimento impecável, garçons super simpáticos.", rating: 5 },
];

const Index = () => {
  const whatsappLink = buildWhatsAppLink();
  const { items: dbItems, loading: menuLoading } = useMenu();
  const { settings } = useStoreSettings();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const { count: cartCount, open: openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categories = useMemo(() => {
    const grouped: Record<string, typeof dbItems> = {};
    dbItems.forEach((it) => {
      (grouped[it.category] ??= []).push(it);
    });
    const order = ["promocoes", "hamburgueres", "hotdogs", "porcoes", "bebidas"];
    const known = order.filter((id) => grouped[id]?.length).map((id) => ({
      id,
      label: CATEGORY_LABELS[id] ?? id,
      items: grouped[id],
    }));
    const extras = Object.keys(grouped)
      .filter((id) => !order.includes(id))
      .map((id) => ({ id, label: CATEGORY_LABELS[id] ?? id, items: grouped[id] }));
    return [...known, ...extras];
  }, [dbItems]);

  const current = categories.find((c) => c.id === activeCat) ?? categories[0];

  const toDetail = (it: typeof dbItems[number]): DetailItem => ({
    name: it.name,
    price: formatBRL(Number(it.price)),
    img: it.image_url || FALLBACK_IMG,
    desc: it.description ?? undefined,
    ingredients: it.ingredients ?? undefined,
  });


  return (
    <div className="min-h-screen bg-background text-foreground">
      {settings && !settings.is_open && (() => {
        const next = nextOpening(settings.business_hours ?? DEFAULT_HOURS);
        return (
          <div className="fixed top-0 inset-x-0 z-50 bg-destructive text-destructive-foreground text-center text-sm font-bold py-2 px-4">
            🔒 Fechado agora{next ? ` — ${formatNextOpening(next)}` : " — não estamos aceitando pedidos"}
          </div>
        );
      })()}
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <nav className="container mx-auto flex items-center justify-between py-4">
          <a href="#home" className="group flex items-center gap-3">
            <div className="relative group-hover:scale-105 transition-smooth">
              <img
                src={muthalaLogo}
                alt="Muthala Burger"
                className="relative h-14 w-14 object-contain"
                width={56}
                height={56}
              />
            </div>
            <StatusBadge className="hidden sm:inline-flex" />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#menu" className="hover:text-primary transition-smooth">Menu</a>
            <a href="#sobre" className="hover:text-primary transition-smooth">Sobre</a>
            <a href="#avaliacoes" className="hover:text-primary transition-smooth">Avaliações</a>
            <a href="#contato" className="hover:text-primary transition-smooth">Contato</a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://instagram.com/muthalaburguer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Muthala Burger"
              className="hidden sm:flex w-10 h-10 rounded-full border border-border bg-card items-center justify-center hover:border-primary hover:text-primary transition-smooth"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <button
              onClick={openCart}
              aria-label="Abrir carrinho"
              className="relative w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:border-primary hover:text-primary transition-smooth"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Button asChild className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-bold">
              <a href="#menu">Ver Cardápio</a>
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="relative min-h-[88vh] md:min-h-screen flex items-center overflow-hidden pt-24 md:pt-28 scroll-mt-20">
        <img
          src={heroBurger}
          alt="Hambúrguer artesanal Muthala Burger com queijo derretido"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-background/50" />
        <div className="container mx-auto relative z-10 py-12 md:py-20">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-4 uppercase">
              Hambúrgueres <span className="font-serif-italic normal-case text-gradient-fire">artesanais</span>
            </h1>
            <p className="text-base md:text-xl text-foreground/90 max-w-xl mb-2 font-semibold">
              Smash de carne nobre, pão dourado na manteiga e molho exclusivo da casa.
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6">
              Peça direto pelo WhatsApp e receba quentinho na sua porta.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
              <Button asChild size="lg" className="relative bg-gradient-fire text-primary-foreground hover:opacity-95 font-black uppercase tracking-wider text-base md:text-lg px-8 md:px-10 h-14 md:h-16 shadow-glow animate-pulse-cta">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                  Pedir agora pelo WhatsApp
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold text-base px-6 md:px-8 h-14 md:h-16">
                <a href="#menu">Ver cardápio</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border">
                <Flame className="w-3.5 h-3.5 text-primary" /> Smash na hora
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border">
                <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Mínimo {formatBRL(settings?.min_order ?? 30)}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-border">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Centro · Assis SP
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-24 md:py-32 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary font-semibold mb-3 tracking-wider uppercase text-sm">Nossa História</p>
            <h2 className="font-display text-5xl md:text-6xl mb-6 leading-tight">
              Feito com <span className="text-gradient-gold">paixão</span>, servido com <span className="text-gradient-fire">orgulho</span>.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              O Muthala Burger nasceu de uma obsessão simples: criar o hambúrguer perfeito.
              Aquele que faz você fechar os olhos na primeira mordida.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Cada smash é prensado na hora, cada pão é selecionado a dedo, cada molho
              é receita exclusiva da casa. Em Assis, somos referência em sabor autêntico
              e qualidade que você sente.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Flame, label: "Smash na hora" },
                { icon: Leaf, label: "Ingredientes frescos" },
                { icon: Award, label: "Receita autoral" },
              ].map((f) => (
                <div key={f.label} className="text-center p-4 rounded-xl bg-card border border-border">
                  <f.icon className="w-7 h-7 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-fire rounded-3xl opacity-30 blur-2xl" />
            <img src={burgerBacon} alt="Hambúrguer artesanal Muthala" className="relative rounded-3xl shadow-deep w-full" loading="lazy" width={768} height={768} />
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-24 md:py-32 scroll-mt-20">
        <div className="container mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-primary font-semibold mb-3 tracking-wider uppercase text-sm">Cardápio Completo</p>
            <h2 className="font-display text-5xl md:text-7xl mb-4 uppercase">
              Sabores <span className="font-serif-italic normal-case text-gradient-gold">lendários</span>
            </h2>
            <p className="text-muted-foreground text-lg">Cada lanche inspirado na mitologia nórdica. Pedido mínimo {formatBRL(settings?.min_order ?? 30)}.</p>
          </div>

          {/* Tabs */}
          <div className="sticky top-24 z-20 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-md border-y border-border mb-10">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-start md:justify-center">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-smooth border ${
                    activeCat === cat.id
                      ? "bg-gradient-gold text-primary-foreground border-transparent shadow-glow"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {menuLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !current ? (
            <p className="text-center text-muted-foreground py-20">Cardápio em breve.</p>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-4">
                <span className="w-12 h-1 bg-gradient-gold rounded-full" />
                <h3 className="font-display text-3xl md:text-4xl uppercase">{current.label}</h3>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {current.items.map((item) => {
                  const detail = toDetail(item);
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setDetailItem(detail)}
                      className={`group overflow-hidden bg-card border transition-smooth shadow-deep flex flex-col cursor-pointer ${
                        item.highlight ? "border-primary/60 shadow-glow" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {item.highlight && (
                        <div className="bg-gradient-gold text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-4 text-center">
                          ⭐ Destaque da casa
                        </div>
                      )}
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={detail.img}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-700"
                          loading="lazy"
                          width={768}
                          height={576}
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-display text-2xl uppercase leading-tight">{item.name}</h4>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                        )}
                        {item.ingredients?.length > 0 && (
                          <ul className="text-xs text-muted-foreground/90 space-y-1 mb-4 flex-1 line-clamp-4">
                            {item.ingredients.slice(0, 4).map((ing) => (
                              <li key={ing} className="flex gap-2">
                                <span className="text-primary">•</span>
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex items-end justify-between gap-4 pt-3 mt-auto border-t border-border">
                          <p className="font-bold text-primary text-2xl whitespace-nowrap font-display">
                            {formatBRL(Number(item.price))}
                          </p>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailItem(detail);
                            }}
                            className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-bold"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Adicionar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="avaliacoes" className="py-24 md:py-32 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-7 h-7 fill-primary text-primary" />
              ))}
            </div>
            <h2 className="font-display text-5xl md:text-7xl mb-3">
              <span className="text-gradient-gold">4.7</span> de 5 estrelas
            </h2>
            <p className="text-muted-foreground text-lg">Baseado em 98 avaliações de clientes reais</p>
          </div>
          <div className="relative group">
            <div className="flex overflow-hidden gap-6 py-4">
              <div className="flex animate-infinite-scroll gap-6 hover:[animation-play-state:paused]">
                {[...reviews, ...reviews].map((r, idx) => (
                  <Card key={`${r.name}-${idx}`} className="w-[300px] md:w-[400px] shrink-0 p-8 bg-card border-border shadow-deep hover:border-primary/50 transition-smooth">
                    <div className="flex gap-1 mb-4">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                      ))}
                    </div>

                <p className="text-foreground/90 leading-relaxed mb-6 italic">"{r.text}"</p>
                <p className="font-semibold">{r.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-24 md:py-32 scroll-mt-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-3 tracking-wider uppercase text-sm">Visite-nos</p>
            <h2 className="font-display text-5xl md:text-7xl">Venha provar <span className="text-gradient-fire">ao vivo</span></h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-smooth">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-1">Endereço</h3>
                    <p className="text-muted-foreground">R. Smith Vasconcelos, 312 — Centro, Assis · SP</p>
                  </div>
                </div>
              </Card>
              <a href={PHONE}>
                <Card className="p-6 bg-card border-border hover:border-primary/50 transition-smooth cursor-pointer">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl mb-1">Telefone</h3>
                      <p className="text-muted-foreground">+55 18 99796-2510 · clique para ligar</p>
                    </div>
                  </div>
                </Card>
              </a>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Card className="p-6 bg-card border-border hover:border-primary/50 transition-smooth cursor-pointer">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl mb-1">WhatsApp</h3>
                      <p className="text-muted-foreground">Peça já — resposta rápida</p>
                    </div>
                  </div>
                </Card>
              </a>
              <a href="https://instagram.com/muthalaburguer" target="_blank" rel="noopener noreferrer">
                <Card className="p-6 bg-card border-border hover:border-primary/50 transition-smooth cursor-pointer">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Instagram className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl mb-1">@muthalaburguer</h3>
                      <p className="text-muted-foreground">Siga e veja as novidades</p>
                    </div>
                  </div>
                </Card>
              </a>
              <Card className="p-6 bg-card border-border">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-xl">Horário</h3>
                      <StatusBadge />
                    </div>
                    <p className="text-muted-foreground">Aberto das 18:00 às 23:00</p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-deep border border-border min-h-[400px]">
              <iframe
                title="Localização Muthala Burger"
                src="https://www.google.com/maps?q=R.+Smith+Vasconcelos,+312+-+Centro,+Assis+-+SP&output=embed"
                className="w-full h-full min-h-[400px] border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-jet/50 py-12">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <img src={muthalaLogo} alt="Muthala Burger" className="h-24 w-auto mb-3 object-contain" width={96} height={96} loading="lazy" />
            <p className="text-sm text-muted-foreground">Hambúrgueres artesanais em Assis — SP. Sabor que vicia.</p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Contato</h4>
            <p className="text-sm text-muted-foreground">R. Smith Vasconcelos, 312 — Centro</p>
            <p className="text-sm text-muted-foreground">+55 18 99796-2510</p>
            <p className="text-sm text-muted-foreground">Aberto até 23:00</p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Redes</h4>
            <div className="flex gap-3">
              <a href="https://instagram.com/muthalaburguer" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href={PHONE} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Muthala Burger. Todos os direitos reservados.
        </div>
      </footer>

      {/* FLOATING WHATSAPP — chamativo */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pedir agora pelo WhatsApp"
        className="fixed bottom-6 right-6 z-50 h-14 px-5 rounded-full bg-[hsl(142_76%_45%)] hover:bg-[hsl(142_76%_40%)] text-white font-black uppercase tracking-wider text-sm flex items-center gap-2 shadow-glow animate-pulse-whats hover:scale-105 transition-smooth"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Pedir agora</span>
      </a>

      {cartCount > 0 && (
        <button
          onClick={openCart}
          aria-label="Ver carrinho"
          className="fixed bottom-24 right-6 z-50 h-14 px-5 rounded-full bg-gradient-gold text-primary-foreground font-bold flex items-center gap-2 shadow-glow hover:scale-105 transition-smooth"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
        </button>
      )}

      <ItemDetailDialog
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
};

export default Index;
