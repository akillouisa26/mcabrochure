'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  parseStringList, 
  parseEducationList, 
  parseInternshipsList, 
  parseProjectsList,
  renderWithLinks
} from '@/lib/parsers';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'submissions';

  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'brochures' | 'settings'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [viewStudentModal, setViewStudentModal] = useState<any | null>(null);
  const [editStudentModal, setEditStudentModal] = useState<any | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const handleOpenEditModal = (student: any) => {
    setEditError('');
    let parsedEdu = parseEducationList(student.educationalQualifications);
    if (!parsedEdu || parsedEdu.length === 0) {
      parsedEdu = [
        { qualification: '', institution: '', year: '', cgpa: '' },
        { qualification: '', institution: '', year: '', cgpa: '' },
      ];
    } else if (parsedEdu.length === 1) {
      parsedEdu.push({ qualification: '', institution: '', year: '', cgpa: '' });
    }

    setEditStudentModal({
      ...student,
      educationalQualifications: parsedEdu,
      certifications: parseStringList(student.certifications),
      technicalExpertise: parseStringList(student.technicalExpertise),
      internships: parseInternshipsList(student.internships),
      projects: parseProjectsList(student.projects),
      strengths: parseStringList(student.strengths),
      customFieldsData: student.customFieldsData ? { ...student.customFieldsData } : {},
    });
  };

  const handleSaveEditStudent = async () => {
    if (!editStudentModal) return;
    setEditSaving(true);
    setEditError('');
    try {
      const formattedName = editStudentModal.name ? editStudentModal.name.toLowerCase().split(' ').map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ') : '';
      const payload = { ...editStudentModal, name: formattedName };
      const res = await fetch(`/api/students/${editStudentModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setStudents(students.map(s => s.id === data.id ? data : s));
        setEditStudentModal(null);
        setConfigSuccess('Student profile details updated successfully!');
        setTimeout(() => setConfigSuccess(''), 4000);
      } else {
        setEditError(data.error || 'Failed to update student profile.');
      }
    } catch (e: any) {
      setEditError(e?.message || 'Error updating student profile.');
    } finally {
      setEditSaving(false);
    }
  };

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

  const DEFAULT_FIELD_LABELS: Record<string, string> = {
    name: 'Full Name',
    registerNumber: 'Register Number',
    tagline: 'Tagline',
    profilePicture: 'Profile Picture',
    phone: 'Phone',
    email: 'Email',
    education: 'Educational Qualifications',
    certifications: 'Certifications',
    technical: 'Technical Expertise',
    internships: 'Internships',
    projects: 'Projects',
    strengths: 'Strengths',
  };

  const [formConfig, setFormConfig] = useState<{
    showName: boolean;
    showRegisterNumber: boolean;
    showTagline: boolean;
    showProfilePicture: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showEducation: boolean;
    showCertifications: boolean;
    showTechnicalExpertise: boolean;
    showInternships: boolean;
    showProjects: boolean;
    showStrengths: boolean;
    fieldLabels: Record<string, string>;
    fieldSections?: Record<string, string>;
    fieldRequired?: Record<string, boolean>;
    fieldTypes?: Record<string, string>;
    fieldOrder?: Record<string, string[]>;
    sectionOrder: string[];
    sectionTitles: Record<string, string>;
    customFields: Array<{ id: string; label: string; type: string; section: string; required?: boolean; enabled?: boolean; order?: number }>;
  }>({
    showName: true,
    showRegisterNumber: true,
    showTagline: true,
    showProfilePicture: true,
    showPhone: true,
    showEmail: true,
    showEducation: true,
    showCertifications: true,
    showTechnicalExpertise: true,
    showInternships: true,
    showProjects: true,
    showStrengths: true,
    fieldLabels: DEFAULT_FIELD_LABELS,
    fieldSections: {
      name: 'personal',
      registerNumber: 'personal',
      tagline: 'personal',
      profilePicture: 'personal',
      phone: 'contact',
      email: 'contact',
      education: 'education',
      certifications: 'certifications',
      technical: 'technical',
      internships: 'internships',
      projects: 'projects',
      strengths: 'strengths',
    },
    fieldRequired: {
      name: true,
      registerNumber: true,
      phone: true,
      email: true,
      education: true,
    },
    fieldTypes: {},
    fieldOrder: {},
    sectionOrder: DEFAULT_SECTIONS,
    sectionTitles: DEFAULT_SECTION_TITLES,
    customFields: [],
  });

  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  // Section Management state
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // New Custom Field input state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'list'>('text');
  const [newFieldSection, setNewFieldSection] = useState<string>('personal');
  const [newFieldRequired, setNewFieldRequired] = useState<boolean>(false);

  // Drag & Drop State
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const STANDARD_FIELD_DEFS = [
    { id: 'name', defaultLabel: 'Full Name', defaultType: 'text', stateKey: 'showName', defaultSec: 'personal' },
    { id: 'registerNumber', defaultLabel: 'Register Number', defaultType: 'text', stateKey: 'showRegisterNumber', defaultSec: 'personal' },
    { id: 'tagline', defaultLabel: 'Tagline', defaultType: 'text', stateKey: 'showTagline', defaultSec: 'personal' },
    { id: 'profilePicture', defaultLabel: 'Profile Picture', defaultType: 'file', stateKey: 'showProfilePicture', defaultSec: 'personal' },
    { id: 'phone', defaultLabel: 'Phone', defaultType: 'text', stateKey: 'showPhone', defaultSec: 'contact' },
    { id: 'email', defaultLabel: 'Email', defaultType: 'text', stateKey: 'showEmail', defaultSec: 'contact' },
    { id: 'education', defaultLabel: 'Educational Qualifications', defaultType: 'array', stateKey: 'showEducation', defaultSec: 'education' },
    { id: 'certifications', defaultLabel: 'Certifications', defaultType: 'list', stateKey: 'showCertifications', defaultSec: 'certifications' },
    { id: 'technical', defaultLabel: 'Technical Expertise', defaultType: 'list', stateKey: 'showTechnicalExpertise', defaultSec: 'technical' },
    { id: 'internships', defaultLabel: 'Internships', defaultType: 'array', stateKey: 'showInternships', defaultSec: 'internships' },
    { id: 'projects', defaultLabel: 'Projects', defaultType: 'array', stateKey: 'showProjects', defaultSec: 'projects' },
    { id: 'strengths', defaultLabel: 'Strengths', defaultType: 'list', stateKey: 'showStrengths', defaultSec: 'strengths' },
  ];

  const addNewSection = () => {
    if (!newSectionTitle.trim()) {
      alert('Please enter a section heading.');
      return;
    }
    const newSecId = 'sec_' + Date.now();
    setFormConfig(prev => ({
      ...prev,
      sectionOrder: [...(prev.sectionOrder || DEFAULT_SECTIONS), newSecId],
      sectionTitles: {
        ...(prev.sectionTitles || DEFAULT_SECTION_TITLES),
        [newSecId]: newSectionTitle.trim(),
      },
    }));
    setNewSectionTitle('');
  };

  const removeSection = (sectionId: string) => {
    if ((formConfig.sectionOrder || []).length <= 1) {
      alert('Form must have at least one section.');
      return;
    }
    if (!confirm('Are you sure you want to remove this section? Any fields inside will be moved to Personal Details.')) return;
    setFormConfig(prev => {
      const newOrder = (prev.sectionOrder || []).filter(s => s !== sectionId);
      const fallbackSec = newOrder[0] || 'personal';
      const updatedSections = { ...(prev.fieldSections || {}) };
      Object.keys(updatedSections).forEach(k => {
        if (updatedSections[k] === sectionId) updatedSections[k] = fallbackSec;
      });
      const updatedCustoms = (prev.customFields || []).map(f => 
        f.section === sectionId ? { ...f, section: fallbackSec } : f
      );
      return {
        ...prev,
        sectionOrder: newOrder,
        fieldSections: updatedSections,
        customFields: updatedCustoms,
      };
    });
  };

  const getFieldsForSection = (sectionId: string) => {
    const stdFields = STANDARD_FIELD_DEFS.filter(std => {
      const assignedSec = formConfig.fieldSections?.[std.id] || std.defaultSec;
      return assignedSec === sectionId;
    }).map(std => ({
      id: std.id,
      label: formConfig.fieldLabels?.[std.id] || std.defaultLabel,
      type: formConfig.fieldTypes?.[std.id] || std.defaultType,
      section: sectionId,
      enabled: (formConfig as any)[std.stateKey] !== false,
      required: formConfig.fieldRequired?.[std.id] ?? (std.id === 'name' || std.id === 'registerNumber' || std.id === 'phone' || std.id === 'email' || std.id === 'education'),
      isCustom: false,
      stateKey: std.stateKey,
    }));

    const customFields = (formConfig.customFields || [])
      .filter(c => (c.section || 'additional') === sectionId)
      .map(c => ({
        id: c.id,
        label: c.label,
        type: c.type,
        section: sectionId,
        enabled: c.enabled !== false,
        required: c.required || false,
        isCustom: true,
        stateKey: undefined,
      }));

    const allFields = [...stdFields, ...customFields];

    const savedOrder = formConfig.fieldOrder?.[sectionId];
    if (savedOrder && Array.isArray(savedOrder)) {
      allFields.sort((a, b) => {
        const idxA = savedOrder.indexOf(a.id);
        const idxB = savedOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    return allFields;
  };

  const getCustomFieldsForSection = (sectionId: string, studentObj: any) => {
    if (!studentObj || !studentObj.customFieldsData) return [];
    const results: Array<{ label: string; value: any }> = [];

    Object.entries(studentObj.customFieldsData).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') return;

      if (typeof val === 'object' && val !== null && 'value' in val) {
        const sec = (val as any).section || 'additional';
        if (sec === sectionId || (sectionId === 'additional' && (!sec || sec === 'additional'))) {
          results.push({ label: (val as any).label || key, value: (val as any).value });
        }
        return;
      }

      const cfgField = (formConfig.customFields || []).find((f: any) => f.id === key || f.label === key);
      const assignedSec = cfgField ? (cfgField.section || 'additional') : 'additional';

      if (assignedSec === sectionId) {
        const label = cfgField ? cfgField.label : key.replace(/^field_/, 'Field ');
        results.push({ label, value: val });
      }
    });

    return results;
  };

  const updateAnyFieldLabel = (fieldId: string, isCustom: boolean, label: string) => {
    if (isCustom) {
      updateCustomField(fieldId, { label });
    } else {
      updateFieldLabel(fieldId, label);
    }
  };

  const toggleAnyFieldEnabled = (fieldId: string, isCustom: boolean, stateKey?: string, enabled?: boolean) => {
    if (isCustom) {
      updateCustomField(fieldId, { enabled });
    } else if (stateKey) {
      setFormConfig(prev => ({ ...prev, [stateKey]: enabled }));
    }
  };

  const toggleAnyFieldRequired = (fieldId: string, isCustom: boolean, required?: boolean) => {
    if (isCustom) {
      updateCustomField(fieldId, { required });
    } else {
      setFormConfig(prev => ({
        ...prev,
        fieldRequired: {
          ...(prev.fieldRequired || {}),
          [fieldId]: !!required,
        }
      }));
    }
  };

  const updateAnyFieldType = (fieldId: string, isCustom: boolean, newType: string) => {
    if (isCustom) {
      updateCustomField(fieldId, { type: newType });
    } else {
      setFormConfig(prev => ({
        ...prev,
        fieldTypes: {
          ...(prev.fieldTypes || {}),
          [fieldId]: newType,
        }
      }));
    }
  };

  const moveAnyFieldSection = (fieldId: string, isCustom: boolean, targetSection: string) => {
    if (isCustom) {
      moveFieldToSection(fieldId, targetSection);
    } else {
      setFormConfig(prev => ({
        ...prev,
        fieldSections: {
          ...(prev.fieldSections || {}),
          [fieldId]: targetSection,
        }
      }));
    }
  };

  const removeAnyField = (fieldId: string, isCustom: boolean, stateKey?: string) => {
    if (isCustom) {
      removeCustomField(fieldId);
    } else if (stateKey) {
      setFormConfig(prev => ({ ...prev, [stateKey]: false }));
    }
  };

  const moveFieldPositionInSection = (fieldId: string, sectionId: string, direction: 'up' | 'down') => {
    const fields = getFieldsForSection(sectionId);
    const idx = fields.findIndex(f => f.id === fieldId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === fields.length - 1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const fieldIds = fields.map(f => f.id);
    const temp = fieldIds[idx];
    fieldIds[idx] = fieldIds[newIdx];
    fieldIds[newIdx] = temp;

    setFormConfig(prev => ({
      ...prev,
      fieldOrder: {
        ...(prev.fieldOrder || {}),
        [sectionId]: fieldIds,
      }
    }));
  };

  const reorderFieldInSection = (draggedId: string, targetId: string, sectionId: string) => {
    const fields = getFieldsForSection(sectionId);
    const dragIdx = fields.findIndex(f => f.id === draggedId);
    const targetIdx = fields.findIndex(f => f.id === targetId);
    if (dragIdx < 0 || targetIdx < 0 || dragIdx === targetIdx) return;

    const fieldIds = fields.map(f => f.id);
    const [removed] = fieldIds.splice(dragIdx, 1);
    fieldIds.splice(targetIdx, 0, removed);

    setFormConfig(prev => ({
      ...prev,
      fieldOrder: {
        ...(prev.fieldOrder || {}),
        [sectionId]: fieldIds,
      }
    }));
  };

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
          fieldLabels: data.fieldLabels && typeof data.fieldLabels === 'object'
            ? { ...DEFAULT_FIELD_LABELS, ...data.fieldLabels }
            : DEFAULT_FIELD_LABELS,
          customFields: Array.isArray(data.customFields) 
            ? data.customFields.map((f: any) => ({
                ...f,
                section: f.section || 'additional',
                enabled: f.enabled !== false,
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

  const updateFieldLabel = (fieldKey: string, newLabel: string) => {
    setFormConfig(prev => ({
      ...prev,
      fieldLabels: {
        ...(prev.fieldLabels || DEFAULT_FIELD_LABELS),
        [fieldKey]: newLabel,
      },
    }));
  };

  const updateCustomField = (fieldId: string, updates: Partial<{ label: string; type: string; section: string; required: boolean; enabled: boolean }>) => {
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
                      <button onClick={() => handleOpenEditModal(student)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#f59e0b', color: '#fff' }}>Edit</button>
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
                        {student.tagline && <h2>{renderWithLinks(student.tagline)}</h2>}
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
                          <div className="contact-item"><span>Phone</span>: {renderWithLinks(student.contactPhone)}</div>
                          <div className="contact-item"><span>Email</span>: {renderWithLinks(student.contactEmail)}</div>
                          {getCustomFieldsForSection('contact', student).map((cf, idx) => (
                            <div key={idx} className="contact-item">
                              <span>{cf.label}</span>: {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}
                            </div>
                          ))}
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
                            <h3>Certifications</h3>
                            <ul className="bullet-list">
                              {certs.map((c: string, idx: number) => <li key={idx}>{renderWithLinks(c)}</li>)}
                              {getCustomFieldsForSection('certifications', student).map((cf, idx) => (
                                <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(tech.length > 0 || getCustomFieldsForSection('technical', student).length > 0) && (
                          <div className="section">
                            <h3>Technical Expertise</h3>
                            <ul className="bullet-list">
                              {tech.map((t: string, idx: number) => <li key={idx}>{renderWithLinks(t)}</li>)}
                              {getCustomFieldsForSection('technical', student).map((cf, idx) => (
                                <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="right-col">
                        {(internships.length > 0 || getCustomFieldsForSection('internships', student).length > 0) && (
                          <div className="section">
                            <h3>Internships</h3>
                            <ul className="bullet-list">
                              {internships.map((i: any, idx: number) => (
                                <li key={idx}>
                                  {renderWithLinks(i.company)}
                                  {i.role && <> | {renderWithLinks(i.role)}</>}
                                  {i.duration && <> | Duration: {renderWithLinks(i.duration)}</>}
                                </li>
                              ))}
                              {getCustomFieldsForSection('internships', student).map((cf, idx) => (
                                <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(projs.length > 0 || getCustomFieldsForSection('projects', student).length > 0) && (
                          <div className="section">
                            <h3>Projects</h3>
                            <ul className="bullet-list">
                              {projs.map((p: any, idx: number) => {
                                const title = typeof p === 'string' ? p : (p.title || p.name || '');
                                const hasTools = typeof p === 'object' && p.toolsUsed;
                                return (
                                  <li key={idx}>
                                    {renderWithLinks(title)}
                                    {hasTools ? <> | Tools Used: {renderWithLinks(p.toolsUsed)}</> : null}
                                  </li>
                                );
                              })}
                              {getCustomFieldsForSection('projects', student).map((cf, idx) => (
                                <li key={'cf_' + idx}><strong>{cf.label}:</strong> {renderWithLinks(typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value))}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {(strengths.length > 0 || getCustomFieldsForSection('strengths', student).length > 0) && (
                          <div className="section">
                            <h3>Strengths</h3>
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
                          .filter(secId => !['personal', 'contact', 'education', 'certifications', 'technical', 'internships', 'projects', 'strengths'].includes(secId))
                          .map(secId => {
                            const secFields = getCustomFieldsForSection(secId, student);
                            if (secFields.length === 0) return null;
                            const secTitle = formConfig.sectionTitles?.[secId] || DEFAULT_SECTION_TITLES[secId] || secId;
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
                    </div>

                    {/* Footer */}
                    <div className="brochure-footer">
                      <div className="footer-text">
                        <strong>Student Profile</strong><br/>
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
            })
          )}
        </div>
      ) : (
        /* Form Settings Tab (Clean Interactive Form Configurator) */
        <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#111827' }}>Student Form Configurator</h2>
          </div>

          {configSuccess && (
            <div style={{ padding: '0.75rem 1rem', background: '#d1fae5', color: '#065f46', marginBottom: '1.5rem', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
              {configSuccess}
            </div>
          )}

          {/* Top Controls: Add Section & Add Custom Field */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {/* Add New Section Box */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e293b' }}>Add New Section</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="Section Title (e.g. Social Links)" 
                  value={newSectionTitle} 
                  onChange={e => setNewSectionTitle(e.target.value)} 
                  className="form-control" 
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={addNewSection}
                  className="btn btn-secondary"
                  style={{ background: '#3b82f6', color: '#fff', fontWeight: 600, padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                >
                  + Add Section
                </button>
              </div>
            </div>

            {/* Add New Custom Field Box */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e293b' }}>Add New Custom Field</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Field Label (e.g. GitHub URL)" 
                  value={newFieldLabel} 
                  onChange={e => setNewFieldLabel(e.target.value)} 
                  className="form-control" 
                  style={{ flex: '1 1 180px' }}
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
                  style={{ flex: '1 1 160px' }}
                >
                  {formConfig.sectionOrder.map(secId => (
                    <option key={secId} value={secId}>
                      Section: {formConfig.sectionTitles?.[secId] || DEFAULT_SECTION_TITLES[secId] || secId}
                    </option>
                  ))}
                </select>

                <button 
                  type="button" 
                  onClick={addCustomField}
                  className="btn btn-secondary"
                  style={{ background: '#10b981', color: '#fff', fontWeight: 600, padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                >
                  + Add Field
                </button>
              </div>
            </div>
          </div>

          {/* Form Sections Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {formConfig.sectionOrder.map((sectionId, sectionIndex) => {
              const currentSectionTitle = formConfig.sectionTitles?.[sectionId] || DEFAULT_SECTION_TITLES[sectionId] || sectionId;
              const sectionFields = getFieldsForSection(sectionId);
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
                      const isCustom = formConfig.customFields?.some(f => f.id === draggedFieldId);
                      moveAnyFieldSection(draggedFieldId, !!isCustom, sectionId);
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
                  {/* Section Header */}
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
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Section Up / Down */}
                      <button 
                        type="button" 
                        onClick={() => moveSectionOrder(sectionId, 'up')}
                        disabled={sectionIndex === 0}
                        style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', padding: '4px 10px', fontSize: '0.85rem', cursor: sectionIndex === 0 ? 'not-allowed' : 'pointer', opacity: sectionIndex === 0 ? 0.4 : 1 }}
                        title="Move Section Up"
                      >
                        ▲
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveSectionOrder(sectionId, 'down')}
                        disabled={sectionIndex === formConfig.sectionOrder.length - 1}
                        style={{ border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', padding: '4px 10px', fontSize: '0.85rem', cursor: sectionIndex === formConfig.sectionOrder.length - 1 ? 'not-allowed' : 'pointer', opacity: sectionIndex === formConfig.sectionOrder.length - 1 ? 0.4 : 1 }}
                        title="Move Section Down"
                      >
                        ▼
                      </button>

                      {/* Remove Section Button */}
                      <button
                        type="button"
                        onClick={() => removeSection(sectionId)}
                        style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        title="Remove Section"
                      >
                        Remove Section
                      </button>
                    </div>
                  </div>

                  {/* Section Fields (Uniform 2-row Cards matching Screenshot) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sectionFields.map((field, fieldIdx) => (
                      <div
                        key={field.id}
                        draggable={true}
                        onDragStart={(e) => {
                          setDraggedFieldId(field.id);
                          e.dataTransfer.setData('text/plain', field.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedFieldId && draggedFieldId !== field.id) {
                            reorderFieldInSection(draggedFieldId, field.id, sectionId);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedFieldId(null);
                          setDragOverSection(null);
                        }}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.85rem 1rem',
                          background: draggedFieldId === field.id ? '#fef3c7' : '#ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {/* Row 1: Drag handle + Full width editable label input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                          <span 
                            style={{ cursor: 'grab', fontSize: '1.2rem', color: '#94a3b8', userSelect: 'none' }}
                            title="Press and drag to reorder within this section"
                          >
                            ⠿
                          </span>
                          <input 
                            type="text"
                            value={field.label}
                            onChange={e => updateAnyFieldLabel(field.id, field.isCustom, e.target.value)}
                            className="form-control"
                            style={{ fontWeight: 600, fontSize: '0.95rem', width: '100%' }}
                            placeholder="Field Label"
                          />
                        </div>

                        {/* Row 2: Controls matching screenshot */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                          {/* Enabled Checkbox */}
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                            <input 
                              type="checkbox"
                              checked={field.enabled}
                              onChange={e => toggleAnyFieldEnabled(field.id, field.isCustom, field.stateKey, e.target.checked)}
                              style={{ width: '16px', height: '16px' }}
                            />
                            Enabled
                          </label>

                          {/* Required Checkbox */}
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                            <input 
                              type="checkbox"
                              checked={!!field.required}
                              onChange={e => toggleAnyFieldRequired(field.id, field.isCustom, e.target.checked)}
                              style={{ width: '16px', height: '16px' }}
                            />
                            Required
                          </label>

                          {/* Type selector */}
                          <select
                            value={field.type}
                            onChange={e => updateAnyFieldType(field.id, field.isCustom, e.target.value)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.825rem', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155' }}
                          >
                            <option value="text">Single Line Text</option>
                            <option value="textarea">Paragraph Text</option>
                            <option value="list">Bullet List</option>
                            <option value="file">File Upload</option>
                            <option value="array">Array List</option>
                          </select>

                          {/* Move to another section dropdown */}
                          <select
                            value={sectionId}
                            onChange={e => moveAnyFieldSection(field.id, field.isCustom, e.target.value)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.825rem', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155' }}
                          >
                            {formConfig.sectionOrder.map(secKey => (
                              <option key={secKey} value={secKey}>
                                Move to: {formConfig.sectionTitles?.[secKey] || DEFAULT_SECTION_TITLES[secKey] || secKey}
                              </option>
                            ))}
                          </select>

                          {/* Red Remove Button */}
                          <button 
                            type="button" 
                            onClick={() => removeAnyField(field.id, field.isCustom, field.stateKey)}
                            style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '0.35rem 0.85rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
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

      {/* Edit Student Submission Modal */}
      {editStudentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111827' }}>Edit Student Profile Details</h2>
              <button 
                onClick={() => setEditStudentModal(null)} 
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 600 }}
              >
                ✕ Close
              </button>
            </div>

            {editError && (
              <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #fca5a5', fontWeight: 600 }}>
                {editError}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSaveEditStudent(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Personal Details */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e293b' }}>Personal & Contact Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={editStudentModal.name || ''} 
                      onChange={e => setEditStudentModal({ ...editStudentModal, name: e.target.value })} 
                      className="form-control" 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Register Number</label>
                    <input 
                      type="text" 
                      value={editStudentModal.registerNumber || ''} 
                      onChange={e => setEditStudentModal({ ...editStudentModal, registerNumber: e.target.value.toUpperCase() })} 
                      className="form-control" 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tagline / Role</label>
                    <input 
                      type="text" 
                      value={editStudentModal.tagline || ''} 
                      onChange={e => setEditStudentModal({ ...editStudentModal, tagline: e.target.value })} 
                      className="form-control" 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={editStudentModal.contactPhone || ''} 
                      onChange={e => setEditStudentModal({ ...editStudentModal, contactPhone: e.target.value })} 
                      className="form-control" 
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={editStudentModal.contactEmail || ''} 
                      onChange={e => setEditStudentModal({ ...editStudentModal, contactEmail: e.target.value })} 
                      className="form-control" 
                    />
                  </div>
                </div>
              </div>

              {/* Educational Qualifications */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e293b' }}>Educational Qualifications</h3>
                
                {/* Under Graduate */}
                <div style={{ marginBottom: '0.85rem', padding: '0.75rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#113666', fontWeight: 700 }}>Under Graduate</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 0.8fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Qualification</label>
                      <input type="text" placeholder="e.g. BCA, B.Sc" value={editStudentModal.educationalQualifications?.[0]?.qualification || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[0]) updated[0] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[0].qualification = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Institution</label>
                      <input type="text" placeholder="Institution" value={editStudentModal.educationalQualifications?.[0]?.institution || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[0]) updated[0] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[0].institution = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Year</label>
                      <input type="text" placeholder="2022-2025" value={editStudentModal.educationalQualifications?.[0]?.year || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[0]) updated[0] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[0].year = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>CGPA</label>
                      <input type="text" placeholder="CGPA" value={editStudentModal.educationalQualifications?.[0]?.cgpa || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[0]) updated[0] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[0].cgpa = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>

                {/* Post Graduate */}
                <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#113666', fontWeight: 700 }}>Post Graduate</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 0.8fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Qualification</label>
                      <input type="text" placeholder="e.g. MCA" value={editStudentModal.educationalQualifications?.[1]?.qualification || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[1]) updated[1] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[1].qualification = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Institution</label>
                      <input type="text" placeholder="Institution" value={editStudentModal.educationalQualifications?.[1]?.institution || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[1]) updated[1] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[1].institution = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Year</label>
                      <input type="text" placeholder="2025-2027" value={editStudentModal.educationalQualifications?.[1]?.year || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[1]) updated[1] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[1].year = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>CGPA</label>
                      <input type="text" placeholder="CGPA" value={editStudentModal.educationalQualifications?.[1]?.cgpa || ''} onChange={e => {
                        const updated = [...(editStudentModal.educationalQualifications || [{}, {}])];
                        if (!updated[1]) updated[1] = { qualification: '', institution: '', year: '', cgpa: '' };
                        updated[1].cgpa = e.target.value;
                        setEditStudentModal({ ...editStudentModal, educationalQualifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Certifications</h3>
                  <button 
                    type="button" 
                    onClick={() => setEditStudentModal({
                      ...editStudentModal,
                      certifications: [...(editStudentModal.certifications || []), '']
                    })}
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: '#fff' }}
                  >
                    + Add Certification
                  </button>
                </div>
                {(editStudentModal.certifications || []).map((cert: string, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Certification Name</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="text" placeholder="Certification Name" value={cert} onChange={e => {
                        const updated = [...editStudentModal.certifications];
                        updated[idx] = e.target.value;
                        setEditStudentModal({ ...editStudentModal, certifications: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }} />
                      <button type="button" onClick={() => {
                        const updated = [...editStudentModal.certifications];
                        updated.splice(idx, 1);
                        setEditStudentModal({ ...editStudentModal, certifications: updated });
                      }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Technical Expertise */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Technical Expertise</h3>
                  <button 
                    type="button" 
                    onClick={() => setEditStudentModal({
                      ...editStudentModal,
                      technicalExpertise: [...(editStudentModal.technicalExpertise || []), '']
                    })}
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: '#fff' }}
                  >
                    + Add Skill
                  </button>
                </div>
                {(editStudentModal.technicalExpertise || []).map((tech: string, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Skill / Technology</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="text" placeholder="Skill / Technology (e.g. Python)" value={tech} onChange={e => {
                        const updated = [...editStudentModal.technicalExpertise];
                        updated[idx] = e.target.value;
                        setEditStudentModal({ ...editStudentModal, technicalExpertise: updated });
                      }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }} />
                      <button type="button" onClick={() => {
                        const updated = [...editStudentModal.technicalExpertise];
                        updated.splice(idx, 1);
                        setEditStudentModal({ ...editStudentModal, technicalExpertise: updated });
                      }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Internships */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Internships</h3>
                  <button 
                    type="button" 
                    onClick={() => setEditStudentModal({
                      ...editStudentModal,
                      internships: [...(editStudentModal.internships || []), { company: '', role: '', duration: '' }]
                    })}
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: '#fff' }}
                  >
                    + Add Internship
                  </button>
                </div>
                {(editStudentModal.internships || []).map((i: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.75rem', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '4px', background: '#ffffff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Company Name</label>
                        <input type="text" placeholder="Company Name" value={i.company || ''} onChange={e => {
                          const updated = [...editStudentModal.internships];
                          updated[idx].company = e.target.value;
                          setEditStudentModal({ ...editStudentModal, internships: updated });
                        }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Role</label>
                        <input type="text" placeholder="Role (e.g. Web Dev Intern)" value={i.role || ''} onChange={e => {
                          const updated = [...editStudentModal.internships];
                          updated[idx].role = e.target.value;
                          setEditStudentModal({ ...editStudentModal, internships: updated });
                        }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Duration</label>
                        <input type="text" placeholder="Duration (e.g. 3 Months)" value={i.duration || ''} onChange={e => {
                          const updated = [...editStudentModal.internships];
                          updated[idx].duration = e.target.value;
                          setEditStudentModal({ ...editStudentModal, internships: updated });
                        }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </div>
                      <button type="button" onClick={() => {
                        const updated = [...editStudentModal.internships];
                        updated.splice(idx, 1);
                        setEditStudentModal({ ...editStudentModal, internships: updated });
                      }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', marginTop: '1rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Projects</h3>
                  <button 
                    type="button" 
                    onClick={() => setEditStudentModal({
                      ...editStudentModal,
                      projects: [...(editStudentModal.projects || []), { title: '', toolsUsed: '' }]
                    })}
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: '#fff' }}
                  >
                    + Add Project
                  </button>
                </div>
                {(editStudentModal.projects || []).map((p: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.75rem', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '4px', background: '#ffffff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Project Title</label>
                        <input type="text" placeholder="Project Title" value={p.title || (typeof p === 'string' ? p : '')} onChange={e => {
                          const updated = [...editStudentModal.projects];
                          if (typeof updated[idx] === 'string') {
                            updated[idx] = { title: e.target.value, toolsUsed: '' };
                          } else {
                            updated[idx].title = e.target.value;
                          }
                          setEditStudentModal({ ...editStudentModal, projects: updated });
                        }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Tools Used</label>
                        <input type="text" placeholder="Tools Used" value={p.toolsUsed || ''} onChange={e => {
                          const updated = [...editStudentModal.projects];
                          if (typeof updated[idx] === 'string') {
                            updated[idx] = { title: updated[idx], toolsUsed: e.target.value };
                          } else {
                            updated[idx].toolsUsed = e.target.value;
                          }
                          setEditStudentModal({ ...editStudentModal, projects: updated });
                        }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </div>
                      <button type="button" onClick={() => {
                        const updated = [...editStudentModal.projects];
                        updated.splice(idx, 1);
                        setEditStudentModal({ ...editStudentModal, projects: updated });
                      }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', marginTop: '1rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Strengths</h3>
                  <button 
                    type="button" 
                    onClick={() => setEditStudentModal({
                      ...editStudentModal,
                      strengths: [...(editStudentModal.strengths || []), '']
                    })}
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: '#fff' }}
                  >
                    + Add Strength
                  </button>
                </div>
                {(editStudentModal.strengths || []).map((str: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input type="text" placeholder="Strength (e.g. Quick Learner)" value={str} onChange={e => {
                      const updated = [...editStudentModal.strengths];
                      updated[idx] = e.target.value;
                      setEditStudentModal({ ...editStudentModal, strengths: updated });
                    }} className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }} />
                    <button type="button" onClick={() => {
                      const updated = [...editStudentModal.strengths];
                      updated.splice(idx, 1);
                      setEditStudentModal({ ...editStudentModal, strengths: updated });
                    }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditStudentModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={editSaving} className="btn btn-primary" style={{ background: '#10b981', color: '#fff', fontWeight: 600 }}>
                  {editSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
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
