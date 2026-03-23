interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Additional max-width override, default is max-w-6xl */
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
}

/**
 * Shared page layout wrapper — provides consistent max-width, horizontal padding,
 * and vertical spacing for every page in the app.
 */
export default function PageLayout({
  children,
  className = '',
  maxWidth = 'max-w-6xl',
}: PageLayoutProps) {
  return (
    <main className={`min-h-screen bg-background ${className}`}>
      <div className={`container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 md:py-12 ${maxWidth}`}>
        {children}
      </div>
    </main>
  );
}
