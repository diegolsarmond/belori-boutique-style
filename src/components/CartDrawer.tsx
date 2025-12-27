import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, CreditCard } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
  } = useCartStore();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative group">
          <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent animate-in zoom-in font-bold">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Carrinho
          </SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Seu carrinho está vazio" : `${totalItems} ${totalItems !== 1 ? 'itens' : 'item'} no carrinho`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <div className="bg-secondary/20 p-6 rounded-full inline-block mb-2">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground">Seu carrinho está vazio</p>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                  Adicione itens para ver seu resumo aqui.
                </p>
              </div>
              <Button
                variant="default"
                onClick={() => setIsOpen(false)}
                className="mt-4 min-w-[150px]"
              >
                Começar a Comprar
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-4 pb-4">
                  {items.map((item) => (
                    <div key={item.cartItemId || item.productId} className="flex gap-4 p-3 relative group hover:bg-secondary/10 rounded-xl transition-all border border-transparent hover:border-border">
                      <div className="w-20 h-20 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0 border shadow-sm">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Sem img
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1.5">{item.name}</h4>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                            {item.selectedColor && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-secondary text-secondary-foreground">
                                {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-secondary text-secondary-foreground">
                                {item.selectedSize}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-sm text-primary">
                          {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0 py-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                          onClick={() => item.cartItemId && removeItem(item.cartItemId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-background rounded-md"
                            onClick={() => item.cartItemId && updateQuantity(item.cartItemId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-background rounded-md"
                            onClick={() => item.cartItemId && updateQuantity(item.cartItemId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex-shrink-0 space-y-4 pt-6 border-t bg-background mt-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Frete e impostos calculados no checkout
                  </p>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                  size="lg"
                  disabled={items.length === 0}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Finalizar Compra
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
