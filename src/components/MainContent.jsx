import Capabilities from "./Capabilities";
import StackLens from "./StackLens";
import TechStackShowcase from "./TechStackShowcase";
import Timeline from "./Timeline";
import FieldNotes from "./FieldNotes";
import Achievements from "./Achievements";
import Contact from "./Contact";
import PortfolioLens from "./PortfolioLens";
import Footer from "./Footer";

// Everything below About, bundled as ONE lazily-loaded chunk (see App.jsx).
// About stays eager (rendered right after Hero) because it holds the profile
// photo — a strong LCP candidate — and lazy-splitting it added a whole extra
// chunk fetch before that image could even start downloading. Everything
// further down is genuinely off-screen without scrolling, so splitting IT
// out still keeps the JS that has to run before Hero/About can paint small.
// Grouped as a single chunk rather than one-lazy-per-section so it's one
// network round trip instead of ten — better on high-latency/slow-3G.
export default function MainContent() {
  return (
    <>
      <main className="max-w-295 mx-auto px-5 sm:px-7 lg:px-8 overflow-x-clip">
        <Capabilities />
        <StackLens />
      </main>

      <TechStackShowcase />

      <main className="max-w-295 mx-auto px-5 sm:px-7 lg:px-8 overflow-x-clip">
        <Timeline />
        <FieldNotes />
        <Achievements />
        <Contact />
        <PortfolioLens />
        <Footer />
      </main>
    </>
  );
}
