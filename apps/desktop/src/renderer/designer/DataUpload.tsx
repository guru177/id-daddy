import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronUp, Image as ImageIcon, X, Settings } from 'lucide-react';
import { useDesignerStore } from './store';

const initialFormState = {
  firstName: '', lastName: '', nickname: '', dob: '', title: '', idNumber: '',
  employeeId: '', department: '', hireDate: '', issueDate: '', expirationDate: '',
  phone1: '', phone2: '', fax: '', email: '', website: '', country: '', postalCode: '',
  state: '', city: '', street1: '', street2: '', gradeLevel: '', securityLevel: '',
  height: '', weight: '', gender: '', eyeColor: '', hairColor: '', profileImage: '',
  signature: '', fingerprint: '', divisionLogo: '', customImage: ''
};
const STANDARD_FIELDS = [
  'First Name', 'Last Name', 'Nickname', 'Date of Birth', 'Title', 'ID number',
  'Employee ID', 'Department', 'Hire Date', 'Issue Date', 'Expiration Date',
  'Phone 1', 'Fax', 'Email', 'Website', 'Country', 'Postal Code', 'State', 'City',
  'Street 1', 'Street 2', 'Grade Level', 'Security Level', 'Height', 'Weight',
  'Gender', 'Eye color', 'Hair color'
];
const STANDARD_IMAGE_FIELDS = ['Signature', 'Fingerprint', 'Division Logo'];


// Section Subcomponent
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="pt-2">
      <div 
        className="flex items-center gap-2 mb-6 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[11px] font-black text-gray-900 group-hover:text-green-600 transition-colors">{title}</h2>
        <ChevronUp size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </div>
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
          {children}
        </div>
      )}
      <div className="h-px bg-gray-100 w-full mt-8" />
    </div>
  );
};

// Form Field Subcomponent
const FormField = ({ label, placeholder, required = false, value, onChange, originalLabel }: { label: string, placeholder?: string, required?: boolean, value: string, onChange: (v: string) => void, originalLabel?: string }) => {
  const { formConfig } = useDesignerStore();
  const idToMatch = originalLabel || label;
  if (formConfig && idToMatch !== 'First Name' && !formConfig.enabledFields.includes(idToMatch)) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-gray-800 tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
      />
    </div>
  );
};

