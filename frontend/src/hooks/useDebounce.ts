// frontend/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Хук для debounce (отложенного выполнения).
 * Возвращает значение `value` только после того, как оно не менялось
 * в течение указанной задержки `delay`.
 *
 * @template T Тип значения.
 * @param {T} value Значение, которое нужно "задебаунсить".
 * @param {number} delay Задержка в миллисекундах.
 * @returns {T} Задебаунсенное значение.
 */
function useDebounce<T>(value: T, delay: number): T {
  // Состояние для хранения задебаунсенного значения
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Устанавливаем таймер, который обновит значение
      // после истечения задержки `delay`
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Функция очистки: отменяем таймер, если `value` или `delay` изменились
      // до того, как таймер сработал, или если компонент размонтируется.
      // Это гарантирует, что обновится только последнее значение после паузы.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Перезапускаем эффект только если изменилось значение или задержка
  );

  // Возвращаем последнее задебаунсенное значение
  return debouncedValue;
}

export default useDebounce;