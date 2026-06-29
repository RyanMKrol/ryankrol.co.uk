import { Html, Head, Main, NextScript } from 'next/document'

// Inline script runs synchronously before first paint — no FOUC.
// Must stay in sync with STORAGE_KEYS and DEFAULTS in src/lib/appearance.js.
const prePaintScript = `(function(){try{
  var theme=localStorage.getItem('appearance-theme')||'cyberpunk';
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
    <Html lang="en" style={{ backgroundColor: '#0a0a1a' }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
