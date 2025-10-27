import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white">
            Game Platform
          </Link>
          <div className="flex gap-4">
            <Link
              href="/lobby"
              className="text-white/70 hover:text-white transition-colors"
            >
              Lobby
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
