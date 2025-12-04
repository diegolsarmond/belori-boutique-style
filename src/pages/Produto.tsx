import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const Produto = () => {
  const { handle } = useParams<{ handle: string }>();
  const addItem = useCartStore(state => state.addItem);

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      if (!handle) throw new Error("Product ID is required");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", handle)
        .single();

      if (error) throw error;
      return data as Product;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Produto não encontrado</p>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (productData.stock_quantity <= 0) {
      toast.error("Produto indisponível no estoque");
      return;
    }

    addItem({
      productId: productData.id,
      name: productData.name,
      price: productData.price,
      quantity: 1,
      imageUrl: productData.image_url
    });

    toast.success("Produto adicionado ao carrinho!", {
      position: "top-center"
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-secondary/20 rounded-lg overflow-hidden">
                {productData.image_url ? (
                  <img
                    src={productData.image_url}
                    alt={productData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground">Sem imagem</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{productData.name}</h1>
                <p className="text-3xl font-bold text-accent">
                  {Number(productData.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{productData.description}</p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={productData.stock_quantity <= 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {productData.stock_quantity > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
              </Button>

              <div className="border-t pt-6 space-y-2 text-sm">
                <p className="text-muted-foreground">✓ Entrega para todo o Brasil</p>
                <p className="text-muted-foreground">✓ Frete calculado no checkout</p>
                <p className="text-muted-foreground">✓ Pagamento seguro</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Produto;
