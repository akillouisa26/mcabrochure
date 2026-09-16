'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          console.warn('Firebase Client Auth note:', fbErr?.message || fbErr);
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
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

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

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
