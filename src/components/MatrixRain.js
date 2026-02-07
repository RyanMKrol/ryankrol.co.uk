import { useEffect, useRef } from 'react';

const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const DIGITS = '0123456789';
const CHARS = KATAKANA + DIGITS;

export default function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let frameCount = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function getFontSize() {
      const w = window.innerWidth;
      if (w < 600) return 10;
      if (w < 1024) return 12;
      return 14;
    }

    let fontSize = getFontSize();
    let columns;
    let drops;

    function initColumns() {
      fontSize = getFontSize();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = new Array(columns).fill(1);
    }

    initColumns();

    // Target ~15 FPS desktop, ~12 FPS mobile via frame skipping
    const frameSkip = window.innerWidth < 600 ? 5 : 4;

    function draw() {
      frameCount++;
      if (frameCount % frameSkip !== 0 && !prefersReducedMotion) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // Trail fade — semi-transparent black overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading character is brighter (white-green)
        ctx.fillStyle = '#afffaf';
        ctx.fillText(char, x, y);

        // Draw a slightly dimmer character one row behind for the "trail head"
        if (drops[i] > 1) {
          const prevChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillStyle = '#00ff41';
          ctx.fillText(prevChar, x, y - fontSize);
        }

        // Reset drop randomly once it passes the bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      if (prefersReducedMotion) return; // Single static frame
      animId = requestAnimationFrame(draw);
    }

    draw();

    function handleResize() {
      initColumns();
    }

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
