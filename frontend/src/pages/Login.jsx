import React, { useState } from 'react';
import { API_BASE_URL } from '../Conexion';
import '../styles/Login.css';
import cartImg from '../assets/images/carrito_bgc.webp';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Login - Página de inicio de sesión.
 * Permite a los usuarios autenticarse con correo y contraseña.
 *
 * Props:
 * - onLogin: función opcional que se ejecuta tras el login exitoso.
 */
function Login({ onLogin }) {
  // Estado del formulario de login
  const [form, setForm] = useState({ email: '', password: '' });
  // Estado para mostrar errores
  const [error, setError] = useState('');
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Hook de navegación
  const navigate = useNavigate();

  /**
   * Actualiza el estado del formulario al escribir en los campos.
   */
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Envía el formulario al backend para autenticar al usuario.
   * Si es exitoso, guarda el token y usuario en localStorage y redirige al home.
   */
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onLogin) onLogin();
        navigate('/');
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  // Renderizado del formulario de login
  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-illustration">
          <img src={cartImg} alt="Carrito" className="login-cart-img"/>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Iniciar Sesión</h2>
          {error && <div className="login-error">{error}</div>}
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            required
          />
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button type="submit" className='btn-login'>Ingresar</button>
        </form>
        <p className="login-link">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;