'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentBrochureCard from '@/app/components/StudentBrochureCard';

export default function SingleBrochurePrintPage() {
  const params = useParams();
  const [student, setStudent] = useState<any>(null);
  const [formConfig, setFormConfig] = useState<any>({});

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then(r => r.json())
      .then(data => setStudent(data));
      
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => { if (cfg && typeof cfg === 'object') setFormConfig(cfg); })
      .catch(() => {});
  }, [params.id]);

  if (!student) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading Brochure...</div>;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#e5e7eb', minHeight: '100vh' }} className="print-container">
      
      <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem', background: '#113666' }}>
          Download PDF / Print Brochure
        </button>
        <button className="btn btn-secondary" onClick={() => window.location.href = '/admin'} style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}>
          ← Back to Admin Panel
        </button>
      </div>

      <StudentBrochureCard student={student} formConfig={formConfig} />
    </div>
  );
}
