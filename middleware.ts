import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSessionRaw = request.cookies.get('admin_session')?.value;
    if (!adminSessionRaw) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      if (adminSessionRaw.startsWith('{')) {
        const parsed = JSON.parse(adminSessionRaw);
        const loginTime = parsed.loginTime || 0;

        if (loginTime > 0 && db) {
          const docRef = doc(db, 'systemConfig', 'authSession');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const globalLogoutTime = docSnap.data()?.globalLogoutTime || 0;
            if (globalLogoutTime > 0 && loginTime < globalLogoutTime) {
              const redirectRes = NextResponse.redirect(new URL('/admin/login', request.url));
              redirectRes.cookies.set('admin_session', '', { maxAge: 0, path: '/' });
              return redirectRes;
            }
          }
        }
      }
    } catch {
      // Gracefully fall back if Firestore read fails in edge runtime
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
