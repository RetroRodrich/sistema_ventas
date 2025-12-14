/**
 * Middleware de validación de datos de entrada
 * Previene inyecciones y valida tipos de datos
 */

/**
 * Sanitiza strings removiendo caracteres peligrosos
 * @param {string} str - String a sanitizar
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remover caracteres peligrosos
    .slice(0, 500); // Limitar longitud
};

/**
 * Valida que un email tenga formato correcto
 * @param {string} email - Email a validar
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que un número esté en el rango permitido
 * @param {number} num - Número a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 */
const isValidNumber = (num, min = 0, max = 999999999) => {
  const number = Number(num);
  return !isNaN(number) && number >= min && number <= max;
};

/**
 * Middleware para validar datos de productos
 */
const validateProductData = (req, res, next) => {
  const { name, price, categoryId, description, brand, barcode, cost, minStock } = req.body;

  // Validaciones requeridas
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Nombre del producto requerido',
      field: 'name' 
    });
  }

  // Precio: debe existir y ser mayor a 0
  if (price === undefined || price === null || price === '') {
    return res.status(400).json({ 
      error: 'Precio es requerido',
      field: 'price' 
    });
  }
  
  if (!isValidNumber(price, 0.01, 999999)) {
    return res.status(400).json({ 
      error: 'Precio debe ser un número válido mayor a 0',
      field: 'price' 
    });
  }

  // Categoría: debe existir y ser un ID válido
  if (categoryId === undefined || categoryId === null || categoryId === '') {
    return res.status(400).json({ 
      error: 'Categoría es requerida',
      field: 'categoryId' 
    });
  }
  
  if (!isValidNumber(categoryId, 1, 999999)) {
    return res.status(400).json({ 
      error: 'Categoría debe ser un ID válido',
      field: 'categoryId' 
    });
  }

  // Sanitizar campos de texto
  req.body.name = sanitizeString(name);
  req.body.description = description ? sanitizeString(description) : '';
  req.body.brand = brand ? sanitizeString(brand) : '';
  req.body.barcode = barcode ? sanitizeString(barcode) : '';

  // Validar campos opcionales numéricos
  if (cost !== undefined && cost !== null && cost !== '' && !isValidNumber(cost, 0, 999999)) {
    return res.status(400).json({ 
      error: 'Costo debe ser un número válido',
      field: 'cost' 
    });
  }

  if (minStock !== undefined && minStock !== null && minStock !== '' && !isValidNumber(minStock, 0, 999999)) {
    return res.status(400).json({ 
      error: 'Stock mínimo debe ser un número válido',
      field: 'minStock' 
    });
  }

  next();
};

/**
 * Middleware para validar datos de ventas
 */
const validateSaleData = (req, res, next) => {
  const { userId, total, igv, items, customer_name, customer_dni } = req.body;

  // Validar usuario
  if (!userId || !isValidNumber(userId, 1, 999999)) {
    return res.status(400).json({ 
      error: 'ID de usuario requerido y válido',
      field: 'userId' 
    });
  }

  // Validar total
  if (!total || !isValidNumber(total, 0.01, 999999)) {
    return res.status(400).json({ 
      error: 'Total debe ser un número válido mayor a 0',
      field: 'total' 
    });
  }

  // Validar IGV
  if (igv !== undefined && !isValidNumber(igv, 0, 999999)) {
    return res.status(400).json({ 
      error: 'IGV debe ser un número válido',
      field: 'igv' 
    });
  }

  // Validar items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Se requiere al menos un item en la venta',
      field: 'items' 
    });
  }

  // Validar cada item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.id || !isValidNumber(item.id, 1, 999999)) {
      return res.status(400).json({ 
        error: `Item ${i + 1}: ID de producto inválido`,
        field: `items[${i}].id` 
      });
    }

    if (!item.quantity || !isValidNumber(item.quantity, 1, 999999)) {
      return res.status(400).json({ 
        error: `Item ${i + 1}: Cantidad debe ser mayor a 0`,
        field: `items[${i}].quantity` 
      });
    }

    if (!item.price || !isValidNumber(item.price, 0.01, 999999)) {
      return res.status(400).json({ 
        error: `Item ${i + 1}: Precio debe ser mayor a 0`,
        field: `items[${i}].price` 
      });
    }
  }

  // Sanitizar campos de texto opcionales
  if (customer_name) {
    req.body.customer_name = sanitizeString(customer_name);
  }

  if (customer_dni) {
    req.body.customer_dni = sanitizeString(customer_dni).replace(/\D/g, '').slice(0, 8);
  }

  next();
};

/**
 * Middleware para validar datos de usuario (registro/login)
 */
const validateUserData = (req, res, next) => {
  const { email, password, name, role } = req.body;

  // Validar email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ 
      error: 'Email debe tener un formato válido',
      field: 'email' 
    });
  }

  // Validar password
  if (!password || password.length < 6) {
    return res.status(400).json({ 
      error: 'Contraseña debe tener al menos 6 caracteres',
      field: 'password' 
    });
  }

  // Para registro, validar nombre y rol
  if (req.route.path === '/register') {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Nombre es requerido',
        field: 'name' 
      });
    }

    if (!role || !['admin', 'employee'].includes(role)) {
      return res.status(400).json({ 
        error: 'Rol debe ser admin o employee',
        field: 'role' 
      });
    }

    // Sanitizar nombre
    req.body.name = sanitizeString(name);
  }

  // Sanitizar email
  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Middleware para validar IDs en parámetros de URL
 */
const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !isValidNumber(id, 1, 999999)) {
    return res.status(400).json({ 
      error: 'ID debe ser un número válido',
      field: 'id' 
    });
  }

  next();
};

/**
 * Middleware para validar batchId en parámetros de URL
 */
const validateBatchIdParam = (req, res, next) => {
  const { batchId } = req.params;
  
  if (!batchId || !isValidNumber(batchId, 1, 999999)) {
    return res.status(400).json({ 
      error: 'Batch ID debe ser un número válido',
      field: 'batchId' 
    });
  }

  next();
};

module.exports = {
  validateProductData,
  validateSaleData,
  validateUserData,
  validateIdParam,
  validateBatchIdParam,
  sanitizeString,
  isValidEmail,
  isValidNumber
};
