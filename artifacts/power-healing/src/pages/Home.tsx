import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { About } from "@/components/sections/About";
import { Products } from "@/components/sections/Products";
import { VIP } from "@/components/sections/VIP";
import { Testimonials } from "@/components/sections/Testimonials";
import { Blog } from "@/components/sections/Blog";
import { FAQ } from "@/components/sections/FAQ";
import { BookCTA } from "@/components/sections/Book";

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <About />
      <Products />
      <VIP />
      <Testimonials />
      <Blog />
      <FAQ />
      <BookCTA />
    </div>
  );
}
