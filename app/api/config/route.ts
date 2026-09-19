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
  showUG: true,
  showPG: true,
  allowMultiplePG: true,
  showCertifications: true,
  showTechnicalExpertise: true,
  showInternships: true,
  showProjects: true,
  showStrengths: true,
  allowMultiple: {
    education: true,
    pg: true,
    certifications: true,
    technical: true,
    internships: true,
    projects: true,
    strengths: true,
  },
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
    tagline: true,
    objective: true,
    profilePicture: true,
    phone: true,
    email: true,
    linkedIn: true,
    github: true,
    portfolio: false,
    education: true,
    certifications: true,
    technical: true,
    internships: true,
    projects: true,
    strengths: true,
  },
  sectionOrder: ['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths'],
  sectionTitles: {
    personal: 'Personal Details',
    contact: 'Contact Info',
    education: 'Educational Qualifications',
    certifications: 'Certifications',
    technical: 'Technical Expertise',
    internships: 'Internships',
    projects: 'Projects',
    strengths: 'Strengths',
  },
  customFields: [],
};

// In-memory fallback for local session/dev server resilience
let inMemoryConfig = { ...defaultConfig };

const cleanConfig = (cfg: any) => {
  const result = { ...cfg };
  if (Array.isArray(result.sectionOrder)) {
    result.sectionOrder = result.sectionOrder.filter((s: string) => s !== 'additional');
  }
  return result;
};

export async function GET() {
  try {
    const docRef = doc(db, 'systemConfig', 'formSettings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      inMemoryConfig = cleanConfig({ ...defaultConfig, ...data });
      return NextResponse.json(inMemoryConfig);
    }
    inMemoryConfig = cleanConfig(inMemoryConfig);
    return NextResponse.json(inMemoryConfig);
  } catch (error) {
    inMemoryConfig = cleanConfig(inMemoryConfig);
    return NextResponse.json(inMemoryConfig);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    inMemoryConfig = cleanConfig({ ...inMemoryConfig, ...body });

    try {
      const docRef = doc(db, 'systemConfig', 'formSettings');
      await setDoc(docRef, inMemoryConfig, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore setDoc warning (using in-memory fallback):', fsErr);
    }

    return NextResponse.json({ success: true, config: inMemoryConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save form config' }, { status: 500 });
  }
}
