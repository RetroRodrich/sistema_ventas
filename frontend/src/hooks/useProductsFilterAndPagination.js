import { useMemo } from "react";

/**
 * Hook personalizado para filtrar y paginar productos.
 *
 * - Filtra productos por nombre (búsqueda) y por categoría.
 * - Calcula la paginación según la cantidad de productos filtrados.
 *
 * @param {Array} productsData - Lista de productos completa.
 * @param {string} search - Término de búsqueda (ya debounced).
 * @param {string} filter - Filtro de categoría ('all' para todas).
 * @param {number} itemsPerPage - Cantidad de productos por página.
 * @param {number} currentPage - Página actual.
 * @returns {Object} { filteredProducts, paginatedProducts, totalPages }
 *
 * Ejemplo de uso:
 *   const { filteredProducts, paginatedProducts, totalPages } = useProductsFilterAndPagination(...);
 */
export function useProductsFilterAndPagination(productsData, search, filter, itemsPerPage, currentPage) {
  // Filtra productos por nombre y categoría
  const filteredProducts = useMemo(() => {
    return productsData.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === "all" || product.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [productsData, search, filter]);

  // Calcula el total de páginas según el filtrado
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts.length, itemsPerPage]);

  // Devuelve solo los productos de la página actual
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return { filteredProducts, paginatedProducts, totalPages };
}
