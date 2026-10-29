import { AnimatePresence, motion } from 'framer-motion';
import type { Theme } from '../lib/themes';

/** Fond plein écran du thème en cours, avec fondu + léger zoom à chaque changement. */
export function CompetitionBackground({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <AnimatePresence initial={false}>
        <motion.div
          key={theme.id}
          className="absolute inset-0"
          style={{ background: theme.background }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </AnimatePresence>
      {/* Voile sombre : garantit le contraste du texte quel que soit le thème. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/55" />
    </div>
  );
}
