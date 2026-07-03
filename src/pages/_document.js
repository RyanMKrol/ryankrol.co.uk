import { Html, Head, Main, NextScript } from 'next/document'

// Inline script runs synchronously before first paint — no FOUC.
// Restores the Matrix easter egg's active state (set via the Konami code) before React hydrates.
const prePaintScript = `(function(){try{
  var h=document.documentElement;
  if(sessionStorage.getItem('matrix-active')==='true'){h.classList.add('matrix-active')}
}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="en" style={{ backgroundColor: '#0d1b2a' }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
