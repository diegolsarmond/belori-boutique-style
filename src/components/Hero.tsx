import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Loader2 } from "lucide-react";

interface Slide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

export const Hero = () => {
  const { data: slides, isLoading } = useQuery({
    queryKey: ["slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Slide[];
    },
  });

  if (isLoading) {
    return (
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center bg-gradient-to-br from-secondary via-background to-beige">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </section>
    );
  }

  if (!slides || slides.length === 0) {
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
  }

  return (
    <section className="relative w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent"></div>
                
                <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                      {slide.title}
                    </h1>
                    {slide.description && (
                      <p className="text-lg md:text-xl text-muted-foreground mb-8">
                        {slide.description}
                      </p>
                    )}
                    {slide.link_url && (
                      <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <a href={slide.link_url}>Ver Mais</a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  );
};
