import React, { useEffect, useRef } from "react";

/**
 * Hook personalizado para aplicar debounce a un valor (útil para búsquedas en tiempo real).
 * Devuelve el valor solo después de que el usuario deja de escribir por el tiempo indicado.
 *
 * @param {string} value - Valor a debounciar (por ejemplo, el texto de búsqueda).
 * @param {number} delay - Milisegundos de espera antes de actualizar el valor debounced.
 * @returns {string} Valor debounced (actualizado solo tras el delay).
 *
 * Ejemplo de uso:
 *   const debounced = useProductsDebouncedSearch(searchTerm, 350);
 */
export function useProductsDebouncedSearch(value, delay = 350) {
  // Estado local para el valor debounced
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  // Referencia para el timeout
  const timeoutRef = useRef();

  useEffect(() => {
    // Limpia el timeout anterior si cambia el valor o el delay
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    // Limpieza al desmontar o cambiar dependencias
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}
