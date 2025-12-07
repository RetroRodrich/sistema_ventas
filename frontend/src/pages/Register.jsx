import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../Conexion';
import '../styles/Register.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineUserGroup } from 'react-icons/hi';

/**
 * Register - Página de registro de nuevos usuarios.
 */
function Register({ onRegister }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
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
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegister && onRegister();
        navigate('/');
      } else {
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Decoración de fondo */}
      <div className="register-decoration">
        <div className="register-decoration__circle register-decoration__circle--1"></div>
        <div className="register-decoration__circle register-decoration__circle--2"></div>
        <div className="register-decoration__paw register-decoration__paw--1">🐾</div>
        <div className="register-decoration__paw register-decoration__paw--2">🐾</div>
      </div>

      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <div className="register-logo">
            <span className="register-logo__icon">🐱</span>
          </div>
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Únete a Pet World</p>
        </div>

        {/* Formulario */}
        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div className="register-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="register-input-group">
            <label className="register-label">Nombre completo</label>
            <div className="register-input-wrapper">
              <HiOutlineUser className="register-input-icon" />
              <input
                type="text"
                name="name"
                className="register-input"
                placeholder="Tu nombre"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="register-input-group">
            <label className="register-label">Correo electrónico</label>
            <div className="register-input-wrapper">
              <HiOutlineMail className="register-input-icon" />
              <input
                type="email"
                name="email"
                className="register-input"
                placeholder="ejemplo@petworld.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="register-input-group">
            <label className="register-label">Contraseña</label>
            <div className="register-input-wrapper">
              <HiOutlineLockClosed className="register-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="register-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="register-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="register-input-group">
            <label className="register-label">Rol</label>
            <div className="register-input-wrapper">
              <HiOutlineUserGroup className="register-input-icon" />
              <select
                name="role"
                className="register-input register-select"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? (
              <span>Registrando...</span>
            ) : (
              <>
                <span>Crear cuenta</span>
                <span className="register-btn__icon">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>

        {/* Mascotas decorativas */}
        <div className="register-pets">
          <span className="register-pets__item">🐕</span>
          <span className="register-pets__item">🐹</span>
          <span className="register-pets__item">🐦</span>
        </div>
      </div>
    </div>
  );
}

export default Register;