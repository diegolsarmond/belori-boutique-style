import { Link } from "react-router-dom";
import { Instagram, Facebook, Phone, Mail } from "lucide-react";
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

export const Footer = () => {
  const { data: settings } = useQuery({
    queryKey: ["site-settings-footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("setting_key", [
          "footer_email",
          "footer_phone",
          "footer_address",
          "footer_whatsapp",
        ]);
      if (error) throw error;

      return data.reduce(
        (acc, setting) => ({
          ...acc,
          [setting.setting_key]: setting.setting_value,
        }),
        {} as Record<string, string>
      );
    },
  });

  const { data: productCounts } = useQuery({
    queryKey: ['footer-category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
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

  const email = settings?.footer_email || "contato@belori.com.br";
  const phone = settings?.footer_phone || "(11) 99999-9999";
  const whatsapp = settings?.footer_whatsapp || "5511999999999";

  return (
    <footer className="border-t bg-secondary/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">
              <span className="text-foreground">Bel</span>
              <span className="text-accent">ori</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Estilo e elegância para todas as ocasiões. Encontre os melhores produtos para você.
            </p>
          </div>

          {categoriesWithProducts.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Categorias</h4>
              <ul className="space-y-2 text-sm">
                {categoriesWithProducts.map((category) => (
                  <li key={category.slug}>
                    <Link to={category.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/sobre" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Troca
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Envios
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Belori. Todos os direitos reservados. Entrega para todo Brasil.</p>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Contato via WhatsApp"
      >
        <Phone className="h-6 w-6" />
      </a>
    </footer>
  );
};

