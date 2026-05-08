import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Phone, Instagram, Clock, MessageCircle, Flame, Award, Leaf, ShoppingBag, Plus, Loader2, ClipboardList } from "lucide-react";

// Import all assets to ensure they are bundled and have stable URLs
import heroBurger from "@/assets/hero-burger.jpg";
import burgerBacon from "@/assets/burger-bacon.jpg";
import burgerBaldurOuro from "@/assets/burger-baldur-ouro.jpg";
import burgerClassic from "@/assets/burger-classic.jpg";
import burgerMuthala from "@/assets/burger-muthala.jpg";
import burgerSpicy from "@/assets/burger-spicy.jpg";
import burgerValkyria from "@/assets/burger-valkyria.jpg";
import comboBanquete from "@/assets/combo-banquete.jpg";
import drinkShake from "@/assets/drink-shake.jpg";
import drinkSoda from "@/assets/drink-soda.jpg";
import hotdogBjorn from "@/assets/hotdog-bjorn.jpg";
import sidesFries from "@/assets/sides-fries.jpg";
import sidesOnion from "@/assets/sides-onion.jpg";
import muthalaLogo from "@/assets/muthala-logo.png";

import StatusBadge from "@/components/StatusBadge";
import ItemDetailDialog, { DetailItem } from "@/components/ItemDetailDialog";
import { useCart, formatBRL } from "@/hooks/useCart";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useMenu } from "@/hooks/useMenu";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { nextOpening, formatNextOpening, DEFAULT_HOURS } from "@/lib/businessHours";

