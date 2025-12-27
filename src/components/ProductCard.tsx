
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/produto/${product.id}`)}
            className="group cursor-pointer bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-all"
        >
            <div className="aspect-square bg-secondary/20 overflow-hidden relative">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground">Sem imagem</span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                {product.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                    </p>
                )}
                <p className="text-lg font-bold text-accent">
                    {Number(product.price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    })}
                </p>
            </div>
        </div>
    );
};
