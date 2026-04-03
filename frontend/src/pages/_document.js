import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head>
        {/* SkyStay Favicon - Airplane in blue circle */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231a6ef5'/%3E%3Cg transform='translate(32,32) rotate(-45)'%3E%3Cpath d='M0,-18 L4,-8 L16,-8 L12,0 L4,0 L4,10 L8,12 L8,16 L0,14 L-8,16 L-8,12 L-4,10 L-4,0 L-12,0 L-16,-8 L-4,-8 Z' fill='white'/%3E%3C/g%3E%3C/svg%3E" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231a6ef5'/%3E%3Cg transform='translate(32,32) rotate(-45)'%3E%3Cpath d='M0,-18 L4,-8 L16,-8 L12,0 L4,0 L4,10 L8,12 L8,16 L0,14 L-8,16 L-8,12 L-4,10 L-4,0 L-12,0 L-16,-8 L-4,-8 Z' fill='white'/%3E%3C/g%3E%3C/svg%3E" />
        <meta name="theme-color" content="#1a6ef5" />
        <meta name="description" content="SkyStay - Premium Hotels & Flights Booking Platform across India" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
