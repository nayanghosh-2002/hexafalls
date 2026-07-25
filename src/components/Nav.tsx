import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`logo text-[17px] font-bold tracking-tight text-foreground ${className}`}
    >
      Sealit
    </Link>
  );
}

export function NavBar({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[58px] max-w-[1200px] items-center justify-between px-6 lg:px-14">
        <Logo />
        <div className="flex items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
