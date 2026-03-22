import Hero from "@/components/Hero";
import GreenLeaseCoach from "@/components/GreenLeaseCoach";
import MaterialsCircularity from "@/components/MaterialsCircularity";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <GreenLeaseCoach />
      <MaterialsCircularity />
      <Dashboard />
      <Footer />
    </div>
  );
};

export default Index;
