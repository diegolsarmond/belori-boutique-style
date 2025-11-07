import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest } from "@/lib/shopify";
import { ShopifyProduct } from "@/types/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      description
      handle
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
    }
  }
`;

const Produto = () => {
  const { handle } = useParams<{ handle: string }>();
  const addItem = useCartStore(state => state.addItem);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      const result = await storefrontApiRequest(PRODUCT_QUERY, { handle });
      return result?.data?.productByHandle;
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

  if (error || !data) {
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

  const product: ShopifyProduct = {
    node: data
  };

  const selectedVariant = product.node.variants.edges[selectedVariantIndex]?.node;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const cartItem = {
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || []
    };
    
    addItem(cartItem);
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
                <img
                  src={product.node.images.edges[0]?.node?.url || '/placeholder.svg'}
                  alt={product.node.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.node.images.edges.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square bg-secondary/20 rounded-md overflow-hidden">
                    <img
                      src={image.node.url}
                      alt={`${product.node.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.node.title}</h1>
                <p className="text-3xl font-bold text-accent">
                  {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || '0').toFixed(2)}
                </p>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{product.node.description}</p>
              </div>

              {product.node.options.map((option, optionIndex) => (
                <div key={option.name}>
                  <label className="block text-sm font-medium mb-2">{option.name}</label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value, valueIndex) => {
                      const variantIndex = product.node.variants.edges.findIndex(
                        v => v.node.selectedOptions.some(o => o.value === value)
                      );
                      return (
                        <Button
                          key={value}
                          variant={selectedVariantIndex === variantIndex ? "default" : "outline"}
                          onClick={() => setSelectedVariantIndex(variantIndex)}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <Button 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={!selectedVariant?.availableForSale}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {selectedVariant?.availableForSale ? 'Adicionar ao Carrinho' : 'Indisponível'}
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
