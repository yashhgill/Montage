import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import ServiceSheet from "../components/ServiceSheet";
import Clients from "../components/Clients";
import Experience from "../components/Experience";
import Gallery from "../components/Gallery";
import About from "../components/About";
import Contact from "../components/Contact";
import PartyLights from "../components/PartyLights";
import DiscoBall from "../components/DiscoBall";
import CursorGlow from "../components/CursorGlow";
import Footer from "../components/Footer";

export default function HomePage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeService, setActiveService] = useState(null);

  const openService = (key) => {
    setActiveService(key);
    setSheetOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden" data-testid="home-page">
      <CursorGlow />
      <PartyLights />
      <DiscoBall />
      <Header />
      <main className="relative z-[2]">
        <Hero />
        <Services onOpen={openService} />
        <Clients />
        <Experience />
        <Gallery />
        <About />
        <Contact />
      </main>
      <Footer />
      <ServiceSheet open={sheetOpen} onOpenChange={setSheetOpen} serviceKey={activeService} />
    </div>
  );
}
