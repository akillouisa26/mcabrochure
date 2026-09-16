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

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then(r => r.json())
      .then(data => setStudent(data));
  }, [params.id]);

  if (!student) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading Brochure...</div>;

  const edu = parseEducationList(student.educationalQualifications);
  const certs = parseStringList(student.certifications);
  const tech = parseStringList(student.technicalExpertise);
  const internships = parseInternshipsList(student.internships);
  const projs = parseProjectsList(student.projects);
  const strengths = parseStringList(student.strengths);

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
            </div>

            {certs.length > 0 && (
              <div className="section">
                <h3>Certifications</h3>
                <ul className="bullet-list">
                  {certs.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                </ul>
              </div>
            )}

            {tech.length > 0 && (
              <div className="section">
                <h3>Technical Expertise</h3>
                <ul className="bullet-list">
                  {tech.map((t: string, idx: number) => <li key={idx}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="right-col">
            {internships.length > 0 && (
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
              </div>
            )}

            {projs.length > 0 && (
              <div className="section">
                <h3>Projects</h3>
                {projs.map((p: any, idx: number) => (
                  <div key={idx} className="project-item">
                    <div className="project-header">
                      <span className="project-title">{p.title}</span>
                      {p.toolsUsed && <span className="project-role"> | Tools: {p.toolsUsed}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {strengths.length > 0 && (
              <div className="section">
                <h3>Strengths</h3>
                <ul className="bullet-list strengths-list">
                  {strengths.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
            )}

            {student.customFieldsData && Object.keys(student.customFieldsData).length > 0 && (
              <div className="section">
                <h3>Additional Information</h3>
                <ul className="bullet-list">
                  {Object.entries(student.customFieldsData).map(([key, val]: [string, any]) => {
                    if (!val) return null;
                    return (
                      <li key={key}>
                        <strong>{key.replace(/^field_/, 'Field ')}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer text */}
        <div className="brochure-footer">
          <div className="footer-text">
            <strong>Student Profile</strong><br/>
            St. Joseph's College<br/>
            MCA batch 2025-2027
          </div>
        </div>
      </div>
    </div>
  );
}
