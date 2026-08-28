import HeroSection from "./components/HeroSection";
import LoginCard from "./components/LoginCard";

const Background = () => (
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute inset-0 opacity-70 bg-[linear-gradient(to_right,#e9e3dd_1px,transparent_1px),linear-gradient(to_bottom,#e9e3dd_1px,transparent_1px)] bg-size-[56px_56px]" />
    <div className="absolute inset-x-0 top-16 h-1 bg-[#c94f5f]" />
  </div>
);

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden bg-[#f8f6f3] px-4 pb-10 pt-24 text-[#303536] sm:px-6">
      <Background />
      <div className="relative mx-auto flex w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_28rem] lg:gap-20">
          <HeroSection />
          <LoginCard />
        </div>
      </div>
    </main>
  );
}