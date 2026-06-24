export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="lp-page overflow-x-clip">
      {children}
    </div>
  );
}