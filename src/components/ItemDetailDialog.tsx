import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Info } from "lucide-react";
import { useCart, formatBRL } from "@/hooks/useCart";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export type DetailItem = {
  name: string;
  price: string;
  img: string;
  desc?: string;
  ingredients?: string[];
  from?: boolean;
};

type Props = {
  item: DetailItem | null;
  open: boolean;
  onClose: () => void;
};

const getBurgerSizes = (itemName: string) => {
  if (itemName === 'BALDUR DE OURO' || itemName === 'COMBO BANQUETE NÓRDICO' || itemName.includes('DOG')) {
    return [];
  }
  
  const basePrices: Record<string, number> = {
    'VALHALLA': 52.90, 'YGGDRASIL': 26.90, 'ASGARD': 33.90, 'MUTHALA': 42.90,
    'RAGNAROK': 42.90, 'ODIN': 39.90, 'JOTUN': 52.90, 'BJORN': 42.90,
    'BALDUR': 29.90, 'MIDGARD': 39.90, 'BIFROST': 36.90, 'FRIGGA': 36.90, 'LOKI': 33.90,
    'IDUNN': 33.90, 'VIDAR': 29.90, 'VALKYRIA': 29.90, 'FREYA': 29.90
  };

  return [
    { id: "100g", label: "BURGER 100g", price: 0 },
    { id: "180g", label: "BURGER 180g", price: (itemName === 'VALHALLA' || itemName === 'JOTUN' || itemName === 'MUTHALA' || itemName === 'RAGNAROK' || itemName === 'BJORN') ? 6 : 6 },
    { id: "combo", label: "COMBO COMPLETO: BURGER • BATATA P + BEBIDA LATA", price: (itemName === 'YGGDRASIL' || itemName === 'BALDUR' || itemName === 'VIDAR' || itemName === 'VALKYRIA' || itemName === 'FREYA') ? 27 : 26 },
    { id: "combo_coca", label: "COMBO COCA: BURGER • COCA-COLA LATA", price: (itemName === 'YGGDRASIL' || itemName === 'BALDUR' || itemName === 'VIDAR' || itemName === 'VALKYRIA' || itemName === 'FREYA') ? 16 : 13 },
  ];
};

const getPortionSizes = (itemName: string) => {
  if (itemName === 'Batata Simples' || itemName === 'Batata Especial') {
    return [
      { id: "p", label: "P 170g", price: 0 },
      { id: "g", label: "G 350g", price: 13 },
    ];
  }
  return [];
};

const BEVERAGES = [
  { id: "conti_cola", label: "CONTI COLA LATA", price: 3.99 },
  { id: "conti_guarana", label: "CONTI GUARANÁ LATA", price: 3.99 },
];

const ADDITIONALS = [
  { id: "h100", label: "Hambúrguer 100g", price: 12.9 },
  { id: "h180", label: "Hambúrguer 180g", price: 16.9 },
  { id: "bacon_p", label: "Bacon Picado", price: 6.9 },
  { id: "bacon_f", label: "Bacon Fatiado (2 fatias)", price: 6.9 },
  { id: "lingua", label: "Linguiça 100g", price: 16.9 },
  { id: "ovo", label: "Ovo Frito", price: 3.9 },
  { id: "cheddar_f", label: "Queijo Cheddar (2 fatias)", price: 4.9 },
  { id: "prato_f", label: "Queijo Prato (2 fatias)", price: 4.9 },
  { id: "provolone_f", label: "Queijo Provolone (2 fatias)", price: 6.9 },
  { id: "coalho_mel", label: "Queijo Coalho no Mel (1 fatia)", price: 12.9 },
  { id: "creme_cheddar", label: "Creme de Cheddar", price: 10.9 },
  { id: "creme_provolone", label: "Creme de Provolone", price: 10.9 },
  { id: "abacaxi_mel", label: "Abacaxi no Mel (1 fatia)", price: 6.9 },
  { id: "cebola_caram", label: "Cebola Caramelizada", price: 3.9 },
  { id: "banana_terra", label: "Banana da Terra Frita (3 fatias)", price: 3.9 },
  { id: "vinagrete", label: "Vinagrete", price: 3.9 },
  { id: "tomate", label: "Tomate (fatias)", price: 3.9 },
  { id: "rucula", label: "Rúcula (folhas)", price: 2.9 },
  { id: "picles", label: "Picles (porção)", price: 2.9 },
  { id: "alface", label: "Alface Americana (folha)", price: 2.9 },
  { id: "doce_leite", label: "Doce de Leite", price: 6.9 },
  { id: "nutella", label: "Nutella", price: 12.9 },
];

const DONENESS = [
  { id: "mal_passado", label: "Mal Passado" },
  { id: "ao_ponto", label: "Ao Ponto" },
  { id: "bem_passado", label: "Bem Passado" },
];

