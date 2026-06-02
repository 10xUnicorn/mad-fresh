import Navbar from "@/components/landing/Navbar";

// Section 1: Food — Hero
import Hero from "@/components/landing/Hero";

// Section 2: Trust — corporate logos, awards
import TrustBar from "@/components/landing/TrustBar";

// How it works (between trust and service paths for flow)
import HowItWorks from "@/components/landing/HowItWorks";

// Menu preview — show the product
import MenuPreview from "@/components/landing/MenuPreview";

// Section 3: Choose Your Service — 3 pathways
import ServicePaths from "@/components/landing/ServicePaths";

// Delivery zone checker — instant ZIP check before adding to cart
import DeliveryChecker from "@/components/landing/DeliveryChecker";

// Section 4: Our Story — Ty + Blanca
import OurStory from "@/components/landing/OurStory";

// Section 5: Results — catering proof, programs, reviews
import CateringCTA from "@/components/landing/CateringCTA";
import FoodPrograms from "@/components/landing/FoodPrograms";
import Reviews from "@/components/landing/Reviews";

// Impact / community
import ImpactSection from "@/components/landing/ImpactSection";

// Pricing plans (kept for meal prep customers)
import PricingPlans from "@/components/landing/PricingPlans";

// Section 6: The App — LAST, as specified
import AppSection from "@/components/landing/AppSection";

// Footer info
import StoreInfo from "@/components/landing/StoreInfo";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* S1: Food */}
      <Hero />

      {/* S2: Trust */}
      <TrustBar />

      {/* How it works */}
      <HowItWorks />

      {/* Menu preview — product proof */}
      <MenuPreview />

      {/* S3: Choose Your Service */}
      <ServicePaths />

      {/* Delivery zone checker — after service paths, before meal plans */}
      <DeliveryChecker />

      {/* Pricing plans */}
      <PricingPlans />

      {/* S4: Our Story */}
      <OurStory />

      {/* S5: Results — catering, programs, reviews */}
      <CateringCTA />
      <FoodPrograms />
      <Reviews />
      <ImpactSection />

      {/* S6: The App — last */}
      <AppSection />

      {/* Footer */}
      <StoreInfo />
      <Footer />
    </>
  );
}
