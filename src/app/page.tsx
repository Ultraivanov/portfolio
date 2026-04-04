import HomePage from "@/components/home/HomePage";
import { home } from "@/content/home";

export default function Home() {
  return (
    <section>
      <HomePage data={home} />
      <div id="work" />
      <div id="contact" />
    </section>
  );
}
