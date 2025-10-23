import { DM_Sans } from 'next/font/google';
import './assets/scss/tailwind.scss';
import './assets/css/materialdesignicons.css';

const dm_sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm_sans',
});

export const metadata = {
  title:
    'Herramientas digitales para emprendedores que quieren escalar su negocio con IA, tecnología y una comunidad que impulsa su crecimiento - EmprendyUp',
  description:
    'Crea tu tienda online profesional con EmprendyUp. Marketplace colaborativo, CRM integrado, IA para contenido, chatbot WhatsApp, métricas de ventas y comunidad de emprendedores. ¡Haz crecer tu negocio hoy!',
  keywords: [
    'emprendyup',
    'herramientas emprendimiento',
    'tienda online',
    'marketplace colaborativo',
    'CRM para emprendedores',
    'IA generar contenido',
    'chatbot WhatsApp',
    'métricas ventas',
    'comunidad emprendedores',
    'plataforma ecommerce',
    'crear tienda online',
    'acompañamiento emprendimiento',
    'capacitaciones empresariales',
    'eventos emprendedores',
  ].join(', '),
  authors: [{ name: 'EmprendyUp Team' }],
  creator: 'EmprendyUp',
  publisher: 'EmprendyUp',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.emprendyup.com/',
    siteName: 'EmprendyUp',
    title:
      'Herramientas digitales para emprendedores que quieren escalar su negocio con IA, tecnología y una comunidad que impulsa su crecimiento - EmprendyUp',
    description:
      'Plataforma todo-en-uno para emprendedores: tienda online, marketplace colaborativo, CRM, IA para contenido, chatbot WhatsApp y comunidad con capacitaciones.',
    images: [
      {
        url: '/images/emprendyup-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Herramientas digitales para emprendedores que quieren escalar su negocio con IA, tecnología y una comunidad que impulsa su crecimiento - EmprendyUp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@emprendyup',
    creator: '@emprendyup',
    title:
      'Herramientas digitales para emprendedores que quieren escalar su negocio con IA, tecnología y una comunidad que impulsa su crecimiento - EmprendyUp',
    description:
      'Tienda online + Marketplace + IA + CRM + Comunidad de emprendedores. Todo lo que necesitas para hacer crecer tu negocio.',
    images: ['/images/emprendyup-twitter-card.jpg'],
  },
  verification: {
    google: 'tu-codigo-de-verificacion-google',
    yandex: 'tu-codigo-yandex',
    yahoo: 'tu-codigo-yahoo',
  },
  alternates: {
    canonical: 'https://www.emprendyup.com/',
    languages: {
      'es-ES': 'https://www.emprendyup.com/',
      'es-MX': 'https://www.emprendyup.com/mx/',
      'es-CO': 'https://www.emprendyup.com/co/',
    },
  },
  other: {
    'application-name': 'EmprendyUp',
    'apple-mobile-web-app-title': 'EmprendyUp',
    'theme-color': '#10B981',
    'msapplication-TileColor': '#10B981',
  },
};

import { ReactNode } from 'react';
import ApolloWrapper from './components/ApolloWrapper';
import ConditionalLayout from './components/ConditionalLayout';
import Script from 'next/script';
import CookieWrapper from './components/CookieWrapper';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Essential SEO meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta
          name="author"
          content={(metadata.authors && metadata.authors[0]?.name) || metadata.publisher}
        />
        <meta name="theme-color" content={metadata.other?.['theme-color'] || '#ffffff'} />

        {/* Open Graph / Twitter */}
        <meta property="og:type" content={metadata.openGraph?.type || 'website'} />
        <meta property="og:locale" content={metadata.openGraph?.locale || 'es_ES'} />
        <meta property="og:site_name" content={metadata.openGraph?.siteName || 'EmprendyUp'} />
        <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
        <meta
          property="og:description"
          content={metadata.openGraph?.description || metadata.description}
        />
        <meta
          property="og:url"
          content={
            metadata.openGraph?.url ||
            metadata.alternates?.canonical ||
            'https://www.emprendyup.com/'
          }
        />
        {metadata.openGraph?.images?.[0] && (
          <meta property="og:image" content={metadata.openGraph.images[0].url} />
        )}
        {metadata.openGraph?.images?.[0] && metadata.openGraph.images[0].alt && (
          <meta property="og:image:alt" content={metadata.openGraph.images[0].alt} />
        )}

        <meta name="twitter:card" content={metadata.twitter?.card || 'summary_large_image'} />
        <meta name="twitter:site" content={metadata.twitter?.site || '@emprendyup'} />
        <meta name="twitter:creator" content={metadata.twitter?.creator || '@emprendyup'} />
        <meta name="twitter:title" content={metadata.twitter?.title || metadata.title} />
        <meta
          name="twitter:description"
          content={metadata.twitter?.description || metadata.description}
        />
        {metadata.twitter?.images?.[0] && (
          <meta name="twitter:image" content={metadata.twitter.images[0]} />
        )}

        {/* Hreflang / alternates for SEO */}
        {metadata.alternates?.canonical && (
          <link rel="canonical" href={metadata.alternates.canonical} />
        )}
        {metadata.alternates?.languages &&
          Object.entries(metadata.alternates.languages).map(([lang, url]) => (
            <link key={lang} rel="alternate" hrefLang={lang} href={url} />
          ))}

        {/* WebSite structured data (JSON-LD) and Breadcrumb */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'EmprendyUp',
              url: metadata.openGraph?.url || 'https://www.emprendyup.com/',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${metadata.openGraph?.url || 'https://www.emprendyup.com/'}?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Inicio',
                  item: metadata.alternates?.canonical || 'https://www.emprendyup.com/',
                },
              ],
            }),
          }}
        />

        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'EmprendyUp',
              description:
                'Herramientas digitales para emprendedores que quieren escalar su negocio con IA, tecnología y una comunidad que impulsa su crecimiento',
              url: 'https://www.emprendyup.com',
              logo: 'https://www.emprendyup.com/images/logo-light.png',
              sameAs: [
                'https://www.facebook.com/emprendyup',
                'https://www.instagram.com/emprendyup',
                'https://www.linkedin.com/company/emprendyup',
                'https://twitter.com/emprendyup',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+57-xxx-xxx-xxxx',
                contactType: 'customer service',
                availableLanguage: 'Spanish',
              },
              offers: {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Plataforma EmprendyUp',
                  description:
                    'Herramientas integrales para emprendedores: tienda online, marketplace, CRM, IA, chatbot WhatsApp y comunidad',
                },
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Servicios EmprendyUp',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Tienda Online + Marketplace Colaborativo',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Acompañamiento en Creación de Tienda',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Métricas de Ventas y Visitas',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'CRM Integrado',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'IA para Generar Contenido',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Chatbot WhatsApp',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Comunidad con Capacitaciones y Eventos',
                    },
                  },
                ],
              },
            }),
          }}
        />

        {/* FAQ Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: '¿Qué incluye la plataforma EmprendyUp?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'EmprendyUp incluye tienda online personalizada, marketplace colaborativo, CRM integrado, herramientas de IA para contenido, chatbot WhatsApp, métricas avanzadas y acceso a una comunidad con capacitaciones y eventos.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Cómo funciona el marketplace colaborativo?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'El marketplace colaborativo conecta tu tienda con miles de compradores potenciales, permitiendo mayor visibilidad y ventas cruzadas con otros emprendedores de la comunidad.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Qué tipo de acompañamiento ofrecen?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Ofrecemos acompañamiento personalizado para crear tu tienda, configurar tus productos, optimizar tus ventas y aprovechar todas las herramientas de la plataforma.',
                  },
                },
              ],
            }),
          }}
        />
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className={`${dm_sans.variable} dark:bg-slate-900`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ApolloWrapper>
            {/* <ConditionalLayout> */}
            {children}
            <Toaster position="top-right" />
            {/* </ConditionalLayout> */}
          </ApolloWrapper>
          <CookieWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
