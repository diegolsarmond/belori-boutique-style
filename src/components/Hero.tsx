import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative h-[500px] md:h-[600px] flex items-center justify-center bg-gradient-to-br from-secondary via-background to-beige overflow-hidden">
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-10"></div>
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          Estilo que define você
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Descubra a coleção perfeita de calçados, roupas, perfumes e cosméticos para todas as ocasiões
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/categoria/calcados">Ver Calçados</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/sobre">Conheça a Belori</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
