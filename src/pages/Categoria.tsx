import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const categoryNames: Record<string, string> = {
  roupas: "Roupas",
  sapatos: "Sapatos",
  acessorios: "Acessórios",
  outros: "Outros"
};

const ITEMS_PER_PAGE = 12;

const Categoria = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const categoryName = categoryNames[categoria || ""] || categoria;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['products-category', categoria],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("BeloriBH_products")
        .select("*")
        .eq("is_active", true)
        .eq("category", categoria)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Product[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than requested, we're at the end.
      return lastPage.length === ITEMS_PER_PAGE ? allPages.length : undefined;
    },
    enabled: !!categoria,
    initialPageParam: 0
  });

  const products = data?.pages.flat() || [];

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

          {isError && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Erro ao carregar produtos</p>
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">Nenhum produto encontrado nesta categoria</p>
              <p className="text-sm text-muted-foreground">
                Em breve teremos novidades!
              </p>
            </div>
          )}

          {products.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-[200px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais produtos"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Categoria;
