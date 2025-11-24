import { useEffect, useState } from 'react';

export const useVisibilityDetector = (onHidden) => {
  const [isVisible, setIsVisible] = useState(true);
  const [blurCount, setBlurCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        setBlurCount((prev) => {
          const newCount = prev + 1;
          console.warn(`Tab hidden. Count: ${newCount}`);
          if (newCount >= 3) {
            onHidden && onHidden();
          }
          return newCount;
        });
      } else {
        setIsVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onHidden]);

  return { isVisible, blurCount };
};
