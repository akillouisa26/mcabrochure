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

    const { idToken } = body;

    // Only accept authenticated Firebase Auth tokens
    if (idToken) {
      const res = NextResponse.json({ success: true });
      const sessionPayload = JSON.stringify({ idToken, loginTime: Date.now() });
      res.cookies.set('admin_session', sessionPayload, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return res;
    }

    return NextResponse.json({ success: false, error: 'Firebase authentication required' }, { status: 401 });
  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Authentication failed' }, { status: 500 });
  }
}
