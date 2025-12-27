import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Footprints, Shirt, Sparkles, Palette, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LucideIcon } from "lucide-react";

interface CategoryConfig {
  name: string;
  icon: LucideIcon;
  href: string;
  description: string;
  slug: string;
}

const allCategories: CategoryConfig[] = [
  {
    name: "Roupas",
    icon: Shirt,
    href: "/categoria/roupas",
    description: "Moda para todos os estilos",
    slug: "roupas"
  },
  {
    name: "Sapatos",
    icon: Footprints,
    href: "/categoria/sapatos",
    description: "Tênis, sapatos e sapatilhas",
    slug: "sapatos"
  },
  {
    name: "Acessórios",
    icon: Sparkles,
    href: "/categoria/acessorios",
    description: "Complemente seu visual",
    slug: "acessorios"
  },
  {
    name: "Outros",
    icon: Package,
    href: "/categoria/outros",
    description: "Mais produtos para você",
    slug: "outros"
  }
];

export const Categories = () => {
  const { data: productCounts, isLoading } = useQuery({
    queryKey: ['category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_active", true)
        .gt("stock_quantity", 0);

      if (error) throw error;

      // Contar produtos por categoria
      const counts: Record<string, number> = {};
      data?.forEach(product => {
        if (product.category) {
          counts[product.category] = (counts[product.category] || 0) + 1;
        }
      });
      return counts;
    }
  });

  // Filtrar categorias que têm produtos
  const categoriesWithProducts = allCategories.filter(
    category => productCounts && productCounts[category.slug] > 0
  );

  // Não exibir a seção se estiver carregando ou não houver categorias com produtos
  if (isLoading || categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossas Categorias</h2>
        <p className="text-muted-foreground">Explore nossa seleção cuidadosamente escolhida</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categoriesWithProducts.map((category) => (
          <Link key={category.name} to={category.href}>
            <Card className="group hover:shadow-lg transition-all hover:border-accent">
              <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center">
                <category.icon className="h-12 w-12 mb-4 text-accent group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
