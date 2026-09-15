'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminEditPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/students/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setFormData({
          ...data,
          educationalQualifications: JSON.parse(data.educationalQualifications || '[]'),
          certifications: JSON.parse(data.certifications || '[]'),
          technicalExpertise: JSON.parse(data.technicalExpertise || '[]'),
          projects: JSON.parse(data.projects || '[]'),
          strengths: JSON.parse(data.strengths || '[]'),
        });
      });
  }, [params.id]);

  if (!formData) return <div>Loading...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/students/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    router.push('/admin');
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="form-container">
      <h1>Edit Student</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input className="form-control" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
          </select>
        </div>
        <div className="form-group">
          <label>Tagline</label>
          <input className="form-control" name="tagline" value={formData.tagline} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input className="form-control" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">Save Changes</button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
