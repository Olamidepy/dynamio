import React, { useEffect, useState } from 'react';

interface ReadyCountdownProps {
  onCountdownFinish: () => void;
}

export const ReadyCountdown: React.FC<ReadyCountdownProps> = ({ onCountdownFinish }) => {
  const [count, setCount] = useState<number | string>(3);

  useEffect(() => {
    const t1 = setTimeout(() => setCount(2), 650);
    const t2 = setTimeout(() => setCount(1), 1300);
    const t3 = setTimeout(() => setCount('GO!'), 1950);
    const t4 = setTimeout(() => {
      onCountdownFinish();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onCountdownFinish]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center select-none">
      <div
        key={String(count)}
        className="transform animate-scale-in flex flex-col items-center justify-center"
      >
        <span
          className={`font-heading font-black text-7xl md:text-8xl tracking-tight drop-shadow-md ${
            count === 'GO!'
              ? 'text-[#FFCA1A]'
              : 'text-white'
          }`}
        >
          {count}
        </span>
        <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#FFCA1A] mt-2 bg-[#020202]/90 backdrop-blur-sm px-3.5 py-1 rounded-full border border-border/50 shadow-sm">
          {count === 'GO!' ? 'DEFEND THE VORTEX!' : 'GET READY'}
        </span>
      </div>
    </div>
  );
};
