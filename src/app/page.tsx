import Link from "next/link";
import Navigation from "./_components/navigation";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <Navigation />
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Game <span className="text-[hsl(280,100%,70%)]">Platform</span>
          </h1>
          <p className="text-xl text-center max-w-2xl">
            Play basic games with friends! Create or join game rooms to start playing.
          </p>
          <div className="flex gap-4">
            <Link
              href="/lobby"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Enter Lobby
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
