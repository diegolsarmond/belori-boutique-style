import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, Globe } from "lucide-react";

const Sobre = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary via-background to-beige py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Sobre a <span className="text-accent">Belori</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Estilo, qualidade e elegância em cada detalhe
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Nossa História</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Belori nasceu da paixão por moda e beleza, com o objetivo de oferecer produtos de alta qualidade 
                que valorizam o estilo único de cada pessoa. Acreditamos que todos merecem ter acesso a peças 
                elegantes, confortáveis e que expressem sua personalidade.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Nossa Missão</h2>
              <p className="text-muted-foreground leading-relaxed">
                Proporcionar uma experiência de compra excepcional, oferecendo calçados, roupas, perfumes e 
                cosméticos cuidadosamente selecionados. Buscamos sempre as melhores marcas e tendências para 
                atender aos mais diversos estilos e ocasiões.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card>
                <CardContent className="flex flex-col items-center text-center p-6">
                  <Heart className="h-12 w-12 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">Qualidade</h3>
                  <p className="text-sm text-muted-foreground">
                    Produtos selecionados com rigor e excelência
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center text-center p-6">
                  <TrendingUp className="h-12 w-12 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">Tendências</h3>
                  <p className="text-sm text-muted-foreground">
                    Sempre atualizados com as últimas novidades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center text-center p-6">
                  <Globe className="h-12 w-12 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">Todo Brasil</h3>
                  <p className="text-sm text-muted-foreground">
                    Entregamos para todos os estados
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Sobre;
