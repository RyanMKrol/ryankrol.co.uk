import { useEffect, useRef, useState } from 'react';

export default function MarqueeText({ children, className = '', speed = 40 }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(8);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        const overflow = textWidth > containerWidth;
        
        setIsOverflowing(overflow);
        
        // Calculate duration based on text length for consistent speed
        const duration = Math.max(5, textWidth / speed);
        setAnimationDuration(duration);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(checkOverflow, 200);
    
    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children, speed]);

  return (
    <div 
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        width: '100%'
      }}
    >
      <span 
        ref={textRef}
        className={`marquee-text ${isOverflowing ? 'scrolling' : ''}`}
        style={{
          display: 'inline-block',
          animationDuration: `${animationDuration}s`,
          animationDelay: '0.5s',
          whiteSpace: 'nowrap'
        }}
      >
        {children}
      </span>
    </div>
  );
}