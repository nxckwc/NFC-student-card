import HeroSection from "./components/HeroSection";
import LoginCard from "./components/LoginCard";

const Background = () => (
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute inset-0 opacity-[0.2] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[84px_84px]" />
    <div className="absolute inset-x-0 top-0 h-2/3 bg-linear-to-b from-red-500/25 to-transparent" />
  </div>
);

export default function LoginPage() {
  return (
    <main className="relative flex-1 overflow-hidden bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6 flex">
      <Background />
      <div className="relative overflow-hidden mx-auto flex max-w-6xl items-center min-w-[90%]">
        <div className="flex w-full items-center justify-evenly">
          <HeroSection />
          <LoginCard />
        </div>
      </div>
    </main>
  );
}