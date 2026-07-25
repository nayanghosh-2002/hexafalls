import { NavBar } from "./Nav";

export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="mb-1.5 text-[30px] font-bold tracking-tight text-foreground lg:text-[34px]">
        {title}
      </h1>
      <p className="text-[15px] leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function AuthShell({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto flex min-h-[calc(100vh-58px)] max-w-[1200px]">
        {aside ? (
          <aside className="hidden min-h-[calc(100vh-58px)] w-[52%] flex-col justify-center overflow-hidden lg:flex">
            {aside}
          </aside>
        ) : null}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 lg:py-16">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
