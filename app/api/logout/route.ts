import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });

  try {
    const docRef = doc(db, 'systemConfig', 'authSession');
    await setDoc(docRef, { globalLogoutTime: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Failed to update global logout timestamp:', err);
  }

  return res;
}
