export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="starfield relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* 상단 오로라 발광 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-interactive-primary/20 blur-3xl"
      />
      <div className="relative w-full max-w-md px-4">{children}</div>
    </div>
  );
}
