import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { idToken, password } = body;

    // 1. Password Auth Check (mca2025 or ADMIN_PASSWORD)
    const validPassword = process.env.ADMIN_PASSWORD || 'mca2025';
    if (password && (password === validPassword || password === 'mca2025')) {
      const res = NextResponse.json({ success: true });
      res.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return res;
    }

    // 2. Firebase ID Token Verification (if ID token is provided)
    if (idToken) {
      try {
        const { adminAuth } = await import('@/lib/firebase-admin');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const res = NextResponse.json({ success: true, uid: decodedToken.uid, email: decodedToken.email });
        res.cookies.set('admin_session', idToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
        return res;
      } catch (tokenError: any) {
        console.error('Firebase ID token verification error:', tokenError);
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Authentication failed' }, { status: 500 });
  }
}
