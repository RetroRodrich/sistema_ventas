# Base de Datos - Pet World

## Descripción
Script SQL para crear la estructura completa de la base de datos del sistema de ventas Pet World.

## Requisitos
- MySQL 8.0 o superior
- MariaDB 10.4 o superior

## Instalación

### Opción 1: Desde línea de comandos
```bash
mysql -u root -p < schema.sql
```

### Opción 2: Desde MySQL Workbench
1. Abrir MySQL Workbench
2. Conectarse al servidor
3. File > Open SQL Script > seleccionar `schema.sql`
4. Ejecutar (⚡ o Ctrl+Shift+Enter)

### Opción 3: Desde phpMyAdmin
1. Ingresar a phpMyAdmin
2. Seleccionar "Importar"
3. Elegir archivo `schema.sql`
4. Ejecutar

## Estructura de la Base de Datos

### Tablas
- **users**: Usuarios del sistema (admin/empleados)
- **categories**: Categorías de productos/servicios
- **products**: Productos y servicios
- **product_batches**: Lotes de productos con stock y vencimiento
- **sales**: Ventas registradas
- **saledetails**: Detalle de productos por venta

### Estados de Venta
- `pendiente`: Venta registrada pero no cobrada
- `pagada`: Venta completada y cobrada
- `anulada`: Venta cancelada (stock devuelto)

## Categorías Incluidas

El script incluye 46 categorías predefinidas para veterinaria:

### Productos
- Alimentos (perros, gatos, especiales, snacks)
- Accesorios (collares, camas, transportadoras, comederos)
- Juguetes (perros, gatos, interactivos)
- Higiene (shampoo, cepillos, antipulgas)
- Salud (vitaminas, medicamentos, primeros auxilios)
- Acuarios y peces
- Aves y roedores

### Servicios
- Consultas veterinarias
- Vacunación y desparasitación
- Cirugías
- Análisis clínicos
- Radiografías y ecografías
- Grooming y peluquería
- Guardería y hotel
- Adiestramiento
- Y más...

## Notas
- El script usa `INSERT IGNORE` para las categorías, evitando duplicados
- Compatible con migraciones de datos antiguos (inglés → español en status)
- Incluye índices optimizados para consultas frecuentes
