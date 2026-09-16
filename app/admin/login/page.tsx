'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let idToken = '';
      if (auth && auth.app) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          idToken = await userCredential.user.getIdToken();
        } catch (fbErr: any) {
          console.warn('Firebase Client Auth note:', fbErr?.code || fbErr?.message);
        }
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, idToken }),
      });

      let resData: any = null;
      try {
        resData = await res.json();
      } catch (jsonErr) {
        console.warn('Non-JSON auth response:', jsonErr);
      }

      if (res.ok && resData?.success !== false) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(resData?.error || 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <h2 className="page-title">Admin Login</h2>
      <form onSubmit={handleLogin}>
        {error && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid #fca5a5', fontWeight: 600 }}>{error}</div>}

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Admin Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              style={{ paddingRight: '2.5rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#6b7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#113666', fontSize: '1.05rem', padding: '0.75rem' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
