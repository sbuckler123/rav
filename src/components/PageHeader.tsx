import { ReactNode } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Breadcrumb items - if not provided, defaults to Home > title */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional extra content rendered below the divider */
  children?: ReactNode;
  /** Tighter vertical padding, useful for pages with inline search bars */
  compact?: boolean;
  /** Hide breadcrumbs (e.g., for home page) */
  hideBreadcrumbs?: boolean;
  /** Match content width with PageLayout */
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
}

/**
 * Shared page header — warm gradient background, serif title, gold ornament.
 * Used on every content page. API is unchanged — no page files need updating.
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  children,
  compact = false,
  hideBreadcrumbs = false,
  maxWidth = 'max-w-6xl',
}: PageHeaderProps) {
  const breadcrumbItems: BreadcrumbItem[] = breadcrumbs ?? [
    { label: 'דף הבית', href: '/' },
    { label: title },
  ];

  return (
    <header
      className={`relative border-t-[3px] border-secondary bg-gradient-to-b from-primary/[0.07] via-muted/60 to-background ${
        compact ? 'pt-6 pb-8 md:pt-8 md:pb-10' : 'pt-8 pb-10 md:pt-12 md:pb-14'
      }`}
      role="banner"
    >
      {/* Breadcrumbs */}
      {!hideBreadcrumbs && (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl mb-4 md:mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      )}

      {/* Title & subtitle */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-primary mb-3 leading-tight tracking-wide">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Gold ornament — cascading dots flanked by gradient lines */}
        <div
          className="flex items-center justify-center gap-3 mx-auto w-56 sm:w-72 md:w-96"
          aria-hidden="true"
        >
          <div className="h-px flex-1 bg-gradient-to-l from-secondary/60 to-transparent" />
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-secondary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/65" />
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/65" />
            <div className="w-1 h-1 rounded-full bg-secondary/40" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-secondary/60 to-transparent" />
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}