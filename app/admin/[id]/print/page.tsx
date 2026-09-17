'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  parseStringList, 
  parseEducationList, 
  parseInternshipsList, 
  parseProjectsList,
  renderWithLinks
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

    const handledKeys = [
      'linkedin', 'github', 'portfolio', 'objective', 
      'visionstatement', 'vision statement (2 lines)', 'vision statement (2lines)', 'vision statement'
    ];

    Object.entries(studentObj.customFieldsData).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') return;
      const lowerKey = key.toLowerCase();
      if (handledKeys.includes(lowerKey)) return;

      if (typeof val === 'object' && val !== null && 'value' in val) {
        const sec = (val as any).section || 'additional';
        if (sec === sectionId || (sectionId === 'additional' && (!sec || sec === 'additional'))) {
          results.push({ label: (val as any).label || key, value: (val as any).value });
        }
        return;
      }

      const cfgField = (formConfig.customFields || []).find((f: any) => f.id === key || (f.label && f.label.toLowerCase() === lowerKey));
      const assignedSec = cfgField ? (cfgField.section || 'additional') : 'additional';

      if (assignedSec === sectionId) {
        const label = cfgField ? cfgField.label : key.replace(/^field_/, '');
        results.push({ label, value: val });
      }
    });

    return results;
  };

  const linkedInVal = student.linkedIn || student.customFieldsData?.linkedIn || student.customFieldsData?.LinkedIn || student.customFieldsData?.['linkedin'];
  const githubVal = student.github || student.customFieldsData?.github || student.customFieldsData?.GitHub || student.customFieldsData?.['github'];
  const portfolioVal = student.portfolio || student.customFieldsData?.portfolio || student.customFieldsData?.Portfolio || student.customFieldsData?.['portfolio'];
  const visionObj = student.objective || student.visionStatement || student.customFieldsData?.objective || student.customFieldsData?.visionStatement || student.customFieldsData?.['Vision Statement (2 Lines)'] || student.customFieldsData?.['Vision Statement (2 lines)'] || student.customFieldsData?.['Vision Statement'];

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

      <div className="brochure-card">
        {/* Header Section */}
        <div className="brochure-header">
          <div className="header-content">
            <h1>{student.name}</h1>
            {student.tagline && <h2>{renderWithLinks(student.tagline)}</h2>}
            {visionObj && (
              <div className="objective">
                &ldquo;{renderWithLinks(visionObj)}&rdquo;
              </div>
            )}
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
          <div className="section contact-section">
            <h3>{formConfig.sectionTitles?.contact || 'Contact'}</h3>
            {student.contactPhone && <div className="contact-item"><span>{formConfig.fieldLabels?.phone || 'Phone'}</span>: {renderWithLinks(student.contactPhone)}</div>}
            {student.contactEmail && <div className="contact-item"><span>{formConfig.fieldLabels?.email || 'Email'}</span>: {renderWithLinks(student.contactEmail)}</div>}
            {linkedInVal && <div className="contact-item"><span>{formConfig.fieldLabels?.linkedIn || 'LinkedIn'}</span>: {renderWithLinks(linkedInVal)}</div>}
            {githubVal && <div className="contact-item"><span>{formConfig.fieldLabels?.github || 'GitHub'}</span>: {renderWithLinks(githubVal)}</div>}
            {portfolioVal && <div className="contact-item"><span>{formConfig.fieldLabels?.portfolio || 'Portfolio'}</span>: {renderWithLinks(portfolioVal)}</div>}
            {getCustomFieldsForSection('contact', student).map((cf, idx) => (
              <div key={idx} className="contact-item">
                <span>{cf.label}</span>: {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
              </div>
            ))}
          </div>

          <div className="section">
            <h3>{formConfig.sectionTitles?.education || 'Educational Qualification'}</h3>
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
                    <td>{renderWithLinks(e.qualification)}</td>
                    <td>{renderWithLinks(e.institution)}</td>
                    <td>{renderWithLinks(e.year)}</td>
                    <td>{renderWithLinks(e.cgpa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getCustomFieldsForSection('education', student).length > 0 && (
              <ul className="bullet-list" style={{ marginTop: '0.5rem' }}>
                {getCustomFieldsForSection('education', student).map((cf, idx) => (
                  <li key={idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                ))}
              </ul>
            )}
          </div>

          {(certs.length > 0 || getCustomFieldsForSection('certifications', student).length > 0) && (
            <div className="section">
              <h3>{formConfig.sectionTitles?.certifications || 'Certifications'}</h3>
              <ul className="bullet-list">
                {certs.map((c: string, idx: number) => <li key={idx}>{renderWithLinks(c)}</li>)}
                {getCustomFieldsForSection('certifications', student).map((cf, idx) => (
                  <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                ))}
              </ul>
            </div>
          )}

          {(internships.length > 0 || getCustomFieldsForSection('internships', student).length > 0) && (
            <div className="section">
              <h3>{formConfig.sectionTitles?.internships || 'Internships'}</h3>
              {internships.map((i: any, idx: number) => {
                const role = i.role || '';
                const company = i.company || '';
                const duration = i.duration || '';

                return (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    {role ? (
                      <>
                        <div style={{ fontWeight: 700, color: '#113666', fontSize: '0.9rem', lineHeight: '1.3' }}>
                          {renderWithLinks(role)}
                        </div>
                        <div style={{ color: '#113666', fontSize: '0.85rem', lineHeight: '1.3' }}>
                          {renderWithLinks(company)}
                          {duration && <> | {renderWithLinks(duration)}</>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: '#113666', fontSize: '0.9rem', lineHeight: '1.3' }}>
                          {renderWithLinks(company)}
                        </div>
                        {duration && (
                          <div style={{ color: '#113666', fontSize: '0.85rem', lineHeight: '1.3' }}>
                            Duration: {renderWithLinks(duration)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {getCustomFieldsForSection('internships', student).map((cf, idx) => (
                <div key={'cf_' + idx} style={{ marginBottom: '0.4rem', color: '#113666', fontSize: '0.85rem' }}>
                  <strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                </div>
              ))}
            </div>
          )}

          {(projs.length > 0 || getCustomFieldsForSection('projects', student).length > 0) && (
            <div className="section">
              <h3>{formConfig.sectionTitles?.projects || 'Projects'}</h3>
              {projs.map((p: any, idx: number) => {
                const title = typeof p === 'string' ? p : (p.title || p.name || '');
                const tools = typeof p === 'object' && p.toolsUsed ? p.toolsUsed : '';

                return (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#113666', fontSize: '0.9rem', lineHeight: '1.3' }}>
                      {renderWithLinks(title)}
                    </div>
                    {tools && (
                      <div style={{ color: '#113666', fontSize: '0.85rem', lineHeight: '1.3' }}>
                        Tools Used: {renderWithLinks(tools)}
                      </div>
                    )}
                  </div>
                );
              })}
              {getCustomFieldsForSection('projects', student).map((cf, idx) => (
                <div key={'cf_' + idx} style={{ marginBottom: '0.4rem', color: '#113666', fontSize: '0.85rem' }}>
                  <strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                </div>
              ))}
            </div>
          )}

          {(tech.length > 0 || getCustomFieldsForSection('technical', student).length > 0) && (
            <div className="section">
              <h3>{formConfig.sectionTitles?.technical || 'Technical Expertise'}</h3>
              <ul className="bullet-list">
                {tech.map((t: string, idx: number) => <li key={idx}>{renderWithLinks(t)}</li>)}
                {getCustomFieldsForSection('technical', student).map((cf, idx) => (
                  <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                ))}
              </ul>
            </div>
          )}

          {(strengths.length > 0 || getCustomFieldsForSection('strengths', student).length > 0) && (
            <div className="section">
              <h3>{formConfig.sectionTitles?.strengths || 'Strengths'}</h3>
              <ul className="bullet-list strengths-list">
                {strengths.map((s: string, idx: number) => <li key={idx}>{renderWithLinks(s)}</li>)}
                {getCustomFieldsForSection('strengths', student).map((cf, idx) => (
                  <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
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
                        <strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>

        {/* Footer text */}
        <div className="brochure-footer">
          <div className="footer-text">
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
