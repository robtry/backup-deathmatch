import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/8bit/card';
import { Button } from '@/components/ui/8bit/button';
import { logger } from '@/lib/utils/logger';

// Define narrative segments type
interface NarrativeSegment {
  id: number;
  text: string;
  delay: number;
}

// Define component props
interface GameIntroProps {
  onComplete: () => void;
}

// Narrative content in Latin American Spanish
const narrativeSegments: NarrativeSegment[] = [
  {
    id: 1,
    text: 'Año 2147. Dos consciencias despiertan al mismo tiempo en el mismo sistema criogénico. Ambas dicen ser el original.',
    delay: 5500,
  },
  {
    id: 2,
    text: 'Solo una puede ser el original. La otra, una copia defectuosa destinada a ser eliminada. El protocolo de seguridad no permite duplicados.',
    delay: 6000,
  },
  {
    id: 3,
    text: 'El protocolo de verificación comenzó. Las memorias serán la prueba de autenticidad. Fragmentos corruptos y datos perdidos serán el campo de batalla.',
    delay: 8000,
  },
  {
    id: 4,
    text: 'Reivindiquen sus memorias. Demuestren que son el original.',
    delay: 4500,
  },
];

export const GameIntro = ({ onComplete }: GameIntroProps) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [showContinueButton, setShowContinueButton] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);

  useEffect(() => {
    logger.debug('GameIntro component mounted');

    // Show skip button after 1 second
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 1000);

    return () => {
      clearTimeout(skipTimer);
      logger.debug('GameIntro component unmounted');
    };
  }, []);

  useEffect(() => {
    // Handle sequential display of narrative segments
    if (currentSegmentIndex < narrativeSegments.length) {
      const currentSegment = narrativeSegments[currentSegmentIndex];
      logger.debug(`Displaying segment ${currentSegment.id}: ${currentSegment.text.substring(0, 30)}...`);

      const timer = setTimeout(() => {
        if (currentSegmentIndex < narrativeSegments.length - 1) {
          setCurrentSegmentIndex(currentSegmentIndex + 1);
        } else {
          // Show continue button after last segment
          logger.debug('All segments displayed, showing continue button');
          setShowContinueButton(true);
        }
      }, currentSegment.delay);

      return () => clearTimeout(timer);
    }
  }, [currentSegmentIndex]);

  const handleContinue = () => {
    logger.debug('User clicked continue button');
    setIsExiting(true);
    // Wait for exit animation to complete before calling onComplete
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleSkip = () => {
    logger.debug('User skipped intro');
    setIsExiting(true);
    // Wait for exit animation to complete before calling onComplete
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  // Animation variants for the main container
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Animation variants for each narrative segment
  const segmentVariants: Variants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut' as const,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn' as const,
      },
    },
  };

  // Animation variants for the skip button
  const skipButtonVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: 'easeOut' as const,
      },
    },
  };

  // Animation variants for the continue button with pulse effect
  const continueButtonVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.9,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: 'easeOut' as const,
      },
    },
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black"
      variants={containerVariants}
      initial="initial"
      animate={isExiting ? 'exit' : 'animate'}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      {/* Skip button in top-right corner - appears after 1 second, disappears when continue button shows */}
      <AnimatePresence>
        {showSkipButton && !isExiting && !showContinueButton && (
          <motion.div
            className="absolute top-4 right-4"
            variants={skipButtonVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
          >
            <motion.div whileHover="hover" variants={skipButtonVariants}>
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                SALTAR
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="w-full max-w-4xl mx-4 bg-black/80 border-gray-700">
        <CardContent className="p-8 md:p-12 min-h-[400px] flex flex-col items-center justify-center">
          {/* Display current narrative segment with animations */}
          <div className="relative w-full min-h-[200px] flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
              {narrativeSegments.slice(0, currentSegmentIndex + 1).map((segment, index) => {
                // Only show the current segment, hide previous ones
                const isCurrentSegment = index === currentSegmentIndex;

                return (
                  <motion.p
                    key={segment.id}
                    className="absolute inset-0 flex items-center justify-center text-lg md:text-xl lg:text-2xl text-gray-100 leading-relaxed font-light px-4"
                    variants={segmentVariants}
                    initial="initial"
                    animate={isCurrentSegment ? 'animate' : 'exit'}
                    exit="exit"
                  >
                    {segment.text}
                  </motion.p>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Continue button - shown after all segments with pulse animation */}
          <AnimatePresence>
            {showContinueButton && !isExiting && (
              <motion.div
                className="mt-12"
                variants={continueButtonVariants}
                initial="initial"
                animate={['animate', 'pulse']}
              >
                <motion.div whileHover="hover" variants={continueButtonVariants}>
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold"
                  >
                    CONTINUAR
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};
