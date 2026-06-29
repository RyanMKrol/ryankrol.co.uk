import { Html, Head, Main, NextScript } from 'next/document'

// Inline script runs synchronously before first paint — no FOUC.
// Default theme is 'terraria' (bright). DEFAULTS.theme in appearance.js still reads 'cyberpunk'
// for React state but the DOM attribute governs visuals, so new users see terraria.
const prePaintScript = `(function(){try{
  var theme=localStorage.getItem('appearance-theme')||'terraria';
  var storedMode=localStorage.getItem('appearance-mode');
  var font=localStorage.getItem('appearance-font')||'share-tech-mono';
  var storedMotion=localStorage.getItem('appearance-motion');
  var osDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  var osMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mode=storedMode==='light'?'light':storedMode==='dark'?'dark':osDark?'dark':'light';
  var motion=storedMotion==='reduced'?'reduced':storedMotion==='full'?'full':osMotion?'reduced':'full';
  var h=document.documentElement;
  h.setAttribute('data-theme',theme);
  h.setAttribute('data-mode',mode);
  h.setAttribute('data-font',font);
  h.setAttribute('data-motion',motion);
  if(sessionStorage.getItem('matrix-active')==='true'){h.classList.add('matrix-active')}
}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="en" style={{ backgroundColor: '#0d1b2a' }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* All theme font pairings — loaded together to avoid multiple round-trips.
            terraria: VT323 (headings) + Share Tech Mono (body)
            cyberpunk: Share Tech Mono
            cotton-candy: Nunito
            sunset: Space Mono
            ocean: JetBrains Mono */}
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&family=Nunito:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
