import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col">
      <Navbar />
      <div className="pt-[70px] flex-1">{children}</div>
      <Footer />
    </div>
  );
}
