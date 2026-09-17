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
          let msg = 'Invalid email or password';
          const code = fbErr?.code || '';
          if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            msg = 'Invalid email or password.';
          } else if (code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
          } else if (code === 'auth/too-many-requests') {
            msg = 'Access temporarily disabled due to too many failed attempts. Try again later.';
          } else if (code.includes('api-key') || code === 'auth/invalid-api-key') {
            msg = 'Firebase API Key is missing or invalid. Please add your real NEXT_PUBLIC_FIREBASE_API_KEY in Vercel Environment Variables.';
          } else if (fbErr?.message) {
            msg = fbErr.message.replace(/^Firebase:\s*/, '');
          }
          setError(msg);
          setLoading(false);
          return;
        }
      } else {
        setError('Firebase Auth client SDK is loading. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
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
        setError(resData?.error || 'Authentication failed. Please check credentials.');
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
            placeholder="Enter admin email..."
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
                color: '#6b7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                /* Clean Eye SVG Icon (Open Eye) */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                /* Clean Eye Slash SVG Icon (Closed Eye) */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
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
