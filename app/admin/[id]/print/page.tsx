'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  parseStringList, 
  parseEducationList, 
  parseInternshipsList, 
  parseProjectsList 
} from '@/lib/parsers';

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

  const edu = parseEducationList(student.educationalQualifications);
  const certs = parseStringList(student.certifications);
  const tech = parseStringList(student.technicalExpertise);
  const internships = parseInternshipsList(student.internships);
  const projs = parseProjectsList(student.projects);
  const strengths = parseStringList(student.strengths);

  const getCustomFieldsForSection = (sectionId: string, studentObj: any) => {
    if (!studentObj || !studentObj.customFieldsData) return [];
    const results: Array<{ label: string; value: any }> = [];

    Object.entries(studentObj.customFieldsData).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') return;

      if (typeof val === 'object' && val !== null && 'value' in val) {
        const sec = (val as any).section || 'additional';
        if (sec === sectionId || (sectionId === 'additional' && (!sec || sec === 'additional'))) {
          results.push({ label: (val as any).label || key, value: (val as any).value });
        }
        return;
      }

      const cfgField = (formConfig.customFields || []).find((f: any) => f.id === key || f.label === key);
      const assignedSec = cfgField ? (cfgField.section || 'additional') : 'additional';

      if (assignedSec === sectionId) {
        const label = cfgField ? cfgField.label : key.replace(/^field_/, 'Field ');
        results.push({ label, value: val });
      }
    });

    return results;
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#e5e7eb', minHeight: '100vh' }} className="print-container">
      
      <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem', background: '#113666' }}>
          🖨️ Download PDF / Print Brochure
        </button>
        <button className="btn btn-secondary" onClick={() => window.location.href = '/admin'} style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}>
          ← Back to Admin Panel
        </button>
      </div>

      <div className="brochure-card">
        {/* Header Section */}
        <div className="brochure-header">
          <div className="header-content">
            <h1>{student.name}</h1>
            {student.tagline && <h2>{student.tagline}</h2>}
          </div>
          <div className="header-image">
            {student.profileImageBase64 ? (
              <img src={student.profileImageBase64} alt={student.name} />
            ) : (
              <div className="placeholder-image">Photo</div>
            )}
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="brochure-body">
          {/* Left Column */}
          <div className="left-col">
            <div className="section contact-section">
              <h3>Contact</h3>
              <div className="contact-item"><span>Phone</span>: {student.contactPhone}</div>
              <div className="contact-item"><span>Email</span>: {student.contactEmail}</div>
              {getCustomFieldsForSection('contact', student).map((cf, idx) => (
                <div key={idx} className="contact-item">
                  <span>{cf.label}</span>: {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}
                </div>
              ))}
            </div>

            <div className="section">
              <h3>Educational Qualification</h3>
              <table className="edu-table">
                <thead>
                  <tr>
                    <th>Qualification</th>
                    <th>Institution</th>
                    <th>Year</th>
                    <th>CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {edu.map((e: any, idx: number) => (
                    <tr key={idx}>
                      <td>{e.qualification}</td>
                      <td>{e.institution}</td>
                      <td>{e.year}</td>
                      <td>{e.cgpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getCustomFieldsForSection('education', student).length > 0 && (
                <ul className="bullet-list" style={{ marginTop: '0.5rem' }}>
                  {getCustomFieldsForSection('education', student).map((cf, idx) => (
                    <li key={idx}><strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}</li>
                  ))}
                </ul>
              )}
            </div>

            {(certs.length > 0 || getCustomFieldsForSection('certifications', student).length > 0) && (
              <div className="section">
                <h3>Certifications</h3>
                <ul className="bullet-list">
                  {certs.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                  {getCustomFieldsForSection('certifications', student).map((cf, idx) => (
                    <li key={'cf_' + idx}><strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}</li>
                  ))}
                </ul>
              </div>
            )}

            {(tech.length > 0 || getCustomFieldsForSection('technical', student).length > 0) && (
              <div className="section">
                <h3>Technical Expertise</h3>
                <ul className="bullet-list">
                  {tech.map((t: string, idx: number) => <li key={idx}>{t}</li>)}
                  {getCustomFieldsForSection('technical', student).map((cf, idx) => (
                    <li key={'cf_' + idx}><strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="right-col">
            {(internships.length > 0 || getCustomFieldsForSection('internships', student).length > 0) && (
              <div className="section">
                <h3>Internships</h3>
                {internships.map((i: any, idx: number) => (
                  <div key={idx} className="project-item">
                    <div className="project-header">
                      <span className="project-title">{i.company}</span>
                      {i.role && <span className="project-role"> | {i.role}</span>}
                    </div>
                    {i.duration && <p className="project-desc" style={{ fontStyle: 'italic', margin: '0.25rem 0 0 0' }}>Duration: {i.duration}</p>}
                  </div>
                ))}
                {getCustomFieldsForSection('internships', student).map((cf, idx) => (
                  <div key={'cf_' + idx} className="project-item">
                    <strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}
                  </div>
                ))}
              </div>
            )}

            {(projs.length > 0 || getCustomFieldsForSection('projects', student).length > 0) && (
              <div className="section">
                <h3>Projects</h3>
                <ul className="bullet-list">
                  {projs.map((p: any, idx: number) => {
                    const title = typeof p === 'string' ? p : (p.title || p.name || '');
                    const tools = typeof p === 'object' && p.toolsUsed ? ` | Tools Used: ${p.toolsUsed}` : '';
                    return (
                      <li key={idx}>
                        {title}{tools}
                      </li>
                    );
                  })}
                  {getCustomFieldsForSection('projects', student).map((cf, idx) => (
                    <li key={'cf_' + idx}><strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}</li>
                  ))}
                </ul>
              </div>
            )}

            {(strengths.length > 0 || getCustomFieldsForSection('strengths', student).length > 0) && (
              <div className="section">
                <h3>Strengths</h3>
                <ul className="bullet-list strengths-list">
                  {strengths.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                  {getCustomFieldsForSection('strengths', student).map((cf, idx) => (
                    <li key={'cf_' + idx}><strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional / Custom Section rendering */}
            {(formConfig.sectionOrder || ['additional'])
              .filter((secId: string) => !['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths'].includes(secId))
              .map((secId: string) => {
                const secFields = getCustomFieldsForSection(secId, student);
                if (secFields.length === 0) return null;
                const secTitle = formConfig.sectionTitles?.[secId] || secId;
                return (
                  <div key={secId} className="section">
                    <h3>{secTitle}</h3>
                    <ul className="bullet-list">
                      {secFields.map((cf, idx) => (
                        <li key={idx}>
                          <strong>{cf.label}:</strong> {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Footer text */}
        <div className="brochure-footer">
          <div className="footer-text">
            <strong>Student Profile</strong><br/>
            St. Joseph's College<br/>
            MCA Batch 2025-2027
            {student.registerNumber && (
              <>
                <br/>
                <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>
                  {student.registerNumber}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
