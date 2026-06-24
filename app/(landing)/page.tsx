import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { RelationshipPreview } from "@/components/landing/RelationshipPreview";

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <HowItWorks />
        <RelationshipPreview />
        <Features />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}
