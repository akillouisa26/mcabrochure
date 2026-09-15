'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => setStudents(data));
  }, []);

  const deleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
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
      alert('Error approving');
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
      alert('Error changing status');
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '1000px' }}>
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Total Students: {students.length}</span>
          <button onClick={async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }} className="btn btn-secondary">Logout</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem',
                    background: student.status === 'APPROVED' ? '#d1fae5' : '#fef3c7',
                    color: student.status === 'APPROVED' ? '#065f46' : '#92400e'
                  }}>{student.status}</span>
                </td>
                <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {student.status === 'APPROVED' ? (
                      <button onClick={() => rejectStudent(student.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Set Pending</button>
                    ) : (
                      <button onClick={() => approveStudent(student.id)} className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Approve</button>
                    )}
                    <Link href={`/admin/${student.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Edit/View</Link>
                    <Link href={`/admin/${student.id}/print`} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', background: '#4b5563' }}>Print PDF</Link>
                    <button onClick={() => deleteStudent(student.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>No submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
