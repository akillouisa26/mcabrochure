import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const defaultConfig = {
  showName: true,
  showRegisterNumber: true,
  showTagline: true,
  showObjective: true,
  showProfilePicture: true,
  showPhone: true,
  showEmail: true,
  showLinkedIn: true,
  showGithub: true,
  showPortfolio: true,
  showEducation: true,
  showCertifications: true,
  showTechnicalExpertise: true,
  showInternships: true,
  showProjects: true,
  showStrengths: true,
  fieldLabels: {
    name: 'Full Name',
    registerNumber: 'Register Number',
    tagline: 'Tagline',
    objective: 'Vision Statement (2 Lines)',
    profilePicture: 'Profile Picture',
    phone: 'Phone',
    email: 'Email',
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    portfolio: 'Portfolio',
    education: 'Educational Qualifications',
    certifications: 'Certifications',
    technical: 'Technical Expertise',
    internships: 'Internships',
    projects: 'Projects',
    strengths: 'Strengths',
  },
  fieldSections: {
    name: 'personal',
    registerNumber: 'personal',
    tagline: 'personal',
    objective: 'personal',
    profilePicture: 'personal',
    phone: 'contact',
    email: 'contact',
    linkedIn: 'contact',
    github: 'contact',
    portfolio: 'contact',
    education: 'education',
    certifications: 'certifications',
    technical: 'technical',
    internships: 'internships',
    projects: 'projects',
    strengths: 'strengths',
  },
  fieldRequired: {
    name: true,
    registerNumber: true,
    tagline: false,
    objective: false,
    profilePicture: false,
    phone: true,
    email: true,
    linkedIn: false,
    github: false,
    portfolio: false,
    education: true,
    certifications: false,
    technical: false,
    internships: false,
    projects: false,
    strengths: false,
  },
  sectionOrder: ['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths', 'additional'],
  sectionTitles: {
    personal: 'Personal Details',
    contact: 'Contact Info',
    education: 'Educational Qualifications',
    certifications: 'Certifications',
    technical: 'Technical Expertise',
    internships: 'Internships',
    projects: 'Projects',
    strengths: 'Strengths',
    additional: 'Additional Information',
  },
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
