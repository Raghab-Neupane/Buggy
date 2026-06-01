import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'primary' | 'success' | 'warning' | 'danger' | 'none';
  hoverEffect?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  hoverEffect = true,
  onClick,
}) => {
  const glowClasses = {
    primary: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] hover:border-brand-primary/30',
    success: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.12)] hover:border-brand-success/30',
    warning: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.12)] hover:border-brand-warning/30',
    danger: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.12)] hover:border-brand-danger/30',
    none: 'hover:shadow-[0_0_20px_rgba(31,41,55,0.2)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={`
        bg-brand-card/90 backdrop-blur-md
        border border-brand-border/60
        rounded-[24px] p-6
        transition-all duration-300 ease-out
        ${glowColor !== 'none' ? glowClasses[glowColor] : 'hover:border-brand-border/90'}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};
