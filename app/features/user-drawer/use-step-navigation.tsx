import { useCallback, useState } from 'react';

// use-step-navigation.ts
export const useStepNavigation = (totalSteps: number, validateStep: (index: number) => Promise<boolean>) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationStatus, setNavigationStatus] = useState({
    prevError: false,
    nextError: false,
  });

  const handleStepChange = async (direction: 'next' | 'back') => {
    const isMovingNext = direction === 'next';
    const canMove = isMovingNext ? currentStepIndex < totalSteps - 1 : currentStepIndex > 0;

    if (!canMove) return;

    const isValid = await validateStep(currentStepIndex);

    setNavigationStatus((prev) => ({
      prevError: isMovingNext ? !isValid : currentStepIndex - 1 === 0 ? false : prev.prevError,
      nextError: !isMovingNext ? !isValid : currentStepIndex + 1 === totalSteps - 1 ? false : prev.nextError,
    }));

    setCurrentStepIndex((prev) => (isMovingNext ? prev + 1 : prev - 1));
  };

  const resetNavigation = useCallback(() => {
    setCurrentStepIndex(0);
    setNavigationStatus({ prevError: false, nextError: false });
  }, []);

  return {
    currentStepIndex,
    navigationStatus,
    nextStep: () => handleStepChange('next'),
    previousStep: () => handleStepChange('back'),
    resetNavigation,
    goToStep: (index: number) => index >= 0 && index < totalSteps && setCurrentStepIndex(index),
  };
};
