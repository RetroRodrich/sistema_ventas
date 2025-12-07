-- ============================================
-- PET WORLD - SISTEMA DE VENTAS
-- Script de creación de base de datos
-- ============================================
-- Ejecutar este script para crear la estructura completa

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS inventory_sales_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventory_sales_db;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') DEFAULT 'employee',
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  categoryId INT,
  image VARCHAR(500),
  brand VARCHAR(100),
  barcode VARCHAR(50) UNIQUE,
  cost DECIMAL(10, 2),
  minStock INT DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_category (categoryId),
  INDEX idx_barcode (barcode),
  INDEX idx_active (isActive)
) ENGINE=InnoDB;

-- Tabla de lotes de productos
CREATE TABLE IF NOT EXISTS product_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  batch VARCHAR(50) NOT NULL,
  expirationDate DATE,
  stock INT NOT NULL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (productId),
  INDEX idx_expiration (expirationDate),
  INDEX idx_stock (stock)
) ENGINE=InnoDB;

-- Tabla de ventas
-- Status: 'pendiente', 'pagada', 'anulada' (español)
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  customer_name VARCHAR(100) DEFAULT 'Cliente General',
  customer_dni VARCHAR(20),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  igv DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('pendiente', 'pagada', 'anulada') NOT NULL DEFAULT 'pendiente',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_user (userId),
  INDEX idx_status (status),
  INDEX idx_date (createdAt)
) ENGINE=InnoDB;

-- Tabla de detalles de venta
CREATE TABLE IF NOT EXISTS saledetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  saleId INT NOT NULL,
  productId INT NOT NULL,
  batchId INT,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (batchId) REFERENCES product_batches(id) ON DELETE SET NULL,
  INDEX idx_sale (saleId),
  INDEX idx_product (productId)
) ENGINE=InnoDB;

-- ============================================
-- MIGRACIÓN: Actualizar status si existen datos antiguos
-- ============================================
-- Si la tabla sales ya existe con valores en inglés, actualizar a español

-- Verificar y migrar datos existentes (solo si hay registros)
UPDATE sales SET status = 'pagada' WHERE status = 'completed';
UPDATE sales SET status = 'pendiente' WHERE status = 'pending';
UPDATE sales SET status = 'anulada' WHERE status = 'cancelled';

-- ============================================
-- CATEGORÍAS PARA VETERINARIA PET WORLD
-- ============================================

-- Insertar categorías solo si no existen
INSERT IGNORE INTO categories (name, description) VALUES 
-- Alimentos para Mascotas
('Alimentos para Perros', 'Alimentos balanceados, croquetas, comida húmeda y snacks para perros de todas las edades'),
('Alimentos para Gatos', 'Alimentos balanceados, croquetas, comida húmeda y snacks para gatos de todas las edades'),
('Alimentos Especiales', 'Dietas veterinarias, alimentos hipoalergénicos y para necesidades específicas'),
('Snacks y Premios', 'Golosinas, huesos, premios de entrenamiento y snacks saludables'),

-- Accesorios y Equipamiento
('Collares y Correas', 'Collares, correas, arneses y pecheras para paseo'),
('Camas y Descanso', 'Camas, colchonetas, mantas y espacios de descanso'),
('Transportadoras', 'Jaulas de transporte, mochilas y carriers para mascotas'),
('Comederos y Bebederos', 'Platos, dispensadores automáticos y fuentes de agua'),

-- Juguetes y Entretenimiento
('Juguetes para Perros', 'Pelotas, cuerdas, frisbees y juguetes interactivos para perros'),
('Juguetes para Gatos', 'Ratones, rascadores, túneles y juguetes con catnip'),
('Juguetes Interactivos', 'Juguetes dispensadores de premios y estimulación mental'),

-- Higiene y Cuidado
('Shampoo y Acondicionador', 'Productos de baño para diferentes tipos de pelaje y piel'),
('Cepillos y Peines', 'Herramientas de cepillado, cortauñas y grooming'),
('Productos de Limpieza', 'Neutralizadores de olor, pañales, toallitas húmedas'),
('Antipulgas y Garrapatas', 'Collares, pipetas, sprays y tratamientos antiparasitarios'),

-- Salud y Medicamentos
('Vitaminas y Suplementos', 'Multivitamínicos, suplementos articulares y nutricionales'),
('Medicamentos Veterinarios', 'Antibióticos, analgésicos y medicamentos con receta'),
('Primeros Auxilios', 'Vendas, gasas, desinfectantes y kits de emergencia'),
('Cuidado Dental', 'Pastas dentales, cepillos y productos para higiene bucal'),

-- Acuarios y Peces
('Acuarios y Peceras', 'Tanques, peceras y accesorios para peces'),
('Alimento para Peces', 'Alimentos en escamas, pellets y congelados'),
('Filtros y Bombas', 'Sistemas de filtración y oxigenación'),

-- Aves y Roedores
('Jaulas para Aves', 'Jaulas, pajareras y accesorios para aves'),
('Alimento para Aves', 'Semillas, mezclas y alimentos balanceados para aves'),
('Jaulas para Roedores', 'Jaulas, hábitats y accesorios para conejos, hámsters y cobayas'),
('Alimento para Roedores', 'Alimentos balanceados, heno y snacks para roedores'),

-- Servicios Veterinarios
('Consultas Veterinarias', 'Consultas generales, chequeos preventivos y valoraciones médicas'),
('Vacunación', 'Vacunas antirrábicas, múltiples y refuerzos según calendario'),
('Desparasitación', 'Desparasitación interna y externa para mascotas'),
('Cirugías', 'Esterilizaciones, castraciones y cirugías menores'),
('Cirugías Mayores', 'Intervenciones quirúrgicas especializadas'),
('Hospitalización', 'Servicio de internación y cuidados intensivos'),
('Análisis Clínicos', 'Laboratorio, análisis de sangre, orina y heces'),
('Radiografías', 'Estudios radiográficos y diagnóstico por imágenes'),
('Ecografías', 'Estudios ecográficos y ultrasonido'),
('Urgencias 24/7', 'Atención de emergencias veterinarias'),
('Grooming', 'Baño, corte de pelo, limpieza de oídos y corte de uñas'),
('Peluquería Canina', 'Estilismo y cortes especializados para perros'),
('Guardería', 'Servicio de cuidado diario y estancia temporal'),
('Hotel para Mascotas', 'Hospedaje y cuidado completo durante vacaciones'),
('Adiestramiento', 'Entrenamiento básico y corrección de conductas'),
('Asesoría Nutricional', 'Consultas sobre alimentación y dietas personalizadas'),
('Odontología', 'Limpieza dental, extracciones y tratamientos bucales'),
('Microchip', 'Implantación de microchip de identificación'),
('Certificados', 'Certificados de salud para viajes y trámites');

-- ============================================
-- USUARIO ADMIN POR DEFECTO (opcional)
-- ============================================
-- Password: admin123 (hasheado con bcrypt)
-- Descomenta si necesitas un usuario inicial
-- INSERT IGNORE INTO users (name, email, password, role) VALUES 
-- ('Administrador', 'admin@petworld.com', '$2a$10$YourHashedPasswordHere', 'admin');

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Base de datos creada exitosamente' AS mensaje;
SELECT COUNT(*) AS total_categorias FROM categories;
