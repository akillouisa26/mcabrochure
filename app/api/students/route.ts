import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  where 
} from 'firebase/firestore';
import { safeParseArray } from '@/lib/parsers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const isAdmin = Boolean(cookieStore.get('admin_session')?.value);

    const collectionRef = collection(db, 'studentProfiles');
    let q;
    
    if (isAdmin) {
      q = query(collectionRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(collectionRef, where('status', '==', 'APPROVED'));
    }

    const snapshot = await getDocs(q);

    const students = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Firestore GET error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const regNum = String(data.registerNumber || '').trim().toUpperCase();

    if (regNum) {
      const collectionRef = collection(db, 'studentProfiles');
      const snapshot = await getDocs(collectionRef);
      const duplicateExists = snapshot.docs.some(docSnap => {
        const existingReg = String(docSnap.data().registerNumber || '').trim().toUpperCase();
        return existingReg === regNum;
      });

      if (duplicateExists) {
        return NextResponse.json({ 
          error: `Register Number "${regNum}" has already filled out the brochure form. Duplicate submissions with the same Register Number are not allowed.` 
        }, { status: 400 });
      }
    }

    const docData = {
      name: data.name || '',
      registerNumber: regNum || data.registerNumber || '',
      tagline: data.tagline || '',
      objective: data.objective || data.visionStatement || '',
      contactPhone: data.contactPhone || '',
      contactEmail: data.contactEmail || '',
      linkedIn: data.linkedIn || '',
      github: data.github || '',
      portfolio: data.portfolio || '',
      educationalQualifications: safeParseArray(data.educationalQualifications),
      certifications: safeParseArray(data.certifications),
      technicalExpertise: safeParseArray(data.technicalExpertise),
      internships: safeParseArray(data.internships),
      projects: safeParseArray(data.projects),
      strengths: safeParseArray(data.strengths),
      customFieldsData: data.customFieldsData || {},
      profileImageBase64: data.profileImageBase64 || null,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'studentProfiles'), docData);
    
    return NextResponse.json({
      id: docRef.id,
      ...docData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Firestore POST error:', error?.message || error);
    if (error?.message?.includes('PERMISSION_DENIED') || error?.code === 'permission-denied') {
      return NextResponse.json({ 
        error: 'Firebase Firestore Permission Denied. Please enable Read/Write permissions in your Firebase Console -> Firestore Database -> Rules tab.' 
      }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create student profile' }, { status: 500 });
  }
}