// Map database paths to actual imported asset URLs
export const ASSET_MAP: Record<string, string> = {
  "/src/assets/hero-burger.jpg": heroBurger,
  "/src/assets/burger-bacon.jpg": burgerBacon,
  "/src/assets/burger-baldur-ouro.jpg": burgerBaldurOuro,
  "/src/assets/burger-classic.jpg": burgerClassic,
  "/src/assets/burger-muthala.jpg": burgerMuthala,
  "/src/assets/burger-spicy.jpg": burgerSpicy,
  "/src/assets/burger-valkyria.jpg": burgerValkyria,
  "/src/assets/combo-banquete.jpg": comboBanquete,
  "/src/assets/drink-shake.jpg": drinkShake,
  "/src/assets/drink-soda.jpg": drinkSoda,
  "/src/assets/hotdog-bjorn.jpg": hotdogBjorn,
  "/src/assets/sides-fries.jpg": sidesFries,
  "/src/assets/sides-onion.jpg": sidesOnion,
  "muthala-logo.png": muthalaLogo,
};

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
  useEffect(() => {
    // Scroll to top when entering index
    window.scrollTo(0, 0);
  }, []);

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
    img: (it.image_url && ASSET_MAP[it.image_url]) || it.image_url || FALLBACK_IMG,
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
      <header className={`fixed top-0 inset-x-0 z-40 transition-smooth ${scrolled ? 'backdrop-blur-md bg-background/80 border-b border-border/50 shadow-md' : 'bg-transparent'}`}>
        <nav className="container mx-auto flex items-center justify-between py-3 md:py-4 px-4">
          <a href="#home" className="group flex items-center gap-2 md:gap-3">
            <div className="relative group-hover:scale-105 transition-smooth">
              <img
                src={muthalaLogo}
                alt="Muthala Burger"
                className="relative h-10 w-10 md:h-14 md:w-14 object-contain"
                width={56}
                height={56}
              />
            </div>
            <StatusBadge className="hidden sm:inline-flex" />
          </a>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium uppercase tracking-wider">
            <a href="#menu" className="hover:text-primary transition-smooth">Menu</a>
            <a href="#sobre" className="hover:text-primary transition-smooth">Sobre</a>
            <a href="#avaliacoes" className="hover:text-primary transition-smooth">Avaliações</a>
            <a href="#contato" className="hover:text-primary transition-smooth">Contato</a>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <a
              href="/status"
              aria-label="Acompanhar Pedido"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-border bg-card/50 flex items-center justify-center hover:border-primary hover:text-primary transition-smooth text-primary"
            >
              <ClipboardList className="w-5 h-5" />
            </a>

            <a
              href="https://instagram.com/muthalaburguer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Muthala Burger"
              className="hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-full border border-border bg-card/50 items-center justify-center hover:border-primary hover:text-primary transition-smooth"
            >
              <Instagram className="w-4 h-4" />
            </a>
            
            <button
              onClick={openCart}
              aria-label="Abrir carrinho"
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full border border-border bg-card/50 flex items-center justify-center hover:border-primary hover:text-primary transition-smooth"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] md:min-w-[20px] md:h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] md:text-[11px] font-bold flex items-center justify-center shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>

            <Button asChild size="sm" className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-bold hidden xs:flex">
              <a href="#menu">Cardápio</a>
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden pt-20 md:pt-28 scroll-mt-20">
        <img
          src={heroBurger}
          alt="Hambúrguer artesanal Muthala Burger com queijo derretido"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-black/40 md:bg-black/20" />
        <div className="container mx-auto relative z-10 py-12 md:py-20 px-4">
          <div className="max-w-3xl animate-fade-in-up text-center md:text-left">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.85] mb-3 uppercase tracking-tighter">
              <span className="font-serif-italic normal-case text-gradient-fire block md:inline mb-1 md:mb-0">MUTHALA</span> Burguer
            </h1>
            <p className="text-xs md:text-base text-primary font-bold mb-4 tracking-[0.2em] uppercase">
              O Sabor dos Deuses • Assis/SP
            </p>
            <p className="text-lg md:text-2xl text-foreground/95 max-w-xl mx-auto md:mx-0 mb-6 font-semibold leading-tight">
              Smash de carne nobre e pão selado na manteiga. Experiência única em cada mordida.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mb-8">
              <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-fire text-primary-foreground hover:opacity-95 font-black uppercase tracking-wider text-lg px-10 h-16 shadow-glow animate-pulse-cta">
                <a href="#menu">
                  <ShoppingBag className="mr-2 w-6 h-6" />
                  Pedir agora
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary/50 text-white hover:bg-primary hover:text-primary-foreground font-bold text-lg px-8 h-16 backdrop-blur-sm">
                <a href="#menu">Ver cardápio</a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                <Flame className="w-4 h-4 text-primary" /> 
                <span className="font-medium text-white">Feito na hora</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                <Star className="w-4 h-4 text-primary" /> 
                <span className="font-medium text-white">Sabor Irresistível</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 md:py-32 bg-muted/20 scroll-mt-20 overflow-hidden px-4">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
            <p className="text-primary font-bold mb-3 tracking-widest uppercase text-xs md:text-sm">Nossa História</p>
            <h2 className="font-display text-4xl md:text-6xl mb-6 leading-none">
              Feito com <span className="text-gradient-gold">paixão</span>,<br className="hidden md:block" /> servido com <span className="text-gradient-fire">orgulho</span>.
            </h2>
            <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-6">
              O Muthala Burger nasceu de uma obsessão simples: criar o hambúrguer perfeito.
              Aquele que faz você fechar os olhos na primeira mordida.
            </p>
            <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-8">
              Cada smash é prensado na hora, cada pão é selecionado a dedo, cada molho
              é receita exclusiva da casa. Em Assis, somos referência em sabor autêntico.
            </p>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { icon: Flame, label: "Feito na hora" },
                { icon: Leaf, label: "Artesanal" },
                { icon: Award, label: "Autoral" },
              ].map((f) => (
                <div key={f.label} className="text-center p-3 md:p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                  <f.icon className="w-5 h-5 md:w-7 md:h-7 text-primary mx-auto mb-2" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-tighter md:tracking-normal">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative order-1 md:order-2 px-8 md:px-0">
            <div className="absolute -inset-4 bg-primary/20 rounded-full opacity-30 blur-3xl animate-pulse" />
            <img 
              src={burgerBacon} 
              alt="Hambúrguer artesanal Muthala" 
              className="relative rounded-3xl shadow-2xl w-full max-w-sm mx-auto md:max-w-none" 
              loading="lazy" 
              width={768} 
              height={768} 
            />
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-20 md:py-32 scroll-mt-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="text-primary font-bold mb-3 tracking-widest uppercase text-xs md:text-sm">Cardápio Completo</p>
            <h2 className="font-display text-5xl md:text-7xl mb-4 uppercase leading-none">
              Sabores <span className="font-serif-italic normal-case text-gradient-gold">lendários</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg">Peça agora e receba em casa com rapidez.</p>
          </div>

          {/* Tabs - Mobile Optimized */}
          <div className="sticky top-16 md:top-24 z-30 -mx-4 px-4 py-4 bg-background/95 backdrop-blur-md border-y border-border/50 mb-8 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCat(cat.id);
                  }}
                  className={`px-6 py-2.5 rounded-full whitespace-nowrap text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300 border ${
                    activeCat === cat.id || (!activeCat && cat === categories[0])
                      ? "bg-gradient-gold text-primary-foreground border-transparent shadow-glow scale-105"
                      : "bg-card/50 text-foreground/70 border-border hover:border-primary/40"
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
              <div className="mb-6 flex items-center gap-3">
                <span className="w-8 md:w-12 h-1 bg-gradient-gold rounded-full" />
                <h3 className="font-display text-2xl md:text-4xl uppercase tracking-tight">{current.label}</h3>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
                {current.items.map((item) => {
                  const detail = toDetail(item);
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setDetailItem(detail)}
                      className={`group overflow-hidden bg-card/60 border transition-all duration-300 shadow-xl hover:shadow-glow/20 flex flex-col cursor-pointer ${
                        item.highlight ? "border-primary/60 shadow-glow/30" : "border-border/50 hover:border-primary/40"
                      }`}
                    >
                      {item.highlight && (
                        <div className="bg-gradient-gold text-primary-foreground text-[10px] md:text-xs font-black uppercase tracking-widest py-1.5 px-4 text-center">
                          ⭐ Destaque
                        </div>
                      )}
                      <div className="aspect-[16/10] xs:aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={detail.img}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-700 brightness-[1.05] contrast-[1.1] saturate-[1.1] [image-rendering:auto]"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('/src/assets/')) {
                              target.src = target.src.replace('/src/assets/', '/assets/');
                            }
                          }}
                          loading="lazy"
                          width={768}
                          height={576}
                        />
                      </div>
                      <div className="p-4 md:p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-display text-xl md:text-2xl uppercase leading-none tracking-tight">{item.name}</h4>
                        </div>
                        {item.description && (
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between gap-2 pt-3 mt-auto border-t border-border/40">
                          <p className="font-bold text-primary text-xl md:text-2xl whitespace-nowrap font-display">
                            {formatBRL(Number(item.price))}
                          </p>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailItem(detail);
                            }}
                            className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-bold h-8 md:h-10 text-xs md:text-sm"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Pedir
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
      <section id="avaliacoes" className="py-24 md:py-32 bg-muted/30 scroll-mt-20 overflow-hidden">
        <div className="container mx-auto px-4">
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
          
          <div className="relative">
            <div className="flex animate-infinite-scroll gap-6 py-4 hover:[animation-play-state:paused] w-max">
              {[...reviews, ...reviews, ...reviews].map((r, idx) => (
                <Card key={`${r.name}-${idx}`} className="w-[300px] md:w-[400px] shrink-0 p-8 bg-card border-border shadow-deep hover:border-primary/50 transition-smooth">
                  <div className="flex gap-1 mb-4">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6 italic line-clamp-4">"{r.text}"</p>
                  <p className="font-semibold">{r.name}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 md:py-32 scroll-mt-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary font-bold mb-3 tracking-widest uppercase text-xs md:text-sm">Onde estamos</p>
            <h2 className="font-display text-4xl md:text-6xl uppercase">Visite-nos ou <br className="md:hidden" /><span className="text-gradient-fire">Peça Online</span></h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 bg-card/40 border-border/50 hover:border-primary/40 transition-all flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg mb-1 uppercase tracking-tight">Endereço</h3>
                <p className="text-muted-foreground text-sm">R. Smith Vasconcelos, 312<br/>Centro, Assis · SP</p>
              </Card>
              
              <a href={PHONE} className="block group">
                <Card className="p-5 bg-card/40 border-border/50 group-hover:border-primary/40 transition-all flex flex-col items-center text-center h-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg mb-1 uppercase tracking-tight">Telefone</h3>
                  <p className="text-muted-foreground text-sm">+55 18 99796-2510<br/><span className="text-[10px] text-primary group-hover:underline">Clique para ligar</span></p>
                </Card>
              </a>

              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block group">
                <Card className="p-5 bg-card/40 border-border/50 group-hover:border-primary/40 transition-all flex flex-col items-center text-center h-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg mb-1 uppercase tracking-tight">WhatsApp</h3>
                  <p className="text-muted-foreground text-sm">Resposta imediata<br/><span className="text-[10px] text-primary group-hover:underline">Clique para conversar</span></p>
                </Card>
              </a>

              <Card className="p-5 bg-card/40 border-border/50 transition-all flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <h3 className="font-display text-lg uppercase tracking-tight">Horário</h3>
                </div>
                <p className="text-muted-foreground text-sm">Ter-Dom: 19:00 - 23:00<br/><StatusBadge /></p>
              </Card>
            </div>
            
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-border/50 min-h-[300px] md:min-h-[400px]">
              <iframe
                title="Localização Muthala Burger"
                src="https://www.google.com/maps?q=R.+Smith+Vasconcelos,+312+-+Centro,+Assis+-+SP&output=embed"
                className="w-full h-full min-h-[300px] md:min-h-[400px] border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 bg-black/40 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 items-start">
            <div className="flex flex-col items-center md:items-start">
              <img src={muthalaLogo} alt="Muthala Burger" className="h-20 w-auto mb-4 object-contain" width={96} height={96} loading="lazy" />
              <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">Hambúrgueres artesanais forjados para deuses. A melhor smash burguer de Assis — SP.</p>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-display text-xl mb-4 uppercase tracking-wider">Contato</h4>
              <p className="text-sm text-muted-foreground mb-1">R. Smith Vasconcelos, 312 — Centro</p>
              <p className="text-sm text-muted-foreground mb-1">+55 18 99796-2510</p>
              <p className="text-sm text-muted-foreground">Assis — SP</p>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-display text-xl mb-4 uppercase tracking-wider">Siga-nos</h4>
              <div className="flex justify-center md:justify-start gap-4">
                <a href="https://instagram.com/muthalaburguer" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-card/50 border border-border/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-card/50 border border-border/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border/30 text-center text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} Muthala Burger • Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* FLOATING ACTIONS — Mobile Optimized */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {cartCount > 0 && (
          <button
            onClick={openCart}
            aria-label="Ver carrinho"
            className="h-14 px-6 rounded-full bg-gradient-gold text-primary-foreground font-black flex items-center gap-2 shadow-glow hover:scale-105 transition-all animate-bounce"
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-sm">{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
          </button>
        )}
        <button
          onClick={openCart}
          aria-label="Pedir agora"
          className="h-14 w-14 md:h-14 md:px-8 rounded-full bg-gradient-fire text-primary-foreground font-black uppercase tracking-widest text-sm flex items-center justify-center md:justify-start gap-2 shadow-glow animate-pulse-cta hover:scale-110 transition-all border-2 border-white/20"
        >
          <ShoppingBag className="w-6 h-6 animate-pulse" />
          <span className="hidden md:inline">Pedir agora</span>
        </button>
      </div>

      <ItemDetailDialog
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
};

export default Index;
