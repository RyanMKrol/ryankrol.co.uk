import { Html, Head, Main, NextScript } from 'next/document'

// Inline script runs synchronously before first paint — no FOUC.
// Restores the Matrix easter egg's active state (set via the Konami code) before React hydrates.
const prePaintScript = `(function(){try{
  var h=document.documentElement;
  if(sessionStorage.getItem('matrix-active')==='true'){h.classList.add('matrix-active')}
}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="en" style={{ backgroundColor: '#FBF7EF' }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* Bricolage Grotesque (display) / Nunito (body) / Space Mono (mono/labels) — the
            Collection design system. JetBrains Mono stays loaded for the Matrix easter egg. */}
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
