import React, { useState } from 'react';
import { API_BASE_URL } from '../Conexion';
import '../styles/Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Login - Página de inicio de sesión.
 * Permite a los usuarios autenticarse con correo y contraseña.
 */
function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decoración de fondo */}
      <div className="login-decoration">
        <div className="login-decoration__circle login-decoration__circle--1"></div>
        <div className="login-decoration__circle login-decoration__circle--2"></div>
        <div className="login-decoration__paw login-decoration__paw--1">🐾</div>
        <div className="login-decoration__paw login-decoration__paw--2">🐾</div>
        <div className="login-decoration__paw login-decoration__paw--3">🐾</div>
      </div>

      <div className="login-card">
        {/* Header con logo */}
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo__icon">🐕</span>
          </div>
          <h1 className="login-title">Pet World</h1>
          <p className="login-subtitle">Clínica Veterinaria</p>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="login-input-group">
            <label className="login-label">Correo electrónico</label>
            <div className="login-input-wrapper">
              <HiOutlineMail className="login-input-icon" />
              <input
                type="email"
                name="email"
                className="login-input"
                placeholder="ejemplo@petworld.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrapper">
              <HiOutlineLockClosed className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="login-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-btn__loading">Ingresando...</span>
            ) : (
              <>
                <span>Ingresar</span>
                <span className="login-btn__icon">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>

        {/* Mascotas decorativas */}
        <div className="login-pets">
          <span className="login-pets__item">🐱</span>
          <span className="login-pets__item">🐕</span>
          <span className="login-pets__item">🐰</span>
        </div>
      </div>
    </div>
  );
}

export default Login;