'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  parseStringList, 
  parseEducationList, 
  parseInternshipsList, 
  parseProjectsList 
} from '@/lib/parsers';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'submissions';

  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'brochures' | 'settings'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [viewStudentModal, setViewStudentModal] = useState<any | null>(null);

  // Form Settings Config state
  const DEFAULT_SECTIONS = ['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths', 'additional'];
  
  const DEFAULT_SECTION_TITLES: Record<string, string> = {
    personal: 'Personal Details',
    contact: 'Contact Info',
    education: 'Educational Qualifications',
    certifications: 'Certifications',
    technical: 'Technical Expertise',
    internships: 'Internships',
    projects: 'Projects',
    strengths: 'Strengths',
    additional: 'Additional Information',
  };

  const [formConfig, setFormConfig] = useState<{
    showTagline: boolean;
    showProfilePicture: boolean;
    showCertifications: boolean;
    showTechnicalExpertise: boolean;
    showInternships: boolean;
    showProjects: boolean;
    showStrengths: boolean;
    sectionOrder: string[];
    sectionTitles: Record<string, string>;
    customFields: Array<{ id: string; label: string; type: string; section: string; required?: boolean; order?: number }>;
  }>({
    showTagline: true,
    showProfilePicture: true,
    showCertifications: true,
    showTechnicalExpertise: true,
    showInternships: true,
    showProjects: true,
    showStrengths: true,
    sectionOrder: DEFAULT_SECTIONS,
    sectionTitles: DEFAULT_SECTION_TITLES,
    customFields: [],
  });

  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  // New Custom Field input state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'list'>('text');
  const [newFieldSection, setNewFieldSection] = useState<string>('personal');
  const [newFieldRequired, setNewFieldRequired] = useState<boolean>(false);

  // Drag & Drop State
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setFormConfig(prev => ({
          ...prev,
          ...data,
          sectionOrder: Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0 ? data.sectionOrder : DEFAULT_SECTIONS,
          sectionTitles: data.sectionTitles && typeof data.sectionTitles === 'object' 
            ? { ...DEFAULT_SECTION_TITLES, ...data.sectionTitles } 
            : DEFAULT_SECTION_TITLES,
          customFields: Array.isArray(data.customFields) 
            ? data.customFields.map((f: any) => ({
                ...f,
                section: f.section || 'additional',
              }))
            : []
        }));
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchConfig();
  }, []);

  const saveFormConfig = async () => {
    setConfigSaving(true);
    setConfigSuccess('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formConfig),
      });
      if (res.ok) {
        setConfigSuccess('Form configuration saved! Changes are live on the student submission form.');
        setTimeout(() => setConfigSuccess(''), 5000);
      }
    } catch (e) {
      alert('Failed to save configuration');
    } finally {
      setConfigSaving(false);
    }
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setFormConfig(prev => ({
      ...prev,
      sectionTitles: {
        ...(prev.sectionTitles || DEFAULT_SECTION_TITLES),
        [sectionId]: newTitle,
      },
    }));
  };

  const updateCustomField = (fieldId: string, updates: Partial<{ label: string; type: string; section: string; required: boolean }>) => {
    setFormConfig(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    }));
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) {
      alert('Please enter a field label.');
      return;
    }
    const newField = {
      id: 'field_' + Date.now(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      section: newFieldSection,
      required: newFieldRequired,
      order: Date.now(),
    };
    setFormConfig(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
  };

  const removeCustomField = (id: string) => {
    setFormConfig(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(f => f.id !== id),
    }));
  };

  const moveFieldToSection = (fieldId: string, targetSection: string) => {
    setFormConfig(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map(f => 
        f.id === fieldId ? { ...f, section: targetSection } : f
      ),
    }));
  };

  const moveCustomFieldInList = (fieldId: string, direction: 'up' | 'down') => {
    setFormConfig(prev => {
      const fields = [...(prev.customFields || [])];
      const fieldIndex = fields.findIndex(f => f.id === fieldId);
      if (fieldIndex < 0) return prev;
      
      const targetSec = fields[fieldIndex].section;
      // Get all indices of fields in the same section
      const sameSecIndices = fields
        .map((f, i) => f.section === targetSec ? i : -1)
        .filter(i => i !== -1);
      
      const secPos = sameSecIndices.indexOf(fieldIndex);
      if (direction === 'up' && secPos > 0) {
        const swapIndex = sameSecIndices[secPos - 1];
        const temp = fields[fieldIndex];
        fields[fieldIndex] = fields[swapIndex];
        fields[swapIndex] = temp;
      } else if (direction === 'down' && secPos < sameSecIndices.length - 1) {
        const swapIndex = sameSecIndices[secPos + 1];
        const temp = fields[fieldIndex];
        fields[fieldIndex] = fields[swapIndex];
        fields[swapIndex] = temp;
      }
      
      return { ...prev, customFields: fields };
    });
  };

  const moveSectionOrder = (sectionId: string, direction: 'up' | 'down') => {
    setFormConfig(prev => {
      const currentOrder = [...(prev.sectionOrder || DEFAULT_SECTIONS)];
      const idx = currentOrder.indexOf(sectionId);
      if (idx < 0) return prev;
      if (direction === 'up' && idx > 0) {
        const temp = currentOrder[idx];
        currentOrder[idx] = currentOrder[idx - 1];
        currentOrder[idx - 1] = temp;
      } else if (direction === 'down' && idx < currentOrder.length - 1) {
        const temp = currentOrder[idx];
        currentOrder[idx] = currentOrder[idx + 1];
        currentOrder[idx + 1] = temp;
      }
      return { ...prev, sectionOrder: currentOrder };
    });
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student profile?')) return;
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    setStudents(students.filter(s => s.id !== id));
  };

  const approveStudent = async (id: string) => {
    try {
      await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      setStudents(students.map(s => s.id === id ? { ...s, status: 'APPROVED' } : s));
    } catch (e) {
      alert('Error approving student');
    }
  };
  
  const rejectStudent = async (id: string) => {
    try {
      await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING' })
      });
      setStudents(students.map(s => s.id === id ? { ...s, status: 'PENDING' } : s));
    } catch (e) {
      alert('Error updating status');
    }
  };

  const safeParse = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return [];
  };

  const approvedStudents = students.filter(s => s.status === 'APPROVED');
  const pendingStudents = students.filter(s => s.status === 'PENDING');

  const downloadExcel = () => {
    if (!students || students.length === 0) {
      alert('No student submissions available to export.');
      return;
    }

    const headers = [
      'Register Number',
      'Student Name',
      'Status',
      'Phone',
      'Email',
      'Tagline',
      'Educational Qualifications',
      'Certifications',
      'Technical Expertise',
      'Internships',
      'Projects',
      'Strengths',
      'Custom Fields',
      'Submitted At'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = typeof str === 'object' ? JSON.stringify(str) : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const rows = students.map(student => {
      const edu = parseEducationList(student.educationalQualifications)
        .map((e: any) => `${e.qualification || ''} (${e.institution || ''}, ${e.year || ''}, CGPA: ${e.cgpa || ''})`)
        .join('; ');
      const certs = parseStringList(student.certifications).join('; ');
      const tech = parseStringList(student.technicalExpertise).join('; ');
      const internships = parseInternshipsList(student.internships)
        .map((i: any) => `${i.company || ''} - ${i.role || ''} (${i.duration || ''})`)
        .join('; ');
      const projs = parseProjectsList(student.projects)
        .map((p: any) => `${p.title || ''}${p.toolsUsed ? ` [Tools: ${p.toolsUsed}]` : ''}`)
        .join('; ');
      const strengths = parseStringList(student.strengths).join('; ');
      const customFieldsText = student.customFieldsData && typeof student.customFieldsData === 'object'
        ? Object.entries(student.customFieldsData)
            .map(([k, v]) => {
              const label = formConfig.customFields?.find(f => f.id === k)?.label || k.replace(/^field_/, 'Field ');
              return `${label}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`;
            })
            .join('; ')
        : '';

      return [
        escapeCsv(student.registerNumber || 'N/A'),
        escapeCsv(student.name || ''),
        escapeCsv(student.status || 'PENDING'),
        escapeCsv(student.contactPhone || ''),
        escapeCsv(student.contactEmail || ''),
        escapeCsv(student.tagline || ''),
        escapeCsv(edu),
        escapeCsv(certs),
        escapeCsv(tech),
        escapeCsv(internships),
        escapeCsv(projs),
        escapeCsv(strengths),
        escapeCsv(customFieldsText),
        escapeCsv(student.createdAt ? new Date(student.createdAt).toLocaleString() : '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Student_Submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="form-container" style={{ maxWidth: '1100px', margin: '2rem auto' }}>
      {/* Admin Header */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#111827' }}>Admin Panel Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={downloadExcel} className="btn btn-primary" style={{ background: '#10b981', color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>
            Download Excel
          </button>
          <button onClick={fetchStudents} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>Refresh Data</button>
          <button onClick={async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }} className="btn btn-secondary" style={{ background: '#ef4444', color: '#fff', fontSize: '0.875rem' }}>Logout</button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e5e7eb', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('submissions')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'submissions' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'submissions' ? '#2563eb' : '#6b7280',
          }}
        >
          Student Submissions
        </button>

        <button
          onClick={() => setActiveTab('brochures')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'brochures' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'brochures' ? '#2563eb' : '#6b7280',
          }}
        >
          Generated Brochure
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'settings' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'settings' ? '#2563eb' : '#6b7280',
          }}
        >
          Form Settings
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading Database Submissions...</div>
      ) : activeTab === 'submissions' ? (
        /* Submissions Management Tab */
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Register Number</th>
                <th style={{ padding: '0.75rem' }}>Student Name</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Submitted At</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#374151' }}>{student.registerNumber || '-'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{student.name}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                      background: student.status === 'APPROVED' ? '#d1fae5' : '#fef3c7',
                      color: student.status === 'APPROVED' ? '#065f46' : '#92400e'
                    }}>{student.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {student.status === 'APPROVED' ? (
                        <button onClick={() => rejectStudent(student.id)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Set Pending</button>
                      ) : (
                        <button onClick={() => approveStudent(student.id)} className="btn btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#10b981', color: '#fff' }}>Verify & Approve</button>
                      )}
                      <button onClick={() => setViewStudentModal(student)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#2563eb' }}>View</button>
                      <Link href={`/admin/${student.id}/print`} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#4b5563' }}>Generate</Link>
                      <button onClick={() => deleteStudent(student.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No student form submissions found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'brochures' ? (
        /* Generated Brochures View Tab Inside Admin Panel */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', alignItems: 'center' }}>
          {approvedStudents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No approved placement brochures yet.</p>
              <p style={{ fontSize: '0.9rem' }}>Go to the <strong>Student Submissions</strong> tab and click <strong>Verify & Approve</strong> to generate brochures.</p>
            </div>
          ) : (
            approvedStudents.map(student => {
              const edu = parseEducationList(student.educationalQualifications);
              const certs = parseStringList(student.certifications);
              const tech = parseStringList(student.technicalExpertise);
              const internships = parseInternshipsList(student.internships);
              const projs = parseProjectsList(student.projects);
              const strengths = parseStringList(student.strengths);

              return (
                <div key={student.id} style={{ width: '100%', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <Link href={`/admin/${student.id}/print`} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#4b5563' }}>
                      Print / Download PDF
                    </Link>
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
                                const label = formConfig.customFields?.find(f => f.id === key)?.label || key.replace(/^field_/, 'Field ');
                                return (
                                  <li key={key}>
                                    <strong>{label}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
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
            })
          )}
        </div>
      ) : (
        /* Form Settings Tab (Clean Interactive Form Configurator) */
        <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#111827' }}>Student Form Configurator</h2>
            <p style={{ margin: '0.3rem 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
              Edit section headings, rename field labels, drag or move fields between sections, and configure your student submission form.
            </p>
          </div>

          {configSuccess && (
            <div style={{ padding: '0.75rem 1rem', background: '#d1fae5', color: '#065f46', marginBottom: '1.5rem', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
              {configSuccess}
            </div>
          )}

          {/* Add New Custom Field Box */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e293b' }}>Add New Custom Field</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Field Label (e.g. GitHub URL, Hobbies)" 
                value={newFieldLabel} 
                onChange={e => setNewFieldLabel(e.target.value)} 
                className="form-control" 
                style={{ flex: '2 1 200px' }}
              />
              <select 
                value={newFieldType} 
                onChange={e => setNewFieldType(e.target.value as any)} 
                className="form-control"
                style={{ flex: '1 1 140px' }}
              >
                <option value="text">Single Line Text</option>
                <option value="textarea">Paragraph Text</option>
                <option value="list">Bullet List</option>
              </select>

              <select 
                value={newFieldSection} 
                onChange={e => setNewFieldSection(e.target.value)} 
                className="form-control"
                style={{ flex: '1 1 180px' }}
              >
                {formConfig.sectionOrder.map(secId => (
                  <option key={secId} value={secId}>
                    Section: {formConfig.sectionTitles?.[secId] || DEFAULT_SECTION_TITLES[secId] || secId}
                  </option>
                ))}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={newFieldRequired} 
                  onChange={e => setNewFieldRequired(e.target.checked)} 
                  style={{ width: '16px', height: '16px' }}
                />
                Required
              </label>

              <button 
                type="button" 
                onClick={addCustomField}
                className="btn btn-secondary"
                style={{ background: '#10b981', color: '#fff', fontWeight: 600, padding: '0.5rem 1rem' }}
              >
                Add Field
              </button>
            </div>
          </div>

          {/* Form Sections & Moveable Fields Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {formConfig.sectionOrder.map((sectionId, sectionIndex) => {
              const currentSectionTitle = formConfig.sectionTitles?.[sectionId] || DEFAULT_SECTION_TITLES[sectionId] || sectionId;
              const sectionCustomFields = (formConfig.customFields || []).filter(f => (f.section || 'additional') === sectionId);
              const isDragOver = dragOverSection === sectionId;

              return (
                <div 
                  key={sectionId}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverSection !== sectionId) {
                      setDragOverSection(sectionId);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverSection === sectionId) {
                      setDragOverSection(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverSection(null);
                    if (draggedFieldId) {
                      moveFieldToSection(draggedFieldId, sectionId);
                      setDraggedFieldId(null);
                    }
                  }}
                  style={{
                    border: isDragOver ? '2px dashed #2563eb' : '1px solid #e2e8f0',
                    background: isDragOver ? '#eff6ff' : '#ffffff',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Section Header with Editable Heading */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>
                        Section {sectionIndex + 1}:
                      </span>
                      <input 
                        type="text"
                        value={currentSectionTitle}
                        onChange={e => updateSectionTitle(sectionId, e.target.value)}
                        placeholder="Section Heading"
                        className="form-control"
                        style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', padding: '0.35rem 0.6rem', width: 'auto', flex: 1, minWidth: '180px' }}
                      />
                      {sectionId === 'certifications' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showCertifications} onChange={e => setFormConfig({ ...formConfig, showCertifications: e.target.checked })} /> Enabled
                        </label>
                      )}
                      {sectionId === 'technical' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showTechnicalExpertise} onChange={e => setFormConfig({ ...formConfig, showTechnicalExpertise: e.target.checked })} /> Enabled
                        </label>
                      )}
                      {sectionId === 'internships' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showInternships !== false} onChange={e => setFormConfig({ ...formConfig, showInternships: e.target.checked })} /> Enabled
                        </label>
                      )}
                      {sectionId === 'projects' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showProjects} onChange={e => setFormConfig({ ...formConfig, showProjects: e.target.checked })} /> Enabled
                        </label>
                      )}
                      {sectionId === 'strengths' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showStrengths} onChange={e => setFormConfig({ ...formConfig, showStrengths: e.target.checked })} /> Enabled
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => moveSectionOrder(sectionId, 'up')}
                        disabled={sectionIndex === 0}
                        style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: sectionIndex === 0 ? 'not-allowed' : 'pointer', opacity: sectionIndex === 0 ? 0.4 : 1 }}
                      >
                        Move Section Up
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveSectionOrder(sectionId, 'down')}
                        disabled={sectionIndex === formConfig.sectionOrder.length - 1}
                        style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: sectionIndex === formConfig.sectionOrder.length - 1 ? 'not-allowed' : 'pointer', opacity: sectionIndex === formConfig.sectionOrder.length - 1 ? 0.4 : 1 }}
                      >
                        Move Section Down
                      </button>
                    </div>
                  </div>

                  {/* Section Content & Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {/* Standard built-in fields preview */}
                    {sectionId === 'personal' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Full Name (Standard)</span>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Register Number (Standard)</span>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showTagline} onChange={e => setFormConfig({ ...formConfig, showTagline: e.target.checked })} /> Tagline Field
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                          <input type="checkbox" checked={formConfig.showProfilePicture} onChange={e => setFormConfig({ ...formConfig, showProfilePicture: e.target.checked })} /> Profile Picture Upload
                        </label>
                      </div>
                    )}

                    {sectionId === 'contact' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Phone (Standard)</span>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Email (Standard)</span>
                      </div>
                    )}

                    {sectionId === 'education' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Educational Qualifications List (Standard)</span>
                      </div>
                    )}

                    {/* Moveable Custom Fields in this Section */}
                    {sectionCustomFields.length > 0 ? (
                      sectionCustomFields.map((field, fieldIdx) => (
                        <div
                          key={field.id}
                          draggable={true}
                          onDragStart={(e) => {
                            setDraggedFieldId(field.id);
                            e.dataTransfer.setData('text/plain', field.id);
                          }}
                          onDragEnd={() => {
                            setDraggedFieldId(null);
                            setDragOverSection(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: draggedFieldId === field.id ? '#fef3c7' : '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            cursor: 'grab',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '2 1 280px' }}>
                            <span 
                              style={{ cursor: 'grab', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#64748b', fontWeight: 600, userSelect: 'none' }}
                              title="Press and drag to move field"
                            >
                              Drag
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                              <input 
                                type="text"
                                value={field.label}
                                onChange={e => updateCustomField(field.id, { label: e.target.value })}
                                placeholder="Field Label"
                                className="form-control"
                                style={{ fontWeight: 600, padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {/* Type selector */}
                            <select
                              value={field.type}
                              onChange={e => updateCustomField(field.id, { type: e.target.value as any })}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}
                            >
                              <option value="text">Single Line Text</option>
                              <option value="textarea">Paragraph Text</option>
                              <option value="list">Bullet List</option>
                            </select>

                            {/* Move to another section dropdown */}
                            <select
                              value={field.section || sectionId}
                              onChange={(e) => moveFieldToSection(field.id, e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}
                            >
                              {formConfig.sectionOrder.map(secKey => (
                                <option key={secKey} value={secKey}>
                                  Move to: {formConfig.sectionTitles?.[secKey] || DEFAULT_SECTION_TITLES[secKey] || secKey}
                                </option>
                              ))}
                            </select>

                            {/* Required toggle */}
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={field.required || false}
                                onChange={e => updateCustomField(field.id, { required: e.target.checked })}
                              />
                              Required
                            </label>

                            {/* Move Up / Down Buttons */}
                            <button
                              type="button"
                              onClick={() => moveCustomFieldInList(field.id, 'up')}
                              disabled={fieldIdx === 0}
                              style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', padding: '3px 8px', fontSize: '0.8rem', cursor: fieldIdx === 0 ? 'not-allowed' : 'pointer', opacity: fieldIdx === 0 ? 0.4 : 1 }}
                            >
                              Move Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCustomFieldInList(field.id, 'down')}
                              disabled={fieldIdx === sectionCustomFields.length - 1}
                              style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', padding: '3px 8px', fontSize: '0.8rem', cursor: fieldIdx === sectionCustomFields.length - 1 ? 'not-allowed' : 'pointer', opacity: fieldIdx === sectionCustomFields.length - 1 ? 0.4 : 1 }}
                            >
                              Move Down
                            </button>

                            <button 
                              type="button" 
                              onClick={() => removeCustomField(field.id)}
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '0.6rem 1rem', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                        Drag & Drop any custom field here or use "Add Field" above to place fields in {currentSectionTitle}.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Single Save Button at Bottom */}
          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={saveFormConfig} 
              className="btn btn-primary" 
              style={{ padding: '0.85rem 1.5rem', fontSize: '1.05rem', width: '100%', background: '#113666', fontWeight: 600 }}
              disabled={configSaving}
            >
              {configSaving ? 'Saving Changes...' : 'Save Form Settings'}
            </button>
          </div>
        </div>
      )}

      {/* View Student Submission Details Modal */}
      {viewStudentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111827' }}>Student Submission Details</h2>
              <button 
                onClick={() => setViewStudentModal(null)} 
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 600 }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              {viewStudentModal.profileImageBase64 ? (
                <img src={viewStudentModal.profileImageBase64} alt={viewStudentModal.name} style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
              ) : (
                <div style={{ width: '120px', height: '150px', background: '#e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>No Photo</div>
              )}
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#1f2937' }}>{viewStudentModal.name}</h3>
                {viewStudentModal.registerNumber && <p style={{ margin: '0 0 0.25rem 0', color: '#1f2937', fontWeight: 600 }}>Reg. No: {viewStudentModal.registerNumber}</p>}
                {viewStudentModal.tagline && <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontStyle: 'italic' }}>"{viewStudentModal.tagline}"</p>}
                <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}><strong>Status:</strong> <span style={{ color: viewStudentModal.status === 'APPROVED' ? '#059669' : '#d97706', fontWeight: 600 }}>{viewStudentModal.status}</span></p>
                <p style={{ margin: '0 0 0.25rem 0', color: '#4b5563' }}><strong>Phone:</strong> {viewStudentModal.contactPhone || 'N/A'}</p>
                <p style={{ margin: '0 0 0.25rem 0', color: '#4b5563' }}><strong>Email:</strong> {viewStudentModal.contactEmail || 'N/A'}</p>
              </div>
            </div>

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Educational Qualifications</h4>
            <ul>
              {parseEducationList(viewStudentModal.educationalQualifications).map((e: any, idx: number) => (
                <li key={idx}><strong>{e.qualification}</strong> - {e.institution} ({e.year}) | CGPA: {e.cgpa}</li>
              ))}
            </ul>

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Certifications</h4>
            <ul>
              {parseStringList(viewStudentModal.certifications).map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Technical Expertise</h4>
            <ul>
              {parseStringList(viewStudentModal.technicalExpertise).map((t: string, idx: number) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>

            {parseInternshipsList(viewStudentModal.internships).length > 0 && (
              <>
                <hr style={{ margin: '1rem 0' }}/>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Internships</h4>
                {parseInternshipsList(viewStudentModal.internships).map((i: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.75rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '4px' }}>
                    <strong>{i.company}</strong> {i.role && <span>({i.role})</span>}
                    {i.duration && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#4b5563' }}>Duration: {i.duration}</p>}
                  </div>
                ))}
              </>
            )}

            {parseProjectsList(viewStudentModal.projects).length > 0 && (
              <>
                <hr style={{ margin: '1rem 0' }}/>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Projects</h4>
                {parseProjectsList(viewStudentModal.projects).map((p: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.75rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '4px' }}>
                    <strong>{p.title}</strong> {p.toolsUsed && <span>(Tools: {p.toolsUsed})</span>}
                  </div>
                ))}
              </>
            )}

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Strengths</h4>
            <ul>
              {parseStringList(viewStudentModal.strengths).map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>

            {viewStudentModal.customFieldsData && Object.keys(viewStudentModal.customFieldsData).length > 0 && (
              <>
                <hr style={{ margin: '1rem 0' }}/>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Additional Custom Information</h4>
                <ul>
                  {Object.entries(viewStudentModal.customFieldsData).map(([key, val]: [string, any]) => {
                    if (!val) return null;
                    const label = formConfig.customFields?.find(f => f.id === key)?.label || key.replace(/^field_/, 'Field ');
                    return (
                      <li key={key}>
                        <strong>{label}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setViewStudentModal(null)} className="btn btn-secondary">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading Admin Panel...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
