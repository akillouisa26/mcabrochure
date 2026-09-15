'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    objective: '',
    contactPhone: '',
    contactEmail: '',
    contactLocation: '',
    contactLinkedIn: '',
    contactGitHub: '',
    contactPortfolio: '',
    educationalQualifications: [{ qualification: '', institution: '', year: '', cgpa: '' }],
    certifications: [''],
    technicalExpertise: [''],
    projects: [{ title: '', role: '', description: '' }],
    strengths: [''],
    profileImageBase64: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      reader.onloadend = () => {
        setFormData({ ...formData, profileImageBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess('Brochure details submitted successfully!');
        window.scrollTo(0, 0);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        alert('Failed to submit');
      }
    } catch(err) {
      alert('Error submitting');
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <h1 className="page-title">Submit Placement Brochure Data</h1>
      {success && <div style={{ padding: '1rem', background: '#d1fae5', color: '#065f46', marginBottom: '1rem', borderRadius: '4px' }}>{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <h3>Personal Details</h3>
        <div className="form-group">
          <label>Full Name</label>
          <input className="form-control" required name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Tagline (e.g. Aspiring Full Stack Developer)</label>
          <input className="form-control" required name="tagline" value={formData.tagline} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Objective / Quote</label>
          <textarea className="form-control" required name="objective" value={formData.objective} onChange={handleChange} rows={3} />
        </div>
        <div className="form-group">
          <label>Profile Picture</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
        </div>

        <hr style={{ margin: '2rem 0' }}/>
        <h3>Contact Info</h3>
        <div className="form-group">
          <label>Phone</label>
          <input className="form-control" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Location</label>
          <input className="form-control" name="contactLocation" value={formData.contactLocation} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>LinkedIn URL</label>
          <input className="form-control" name="contactLinkedIn" value={formData.contactLinkedIn} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>GitHub URL</label>
          <input className="form-control" name="contactGitHub" value={formData.contactGitHub} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Portfolio URL</label>
          <input className="form-control" name="contactPortfolio" value={formData.contactPortfolio} onChange={handleChange} />
        </div>

        <hr style={{ margin: '2rem 0' }}/>
        <h3>Educational Qualifications</h3>
        {formData.educationalQualifications.map((edu, idx) => (
          <div key={idx} className="array-item">
            <input className="form-control" placeholder="Qualification (e.g. MCA)" value={edu.qualification} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'qualification')} />
            <input className="form-control" placeholder="Institution" value={edu.institution} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'institution')} />
            <input className="form-control" placeholder="Year (e.g. 2025-2027)" value={edu.year} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'year')} />
            <input className="form-control" placeholder="CGPA" value={edu.cgpa} onChange={e => handleArrayChange('educationalQualifications', idx, e.target.value, 'cgpa')} />
            <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('educationalQualifications', idx)}>X</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('educationalQualifications', { qualification: '', institution: '', year: '', cgpa: ''})}>+ Add Education</button>

        <hr style={{ margin: '2rem 0' }}/>
        <h3>Certifications</h3>
        {formData.certifications.map((cert, idx) => (
          <div key={idx} className="array-item">
            <input className="form-control" placeholder="Certification Name" value={cert} onChange={e => handleArrayChange('certifications', idx, e.target.value)} />
            <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('certifications', idx)}>X</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('certifications', '')}>+ Add Certification</button>

        <hr style={{ margin: '2rem 0' }}/>
        <h3>Technical Expertise</h3>
        {formData.technicalExpertise.map((tech, idx) => (
          <div key={idx} className="array-item">
            <input className="form-control" placeholder="Skill/Expertise" value={tech} onChange={e => handleArrayChange('technicalExpertise', idx, e.target.value)} />
            <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('technicalExpertise', idx)}>X</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('technicalExpertise', '')}>+ Add Expertise</button>

        <hr style={{ margin: '2rem 0' }}/>
        <h3>Internships & Projects</h3>
        {formData.projects.map((proj, idx) => (
          <div key={idx} style={{ marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem' }}>
            <input className="form-control" placeholder="Project Title" value={proj.title} onChange={e => handleArrayChange('projects', idx, e.target.value, 'title')} style={{marginBottom:'0.5rem'}} />
            <input className="form-control" placeholder="Role/Duration" value={proj.role} onChange={e => handleArrayChange('projects', idx, e.target.value, 'role')} style={{marginBottom:'0.5rem'}} />
            <textarea className="form-control" placeholder="Description" value={proj.description} onChange={e => handleArrayChange('projects', idx, e.target.value, 'description')} style={{marginBottom:'0.5rem'}} />
            <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('projects', idx)}>Remove Project</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('projects', { title: '', role: '', description: ''})}>+ Add Project</button>

        <hr style={{ margin: '2rem 0' }}/>
        <h3>Strengths</h3>
        {formData.strengths.map((strength, idx) => (
          <div key={idx} className="array-item">
            <input className="form-control" placeholder="Strength details" value={strength} onChange={e => handleArrayChange('strengths', idx, e.target.value)} />
            <button type="button" className="btn btn-danger" onClick={() => removeArrayItem('strengths', idx)}>X</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('strengths', '')}>+ Add Strength</button>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
