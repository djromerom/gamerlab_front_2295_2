import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string | number | Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps): React.ReactElement {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date();
    const totalSeconds = Math.floor(difference / 1000);

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const { days, hours, minutes, seconds } = timeLeft;

  const pad = (n: number): string => String(n).padStart(2, '0');

  return (
    <div className="text-center mb-8 sm:mt-8">
      <p className="text-white/80 mb-2">La competencia inicia en</p>
      <div className="text-4xl sm:text-6xl font-bold">
        {days > 0 ? (
          <span>
            {pad(days)}d : {pad(hours)}h : {pad(minutes)}m
          </span>
        ) : (
          <span>
            {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s
          </span>
        )}
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full max-w-3xl mx-auto"></div>
    </div>
  );
}