import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Barra de paginación reutilizable para productos.
 *
 * @param {number} currentPage - Página actual.
 * @param {number} totalPages - Total de páginas.
 * @param {function} onPrev - Handler para ir a la página anterior.
 * @param {function} onNext - Handler para ir a la página siguiente.
 */
export default function ProductsPaginationBar({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <div className="pagination-bar">
      <button
        onClick={onPrev}
        disabled={currentPage === 1 || totalPages === 0}
        aria-label="Página anterior"
        tabIndex={0}
      >
        <FiChevronLeft />
      </button>
      <span>
        {totalPages === 0
          ? "Sin páginas"
          : `Página ${currentPage} de ${totalPages}`}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages || totalPages === 0}
        aria-label="Página siguiente"
        tabIndex={0}
      >
        <FiChevronRight />
      </button>
    </div>
  );
}
