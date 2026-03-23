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
 * Shared page header — gradient background, centred title, optional subtitle,
 * gold decorative divider. Used on every content page.
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
  // Default breadcrumbs: Home > Current Page Title
  const breadcrumbItems: BreadcrumbItem[] = breadcrumbs ?? [
    { label: 'דף הבית', href: '/' },
    { label: title },
  ];

  return (
    <header
      className={`bg-gradient-to-b from-primary/5 to-background ${compact ? 'py-8 md:py-10' : 'py-10 md:py-14'}`}
      role="banner"
    >
      {/* Breadcrumbs - aligned with page content width */}
      {!hideBreadcrumbs && (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl mb-4 md:mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      )}

      {/* Title & subtitle - centered, full width */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-primary mb-3 leading-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="text-base md:text-lg text-muted-foreground mb-5 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        {/* Gold decorative divider */}
        <div
          className="flex items-center justify-center gap-3 max-w-xs mx-auto"
          aria-hidden="true"
        >
          <div className="h-px flex-1 bg-gradient-to-l from-secondary to-transparent" />
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <div className="h-px flex-1 bg-gradient-to-r from-secondary to-transparent" />
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}