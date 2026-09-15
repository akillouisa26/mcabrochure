import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();
  
  // Hardcoded password for simplicity: mca2025
  // You can change this or use environment variables
  if (password === 'mca2025' || password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true });
    // Set a simple cookie
    res.cookies.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    return res;
  }
  
  return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
}
