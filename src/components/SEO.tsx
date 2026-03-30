import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'הרב קלמן מאיר בר';
const DEFAULT_IMAGE =
  'https://images.fillout.com/orgid-590181/flowpublicid-bjqtmvgzna/widgetid-default/fbWdZYpc2d4y4e6G4p1wmf/pasted-image-1770841682409.jpg';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  /** "website" for regular pages, "article" for content detail pages */
  type?: 'website' | 'article';
  /** Set true for pages that should not appear in search results (privacy, terms, admin) */
  noindex?: boolean;
}

/**
 * Drop <SEO> at the top of any page's return to set per-page head tags.
 * Title is automatically appended with " | הרב קלמן מאיר בר" except on the homepage.
 */
export default function SEO({
  title,
  description,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
}: SEOProps) {
  const isHome = title === SITE_NAME;
  const fullTitle = isHome ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      {/* Base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Open Graph — Facebook, WhatsApp, LinkedIn */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="he_IL" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
