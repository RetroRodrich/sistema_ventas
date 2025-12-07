import React from "react";
import jsPDF from "jspdf";

/**
 * Botón para generar e imprimir la boleta en PDF.
 * Diseño profesional tipo boleta electrónica peruana.
 */
const BoletaButton = ({ sale, details, icon, text, ...props }) => {
  // Datos de la empresa
  const empresaNombre = "PET WORLD S.A.C.";
  const empresaRuc = "20123456789";
  const empresaDireccion = "Av. Las Mascotas 456";
  const empresaDistrito = "San Isidro - Lima";
  const empresaTelefono = "Tel: (01) 234-5678";

  const handleGenerateBoleta = () => {
    if (!sale || !details) return;
    
    // Calcular altura dinámica basada en cantidad de productos
    const baseHeight = 180;
    const productLines = details.reduce((acc, d) => {
      const lines = Math.ceil(String(d.product_name || d.productId).length / 18);
      return acc + (lines * 4) + 2;
    }, 0);
    const docHeight = Math.max(baseHeight, 140 + productLines);
    
    const doc = new jsPDF({ unit: "mm", format: [80, docHeight] });
    const pageWidth = 80;
    const marginLeft = 5;
    const marginRight = 75;
    const centerX = pageWidth / 2;

    // ========== ENCABEZADO ==========
    let y = 10;
    
    // Nombre de empresa
    doc.setTextColor(0, 88, 66);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(empresaNombre, centerX, y, { align: "center" });
    
    y += 4;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`RUC: ${empresaRuc}`, centerX, y, { align: "center" });
    
    y += 3.5;
    doc.text(empresaDireccion, centerX, y, { align: "center" });
    
    y += 3;
    doc.text(empresaDistrito, centerX, y, { align: "center" });
    
    y += 3;
    doc.text(empresaTelefono, centerX, y, { align: "center" });

    // ========== TIPO DE DOCUMENTO ==========
    y += 6;
    doc.setFillColor(255, 140, 66);
    doc.roundedRect(marginLeft + 10, y - 3, 50, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("BOLETA ELECTRÓNICA", centerX, y + 2, { align: "center" });
    
    y += 8;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`B001-${String(sale.id).padStart(8, '0')}`, centerX, y, { align: "center" });

    // ========== LÍNEA DECORATIVA ==========
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginLeft, y, marginRight, y);
    doc.setLineDashPattern([], 0);

    // ========== DATOS DEL CLIENTE ==========
    y += 5;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    
    // Fecha y hora
    const fecha = new Date(sale.createdAt);
    doc.text("Fecha:", marginLeft, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(fecha.toLocaleDateString('es-PE'), marginLeft + 12, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Hora:", centerX + 5, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), centerX + 15, y);
    
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Cliente:", marginLeft, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    const clienteNombre = sale.customer_name || "Cliente General";
    doc.text(clienteNombre.substring(0, 25), marginLeft + 14, y);
    
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Vendedor:", marginLeft, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(sale.user_name || "---", marginLeft + 17, y);

    // ========== LÍNEA SEPARADORA ==========
    y += 5;
    doc.setDrawColor(0, 88, 66);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, marginRight, y);

    // ========== TABLA DE PRODUCTOS ==========
    y += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(marginLeft, y - 3, 70, 6, 'F');
    
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text("DESCRIPCIÓN", marginLeft + 1, y);
    doc.text("CANT", marginLeft + 40, y);
    doc.text("P.UNIT", marginLeft + 50, y);
    doc.text("TOTAL", marginLeft + 62, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7);

    details.forEach((d) => {
      const nombreProducto = String(d.product_name || d.productId);
      const lines = doc.splitTextToSize(nombreProducto, 35);
      
      lines.forEach((linea, idx) => {
        doc.text(linea, marginLeft + 1, y);
        if (idx === lines.length - 1) {
          // Última línea: agregar cantidades
          doc.text(String(d.quantity), marginLeft + 42, y, { align: "center" });
          doc.text(Number(d.price).toFixed(2), marginLeft + 55, y, { align: "right" });
          doc.setFont("helvetica", "bold");
          doc.text(Number(d.subtotal).toFixed(2), marginLeft + 69, y, { align: "right" });
          doc.setFont("helvetica", "normal");
        }
        y += 4;
      });
      y += 1;
    });

    // ========== LÍNEA SEPARADORA ==========
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginLeft, y, marginRight, y);
    doc.setLineDashPattern([], 0);

    // ========== TOTALES ==========
    y += 5;
    const subtotal = Number(sale.total) - Number(sale.igv || 0);
    
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    
    doc.text("Op. Gravada:", marginLeft + 35, y);
    doc.text(`S/ ${subtotal.toFixed(2)}`, marginRight - 1, y, { align: "right" });

    y += 4;
    doc.text("IGV (18%):", marginLeft + 35, y);
    doc.text(`S/ ${Number(sale.igv || 0).toFixed(2)}`, marginRight - 1, y, { align: "right" });

    // Total destacado
    y += 6;
    doc.setFillColor(0, 88, 66);
    doc.roundedRect(marginLeft + 25, y - 4, 45, 9, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", marginLeft + 28, y + 1.5);
    doc.setFontSize(10);
    doc.text(`S/ ${Number(sale.total).toFixed(2)}`, marginRight - 3, y + 2, { align: "right" });

    // ========== PIE DE PÁGINA ==========
    y += 12;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("Representacion impresa de la Boleta Electronica", centerX, y, { align: "center" });
    
    y += 3.5;
    doc.text("Consulte su documento en:", centerX, y, { align: "center" });
    
    y += 3.5;
    doc.setTextColor(0, 88, 66);
    doc.setFont("helvetica", "bold");
    doc.text("www.petworld.pe/consulta", centerX, y, { align: "center" });

    // Línea separadora
    y += 5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginLeft + 10, y, marginRight - 10, y);
    doc.setLineDashPattern([], 0);

    y += 5;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Gracias por su preferencia!", centerX, y, { align: "center" });
    
    y += 4;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Vuelva pronto", centerX, y, { align: "center" });

    doc.save(`boleta_${sale.id}.pdf`);
  };

  return (
    <button {...props} onClick={handleGenerateBoleta}>
      {icon}
      {text && <span style={{ marginLeft: 6 }}>{text}</span>}
      Imprimir Boleta
    </button>
  );
};

export default BoletaButton;