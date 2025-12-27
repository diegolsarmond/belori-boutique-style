import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Loader2 } from "lucide-react";

const categoryNames: Record<string, string> = {
  roupas: "Roupas",
  sapatos: "Sapatos",
  acessorios: "Acessórios",
  outros: "Outros"
};

const Categoria = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const categoryName = categoryNames[categoria || ""] || categoria;

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products-category', categoria],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", categoria)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!categoria
  });

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
                <div
                  key={product.id}
                  onClick={() => navigate(`/produto/${product.id}`)}
                  className="group cursor-pointer bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-secondary/20 overflow-hidden">
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
