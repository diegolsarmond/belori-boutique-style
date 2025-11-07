import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, STOREFRONT_QUERY } from "@/lib/shopify";
import { ShopifyProduct } from "@/types/shopify";
import { Loader2 } from "lucide-react";

const categoryNames: Record<string, string> = {
  calcados: "Calçados",
  roupas: "Roupas",
  perfumes: "Perfumes",
  cosmeticos: "Cosméticos"
};

const Categoria = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const categoryName = categoryNames[categoria || ""] || categoria;

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', categoria],
    queryFn: async () => {
      const result = await storefrontApiRequest(STOREFRONT_QUERY, { first: 24 });
      return result?.data?.products?.edges || [];
    }
  });

  const products = data as ShopifyProduct[] | undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary via-background to-beige py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{categoryName}</h1>
            <p className="text-muted-foreground">Descubra os melhores produtos desta categoria</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Erro ao carregar produtos</p>
            </div>
          )}

          {products && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">Nenhum produto encontrado nesta categoria</p>
              <p className="text-sm text-muted-foreground">
                Em breve teremos novidades!
              </p>
            </div>
          )}

          {products && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.node.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Categoria;
