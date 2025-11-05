import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/8bit/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

const loadingTexts = [
  'Recuperando memorias...',
  'Verificando integridad...',
  'Sincronizando consciencia...',
  'Cargando fragmentos...',
];

export const LoadingState = ({
  message,
  variant = 'default',
  className
}: LoadingStateProps) => {
  const displayMessage = message || loadingTexts[Math.floor(Math.random() * loadingTexts.length)];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Skeleton className="h-6 w-6" />
        <motion.span
          className="text-sm font-pixel"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {displayMessage}
        </motion.span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6 p-8', className)}>
      {/* Skeleton blocks con animación escalonada */}
      <div className="flex gap-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.2,
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.8
            }}
          >
            <Skeleton className="h-16 w-16" />
          </motion.div>
        ))}
      </div>

      {/* Texto animado con efecto de parpadeo */}
      <motion.div
        className="text-center"
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="font-pixel text-lg">{displayMessage}</p>
        <motion.span
          className="inline-block ml-1"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          _
        </motion.span>
      </motion.div>

      {/* Barra de skeleton adicional */}
      <Skeleton className="h-4 w-64" />
    </div>
  );
};
