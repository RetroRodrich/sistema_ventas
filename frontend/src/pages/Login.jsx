import React, { useState } from 'react';
import { API_BASE_URL } from '../Conexion';
import '../styles/Login.css';
import cartImg from '../assets/images/carrito_bgc.webp';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
        if (onLogin) onLogin();
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión');
    }
  };

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
      </div>
    </div>
  );
}

export default Login;