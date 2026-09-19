'use client';

import { useEffect, useState, useRef } from 'react';

const getInitialFormState = () => ({
  name: '',
  registerNumber: '',
  tagline: '',
  objective: '',
  contactPhone: '',
  contactEmail: '',
  linkedIn: '',
  github: '',
  portfolio: '',
  educationalQualifications: [
    { qualification: '', institution: '', year: '', cgpa: '' },
    { qualification: '', institution: '', year: '', cgpa: '' },
  ],
  certifications: [''],
  technicalExpertise: [''],
  internships: [{ company: '', role: '', duration: '' }],
  projects: [{ title: '', toolsUsed: '' }],
  strengths: [''],
  profileImageBase64: '',
  customFieldsData: {} as Record<string, any>,
});

export default function Home() {
  const [formData, setFormData] = useState(getInitialFormState());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formConfig, setFormConfig] = useState<any>({
    showTagline: true,
    showObjective: true,
    showProfilePicture: true,
    showPhone: true,
    showEmail: true,
    showLinkedIn: true,
    showGithub: true,
    showPortfolio: true,
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

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
      .join(' ');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, name: lettersOnly }));
  };

  const handleNameBlur = () => {
    setFormData(prev => ({ ...prev, name: toTitleCase(prev.name.trim()) }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, contactPhone: val }));
  };

  const handleRegisterNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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
    let cleanVal = value;
    if (subfield === 'cgpa') {
      cleanVal = value.replace(/[^0-9.]/g, '');
    } else if (subfield === 'year') {
      cleanVal = value.replace(/[^0-9-]/g, '');
    }
    if (subfield) {
      updated[index][subfield] = cleanVal;
    } else {
      updated[index] = cleanVal;
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

    const isFieldReq = (key: string, defaultReq: boolean = true) => {
      if (formConfig.fieldRequired && key in formConfig.fieldRequired) {
        return Boolean(formConfig.fieldRequired[key]);
      }
      return key !== 'portfolio';
    };

    // Form Field Validations (Only validate if field is enabled and marked Required in Form Settings)
    if (formConfig.showName !== false && isFieldReq('name', true) && !formData.name.trim()) {
      setErrorMsg(`Please enter your ${formConfig.fieldLabels?.name || 'Full Name'}.`);
      return;
    }
    if (formConfig.showRegisterNumber !== false && isFieldReq('registerNumber', true) && !formData.registerNumber.trim()) {
      setErrorMsg(`Please enter your ${formConfig.fieldLabels?.registerNumber || 'Register Number'}.`);
      return;
    }
    if (formConfig.showTagline !== false && isFieldReq('tagline', true) && !formData.tagline.trim()) {
      setErrorMsg(`Please enter your ${formConfig.fieldLabels?.tagline || 'Tagline'}.`);
      return;
    }
    if (formConfig.showObjective !== false && isFieldReq('objective', true) && !formData.objective.trim()) {
      setErrorMsg(`Please enter your ${formConfig.fieldLabels?.objective || 'Vision Statement / Objective'}.`);
      return;
    }
    if (formConfig.showPhone !== false && isFieldReq('phone', true)) {
      if (!/^\d{10}$/.test(formData.contactPhone)) {
        setErrorMsg(`Please enter a valid 10-digit ${formConfig.fieldLabels?.phone || 'Phone number'}.`);
        return;
      }
    }
    if (formConfig.showEmail !== false && isFieldReq('email', true) && !formData.contactEmail.trim()) {
      setErrorMsg(`Please enter a valid ${formConfig.fieldLabels?.email || 'Email address'}.`);
      return;
    }
    if (formConfig.showLinkedIn !== false && isFieldReq('linkedIn', true) && !formData.linkedIn.trim()) {
      setErrorMsg(`Please enter your ${formConfig.fieldLabels?.linkedIn || 'LinkedIn URL'}.`);
      return;
    }
    if (formConfig.showGithub !== false && isFieldReq('github', true) && !formData.github.trim()) {
      setErrorMsg(`Please enter your ${formConfig.fieldLabels?.github || 'GitHub URL'}.`);
      return;
    }

    // Validate Education Items if enabled and required
    if (formConfig.showEducation !== false && isFieldReq('education', true)) {
      const ug = formData.educationalQualifications[0];
      if (!ug || !ug.qualification.trim() || !ug.institution.trim() || !ug.year.trim() || !ug.cgpa.trim()) {
        setErrorMsg('Please complete all Under Graduate details (Qualification, Institution, Year, CGPA).');
        return;
      }
      for (let i = 1; i < formData.educationalQualifications.length; i++) {
        const pg = formData.educationalQualifications[i];
        if (pg && (pg.qualification.trim() || pg.institution.trim() || pg.year.trim() || pg.cgpa.trim())) {
          if (!pg.qualification.trim() || !pg.institution.trim() || !pg.year.trim() || !pg.cgpa.trim()) {
            setErrorMsg(`Please complete all details for Post Graduate #${i} (Qualification, Institution, Year, CGPA).`);
            return;
          }
        }
      }
    }

    // Validate Certifications if enabled and required
    if (formConfig.showCertifications !== false && isFieldReq('certifications', true)) {
      if (!formData.certifications || formData.certifications.length === 0) {
        setErrorMsg(`Please add at least one ${formConfig.fieldLabels?.certifications || 'Certification'}.`);
        return;
      }
      for (const cert of formData.certifications) {
        if (!cert.trim()) {
          setErrorMsg('Please fill in all Certification fields.');
          return;
        }
      }
    }

    // Validate Technical Expertise if enabled and required
    if (formConfig.showTechnicalExpertise !== false && isFieldReq('technical', true)) {
      if (!formData.technicalExpertise || formData.technicalExpertise.length === 0) {
        setErrorMsg(`Please add at least one ${formConfig.fieldLabels?.technical || 'Technical Expertise'} item.`);
        return;
      }
      for (const tech of formData.technicalExpertise) {
        if (!tech.trim()) {
          setErrorMsg('Please fill in all Technical Expertise fields.');
          return;
        }
      }
    }

    // Validate Internships if enabled and required
    if (formConfig.showInternships !== false && isFieldReq('internships', true)) {
      if (!formData.internships || formData.internships.length === 0) {
        setErrorMsg(`Please add at least one ${formConfig.fieldLabels?.internships || 'Internship'} entry.`);
        return;
      }
      for (const intern of formData.internships) {
        if (!intern.company.trim() || !intern.role.trim() || !intern.duration.trim()) {
          setErrorMsg('Please complete all Internship details (Company Name, Role, Duration).');
          return;
        }
      }
    }

    // Validate Projects if enabled and required
    if (formConfig.showProjects !== false && isFieldReq('projects', true)) {
      if (!formData.projects || formData.projects.length === 0) {
        setErrorMsg(`Please add at least one ${formConfig.fieldLabels?.projects || 'Project'} entry.`);
        return;
      }
      for (const proj of formData.projects) {
        if (!proj.title.trim() || !proj.toolsUsed.trim()) {
          setErrorMsg('Please complete all Project details (Project Name, Tools Used).');
          return;
        }
      }
    }

    // Validate Strengths if enabled and required
    if (formConfig.showStrengths !== false && isFieldReq('strengths', true)) {
      if (!formData.strengths || formData.strengths.length === 0) {
        setErrorMsg(`Please add at least one ${formConfig.fieldLabels?.strengths || 'Strength'} entry.`);
        return;
      }
      for (const str of formData.strengths) {
        if (!str.trim()) {
          setErrorMsg('Please fill in all Strength fields.');
          return;
        }
      }
    }

    // Validate Profile Picture if enabled and required
    if (formConfig.showProfilePicture !== false && isFieldReq('profilePicture', true) && !formData.profileImageBase64) {
      setErrorMsg(`Please upload your ${formConfig.fieldLabels?.profilePicture || 'Profile Picture'} before submitting.`);
      return;
    }

    // Validate Custom Fields if present and enabled
    const customFieldsPayload: Record<string, any> = {};
    if (formConfig.customFields && formConfig.customFields.length > 0) {
      for (const field of formConfig.customFields) {
        if (field.enabled === false) continue;
        const val = formData.customFieldsData?.[field.id] !== undefined 
          ? formData.customFieldsData[field.id] 
          : formData.customFieldsData?.[field.label];

        if (field.required && (!val || (typeof val === 'string' && !val.trim()))) {
          setErrorMsg(`Please fill in the required field "${field.label}".`);
          return;
        }
        if (val !== undefined && val !== null && val !== '') {
          customFieldsPayload[field.id] = {
            label: field.label,
            value: val,
            section: field.section || 'personal'
          };
          customFieldsPayload[field.label] = val;
        }
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        name: toTitleCase(formData.name.trim()),
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
        setFormData(getInitialFormState());
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(''), 7000);
      } else {
        setErrorMsg(resData.error || 'Failed to submit form details.');
      }
    } catch(err: any) {
      setErrorMsg(err?.message || 'Error submitting details. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const sectionOrder = (Array.isArray(formConfig.sectionOrder) && formConfig.sectionOrder.length > 0
    ? formConfig.sectionOrder
    : ['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths']).filter((s: string) => s !== 'additional');

  const renderCustomFieldsForSection = (secId: string) => {
    const fields = (formConfig.customFields || []).filter((f: any) => f.section === secId && f.enabled !== false);
    if (fields.length === 0) return null;

    return fields.map((field: any) => (
      <div key={field.id} className="form-group" style={{ marginTop: '1rem' }}>
        <label style={{ fontWeight: 600 }}>
          {field.label}
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

  const getLabel = (key: string, fallback: string) => {
    return formConfig.fieldLabels?.[key] || fallback;
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
          }[secId] || secId;

          const getSection = (key: string, defaultSec: string) => formConfig.fieldSections?.[key] || defaultSec;
          const isReq = (key: string, defaultReq: boolean = true) => {
            if (formConfig.fieldRequired && key in formConfig.fieldRequired) {
              return Boolean(formConfig.fieldRequired[key]);
            }
            return key !== 'portfolio';
          };

          const hasFieldsInSec = 
            (getSection('name', 'personal') === secId && formConfig.showName !== false) ||
            (getSection('registerNumber', 'personal') === secId && formConfig.showRegisterNumber !== false) ||
            (getSection('tagline', 'personal') === secId && formConfig.showTagline !== false) ||
            (getSection('objective', 'personal') === secId && formConfig.showObjective !== false) ||
            (getSection('profilePicture', 'personal') === secId && formConfig.showProfilePicture !== false) ||
            (getSection('phone', 'contact') === secId && formConfig.showPhone !== false) ||
            (getSection('email', 'contact') === secId && formConfig.showEmail !== false) ||
            (getSection('linkedIn', 'contact') === secId && formConfig.showLinkedIn !== false) ||
            (getSection('github', 'contact') === secId && formConfig.showGithub !== false) ||
            (getSection('portfolio', 'contact') === secId && formConfig.showPortfolio !== false) ||
            (getSection('education', 'education') === secId && formConfig.showEducation !== false) ||
            (getSection('certifications', 'certifications') === secId && formConfig.showCertifications !== false) ||
            (getSection('technical', 'technical') === secId && formConfig.showTechnicalExpertise !== false) ||
            (getSection('internships', 'internships') === secId && formConfig.showInternships !== false) ||
            (getSection('projects', 'projects') === secId && formConfig.showProjects !== false) ||
            (getSection('strengths', 'strengths') === secId && formConfig.showStrengths !== false) ||
            renderCustomFieldsForSection(secId);

          if (!hasFieldsInSec) return null;

          return (
            <div key={secId}>
              {sIdx > 0 && <hr style={{ margin: '2rem 0' }}/>}
              <h3>{sectionTitle}</h3>

              {/* Standard Fields assigned to this section */}
              {getSection('name', 'personal') === secId && formConfig.showName !== false && (
                <div className="form-group">
                  <label>{getLabel('name', 'Full Name')}</label>
                  <input className="form-control" required={isReq('name', true)} name="name" value={formData.name} onChange={handleNameChange} onBlur={handleNameBlur} placeholder="Vimal Jerald" />
                </div>
              )}

              {getSection('registerNumber', 'personal') === secId && formConfig.showRegisterNumber !== false && (
                <div className="form-group">
                  <label>{getLabel('registerNumber', 'Register Number')}</label>
                  <input className="form-control" required={isReq('registerNumber', true)} name="registerNumber" value={formData.registerNumber} onChange={handleRegisterNumberChange} placeholder="25PCA101" />
                </div>
              )}

              {getSection('tagline', 'personal') === secId && formConfig.showTagline !== false && (
                <div className="form-group">
                  <label>{getLabel('tagline', 'Tagline')}</label>
                  <input className="form-control" required={isReq('tagline', true)} name="tagline" value={formData.tagline} onChange={handleChange} placeholder="Software Engineer & Web Developer" />
                </div>
              )}

              {getSection('objective', 'personal') === secId && formConfig.showObjective !== false && (
                <div className="form-group">
                  <label>{getLabel('objective', 'Vision Statement (2 Lines)')}</label>
                  <textarea className="form-control" rows={2} required={isReq('objective', true)} name="objective" value={formData.objective} onChange={handleChange} placeholder="To secure a challenging position in a reputable organization..." />
                </div>
              )}

              {getSection('profilePicture', 'personal') === secId && formConfig.showProfilePicture !== false && (
                <div className="form-group">
                  <label>{getLabel('profilePicture', 'Profile Picture')}</label>
                  <input ref={fileInputRef} type="file" accept="image/*" required={isReq('profilePicture', true)} className="form-control" onChange={handleFileChange} />
                </div>
              )}

              {getSection('phone', 'contact') === secId && formConfig.showPhone !== false && (
                <div className="form-group">
                  <label>{getLabel('phone', 'Phone')}</label>
                  <input className="form-control" type="tel" required={isReq('phone', true)} maxLength={10} name="contactPhone" value={formData.contactPhone} onChange={handlePhoneChange} placeholder="9876543210" />
                </div>
              )}

              {getSection('email', 'contact') === secId && formConfig.showEmail !== false && (
                <div className="form-group">
                  <label>{getLabel('email', 'Email')}</label>
                  <input className="form-control" type="email" required={isReq('email', true)} name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="vimal@gmail.com" />
                </div>
              )}

              {getSection('linkedIn', 'contact') === secId && formConfig.showLinkedIn !== false && (
                <div className="form-group">
                  <label>{getLabel('linkedIn', 'LinkedIn')}</label>
                  <input className="form-control" type="url" required={isReq('linkedIn', true)} name="linkedIn" value={formData.linkedIn} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                </div>
              )}

              {getSection('github', 'contact') === secId && formConfig.showGithub !== false && (
                <div className="form-group">
                  <label>{getLabel('github', 'GitHub')}</label>
                  <input className="form-control" type="url" required={isReq('github', true)} name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/username" />
                </div>
              )}

              {getSection('portfolio', 'contact') === secId && formConfig.showPortfolio !== false && (
                <div className="form-group">
                  <label>{getLabel('portfolio', 'Portfolio')}</label>
                  <input className="form-control" type="url" required={isReq('portfolio', false)} name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://myportfolio.com" />
                </div>
              )}

              {getSection('education', 'education') === secId && formConfig.showEducation !== false && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Under Graduate Set */}
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', color: '#113666', fontWeight: 700 }}>Under Graduate</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Qualification</label>
                        <input className="form-control" required={isReq('education', true)} placeholder="Qualification (e.g. BCA, B.Sc)" value={formData.educationalQualifications[0]?.qualification || ''} onChange={e => handleArrayChange('educationalQualifications', 0, e.target.value, 'qualification')} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Institution</label>
                        <input className="form-control" required={isReq('education', true)} placeholder="Institution" value={formData.educationalQualifications[0]?.institution || ''} onChange={e => handleArrayChange('educationalQualifications', 0, e.target.value, 'institution')} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Year</label>
                        <input className="form-control" required={isReq('education', true)} placeholder="Year (e.g. 2022-2025)" value={formData.educationalQualifications[0]?.year || ''} onChange={e => handleArrayChange('educationalQualifications', 0, e.target.value, 'year')} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>CGPA</label>
                        <input className="form-control" required={isReq('education', true)} placeholder="CGPA" value={formData.educationalQualifications[0]?.cgpa || ''} onChange={e => handleArrayChange('educationalQualifications', 0, e.target.value, 'cgpa')} />
                      </div>
                    </div>
                  </div>

                  {/* Post Graduate Set(s) */}
                  {formData.educationalQualifications.slice(1).map((pg, pgIdx) => {
                    const realIndex = pgIdx + 1;
                    return (
                      <div key={'pg_' + realIndex} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: '#113666', fontWeight: 700 }}>
                            Post Graduate {formData.educationalQualifications.length > 2 ? `#${realIndex}` : ''}
                          </h4>
                          {realIndex > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('educationalQualifications', realIndex)}
                              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Qualification</label>
                            <input className="form-control" placeholder="Qualification (e.g. MCA)" value={pg?.qualification || ''} onChange={e => handleArrayChange('educationalQualifications', realIndex, e.target.value, 'qualification')} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Institution</label>
                            <input className="form-control" placeholder="Institution" value={pg?.institution || ''} onChange={e => handleArrayChange('educationalQualifications', realIndex, e.target.value, 'institution')} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Year</label>
                            <input className="form-control" placeholder="Year (e.g. 2025-2027)" value={pg?.year || ''} onChange={e => handleArrayChange('educationalQualifications', realIndex, e.target.value, 'year')} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>CGPA</label>
                            <input className="form-control" placeholder="CGPA" value={pg?.cgpa || ''} onChange={e => handleArrayChange('educationalQualifications', realIndex, e.target.value, 'cgpa')} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Post Graduate Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => addArrayItem('educationalQualifications', { qualification: '', institution: '', year: '', cgpa: '' })}
                      className="btn btn-secondary"
                      style={{ background: '#3b82f6', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '0.45rem 0.9rem', borderRadius: '5px' }}
                    >
                      + Add Post Graduate
                    </button>
                  </div>
                </div>
              )}

              {getSection('certifications', 'certifications') === secId && formConfig.showCertifications !== false && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {formData.certifications.map((cert, idx) => (
                    <div key={idx} style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Certification Name</label>
                      <div className="array-item">
                        <input className="form-control" required={isReq('certifications', false)} placeholder="Certification Name" value={cert} onChange={e => handleArrayChange('certifications', idx, e.target.value)} />
                        {formData.certifications.length > 1 && (
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('certifications', idx)}>X</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('certifications', '')}>+ Add Certification</button>
                </div>
              )}

              {getSection('technical', 'technical') === secId && formConfig.showTechnicalExpertise !== false && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {formData.technicalExpertise.map((tech, idx) => (
                    <div key={idx} style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Skill / Expertise</label>
                      <div className="array-item">
                        <input className="form-control" required={isReq('technical', false)} placeholder="Skill/Expertise (e.g. React, Python)" value={tech} onChange={e => handleArrayChange('technicalExpertise', idx, e.target.value)} />
                        {formData.technicalExpertise.length > 1 && (
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('technicalExpertise', idx)}>X</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('technicalExpertise', '')}>+ Add Expertise</button>
                </div>
              )}

              {getSection('internships', 'internships') === secId && formConfig.showInternships !== false && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {formData.internships?.map((intern, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '6px', background: '#f8fafc' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Company Name</label>
                        <input className="form-control" required={isReq('internships', false)} placeholder="Company Name" value={intern.company} onChange={e => handleArrayChange('internships', idx, e.target.value, 'company')} />
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Role</label>
                        <input className="form-control" required={isReq('internships', false)} placeholder="Role (e.g. Web Developer Intern)" value={intern.role} onChange={e => handleArrayChange('internships', idx, e.target.value, 'role')} />
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Duration</label>
                        <input className="form-control" required={isReq('internships', false)} placeholder="Duration (e.g. 3 Months)" value={intern.duration} onChange={e => handleArrayChange('internships', idx, e.target.value, 'duration')} />
                      </div>
                      {formData.internships.length > 1 && (
                        <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('internships', idx)}>Remove Internship</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('internships', { company: '', role: '', duration: ''})}>+ Add Internship</button>
                </div>
              )}

              {getSection('projects', 'projects') === secId && formConfig.showProjects !== false && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {formData.projects?.map((proj, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '6px', background: '#f8fafc' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Project Name</label>
                        <input className="form-control" required={isReq('projects', false)} placeholder="Project Name" value={proj.title} onChange={e => handleArrayChange('projects', idx, e.target.value, 'title')} />
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Tools Used</label>
                        <input className="form-control" required={isReq('projects', false)} placeholder="Tools Used (e.g. React, Node.js, Firebase)" value={proj.toolsUsed} onChange={e => handleArrayChange('projects', idx, e.target.value, 'toolsUsed')} />
                      </div>
                      {formData.projects.length > 1 && (
                        <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('projects', idx)}>Remove Project</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('projects', { title: '', toolsUsed: ''})}>+ Add Project</button>
                </div>
              )}

              {getSection('strengths', 'strengths') === secId && formConfig.showStrengths !== false && (
                <div style={{ marginBottom: '1.5rem' }}>
                  {formData.strengths.map((strength, idx) => (
                    <div key={idx} style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Strength Detail</label>
                      <div className="array-item">
                        <input className="form-control" required={isReq('strengths', false)} placeholder="Strength details (e.g. Fast Learner)" value={strength} onChange={e => handleArrayChange('strengths', idx, e.target.value)} />
                        {formData.strengths.length > 1 && (
                          <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('strengths', idx)}>X</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('strengths', '')}>+ Add Strength</button>
                </div>
              )}

              {/* Render Custom Fields assigned to this section */}
              {renderCustomFieldsForSection(secId)}
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