export default function ItemDetailDialog({ item, open, onClose }: Props) {
  const { add, open: openCart } = useCart();
  const [size, setSize] = useState("");
  const [beverage, setBeverage] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [doneness, setDoneness] = useState("ao_ponto");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);

  const burgerSizes = useMemo(() => item ? getBurgerSizes(item.name) : [], [item]);
  const portionSizes = useMemo(() => item ? getPortionSizes(item.name) : [], [item]);
  const allSizes = useMemo(() => [...burgerSizes, ...portionSizes], [burgerSizes, portionSizes]);

  useEffect(() => {
    if (open && item) {
      const initialSizes = [...getBurgerSizes(item.name), ...getPortionSizes(item.name)];
      setSize(initialSizes.length > 0 ? initialSizes[0].id : "");
      setBeverage("");
      setSelectedExtras([]);
      setDoneness("ao_ponto");
      setNotes("");
      setQty(1);
    }
  }, [open, item]);

  const basePrice = useMemo(() => {
    if (!item) return 0;
    const cleaned = item.price.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [item]);

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let total = basePrice;
    const selectedSize = allSizes.find(s => s.id === size);
    if (selectedSize) total += selectedSize.price;

    if (beverage) {
      const selectedBev = BEVERAGES.find(b => b.id === beverage);
      if (selectedBev) total += selectedBev.price;
    }

    selectedExtras.forEach(extraId => {
      const extra = ADDITIONALS.find(e => e.id === extraId);
      if (extra) total += extra.price;
    });

    return total * qty;
  }, [item, basePrice, allSizes, size, beverage, selectedExtras, qty]);

  if (!item) return null;

  const handleAdd = () => {
    const sizeLabel = allSizes.find(s => s.id === size)?.label;
    const bevLabel = BEVERAGES.find(b => b.id === beverage)?.label;
    const extrasLabels = selectedExtras.map(id => ADDITIONALS.find(e => e.id === id)?.label).filter(Boolean) as string[];
    const donenessLabel = DONENESS.find(d => d.id === doneness)?.label;

    const cartItem = {
      name: item.name,
      price: formatBRL(totalPrice / qty),
      img: item.img,
      options: {
        burgerSize: sizeLabel,
        beverage: bevLabel,
        extras: extrasLabels,
        doneness: donenessLabel,
        notes: notes.trim() || undefined
      }
    };

    for (let i = 0; i < qty; i++) {
      add(cartItem);
    }

    toast.success(`${qty}x ${item.name} adicionado ao pedido`);
    onClose();
    setTimeout(openCart, 200);
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border h-[90vh] flex flex-col">
        <ScrollArea className="flex-1">
          <div className="relative aspect-video sm:aspect-[21/9] overflow-hidden">
            <img 
              src={item.img} 
              alt={item.name} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('/src/assets/')) {
                  target.src = target.src.replace('/src/assets/', '/assets/');
                }
              }}
            />
          </div>
          
          <div className="p-6 space-y-8 pb-32">
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-4xl uppercase leading-tight text-primary">
                {item.name}
              </DialogTitle>
              {item.desc && (
                <DialogDescription className="text-muted-foreground text-base pt-2 leading-relaxed">
                  {item.desc}
                </DialogDescription>
              )}
            </DialogHeader>

            {allSizes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-tight">Escolha 1 opção</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Obrigatório</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">1/1</span>
                </div>
                <RadioGroup value={size} onValueChange={setSize} className="gap-0">
                  {allSizes.map((s) => (
                    <Label
                      key={s.id}
                      className="flex items-center justify-between p-4 border-b border-border/50 cursor-pointer hover:bg-muted/10 transition-colors last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={s.id} />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatBRL(basePrice + s.price)}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">CONTI 1,99 CENTAVOS</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Escolha até 1 opção</p>
                </div>
              </div>
              <RadioGroup value={beverage} onValueChange={setBeverage} className="gap-0">
                <Label className="flex items-center gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-muted/10">
                  <RadioGroupItem value="" />
                  <span className="text-sm">Nenhuma opção</span>
                </Label>
                {BEVERAGES.map((b) => (
                  <Label
                    key={b.id}
                    className="flex items-center justify-between p-4 border-b border-border/50 cursor-pointer hover:bg-muted/10 transition-colors last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={b.id} />
                      <span className="text-sm font-medium">{b.label}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">+{formatBRL(b.price)}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Adicionais</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Escolha até 20 opções</p>
                </div>
              </div>
              <div className="grid gap-0">
                {ADDITIONALS.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between p-4 border-b border-border/50 hover:bg-muted/10 transition-colors last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={extra.id}
                        checked={selectedExtras.includes(extra.id)}
                        onCheckedChange={() => toggleExtra(extra.id)}
                      />
                      <Label htmlFor={extra.id} className="text-sm font-medium cursor-pointer">
                        {extra.label}
                      </Label>
                    </div>
                    <span className="text-sm font-bold text-primary">+{formatBRL(extra.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-tight">Ponto do Hambúrger</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Escolha 1 opção</p>
                </div>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">Obrigatório</span>
              </div>
              <RadioGroup value={doneness} onValueChange={setDoneness} className="gap-0">
                {DONENESS.map((d) => (
                  <Label
                    key={d.id}
                    className="flex items-center gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-muted/10 transition-colors last:border-0"
                  >
                    <RadioGroupItem value={d.id} />
                    <span className="text-sm font-medium">{d.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-tight">Observações</h4>
              <Textarea
                placeholder="Digite as observações aqui..."
                className="min-h-[100px] resize-none bg-background/50"
                maxLength={180}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg text-[10px] text-muted-foreground leading-snug">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                <p>Neste campo não são aceitas modificações que podem gerar cobrança adicional.</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 inset-x-0 bg-card border-t border-border p-4 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-1">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleAdd}
            className="flex-1 h-12 bg-gradient-gold text-primary-foreground hover:opacity-95 font-bold uppercase tracking-wide text-sm"
          >
            Adicionar <span className="mx-2">•</span> {formatBRL(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
