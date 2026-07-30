import About from "./About";
import Capabilities from "./Capabilities";
import StackLens from "./StackLens";
import TechStackShowcase from "./TechStackShowcase";
import Timeline from "./Timeline";
import FieldNotes from "./FieldNotes";
import Achievements from "./Achievements";
import Contact from "./Contact";
import PortfolioLens from "./PortfolioLens";
import Footer from "./Footer";

// Everything below Hero, bundled as ONE lazily-loaded chunk (see App.jsx).
// Hero sits at `min-h-screen`, so none of this is ever visible without
// scrolling — splitting it out of the main bundle keeps the JS that has to
// be parsed/executed before Hero can paint as small as possible, which is
// what actually moves FCP/TBT on a slow connection. Grouped as a single
// chunk rather than one-lazy-per-section so it's one network round trip
// instead of ten — better for high-latency/slow-3G conditions specifically.
export default function MainContent() {
  return (
    <>
      <main className="max-w-295 mx-auto px-5 sm:px-7 lg:px-8 overflow-x-clip">
        <About />
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