export const DataUpload = () => {
  const { members, deleteMember, addMember, updateMember, showModal, organizationType, setOrganizationType, formConfig, setFormConfig } = useDesignerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<{enabledFields: string[], customFields: string[], enabledImageFields: string[], customImageFields: string[]}>({ enabledFields: STANDARD_FIELDS, customFields: [], enabledImageFields: STANDARD_IMAGE_FIELDS, customImageFields: [] });
  const [tempOrganizationType, setTempOrganizationType] = useState<'corporate' | 'education' | 'healthcare'>('corporate');
  const [formData, setFormData] = useState(initialFormState);
  const [customFieldsList, setCustomFieldsList] = useState<{label: string, value: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen && !editingMemberId) {
      const activeCustomFields = formConfig?.customFields?.filter(cf => formConfig.enabledFields.includes(cf)) || [];
      const activeCustomImageFields = formConfig?.customImageFields?.filter(cf => formConfig.enabledImageFields?.includes(cf)) || [];
      
      const combined = [
        ...activeCustomFields.map(cf => ({ label: cf, value: '' })),
        ...activeCustomImageFields.map(cf => ({ label: cf, value: '' }))
      ];
      setCustomFieldsList(combined);
    }
  }, [isModalOpen, formConfig, editingMemberId]);

  const handleChange = (field: keyof typeof initialFormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getLabel = (field: string, explicitType?: string) => {
    const typeToCheck = explicitType || organizationType;
    if (typeToCheck === 'education') {
      if (field === 'Employee ID') return 'Student/Staff ID';
      if (field === 'Department') return 'Grade/Class';
      if (field === 'Title') return 'Role (Student/Faculty)';
      if (field === 'Hire Date') return 'Enrollment Date';
      if (field === 'Employment Details') return 'School Details';
    } else if (typeToCheck === 'healthcare') {
      if (field === 'Employee ID') return 'Staff ID';
      if (field === 'Department') return 'Department/Ward';
      if (field === 'Title') return 'Role/Specialty';
    }
    return field;
  };

  const handleSave = () => {
    if (!formData.firstName) {
      showModal({
        title: 'Missing Field',
        message: 'First Name is required.',
        type: 'error'
      });
      return;
    }

    const customFieldsRecord: Record<string, string> = {};
    customFieldsList.forEach(f => {
      if (f.label.trim()) {
        customFieldsRecord[f.label.trim()] = f.value;
      }
    });

    if (editingMemberId) {
      updateMember(editingMemberId, { ...formData, customFields: customFieldsRecord });
    } else {
      addMember({ ...formData, customFields: customFieldsRecord });
    }

    setFormData(initialFormState);
    setCustomFieldsList([]);
    setIsModalOpen(false);
    setEditingMemberId(null);

    showModal({
      title: 'Success',
      message: editingMemberId 
        ? `${formData.firstName}'s data has been updated.` 
        : `${formData.firstName} has been added to your members list.`,
      type: 'info'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (f) => {
        handleChange('profileImage', f.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-800">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0 z-10">
        <h1 className="text-lg font-black text-gray-900">Saved Members ({members.length})</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setTempConfig(formConfig || { enabledFields: STANDARD_FIELDS, customFields: [], enabledImageFields: STANDARD_IMAGE_FIELDS, customImageFields: [] });
              setTempOrganizationType(organizationType);
              setIsSettingsOpen(true);
            }}
            className={`bg-white border text-[11px] uppercase tracking-wide font-bold px-4 py-2 rounded transition-colors flex items-center gap-2 ${isSettingsOpen ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <Settings size={14} /> Variable Checklist
          </button>
          <button 
            onClick={() => {
              setEditingMemberId(null);
              setFormData(initialFormState);
              setCustomFieldsList([]);
              setIsModalOpen(true);
            }}
            className="bg-[#34a853] hover:bg-green-600 text-white px-6 py-2 rounded font-bold text-[11px] uppercase tracking-wide transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={14} /> Add New Member
          </button>
        </div>
      </div>

      {/* Settings Modal Popup */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-gray-900">Variable Checklist & Profile</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-8">
                <h3 className="text-sm font-black text-gray-800 mb-4">Organization Profile Type</h3>
                <p className="text-xs text-gray-500 mb-3">Select the type of organization to automatically adapt the field labels.</p>
                <select 
                  value={tempOrganizationType}
                  onChange={(e) => setTempOrganizationType(e.target.value as any)}
                  className="bg-white border border-gray-200 text-stone-700 px-3 py-2.5 rounded font-bold text-[12px] uppercase tracking-wide focus:outline-none focus:border-green-500 transition-colors shadow-sm w-64"
                >
                  <option value="corporate">Corporate Profile</option>
                  <option value="education">Education Profile</option>
                  <option value="healthcare">Healthcare Profile</option>
                </select>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-800 mb-4">Configure Form Checklist</h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {STANDARD_FIELDS.map(f => {
                    const label = getLabel(f, tempOrganizationType);
                    const isChecked = tempConfig.enabledFields.includes(f);
                    // First Name is always required
                    const disabled = f === 'First Name';
                    return (
                      <label key={f} className={`flex items-center gap-2 text-xs font-bold ${disabled ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}>
                        <input 
                          type="checkbox" 
                          disabled={disabled}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({...tempConfig, enabledFields: [...tempConfig.enabledFields, f]});
                            } else {
                              setTempConfig({...tempConfig, enabledFields: tempConfig.enabledFields.filter(x => x !== f)});
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        {label}
                      </label>
                    );
                  })}
                  {tempConfig.customFields.map((cf, idx) => {
                    const isChecked = tempConfig.enabledFields.includes(cf);
                    return (
                      <label key={`custom-${idx}`} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({...tempConfig, enabledFields: [...tempConfig.enabledFields, cf]});
                            } else {
                              setTempConfig({...tempConfig, enabledFields: tempConfig.enabledFields.filter(x => x !== cf)});
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-blue-700">{cf}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setTempConfig({
                              ...tempConfig, 
                              customFields: tempConfig.customFields.filter((_, i) => i !== idx),
                              enabledFields: tempConfig.enabledFields.filter(x => x !== cf)
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-1 text-gray-300 hover:text-red-500 transition-opacity"
                          title="Delete custom field"
                        >
                          <X size={12} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-800 mb-4">Configure Image Checklist</h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {STANDARD_IMAGE_FIELDS.map(f => {
                    const isChecked = tempConfig.enabledImageFields?.includes(f);
                    return (
                      <label key={f} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({...tempConfig, enabledImageFields: [...(tempConfig.enabledImageFields || []), f]});
                            } else {
                              setTempConfig({...tempConfig, enabledImageFields: (tempConfig.enabledImageFields || []).filter(x => x !== f)});
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-purple-700">{f}</span>
                      </label>
                    );
                  })}
                  {tempConfig.customImageFields?.map((cf, idx) => {
                    const isChecked = tempConfig.enabledImageFields?.includes(cf);
                    return (
                      <label key={`custom-img-${idx}`} className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({...tempConfig, enabledImageFields: [...(tempConfig.enabledImageFields || []), cf]});
                            } else {
                              setTempConfig({...tempConfig, enabledImageFields: (tempConfig.enabledImageFields || []).filter(x => x !== cf)});
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-purple-700 underline">{cf}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setTempConfig({
                              ...tempConfig, 
                              customImageFields: (tempConfig.customImageFields || []).filter((_, i) => i !== idx),
                              enabledImageFields: (tempConfig.enabledImageFields || []).filter(x => x !== cf)
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-1 text-gray-300 hover:text-red-500 transition-opacity"
                          title="Delete custom image field"
                        >
                          <X size={12} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-8 border-t border-gray-100 flex gap-12">
                <div>
                  <h3 className="text-sm font-black text-gray-800 mb-4">Add Custom Text Field</h3>
                  <div className="flex gap-2 w-64">
                    <input 
                      type="text" 
                      id="newCustomFieldInput"
                      placeholder="e.g. Bus Route" 
                      className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !tempConfig.customFields.includes(val)) {
                            setTempConfig({
                              ...tempConfig, 
                              customFields: [...tempConfig.customFields, val],
                              enabledFields: [...tempConfig.enabledFields, val]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('newCustomFieldInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !tempConfig.customFields.includes(val)) {
                          setTempConfig({
                            ...tempConfig, 
                            customFields: [...tempConfig.customFields, val],
                            enabledFields: [...tempConfig.enabledFields, val]
                          });
                          input.value = '';
                        }
                      }}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-800 mb-4">Add Custom Image Field</h3>
                  <div className="flex gap-2 w-64">
                    <input 
                      type="text" 
                      id="newCustomImageInput"
                      placeholder="e.g. Parent Signature" 
                      className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !tempConfig.customImageFields?.includes(val)) {
                            setTempConfig({
                              ...tempConfig, 
                              customImageFields: [...(tempConfig.customImageFields || []), val],
                              enabledImageFields: [...(tempConfig.enabledImageFields || []), val]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('newCustomImageInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !tempConfig.customImageFields?.includes(val)) {
                          setTempConfig({
                            ...tempConfig, 
                            customImageFields: [...(tempConfig.customImageFields || []), val],
                            enabledImageFields: [...(tempConfig.enabledImageFields || []), val]
                          });
                          input.value = '';
                        }
                      }}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-4 shrink-0">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 rounded font-bold text-xs transition-colors text-gray-500 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setOrganizationType(tempOrganizationType);
                  setFormConfig(tempConfig);
                  setIsSettingsOpen(false);
                  showModal({ title: 'Settings Saved', message: 'Profile and Form variables updated successfully.', type: 'info' });
                }}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded font-bold text-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="w-full h-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-400 font-black border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Photo</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">ID Number</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        {member.profileImage ? (
                          <img src={member.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-6 py-3">{member.idNumber || '-'}</td>
                    <td className="px-6 py-3">{member.department || '-'}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            setEditingMemberId(member.id);
                            // @ts-ignore
                            setFormData(member);
                            const customFields = Object.entries(member.customFields || {}).map(([label, value]) => ({ label: (label as string), value: (value as string) }));
                            setCustomFieldsList(customFields);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 font-bold text-xs"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteMember(member.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold">
                      No members added yet. Click "Add New Member" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-8">
          <div className="bg-stone-50 rounded-[28px] shadow-2xl w-full max-w-[1200px] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-gray-900">{editingMemberId ? 'Edit Member' : 'Add New Member'}</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSave}
                  className="bg-[#34a853] hover:bg-green-600 text-white px-8 py-2 rounded font-bold text-sm transition-colors shadow-sm"
                >
                  Save Member
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Form Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex gap-8 mx-auto">
                {/* Left Column: Image Upload */}
                <div className="w-[300px] shrink-0">
                  <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center gap-6 border border-gray-100 shadow-sm">
                    <div className="w-32 h-32 bg-gray-50 flex items-center justify-center rounded text-gray-200 overflow-hidden relative">
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={64} strokeWidth={1} />
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#34a853] hover:bg-green-600 text-white px-6 py-1.5 rounded font-bold text-xs w-full transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> {formData.profileImage ? 'Change Image' : 'Add Image'}
                    </button>
                  </div>
                </div>

                {/* Right Column: Form Fields */}
                <div className="flex-1 space-y-8">
                  {/* General Info */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="First Name" required placeholder="Enter First Name..." value={formData.firstName} onChange={(v) => handleChange('firstName', v)} />
                    <FormField label="Last Name" placeholder="Enter Last Name..." value={formData.lastName} onChange={(v) => handleChange('lastName', v)} />
                    <FormField label="Nickname" placeholder="Enter Nickname..." value={formData.nickname} onChange={(v) => handleChange('nickname', v)} />
                    <FormField label="Date of Birth" placeholder="Enter Date of Birth..." value={formData.dob} onChange={(v) => handleChange('dob', v)} />
                    <FormField originalLabel="Title" label={getLabel("Title")} placeholder={`Enter ${getLabel("Title")}...`} value={formData.title} onChange={(v) => handleChange('title', v)} />
                    <FormField label="ID number" placeholder="Enter ID number..." value={formData.idNumber} onChange={(v) => handleChange('idNumber', v)} />
                  </div>

                  {/* Employment Details */}
                  <Section title={getLabel("Employment Details")}>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <FormField originalLabel="Employee ID" label={getLabel("Employee ID")} placeholder={`Enter ${getLabel("Employee ID")}...`} value={formData.employeeId} onChange={(v) => handleChange('employeeId', v)} />
                      <FormField originalLabel="Department" label={getLabel("Department")} placeholder={`Enter ${getLabel("Department")}...`} value={formData.department} onChange={(v) => handleChange('department', v)} />
                      <FormField originalLabel="Hire Date" label={getLabel("Hire Date")} placeholder={`Enter ${getLabel("Hire Date")}...`} value={formData.hireDate} onChange={(v) => handleChange('hireDate', v)} />
                      <FormField label="Issue Date" placeholder="Enter Issue Date..." value={formData.issueDate} onChange={(v) => handleChange('issueDate', v)} />
                      <FormField label="Expiration Date" placeholder="Enter Expiration Date..." value={formData.expirationDate} onChange={(v) => handleChange('expirationDate', v)} />
                    </div>
                  </Section>

                  {/* Contact Info & Addresses */}
                  <Section title="Contact Info & Addresses">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <FormField label="Phone 1" placeholder="Enter Phone 1..." value={formData.phone1} onChange={(v) => handleChange('phone1', v)} />
                      <FormField label="Fax" placeholder="Enter Fax..." value={formData.fax} onChange={(v) => handleChange('fax', v)} />
                      <FormField label="Email" placeholder="Enter Email..." value={formData.email} onChange={(v) => handleChange('email', v)} />
                      <FormField label="Website" placeholder="Enter Website..." value={formData.website} onChange={(v) => handleChange('website', v)} />
                    </div>
                    <div className="grid grid-cols-4 gap-x-8 gap-y-6 mt-6">
                      <FormField label="Country" placeholder="Enter Country..." value={formData.country} onChange={(v) => handleChange('country', v)} />
                      <FormField label="Postal Code" placeholder="Enter Postal Code..." value={formData.postalCode} onChange={(v) => handleChange('postalCode', v)} />
                      <FormField label="State" placeholder="Enter State..." value={formData.state} onChange={(v) => handleChange('state', v)} />
                      <FormField label="City" placeholder="Enter City..." value={formData.city} onChange={(v) => handleChange('city', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-6">
                      <FormField label="Street 1" placeholder="Enter Street 1..." value={formData.street1} onChange={(v) => handleChange('street1', v)} />
                      <FormField label="Street 2" placeholder="Enter Street 2..." value={formData.street2} onChange={(v) => handleChange('street2', v)} />
                    </div>
                  </Section>

                  {/* Additional Information */}
                  <Section title="Additional Information">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
                      <FormField label="Grade Level" placeholder="Enter Grade Level..." value={formData.gradeLevel} onChange={(v) => handleChange('gradeLevel', v)} />
                      <FormField label="Security Level" placeholder="Enter Security Level..." value={formData.securityLevel} onChange={(v) => handleChange('securityLevel', v)} />
                    </div>
                    <div className="grid grid-cols-4 gap-x-8 gap-y-6 mb-6">
                      <FormField label="Height" placeholder="Enter Height..." value={formData.height} onChange={(v) => handleChange('height', v)} />
                      <FormField label="Weight" placeholder="Enter Weight..." value={formData.weight} onChange={(v) => handleChange('weight', v)} />
                      <FormField label="Gender" placeholder="Enter Gender..." value={formData.gender} onChange={(v) => handleChange('gender', v)} />
                      <FormField label="Eye color" placeholder="Enter eye color..." value={formData.eyeColor} onChange={(v) => handleChange('eyeColor', v)} />
                    </div>
                    <div className="flex justify-between items-end mb-6">
                      <div className="w-[calc(25%-1.5rem)]">
                        <FormField label="Hair color" placeholder="Enter Hair color..." value={formData.hairColor} onChange={(v) => handleChange('hairColor', v)} />
                      </div>
                    </div>

                    {/* Required Custom Fields */}
                    {customFieldsList.filter(f => !formConfig?.customImageFields?.includes(f.label)).length > 0 && (
                      <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-[11px] font-black text-gray-900 mb-6 group-hover:text-green-600 transition-colors uppercase tracking-wider">Required Custom Fields</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                          {customFieldsList.map((field, idx) => {
                            if (formConfig?.customImageFields?.includes(field.label)) return null;
                            return (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-800 tracking-wide">{field.label}</label>
                                <input 
                                  type="text" 
                                  placeholder={`Enter ${field.label}...`}
                                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                  value={field.value}
                                  onChange={e => {
                                    const newList = [...customFieldsList];
                                    newList[idx].value = e.target.value;
                                    setCustomFieldsList(newList);
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Section>

                  {/* Bottom Image Fields (Signatures, Fingerprints, Custom Images) */}
                  <div className="grid grid-cols-4 gap-6 pt-4 pb-12">
                    {/* Standard Image Fields */}
                    {STANDARD_IMAGE_FIELDS.map(field => {
                      if (!formConfig?.enabledImageFields?.includes(field)) return null;
                      
                      const key = field === 'Signature' ? 'signature' : 
                                  field === 'Fingerprint' ? 'fingerprint' : 
                                  field === 'Division Logo' ? 'divisionLogo' : '';
                      
                      if (!key) return null;

                      return (
                        <div key={field} className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-800 tracking-wide uppercase">{field}</label>
                          {(() => {
                            const imageVal = formData[key as keyof typeof initialFormState] as string;
                            return (
                              <div 
                                onClick={() => document.getElementById(`upload-${key}`)?.click()}
                                className={`rounded-lg h-32 relative overflow-hidden cursor-pointer group transition-all duration-200 ${imageVal ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50'}`}
                              >
                                {imageVal ? (
                                  <>
                                    <img src={imageVal} alt={field} className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                      <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-colors">
                                        <ImageIcon size={12} /> Change {field}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-gray-400 group-hover:text-green-600 group-hover:scale-110 transition-all">
                                      <Plus size={16} />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 group-hover:text-green-700">Add {field}</span>
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  id={`upload-${key}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (f) => handleChange(key as keyof typeof initialFormState, f.target?.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* Custom Image Fields */}
                    {formConfig?.customImageFields?.map(field => {
                      if (!formConfig?.enabledImageFields?.includes(field)) return null;

                      const customFieldObj = customFieldsList.find(f => f.label === field);
                      const imageValue = customFieldObj?.value || '';

                      return (
                        <div key={field} className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-800 tracking-wide uppercase">{field}</label>
                          <div 
                            onClick={() => document.getElementById(`upload-custom-${field.replace(/\s+/g, '-')}`)?.click()}
                            className={`rounded-lg h-32 relative overflow-hidden cursor-pointer group transition-all duration-200 ${imageValue ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50'}`}
                          >
                            {imageValue ? (
                              <>
                                <img src={imageValue} alt={field} className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                  <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-colors">
                                    <ImageIcon size={12} /> Change {field}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-gray-400 group-hover:text-green-600 group-hover:scale-110 transition-all">
                                  <Plus size={16} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-500 group-hover:text-green-700">Add {field}</span>
                              </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              id={`upload-custom-${field.replace(/\s+/g, '-')}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (f) => {
                                    const newList = [...customFieldsList];
                                    const existingIdx = newList.findIndex(x => x.label === field);
                                    if (existingIdx >= 0) {
                                      newList[existingIdx].value = f.target?.result as string;
                                    } else {
                                      newList.push({ label: field, value: f.target?.result as string });
                                    }
                                    setCustomFieldsList(newList);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


