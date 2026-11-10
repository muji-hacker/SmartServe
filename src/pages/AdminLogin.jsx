import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('smartserve_token', result.token);
      navigate('/admin', { replace: true });
    } catch (error) {
      setMessage(error.message);
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-copy">
        <img className="login-photo" src="/images/coffee.jpg" alt="Iced coffee on the cafe counter" />
        <div>
          <p className="eyebrow">SmartServe</p>
          <h1>The floor, in one view.</h1>
          <p>Watch tables, receive orders as they are placed, and keep the menu up to date.</p>
        </div>
      </section>
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">Admin</p>
        <h2>Sign in</h2>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        {message ? <p className="banner">{message}</p> : null}
        <button type="submit" className="button full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}
