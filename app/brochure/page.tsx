'use client';

import { useEffect, useState } from 'react';

export default function BrochurePage() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        // Only show approved students
        const approved = data.filter((s: any) => s.status === 'APPROVED');
        setStudents(approved);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', background: '#e5e7eb', minHeight: '100vh' }}>
      <h1 className="page-title">Final Approved Brochures ({students.length})</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'center' }}>
        {students.map(student => {
          const edu = JSON.parse(student.educationalQualifications || '[]');
          const certs = JSON.parse(student.certifications || '[]');
          const tech = JSON.parse(student.technicalExpertise || '[]');
          const projs = JSON.parse(student.projects || '[]');
          const strengths = JSON.parse(student.strengths || '[]');

          return (
            <div key={student.id} className="brochure-card">
              {/* Header Section */}
              <div className="brochure-header">
                <div className="header-content">
                  <h1>{student.name}</h1>
                  <h2>{student.tagline}</h2>
                  <p className="objective">"{student.objective}"</p>
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
                    <div className="contact-item"><span>Location</span>: {student.contactLocation}</div>
                    <div className="contact-item"><span>LinkedIn</span>: {student.contactLinkedIn}</div>
                    <div className="contact-item"><span>GitHub</span>: {student.contactGitHub}</div>
                    <div className="contact-item"><span>Portfolio</span>: {student.contactPortfolio}</div>
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

                  <div className="section">
                    <h3>Certifications</h3>
                    <ul className="bullet-list">
                      {certs.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>

                  <div className="section">
                    <h3>Technical Expertise</h3>
                    <ul className="bullet-list">
                      {tech.map((t: string, idx: number) => <li key={idx}>{t}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Right Column */}
                <div className="right-col">
                  <div className="section">
                    <h3>Exposure to Technologies <br/> Internships & Projects</h3>
                    {projs.map((p: any, idx: number) => (
                      <div key={idx} className="project-item">
                        <div className="project-header">
                          <span className="project-title">{p.title}</span>
                          {p.role && <span className="project-role"> | {p.role}</span>}
                        </div>
                        <p className="project-desc">{p.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="section">
                    <h3>Strengths</h3>
                    <ul className="bullet-list strengths-list">
                      {strengths.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer text overlapping the blob */}
              <div className="brochure-footer">
                <div className="footer-text">
                  <strong>Student Profile</strong><br/>
                  St. Joseph's College<br/>
                  MCA batch 2025-2027
                </div>
              </div>
            </div>
          );
        })}
        {students.length === 0 && <p>No completed brochures found in the database.</p>}
      </div>
    </div>
  );
}
