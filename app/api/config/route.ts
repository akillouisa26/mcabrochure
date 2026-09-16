import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const defaultConfig = {
  showTagline: true,
  showProfilePicture: true,
  showCertifications: true,
  showTechnicalExpertise: true,
  showInternships: true,
  showProjects: true,
  showStrengths: true,
  customFields: [],
};

// In-memory fallback for local session/dev server resilience
let inMemoryConfig = { ...defaultConfig };

export async function GET() {
  try {
    const docRef = doc(db, 'systemConfig', 'formSettings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      inMemoryConfig = { ...defaultConfig, ...data };
      return NextResponse.json(inMemoryConfig);
    }
    return NextResponse.json(inMemoryConfig);
  } catch (error) {
    return NextResponse.json(inMemoryConfig);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    inMemoryConfig = { ...inMemoryConfig, ...body };

    try {
      const docRef = doc(db, 'systemConfig', 'formSettings');
      await setDoc(docRef, body, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore setDoc warning (using in-memory fallback):', fsErr);
    }

    return NextResponse.json({ success: true, config: inMemoryConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save form config' }, { status: 500 });
  }
}
