'use client';

import { useEffect, useState } from 'react';

const initialFormState = {
  name: '',
  registerNumber: '',
  tagline: '',
  contactPhone: '',
  contactEmail: '',
  educationalQualifications: [{ qualification: '', institution: '', year: '', cgpa: '' }],
  certifications: [''],
  technicalExpertise: [''],
  internships: [{ company: '', role: '', duration: '' }],
  projects: [{ title: '', toolsUsed: '' }],
  strengths: [''],
  profileImageBase64: '',
  customFieldsData: {} as Record<string, any>,
};

export default function Home() {
  const [formData, setFormData] = useState(initialFormState);
  const [formConfig, setFormConfig] = useState<any>({
    showTagline: true,
    showProfilePicture: true,
    showCertifications: true,
    showTechnicalExpertise: true,
    showInternships: true,
    showProjects: true,
    showStrengths: true,
    customFields: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setFormConfig((prev: any) => ({
            ...prev,
            ...data,
            customFields: Array.isArray(data.customFields) ? data.customFields : []
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, contactPhone: val }));
  };

  const handleRegisterNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, registerNumber: val }));
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFieldsData: {
        ...prev.customFieldsData,
        [fieldId]: value,
      },
    }));
  };

  const handleArrayChange = (field: string, index: number, value: any, subfield?: string) => {
    const updated = [...(formData as any)[field]];
    if (subfield) {
      updated[index][subfield] = value;
    } else {
      updated[index] = value;
    }
    setFormData({ ...formData, [field]: updated });
  };

  const addArrayItem = (field: string, item: any) => {
    setFormData({ ...formData, [field]: [...(formData as any)[field], item] });
  };

  const removeArrayItem = (field: string, index: number) => {
    const updated = [...(formData as any)[field]];
    updated.splice(index, 1);
    setFormData({ ...formData, [field]: updated });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setFormData(prev => ({ ...prev, profileImageBase64: compressedBase64 }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setErrorMsg('');

    // Form Field Validations
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your Full Name.');
      return;
    }
    if (!formData.registerNumber.trim()) {
      setErrorMsg('Please enter your Register Number.');
      return;
    }
    if (formConfig.showTagline && !formData.tagline.trim()) {
      setErrorMsg('Please enter your Tagline.');
      return;
    }
    if (!/^\d{10}$/.test(formData.contactPhone)) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setErrorMsg('Please enter a valid Email address.');
      return;
    }

    // Validate Education Items
    if (!formData.educationalQualifications || formData.educationalQualifications.length === 0) {
      setErrorMsg('Please add at least one Educational Qualification.');
      return;
    }
    for (const edu of formData.educationalQualifications) {
      if (!edu.qualification.trim() || !edu.institution.trim() || !edu.year.trim() || !edu.cgpa.trim()) {
        setErrorMsg('Please complete all Educational Qualification details (Qualification, Institution, Year, CGPA).');
        return;
      }
    }

    // Validate Certifications if enabled
    if (formConfig.showCertifications) {
      if (!formData.certifications || formData.certifications.length === 0) {
        setErrorMsg('Please add at least one Certification.');
        return;
      }
      for (const cert of formData.certifications) {
        if (!cert.trim()) {
          setErrorMsg('Please fill in all Certification fields.');
          return;
        }
      }
    }

    // Validate Technical Expertise if enabled
    if (formConfig.showTechnicalExpertise) {
      if (!formData.technicalExpertise || formData.technicalExpertise.length === 0) {
        setErrorMsg('Please add at least one Technical Expertise item.');
        return;
      }
      for (const tech of formData.technicalExpertise) {
        if (!tech.trim()) {
          setErrorMsg('Please fill in all Technical Expertise fields.');
          return;
        }
      }
    }

    // Validate Internships if enabled
    if (formConfig.showInternships !== false) {
      if (!formData.internships || formData.internships.length === 0) {
        setErrorMsg('Please add at least one Internship entry.');
        return;
      }
      for (const intern of formData.internships) {
        if (!intern.company.trim() || !intern.role.trim() || !intern.duration.trim()) {
          setErrorMsg('Please complete all Internship details (Company Name, Role, Duration).');
          return;
        }
      }
    }

    // Validate Projects if enabled
    if (formConfig.showProjects) {
      if (!formData.projects || formData.projects.length === 0) {
        setErrorMsg('Please add at least one Project entry.');
        return;
      }
      for (const proj of formData.projects) {
        if (!proj.title.trim() || !proj.toolsUsed.trim()) {
          setErrorMsg('Please complete all Project details (Project Name, Tools Used).');
          return;
        }
      }
    }

    // Validate Strengths if enabled
    if (formConfig.showStrengths) {
      if (!formData.strengths || formData.strengths.length === 0) {
        setErrorMsg('Please add at least one Strength entry.');
        return;
      }
      for (const str of formData.strengths) {
        if (!str.trim()) {
          setErrorMsg('Please fill in all Strength fields.');
          return;
        }
      }
    }

    // Validate Profile Picture if enabled
    if (formConfig.showProfilePicture !== false && !formData.profileImageBase64) {
      setErrorMsg('Please upload your Profile Picture before submitting.');
      return;
    }

    // Validate Custom Fields if present
    const customFieldsPayload: Record<string, any> = {};
    if (formConfig.customFields && formConfig.customFields.length > 0) {
      for (const field of formConfig.customFields) {
        const val = formData.customFieldsData?.[field.id];
        if (!val || (typeof val === 'string' && !val.trim())) {
          setErrorMsg(`Please fill in the custom field "${field.label}".`);
          return;
        }
        customFieldsPayload[field.label] = val;
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        customFieldsData: customFieldsPayload,
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (res.ok && resData.id) {
        setSuccess('Brochure details submitted successfully!');
        setFormData(initialFormState);
        window.scrollTo(0, 0);
        setTimeout(() => setSuccess(''), 6000);
      } else {
        setErrorMsg(resData.error || 'Failed to submit form details.');
      }
    } catch(err: any) {
      setErrorMsg(err?.message || 'Error submitting details. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const sectionOrder = Array.isArray(formConfig.sectionOrder) && formConfig.sectionOrder.length > 0
    ? formConfig.sectionOrder
    : ['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths', 'additional'];

  const renderCustomFieldsForSection = (secId: string) => {
    const fields = (formConfig.customFields || []).filter((f: any) => (f.section || 'additional') === secId);
    if (fields.length === 0) return null;

    return fields.map((field: any) => (
      <div key={field.id} className="form-group" style={{ marginTop: '1rem' }}>
        <label style={{ fontWeight: 600 }}>
          {field.label} {field.required ? '*' : ''}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            className="form-control"
            rows={3}
            required={field.required}
            placeholder={`Enter ${field.label}`}
            value={formData.customFieldsData?.[field.id] || ''}
            onChange={e => handleCustomFieldChange(field.id, e.target.value)}
          />
        ) : (
          <input
            type="text"
            className="form-control"
            required={field.required}
            placeholder={`Enter ${field.label}${field.type === 'list' ? ' (comma separated)' : ''}`}
            value={formData.customFieldsData?.[field.id] || ''}
            onChange={e => handleCustomFieldChange(field.id, e.target.value)}
          />
        )}
      </div>
    ));
  };

  return (
    <div className="form-container">
      <h1 className="page-title">Submit Placement Brochure Data</h1>
      
      {success && (
        <div style={{ padding: '1rem', background: '#d1fae5', color: '#065f46', marginBottom: '1.5rem', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', marginBottom: '1.5rem', borderRadius: '4px', border: '1px solid #fca5a5' }}>
          {errorMsg}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {sectionOrder.map((secId: string, sIdx: number) => {
          const sectionTitle = formConfig.sectionTitles?.[secId] || {
            personal: 'Personal Details',
            contact: 'Contact Info',
            education: 'Educational Qualifications',
            certifications: 'Certifications',
            technical: 'Technical Expertise',
            internships: 'Internships',
            projects: 'Projects',
            strengths: 'Strengths',
            additional: 'Additional Information',
          }[secId] || secId;

          return (
            <div key={secId}>
              {sIdx > 0 && <hr style={{ margin: '2rem 0' }}/>}
              
              {secId === 'personal' && (
                <div>
                  <h3>{sectionTitle}</h3>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input className="form-control" required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Vimal Jerald" />
                  </div>

                  <div className="form-group">
                    <label>Register Number *</label>
                    <input className="form-control" required name="registerNumber" value={formData.registerNumber} onChange={handleRegisterNumberChange} placeholder="e.g. 25PCA101" />
                  </div>

                  {formConfig.showTagline && (
                    <div className="form-group">
                      <label>Tagline * (e.g. Aspiring Full Stack Developer)</label>
                      <input className="form-control" required name="tagline" value={formData.tagline} onChange={handleChange} placeholder="e.g. Software Engineer & Web Developer" />
                    </div>
                  )}

                  {formConfig.showProfilePicture !== false && (
                    <div className="form-group">
                      <label>Profile Picture *</label>
                      <input type="file" accept="image/*" required className="form-control" onChange={handleFileChange} />
                    </div>
                  )}
                  {renderCustomFieldsForSection('personal')}
                </div>
              )}

              {secId === 'contact' && (
                <div>
                  <h3>{sectionTitle}</h3>
                  <div className="form-group">
                    <label>Phone * (10 Digits)</label>
                    <input className="form-control" type="tel" required maxLength={10} name="contactPhone" value={formData.contactPhone} onChange={handlePhoneChange} placeholder="9876543210" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input className="form-control" type="email" required name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="vimal@gmail.com" />
                  </div>
                  {renderCustomFieldsForSection('contact')}
                </div>
              )}

              {secId === 'education' && (
                <div>
                  <h3>{sectionTitle}</h3>
                  {formData.educationalQualifications.map((edu, idx) => (
                    <div key={idx} className="array-item">
                      <input className="form-control" required placeholder="Qualification (e.g. MCA)" value={edu.qualification} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'qualification')} />
                      <input className="form-control" required placeholder="Institution" value={edu.institution} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'institution')} />
                      <input className="form-control" required placeholder="Year (e.g. 2025-2027)" value={edu.year} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'year')} />
                      <input className="form-control" required placeholder="CGPA" value={edu.cgpa} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'cgpa')} />
                      <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('educationalQualifications', idx)}>X</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('educationalQualifications', { qualification: '', institution: '', year: '', cgpa: ''})}>+ Add Education</button>
                  {renderCustomFieldsForSection('education')}
                </div>
              )}

              {secId === 'certifications' && (formConfig.showCertifications || renderCustomFieldsForSection('certifications')) && (
                <div>
                  {formConfig.showCertifications && (
                    <>
                      <h3>{sectionTitle}</h3>
                      {formData.certifications.map((cert, idx) => (
                        <div key={idx} className="array-item">
                          <input className="form-control" required placeholder="Certification Name" value={cert} onChange={e => handleArrayChange('certifications', idx, e.target.value)} />
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('certifications', idx)}>X</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('certifications', '')}>+ Add Certification</button>
                    </>
                  )}
                  {renderCustomFieldsForSection('certifications')}
                </div>
              )}

              {secId === 'technical' && (formConfig.showTechnicalExpertise || renderCustomFieldsForSection('technical')) && (
                <div>
                  {formConfig.showTechnicalExpertise && (
                    <>
                      <h3>{sectionTitle}</h3>
                      {formData.technicalExpertise.map((tech, idx) => (
                        <div key={idx} className="array-item">
                          <input className="form-control" required placeholder="Skill/Expertise" value={tech} onChange={e => handleArrayChange('technicalExpertise', idx, e.target.value)} />
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('technicalExpertise', idx)}>X</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('technicalExpertise', '')}>+ Add Expertise</button>
                    </>
                  )}
                  {renderCustomFieldsForSection('technical')}
                </div>
              )}

              {secId === 'internships' && (formConfig.showInternships !== false || renderCustomFieldsForSection('internships')) && (
                <div>
                  {formConfig.showInternships !== false && (
                    <>
                      <h3>{sectionTitle}</h3>
                      {formData.internships?.map((intern, idx) => (
                        <div key={idx} style={{ marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                          <input className="form-control" required placeholder="Company Name" value={intern.company} onChange={e => handleArrayChange('internships', idx, e.target.value, 'company')} style={{marginBottom:'0.5rem'}} />
                          <input className="form-control" required placeholder="Role (e.g. Web Developer Intern)" value={intern.role} onChange={e => handleArrayChange('internships', idx, e.target.value, 'role')} style={{marginBottom:'0.5rem'}} />
                          <input className="form-control" required placeholder="Duration (e.g. 3 Months / June - Aug 2024)" value={intern.duration} onChange={e => handleArrayChange('internships', idx, e.target.value, 'duration')} style={{marginBottom:'0.5rem'}} />
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('internships', idx)}>Remove Internship</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('internships', { company: '', role: '', duration: ''})}>+ Add Internship</button>
                    </>
                  )}
                  {renderCustomFieldsForSection('internships')}
                </div>
              )}

              {secId === 'projects' && (formConfig.showProjects || renderCustomFieldsForSection('projects')) && (
                <div>
                  {formConfig.showProjects && (
                    <>
                      <h3>{sectionTitle}</h3>
                      {formData.projects?.map((proj, idx) => (
                        <div key={idx} style={{ marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                          <input className="form-control" required placeholder="Project Name" value={proj.title} onChange={e => handleArrayChange('projects', idx, e.target.value, 'title')} style={{marginBottom:'0.5rem'}} />
                          <input className="form-control" required placeholder="Tools Used (e.g. React, Node.js, Firebase)" value={proj.toolsUsed} onChange={e => handleArrayChange('projects', idx, e.target.value, 'toolsUsed')} style={{marginBottom:'0.5rem'}} />
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('projects', idx)}>Remove Project</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('projects', { title: '', toolsUsed: ''})}>+ Add Project</button>
                    </>
                  )}
                  {renderCustomFieldsForSection('projects')}
                </div>
              )}

              {secId === 'strengths' && (formConfig.showStrengths || renderCustomFieldsForSection('strengths')) && (
                <div>
                  {formConfig.showStrengths && (
                    <>
                      <h3>{sectionTitle}</h3>
                      {formData.strengths.map((strength, idx) => (
                        <div key={idx} className="array-item">
                          <input className="form-control" placeholder="Strength details" value={strength} onChange={e => handleArrayChange('strengths', idx, e.target.value)} />
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('strengths', idx)}>X</button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('strengths', '')}>+ Add Strength</button>
                    </>
                  )}
                  {renderCustomFieldsForSection('strengths')}
                </div>
              )}

              {secId === 'additional' && renderCustomFieldsForSection('additional') && (
                <div>
                  <h3>{sectionTitle}</h3>
                  {renderCustomFieldsForSection('additional')}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', background: '#113666' }} disabled={loading}>
            {loading ? 'Submitting Details...' : 'Submit Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
