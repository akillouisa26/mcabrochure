'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    if (res.ok) {
      router.push('/admin');
      router.refresh(); // to apply middleware changes immediately on client
    } else {
      setError('Invalid admin password');
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <h2 className="page-title">Admin Login</h2>
      <form onSubmit={handleLogin}>
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <div className="form-group">
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
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}
