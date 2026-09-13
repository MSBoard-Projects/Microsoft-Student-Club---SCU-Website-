import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const PageTransition = ({ children }) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
