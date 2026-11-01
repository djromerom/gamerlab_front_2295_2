import { createContext, useContext, useState, ReactNode } from 'react';

interface MultiFormContextProps {
  step: number;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const MultiFormContext = createContext<MultiFormContextProps | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useMultiForm = () => {
  const ctx = useContext(MultiFormContext);
  if (!ctx) throw new Error('useMultiForm must be used within MultiFormProvider');
  return ctx;
};

export const MultiFormProvider = ({
  children,
  initialStep = 0,
}: {
  children: ReactNode;
  /** Paso con el que arranca (el registro lo restaura del borrador, BG-07). */
  initialStep?: number;
}) => {
  const [step, setStep] = useState(() => Math.min(Math.max(initialStep, 0), 3));
  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const reset = () => setStep(0);

  return (
    <MultiFormContext.Provider value={{ step, next, back, reset }}>
      {children}
    </MultiFormContext.Provider>
  );
};
