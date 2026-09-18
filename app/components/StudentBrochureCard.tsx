'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  parseStringList, 
  parseEducationList, 
  parseInternshipsList, 
  parseProjectsList,
  renderWithLinks
} from '@/lib/parsers';

const DENSITY_MODES = [
  'brochure-body ultra-sparse-content',
  'brochure-body very-sparse-content',
  'brochure-body sparse-content',
  'brochure-body',
  'brochure-body dense-content',
  'brochure-body ultra-dense-content',
  'brochure-body micro-content',
  'brochure-body nano-content'
];

interface StudentBrochureCardProps {
  student: any;
  formConfig: any;
  showPrintButton?: boolean;
}

export default function StudentBrochureCard({ student, formConfig, showPrintButton = false }: StudentBrochureCardProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [densityClass, setDensityClass] = useState<string>('brochure-body');

  useEffect(() => {
    if (!bodyRef.current) return;
    const el = bodyRef.current;

    const checkOverflow = () => {
      if (!el) return false;
      return (
        el.scrollWidth > el.clientWidth + 5 ||
        el.scrollHeight > el.clientHeight + 5
      );
    };

    const autoFit = () => {
      let bestMode = DENSITY_MODES[DENSITY_MODES.length - 1];
      for (let i = 0; i < DENSITY_MODES.length; i++) {
        el.className = DENSITY_MODES[i];
        if (!checkOverflow()) {
          bestMode = DENSITY_MODES[i];
          break;
        }
      }
      setDensityClass(bestMode);
    };

    autoFit();

    window.addEventListener('resize', autoFit);
    const timeoutId = setTimeout(autoFit, 150);

    return () => {
      window.removeEventListener('resize', autoFit);
      clearTimeout(timeoutId);
    };
  }, [student, formConfig]);

  if (!student) return null;

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
        const sec = (val as any).section || 'personal';
        if (sec === sectionId || (sectionId === 'personal' && (!sec || sec === 'additional'))) {
          results.push({ label: (val as any).label || key, value: (val as any).value });
        }
        return;
      }

      const cfgField = (formConfig.customFields || []).find((f: any) => 
        f.id === key || 
        (f.label && f.label.toLowerCase() === lowerKey) ||
        key.toLowerCase().includes(f.id.toLowerCase())
      );
      const assignedSec = cfgField ? (cfgField.section || 'personal') : 'personal';

      if (assignedSec === sectionId || (sectionId === 'personal' && (assignedSec === 'additional' || !assignedSec))) {
        const label = cfgField ? cfgField.label : key.replace(/^field_/, 'Field ');
        results.push({ label, value: val });
      }
    });

    const uniqueMap = new Map<string, any>();
    results.forEach(item => {
      if (!uniqueMap.has(item.label.toLowerCase())) {
        uniqueMap.set(item.label.toLowerCase(), item);
      }
    });

    return Array.from(uniqueMap.values());
  };

  const linkedInVal = student.linkedIn || student.customFieldsData?.linkedIn || student.customFieldsData?.LinkedIn || student.customFieldsData?.['linkedin'];
  const githubVal = student.github || student.customFieldsData?.github || student.customFieldsData?.GitHub || student.customFieldsData?.['github'];
  const portfolioVal = student.portfolio || student.customFieldsData?.portfolio || student.customFieldsData?.Portfolio || student.customFieldsData?.['portfolio'];
  const visionObj = student.objective || student.visionStatement || student.customFieldsData?.objective || student.customFieldsData?.visionStatement || student.customFieldsData?.['Vision Statement (2 Lines)'] || student.customFieldsData?.['Vision Statement (2 lines)'] || student.customFieldsData?.['Vision Statement'];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {showPrintButton && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem', gap: '0.5rem' }} className="no-print">
          <Link href={`/admin/${student.id}/print`} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#4b5563' }}>
            Print / Download PDF
          </Link>
        </div>
      )}
      <div className="brochure-card-wrapper">
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

          {/* Main Content Sections - Dynamic Auto-Fitting Multi-Column Flow */}
          <div className={densityClass} ref={bodyRef}>
            <div className="section contact-section">
              <h3>{formConfig.sectionTitles?.contact || 'Contact'}</h3>
              {student.contactPhone && <div className="contact-item"><span>{formConfig.fieldLabels?.phone || 'Phone'}</span>: {renderWithLinks(student.contactPhone)}</div>}
              {student.contactEmail && <div className="contact-item"><span>{formConfig.fieldLabels?.email || 'Email'}</span>: {renderWithLinks(student.contactEmail)}</div>}
              {linkedInVal && <div className="contact-item"><span>{formConfig.fieldLabels?.linkedIn || 'LinkedIn'}</span>: {renderWithLinks(linkedInVal)}</div>}
              {githubVal && <div className="contact-item"><span>{formConfig.fieldLabels?.github || 'GitHub'}</span>: {renderWithLinks(githubVal)}</div>}
              {portfolioVal && <div className="contact-item"><span>{formConfig.fieldLabels?.portfolio || 'Portfolio'}</span>: {renderWithLinks(portfolioVal)}</div>}
              {getCustomFieldsForSection('contact', student).map((cf, idx) => (
                <div key={'cf_cnt_' + idx} className="contact-item">
                  <span>{cf.label}</span>: {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                </div>
              ))}
              {getCustomFieldsForSection('personal', student).map((cf, idx) => (
                <div key={'cf_pers_' + idx} className="contact-item">
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
                <ul className="bullet-list">
                  {internships.map((i: any, idx: number) => {
                    const role = i.role || '';
                    const company = i.company || '';
                    const duration = i.duration || '';

                    return (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {role ? (
                          <>
                            <div className="item-title" style={{ fontWeight: 700, color: '#113666', lineHeight: '1.3' }}>
                              {renderWithLinks(role)}
                            </div>
                            <div className="item-sub" style={{ color: '#113666', lineHeight: '1.3' }}>
                              {renderWithLinks(company)}
                              {duration && <> | {renderWithLinks(duration)}</>}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="item-title" style={{ fontWeight: 700, color: '#113666', lineHeight: '1.3' }}>
                              {renderWithLinks(company)}
                            </div>
                            {duration && (
                              <div className="item-sub" style={{ color: '#113666', lineHeight: '1.3' }}>
                                Duration: {renderWithLinks(duration)}
                              </div>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                  {getCustomFieldsForSection('internships', student).map((cf, idx) => (
                    <li key={'cf_' + idx} className="item-sub" style={{ color: '#113666' }}>
                      <strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(projs.length > 0 || getCustomFieldsForSection('projects', student).length > 0) && (
              <div className="section">
                <h3>{formConfig.sectionTitles?.projects || 'Projects'}</h3>
                <ul className="bullet-list">
                  {projs.map((p: any, idx: number) => {
                    const title = typeof p === 'string' ? p : (p.title || p.name || '');
                    const tools = typeof p === 'object' && p.toolsUsed ? p.toolsUsed : '';

                    return (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        <div className="item-title" style={{ fontWeight: 700, color: '#113666', lineHeight: '1.3' }}>
                          {renderWithLinks(title)}
                        </div>
                        {tools && (
                          <div className="item-sub" style={{ color: '#113666', lineHeight: '1.3' }}>
                            Tools Used: {renderWithLinks(tools)}
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {getCustomFieldsForSection('projects', student).map((cf, idx) => (
                    <li key={'cf_' + idx} className="item-sub" style={{ color: '#113666' }}>
                      <strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                    </li>
                  ))}
                </ul>
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
              St. Joseph's College (Autonomous)<br/>
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
    </div>
  );
}
