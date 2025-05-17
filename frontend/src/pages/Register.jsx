import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../Conexion';
import '../styles/Register.css';
import { HiOutlineShoppingCart } from 'react-icons/hi'; // <-- Importa el icono

function Register({ onRegister }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
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
        navigate('/'); // <-- Redirige al home
      } else {
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  return (
    <div className="register-bg">
      <div className="register-card">
        <div className="register-icon">
          <HiOutlineShoppingCart />
        </div>
        <h2>Crear Cuenta</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="register-error">{error}</div>}
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="register-btn">Registrarme</button>
        </form>
        <p className="register-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;