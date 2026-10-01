import type { Transition } from 'motion/react';

// Interactive motion uses springs: they redirect smoothly when retriggered mid-flight (fast hovers, rapid clicks).
export const snappySpring: Transition = { type: 'spring', stiffness: 550, damping: 40, mass: 0.6 };

// Non-interactive UI feedback stays in the 150–200ms band.
export const quickFade: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };
