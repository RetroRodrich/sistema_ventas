import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileExcel } from "react-icons/fa";

function ExportExcelButton({ data, columns, children, filterType, customFrom, customTo }) {
  const handleExport = () => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    // Formato: 20250517_1401_HS_MS
    const fechaStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_HS_MS`;
    const dynamicFilename = `${fechaStr}.xlsx`;

    const fechaExport = now.toLocaleString();

    // Calcula el rango de fechas real según el filtro
    let rango = "";
    const formatDate = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    switch (filterType) {
      case "hoy": {
        const hoy = formatDate(now);
        rango = `Desde: ${hoy}  Hasta: ${hoy}`;
        break;
      }
      case "mes": {
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
        rango = `Desde: ${formatDate(inicioMes)}  Hasta: ${formatDate(now)}`;
        break;
      }
      case "anio": {
        const inicioAnio = new Date(now.getFullYear(), 0, 1);
        rango = `Desde: ${formatDate(inicioAnio)}  Hasta: ${formatDate(now)}`;
        break;
      }
      case "todo":
        rango = "Todo el historial";
        break;
      case "personalizado":
        rango = `Desde: ${customFrom || "-"}  Hasta: ${customTo || "-"}`;
        break;
      default:
        rango = "Sin filtro";
    }

    const infoRows = [
      ["Fecha de exportación:", fechaExport],
      ["Rango de fechas:", rango],
      [],
    ];

    const headers = columns.map(col => col.label);
    const exportData = data.map(row =>
      columns.map(col =>
        typeof col.value === "function" ? col.value(row) : row[col.value]
      )
    );

    const finalData = [...infoRows, headers, ...exportData];

    const worksheet = XLSX.utils.aoa_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, dynamicFilename);
  };

  return (
    <button className="sh-btn sh-btn--excel" onClick={handleExport}>
      <FaFileExcel style={{ marginRight: 6, fontSize: "1.2em" }} />
      {children || "Exportar Excel"}
    </button>
  );
}

export default ExportExcelButton;