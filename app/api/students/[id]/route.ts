import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const student = await prisma.studentProfile.findUnique({
      where: { id }
    });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    const updateData: any = { ...data };
    
    // Stringify array fields if they are sent as objects/arrays
    if (data.educationalQualifications && typeof data.educationalQualifications !== 'string') {
      updateData.educationalQualifications = JSON.stringify(data.educationalQualifications);
    }
    if (data.certifications && typeof data.certifications !== 'string') {
      updateData.certifications = JSON.stringify(data.certifications);
    }
    if (data.technicalExpertise && typeof data.technicalExpertise !== 'string') {
      updateData.technicalExpertise = JSON.stringify(data.technicalExpertise);
    }
    if (data.projects && typeof data.projects !== 'string') {
      updateData.projects = JSON.stringify(data.projects);
    }
    if (data.strengths && typeof data.strengths !== 'string') {
      updateData.strengths = JSON.stringify(data.strengths);
    }

    const student = await prisma.studentProfile.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    await prisma.studentProfile.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
