import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShopifyProduct } from "@/types/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const { node } = product;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const variant = node.variants.edges[0]?.node;
    if (!variant) return;

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success("Produto adicionado ao carrinho!", {
      position: "top-center"
    });
  };

  const imageUrl = node.images.edges[0]?.node?.url || '/placeholder.svg';
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const formattedPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Link to={`/produto/${node.handle}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-secondary/20">
            <img
              src={imageUrl}
              alt={node.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start p-4 gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2 w-full">
            {node.title}
          </h3>
          <div className="flex items-center justify-between w-full">
            <p className="text-xl font-bold text-accent">
              {formattedPrice}
            </p>
            <Button 
              size="icon" 
              variant="outline"
              onClick={handleAddToCart}
              className="hover:bg-accent hover:text-accent-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
