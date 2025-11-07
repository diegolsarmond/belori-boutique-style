import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Footprints, Shirt, Sparkles, Palette } from "lucide-react";

const categories = [
  {
    name: "Calçados",
    icon: Footprints,
    href: "/categoria/calcados",
    description: "Tênis, sapatos e sapatilhas"
  },
  {
    name: "Roupas",
    icon: Shirt,
    href: "/categoria/roupas",
    description: "Moda para todos os estilos"
  },
  {
    name: "Perfumes",
    icon: Sparkles,
    href: "/categoria/perfumes",
    description: "Fragrâncias marcantes"
  },
  {
    name: "Cosméticos",
    icon: Palette,
    href: "/categoria/cosmeticos",
    description: "Beleza e cuidados"
  }
];

export const Categories = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossas Categorias</h2>
        <p className="text-muted-foreground">Explore nossa seleção cuidadosamente escolhida</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((category) => (
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
