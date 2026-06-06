import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { syncUser } from "@/lib/actions/syncUser";

// This is a Server Component — runs on every request.
// syncUser() silently upserts the signed-in user into the DB each time.
// If no user is signed in it does nothing (returns null).
export default async function Home() {
  await syncUser();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}