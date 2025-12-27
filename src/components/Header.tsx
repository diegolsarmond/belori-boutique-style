import { Link } from "react-router-dom";
import { Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartDrawer } from "./CartDrawer";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryConfig {
  name: string;
  href: string;
  slug: string;
}

const allCategories: CategoryConfig[] = [
  { name: "Roupas", href: "/categoria/roupas", slug: "roupas" },
  { name: "Sapatos", href: "/categoria/sapatos", slug: "sapatos" },
  { name: "Acessórios", href: "/categoria/acessorios", slug: "acessorios" },
  { name: "Outros", href: "/categoria/outros", slug: "outros" },
];

const fixedNavigation = [
  { name: "Início", href: "/" },
];

const endNavigation = [
  { name: "Sobre", href: "/sobre" },
];

export const Header = () => {
  const { user, isAdmin } = useAuth();

  const { data: productCounts } = useQuery({
    queryKey: ['header-category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_products")
        .select("category")
        .eq("is_active", true)
        .gt("stock_quantity", 0);

      if (error) throw error;

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

  // Montar navegação dinâmica
  const navigation = [
    ...fixedNavigation,
    ...categoriesWithProducts.map(cat => ({ name: cat.name, href: cat.href })),
    ...endNavigation
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">Bel</span>
            <span className="text-accent">ori</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </Button>
          )}
          {!user && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
          <CartDrawer />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

