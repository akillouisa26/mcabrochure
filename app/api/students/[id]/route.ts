import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const docRef = doc(db, 'studentProfiles', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = docSnap.data() || {};
    return NextResponse.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const data = await req.json();

    const parseArrayField = (val: any) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    };

    const updateData: any = { ...data };
    delete updateData.id;

    if ('educationalQualifications' in data) updateData.educationalQualifications = parseArrayField(data.educationalQualifications);
    if ('certifications' in data) updateData.certifications = parseArrayField(data.certifications);
    if ('technicalExpertise' in data) updateData.technicalExpertise = parseArrayField(data.technicalExpertise);
    if ('projects' in data) updateData.projects = parseArrayField(data.projects);
    if ('strengths' in data) updateData.strengths = parseArrayField(data.strengths);

    updateData.updatedAt = serverTimestamp();

    const docRef = doc(db, 'studentProfiles', id);
    await updateDoc(docRef, updateData);

    const updatedSnap = await getDoc(docRef);
    const updatedData = updatedSnap.data() || {};

    return NextResponse.json({
      id: updatedSnap.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.() ? updatedData.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: updatedData.updatedAt?.toDate?.() ? updatedData.updatedAt.toDate().toISOString() : new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const docRef = doc(db, 'studentProfiles', id);
    await deleteDoc(docRef);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
