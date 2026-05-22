import Link from 'next/link';

export function Navigation() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/10 bg-void-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-ghost-100">
        <Link href="/" className="font-medium text-lg tracking-wide">DeadDrop</Link>
        <div className="flex gap-4 text-ghost-400">
          <Link href="/create" className="hover:text-ghost-100 transition-colors duration-200">Create</Link>
          <Link href="/d" className="hover:text-ghost-100 transition-colors duration-200">Decode</Link>
        </div>
      </nav>
    </header>
  );
}
