'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'submissions';

  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'brochures' | 'settings'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [viewStudentModal, setViewStudentModal] = useState<any | null>(null);

  // Form Settings Config state
  const [formConfig, setFormConfig] = useState<{
    showTagline: boolean;
    showProfilePicture: boolean;
    showCertifications: boolean;
    showTechnicalExpertise: boolean;
    showInternships: boolean;
    showProjects: boolean;
    showStrengths: boolean;
    customFields: Array<{ id: string; label: string; type: string }>;
  }>({
    showTagline: true,
    showProfilePicture: true,
    showCertifications: true,
    showTechnicalExpertise: true,
    showInternships: true,
    showProjects: true,
    showStrengths: true,
    customFields: [],
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  // New Custom Field input state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'list'>('text');

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
          customFields: Array.isArray(data.customFields) ? data.customFields : []
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
        setConfigSuccess('Form configuration saved! Changes are now live on the student submission form.');
        setTimeout(() => setConfigSuccess(''), 5000);
      }
    } catch (e) {
      alert('Failed to save configuration');
    } finally {
      setConfigSaving(false);
    }
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
    };
    setFormConfig(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
    setNewFieldLabel('');
    setNewFieldType('text');
  };

  const removeCustomField = (id: string) => {
    setFormConfig(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(f => f.id !== id),
    }));
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
      const edu = safeParse(student.educationalQualifications)
        .map((e: any) => `${e.qualification || ''} (${e.institution || ''}, ${e.year || ''}, CGPA: ${e.cgpa || ''})`)
        .join('; ');
      const certs = safeParse(student.certifications).join('; ');
      const tech = safeParse(student.technicalExpertise).join('; ');
      const internships = safeParse(student.internships)
        .map((i: any) => `${i.company || ''} - ${i.role || ''} (${i.duration || ''})`)
        .join('; ');
      const projs = safeParse(student.projects)
        .map((p: any) => `${p.title || ''}${p.toolsUsed ? ` [Tools: ${p.toolsUsed}]` : ''}`)
        .join('; ');
      const strengths = safeParse(student.strengths).join('; ');
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
              const edu = safeParse(student.educationalQualifications);
              const certs = safeParse(student.certifications);
              const tech = safeParse(student.technicalExpertise);
              const internships = safeParse(student.internships);
              const projs = safeParse(student.projects);
              const strengths = safeParse(student.strengths);

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
        /* Form Settings Tab (Add/Remove Form Fields) */
        <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '1.5rem', color: '#111827' }}>Student Form Fields Configurator</h2>

          {configSuccess && (
            <div style={{ padding: '0.75rem 1rem', background: '#d1fae5', color: '#065f46', marginBottom: '1.5rem', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
              {configSuccess}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '650px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '0.25rem' }}>Default Form Sections</h3>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Tagline Field</span>
              <input 
                type="checkbox" 
                checked={formConfig.showTagline} 
                onChange={e => setFormConfig({ ...formConfig, showTagline: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Profile Picture Upload</span>
              <input 
                type="checkbox" 
                checked={formConfig.showProfilePicture} 
                onChange={e => setFormConfig({ ...formConfig, showProfilePicture: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Certifications Section</span>
              <input 
                type="checkbox" 
                checked={formConfig.showCertifications} 
                onChange={e => setFormConfig({ ...formConfig, showCertifications: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Technical Expertise Section</span>
              <input 
                type="checkbox" 
                checked={formConfig.showTechnicalExpertise} 
                onChange={e => setFormConfig({ ...formConfig, showTechnicalExpertise: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Internships Section</span>
              <input 
                type="checkbox" 
                checked={formConfig.showInternships !== false} 
                onChange={e => setFormConfig({ ...formConfig, showInternships: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Projects Section</span>
              <input 
                type="checkbox" 
                checked={formConfig.showProjects} 
                onChange={e => setFormConfig({ ...formConfig, showProjects: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Strengths Section</span>
              <input 
                type="checkbox" 
                checked={formConfig.showStrengths} 
                onChange={e => setFormConfig({ ...formConfig, showStrengths: e.target.checked })} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>

            <hr style={{ margin: '1.5rem 0 0.5rem 0', borderColor: '#e5e7eb' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '0.25rem' }}>Custom Additional Fields</h3>
            
            {/* Added Custom Fields List */}
            {formConfig.customFields && formConfig.customFields.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {formConfig.customFields.map((field) => (
                  <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f3f4f6', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{field.label}</span>
                      <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px', color: '#4b5563' }}>Type: {field.type}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeCustomField(field.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Remove Field
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>No custom fields added yet.</p>
            )}

            {/* Add New Custom Field Form */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px dashed #cbd5e1', marginTop: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#334155' }}>Add New Custom Field</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Field Label (e.g. GitHub URL, Hobbies)" 
                  value={newFieldLabel} 
                  onChange={e => setNewFieldLabel(e.target.value)} 
                  className="form-control" 
                  style={{ flex: 2, minWidth: '200px' }}
                />
                <select 
                  value={newFieldType} 
                  onChange={e => setNewFieldType(e.target.value as any)} 
                  className="form-control"
                  style={{ flex: 1, minWidth: '130px' }}
                >
                  <option value="text">Single Line Text</option>
                  <option value="textarea">Paragraph Text</option>
                  <option value="list">Bullet List</option>
                </select>
                <button 
                  type="button" 
                  onClick={addCustomField}
                  className="btn btn-secondary"
                  style={{ background: '#10b981', color: '#fff', fontWeight: 600 }}
                >
                  + Add Field
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button 
                onClick={saveFormConfig} 
                className="btn btn-primary" 
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', width: '100%', background: '#113666' }}
                disabled={configSaving}
              >
                {configSaving ? 'Saving Changes...' : 'Save Form Settings'}
              </button>
            </div>
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
                <img src={viewStudentModal.profileImageBase64} alt={viewStudentModal.name} style={{ width: '90px', height: '110px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
              ) : (
                <div style={{ width: '90px', height: '110px', background: '#e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>No Photo</div>
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
              {safeParse(viewStudentModal.educationalQualifications).map((e: any, idx: number) => (
                <li key={idx}><strong>{e.qualification}</strong> - {e.institution} ({e.year}) | CGPA: {e.cgpa}</li>
              ))}
            </ul>

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Certifications</h4>
            <ul>
              {safeParse(viewStudentModal.certifications).map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Technical Expertise</h4>
            <ul>
              {safeParse(viewStudentModal.technicalExpertise).map((t: string, idx: number) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>

            {safeParse(viewStudentModal.internships).length > 0 && (
              <>
                <hr style={{ margin: '1rem 0' }}/>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Internships</h4>
                {safeParse(viewStudentModal.internships).map((i: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.75rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '4px' }}>
                    <strong>{i.company}</strong> {i.role && <span>({i.role})</span>}
                    {i.duration && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#4b5563' }}>Duration: {i.duration}</p>}
                  </div>
                ))}
              </>
            )}

            {safeParse(viewStudentModal.projects).length > 0 && (
              <>
                <hr style={{ margin: '1rem 0' }}/>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Projects</h4>
                {safeParse(viewStudentModal.projects).map((p: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.75rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '4px' }}>
                    <strong>{p.title}</strong> {p.toolsUsed && <span>(Tools: {p.toolsUsed})</span>}
                  </div>
                ))}
              </>
            )}

            <hr style={{ margin: '1rem 0' }}/>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Strengths</h4>
            <ul>
              {safeParse(viewStudentModal.strengths).map((s: string, idx: number) => (
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
