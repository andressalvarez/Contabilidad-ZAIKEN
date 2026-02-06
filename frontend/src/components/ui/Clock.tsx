'use client';

import { useState, useEffect } from 'react';

interface ClockProps {
  showSeconds?: boolean;
  className?: string;
}

export default function Clock({ showSeconds = true, className = '' }: ClockProps) {
  const [currentTime, setCurrentTime] = useState<string>('--:--');

  useEffect(() => {
    // Function to update the time
    const updateTime = () => {
      const timeString = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: false
      });
      setCurrentTime(timeString);
    };

    // Update immediately
    updateTime();

    // Update every second if showing seconds, every minute if not
    const interval = setInterval(updateTime, showSeconds ? 1000 : 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [showSeconds]);

  return (
    <span className={className}>
      {currentTime}
    </span>
  );
}
