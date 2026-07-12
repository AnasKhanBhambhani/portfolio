import Loader from "./components/Loader";
import CustomCursor from "./components/CustomCursor";
import AuroraBackground from "./components/AuroraBackground";
import ParticleField from "./components/ParticleField";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Capabilities from "./components/Capabilities";
import Stack from "./components/Stack";
import Timeline from "./components/Timeline";
import FieldNotes from "./components/FieldNotes";
import Achievements from "./components/Achievements";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ThemePicker from "./components/ThemePicker";
import useCleanAnchors from "./hooks/useCleanAnchors";

function App() {
  useCleanAnchors();

  return (
    <>
      <a
        href="#main"
        className="fixed left-3 -top-24 focus:top-3 z-1000 grad-btn text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-[top] duration-200"
      >
        Skip to content
      </a>

      <Loader />
      <CustomCursor />
      <AuroraBackground />
      <ParticleField />
      <Nav />

      <main id="main" className="max-w-295 mx-auto px-5 sm:px-7 lg:px-8 overflow-x-clip">
        <Hero />
        <About />
        <Capabilities />
        <Stack />
        <Timeline />
        <FieldNotes />
        <Achievements />
        <Contact />
        <Footer />
      </main>

      <ThemePicker />
    </>
  );
}

export default App;
