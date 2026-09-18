import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function checkIsAdminValid(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get('admin_session')?.value;
    if (!rawCookie) return false;

    let loginTime = 0;
    if (rawCookie.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawCookie);
        loginTime = parsed.loginTime || 0;
      } catch {
        return true;
      }
    } else {
      return true;
    }

    if (loginTime > 0) {
      const docRef = doc(db, 'systemConfig', 'authSession');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const globalLogoutTime = docSnap.data()?.globalLogoutTime || 0;
        if (globalLogoutTime > 0 && loginTime < globalLogoutTime) {
          return false;
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('Auth session check error:', err);
    return true;
  }
}
