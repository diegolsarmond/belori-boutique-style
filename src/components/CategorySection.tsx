
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { CategoryConfig } from "./Categories";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface CategorySectionProps {
    category: CategoryConfig;
}

export const CategorySection = ({ category }: CategorySectionProps) => {
    const navigate = useNavigate();

    const { data: products, isLoading } = useQuery({
        queryKey: ['products-category-section', category.slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("BeloriBH_products")
                .select("*")
                .eq("is_active", true)
                .eq("category", category.slug)
                .gt("stock_quantity", 0)
                .order("created_at", { ascending: false })
                .limit(4);

            if (error) throw error;
            return data as Product[];
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <category.icon className="h-6 w-6 text-accent" />
                        {category.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">{category.description}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(category.href)}
                    className="hidden md:flex"
                >
                    Ver todos
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            <div className="mt-8 md:hidden text-center">
                <Button
                    variant="outline"
                    onClick={() => navigate(category.href)}
                    className="w-full"
                >
                    Ver todos em {category.name}
                </Button>
            </div>
        </section>
    );
};
