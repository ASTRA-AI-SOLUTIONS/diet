import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface Astra3DCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  glowColor?: string;
}

export const Astra3DCard: React.FC<Astra3DCardProps> = ({
  children,
  className = '',
  depth = 12,
  glowColor = 'rgba(6, 182, 212, 0.15)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      setSupportsHover(mq.matches);
      const listener = (e: MediaQueryListEvent) => setSupportsHover(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!supportsHover || !cardRef.current) return;

    // If mouse is over an interactive button or input, do not tilt the card
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, input, select, textarea, a, [role="button"]')) {
      if (rotateX !== 0 || rotateY !== 0) {
        setRotateX(0);
        setRotateY(0);
      }
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -depth;
    const rotY = ((x - centerX) / centerX) * depth;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    if (supportsHover) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 w-full"
    >
      <motion.div
        animate={{
          rotateX: supportsHover ? rotateX : 0,
          rotateY: supportsHover ? rotateY : 0,
          scale: supportsHover && isHovered ? 1.006 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 280,
          mass: 0.6,
        }}
        className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] p-5 shadow-xl transition-colors hover:border-white/[0.14] ${className}`}
      >
        {/* Subtle Specular Sheen Glare */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: supportsHover && isHovered ? 0.08 : 0,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 65%)`,
          }}
        />

        <div className="relative z-10 pointer-events-auto">{children}</div>
      </motion.div>
    </div>
  );
};

