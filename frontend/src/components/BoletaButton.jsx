import React from "react";
import jsPDF from "jspdf";

const BoletaButton = ({ sale, details, icon, text, ...props }) => {
  // Variables para nombre de empresa y RUC (modificables)
  const empresaNombre = "RODRIGO TE ENDEUDA S.A.C.";
  const empresaRuc = "1072523118";

  const handleGenerateBoleta = () => {
    if (!sale || !details) return;
    const doc = new jsPDF({ unit: "mm", format: [80, 150] });

    // Fuente tipo ticket
    doc.setFont("courier", "normal");

    // Encabezado
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text(`R.U.C.: ${empresaRuc}`, 40, 12, { align: "center" });
    doc.setFontSize(11);
    doc.text("BOLETA ELECTRÓNICA", 40, 17, { align: "center" });
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`N° de Boleta: 0000${sale.id}`, 40, 22, { align: "center" });

    // Empresa
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text(empresaNombre, 40, 28, { align: "center" });
    doc.setFont(undefined, "normal");
    doc.text("Av. Principal 123", 40, 32, { align: "center" });

    // Cliente y fecha
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.text("Cliente:", 8, 38);
    doc.setFont(undefined, "normal");
    doc.text(sale.customer_name, 25, 38);
    doc.setFont(undefined, "bold");
    doc.text("Emisión:", 8, 42);
    doc.setFont(undefined, "normal");
    doc.text(new Date(sale.createdAt).toLocaleDateString(), 25, 42);

    // Línea separadora
    doc.setLineWidth(0.4);
    doc.line(6, 45, 74, 45);

    // Tabla encabezado (más espacio para producto)
    let y = 49;
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.text("Producto", 8, y);
    doc.text("P. unit.", 44, y, { align: "right" });
    doc.text("Cant.", 56, y, { align: "right" });
    doc.text("Total", 74, y, { align: "right" });

    y += 2.5;
    doc.setLineWidth(0.2);
    doc.line(6, y, 74, y);

    // Detalles (nombre con salto de línea, importes alineados en la última línea)
    y += 4;
    doc.setFont(undefined, "normal");
    details.forEach((d, i) => {
      const nombreProducto = doc.splitTextToSize(String(d.product_name || d.productId), 20);
      nombreProducto.forEach((linea, idx) => {
        // Si es la última línea del nombre, imprime también los importes
        if (idx === nombreProducto.length - 1) {
          doc.text(linea, 8, y + idx * 4);
          doc.text(`S/ ${Number(d.price).toFixed(2)}`, 44, y + idx * 4, { align: "right" });
          doc.text(String(d.quantity), 56, y + idx * 4, { align: "right" });
          doc.text(`S/ ${Number(d.subtotal).toFixed(2)}`, 74, y + idx * 4, { align: "right" });
        } else {
          doc.text(linea, 8, y + idx * 4);
        }
      });
      y += 4 * nombreProducto.length;
    });

    // Línea separadora
    doc.setLineWidth(0.4);
    doc.line(6, y, 74, y);

    // Totales
    y += 6;
    doc.setFont(undefined, "normal");
    const subtotal = Number(sale.total) - Number(sale.igv || 0);
    doc.text("Total Gravado:", 56, y, { align: "right" });
    doc.text(`S/ ${subtotal.toFixed(2)}`, 74, y, { align: "right" });

    y += 4;
    doc.text("IGV:", 56, y, { align: "right" });
    doc.text(`S/ ${Number(sale.igv || 0).toFixed(2)}`, 74, y, { align: "right" });

    y += 4;
    doc.setFont(undefined, "bold");
    doc.text("Total:", 56, y, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.text(`S/ ${Number(sale.total).toFixed(2)}`, 74, y, { align: "right" });

    // Pie de página
    y += 12;
    doc.setFontSize(8);
    doc.setFont(undefined, "italic");
    doc.text("¡Gracias por su compra!", 40, y, { align: "center" });

    doc.save(`boleta_${sale.id}.pdf`);
  };

  return (
    <button {...props} onClick={handleGenerateBoleta}>
      {icon}
      {text && <span style={{ marginLeft: 6 }}>{text}</span>}
    </button>
  );
};

export default BoletaButton;