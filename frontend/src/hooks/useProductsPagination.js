import { useCallback } from "react";

/**
 * Hook personalizado para manejar la paginación de productos.
 *
 * Proporciona handlers para avanzar y retroceder de página, asegurando que no se salga de los límites.
 *
 * @param {number} currentPage - Página actual.
 * @param {number} totalPages - Total de páginas disponibles.
 * @param {function} setCurrentPage - Setter de estado para la página actual.
 * @returns {Object} { handlePrevPage, handleNextPage }
 *
 * Ejemplo de uso:
 *   const { handlePrevPage, handleNextPage } = useProductsPagination(currentPage, totalPages, setCurrentPage);
 */
export function useProductsPagination(currentPage, totalPages, setCurrentPage) {
  // Retrocede una página (no menor a 1)
  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, [setCurrentPage]);

  // Avanza una página (no mayor al total)
  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [setCurrentPage, totalPages]);

  return { handlePrevPage, handleNextPage };
}
