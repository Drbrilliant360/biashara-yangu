import { Helmet } from 'react-helmet-async';

interface PageHeadProps {
  title: string;
  description: string;
  path: string;
}

const SITE = 'https://biashara-yangu.lovable.app';

export function PageHead({ title, description, path }: PageHeadProps) {
  const url = `${SITE}${path}`;
  const fullTitle = title.includes('Biashara Yangu') ? title : `${title} · Biashara Yangu`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
