import { useState, useEffect } from "react";
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      if (!handle) throw new Error("Product ID is required");

      const { data, error } = await supabase
        .from("BeloriBH_products")
        .select("*")
        .eq("id", handle)
        .single();

      if (error) throw error;
      return data as unknown as Product;
    }
  });

  useEffect(() => {
    if (productData?.image_url) {
      setSelectedImage(productData.image_url);
    }
  }, [productData]);

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

    if (productData.colors?.length && !selectedColor) {
      toast.error("Por favor, selecione uma cor");
      return;
    }

    if (productData.sizes?.length && !selectedSize) {
      toast.error("Por favor, selecione um tamanho");
      return;
    }

    addItem({
      productId: productData.id,
      name: productData.name,
      price: productData.price,
      quantity: 1,
      imageUrl: productData.image_url,
      selectedColor: selectedColor || undefined,
      selectedSize: selectedSize || undefined,
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
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={productData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground">Sem imagem</span>
                  </div>
                )}
              </div>
              {productData.additional_images && productData.additional_images.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedImage(productData.image_url)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImage === productData.image_url
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-primary/50"
                      }`}
                  >
                    <img
                      src={productData.image_url || ""}
                      alt="Principal"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {productData.additional_images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImage === img
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/50"
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Adicional ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{productData.name}</h1>
                {productData.category && (
                  <span className="inline-block bg-secondary px-3 py-1 rounded-full text-sm font-medium mb-2 capitalize">
                    {productData.category}
                  </span>
                )}
                <p className="text-3xl font-bold text-accent">
                  {Number(productData.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              {productData.colors && productData.colors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Cores:</h3>
                  <div className="flex flex-wrap gap-3">
                    {productData.colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedColor === color
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-input hover:border-primary/50 hover:bg-accent/50"
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {productData.sizes && productData.sizes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Tamanhos:</h3>
                  <div className="flex flex-wrap gap-3">
                    {productData.sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md text-sm transition-all ${selectedSize === size
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-input hover:border-primary/50 hover:bg-accent/50"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{productData.description}</p>
              </div>

              <Button
                size="lg"
                className="w-full text-lg h-12"
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
