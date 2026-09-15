import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const students = await prisma.studentProfile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const student = await prisma.studentProfile.create({
      data: {
        name: data.name,
        tagline: data.tagline,
        objective: data.objective,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactLocation: data.contactLocation,
        contactLinkedIn: data.contactLinkedIn,
        contactGitHub: data.contactGitHub,
        contactPortfolio: data.contactPortfolio,
        educationalQualifications: JSON.stringify(data.educationalQualifications || []),
        certifications: JSON.stringify(data.certifications || []),
        technicalExpertise: JSON.stringify(data.technicalExpertise || []),
        projects: JSON.stringify(data.projects || []),
        strengths: JSON.stringify(data.strengths || []),
        profileImageBase64: data.profileImageBase64 || null,
        status: 'PENDING'
      }
    });
    return NextResponse.json(student);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
  }
}
