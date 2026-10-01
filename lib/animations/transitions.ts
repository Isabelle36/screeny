import type { Transition } from 'motion/react';

export const snappySpring: Transition = { type: 'spring', stiffness: 550, damping: 40, mass: 0.6 };

export const dotSpring: Transition = { type: 'spring', visualDuration: 0.16, bounce: 0.15 };

export const quickFade: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };
