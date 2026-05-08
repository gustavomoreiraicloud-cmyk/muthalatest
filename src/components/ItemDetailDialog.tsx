import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

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

export default function ItemDetailDialog({ item, open, onClose }: Props) {
  const { add, open: openCart } = useCart();
  if (!item) return null;

  const handleAdd = () => {
    add({ name: item.name, price: item.price, img: item.img });
    toast.success(`${item.name} adicionado ao pedido`);
    onClose();
    setTimeout(openCart, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border">
        <div className="aspect-[4/3] overflow-hidden">
          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-3xl uppercase leading-tight">
              {item.name}
            </DialogTitle>
            {item.desc && (
              <DialogDescription className="text-muted-foreground text-base pt-1">
                {item.desc}
              </DialogDescription>
            )}
          </DialogHeader>

          {item.ingredients && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">
                Ingredientes
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {item.ingredients.map((ing) => (
                  <li key={ing} className="flex gap-2">
                    <span className="text-primary">•</span> {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-end justify-between gap-4 mt-6 pt-4 border-t border-border">
            <div>
              {item.from && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  A partir de
                </p>
              )}
              <p className="font-display text-3xl text-primary">{item.price}</p>
            </div>
            <Button
              onClick={handleAdd}
              size="lg"
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-bold"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
