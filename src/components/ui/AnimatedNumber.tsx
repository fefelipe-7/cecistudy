import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

/** Conta números com spring — útil para stats/progressos data-driven. */
export const AnimatedNumber = ({ value, className, format }: AnimatedNumberProps) => {
  const spring = useSpring(value, { stiffness: 120, damping: 22, mass: 0.8 });
  const display = useTransform(spring, (v) => (format ? format(v) : Math.round(v).toString()));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
};