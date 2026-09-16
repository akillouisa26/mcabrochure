import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { idToken, email, password } = await req.json();

    // 1. If an ID Token from Firebase Auth is sent by client
    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const res = NextResponse.json({ success: true, uid: decodedToken.uid, email: decodedToken.email });
        res.cookies.set('admin_session', idToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
        return res;
      } catch (tokenError: any) {
        console.error('Firebase ID token verification failed:', tokenError);
      }
    }

    // 2. Fallback password or environment admin password check
    if (password && (password === 'mca2025' || password === process.env.ADMIN_PASSWORD)) {
      const res = NextResponse.json({ success: true });
      res.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return res;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
