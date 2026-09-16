'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BrochurePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Admin Panel brochures tab
    router.replace('/admin');
  }, [router]);

  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
      Redirecting to Admin Panel Brochures view...
    </div>
  );
}
