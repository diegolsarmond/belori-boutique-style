import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Categories, allCategories } from "@/components/Categories";
import { CategorySection } from "@/components/CategorySection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Categories />

        <div className="space-y-4 pb-16">
          {allCategories.map((category) => (
            <CategorySection key={category.slug} category={category} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
