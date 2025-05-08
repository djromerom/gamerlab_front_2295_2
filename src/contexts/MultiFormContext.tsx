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

export const MultiFormProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const reset = () => setStep(0);

  return (
    <MultiFormContext.Provider value={{ step, next, back, reset }}>
      {children}
    </MultiFormContext.Provider>
  );
};
