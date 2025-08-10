'use client';

import { useState, useEffect } from 'react';

interface ClockProps {
  showSeconds?: boolean;
  className?: string;
}

export default function Clock({ showSeconds = true, className = '' }: ClockProps) {
  const [currentTime, setCurrentTime] = useState<string>('--:--');

  useEffect(() => {
    // Función para actualizar la hora
    const updateTime = () => {
      const timeString = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: false
      });
      setCurrentTime(timeString);
    };

    // Actualizar inmediatamente
    updateTime();

    // Actualizar cada segundo si se muestran los segundos, cada minuto si no
    const interval = setInterval(updateTime, showSeconds ? 1000 : 60000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [showSeconds]);

  return (
    <span className={className}>
      {currentTime}
    </span>
  );
}
