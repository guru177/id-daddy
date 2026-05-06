import React, { useState } from 'react';
import { Plus, ChevronUp, Image as ImageIcon } from 'lucide-react';

export const MyMembers = () => {
  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-y-auto custom-scrollbar text-gray-800">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <h1 className="text-lg font-black text-gray-900">Add Member</h1>
        <button className="bg-[#34a853] hover:bg-green-600 text-white px-8 py-2 rounded font-bold text-sm transition-colors shadow-sm">
          Save & Add New
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex gap-8 max-w-[1400px] mx-auto">
          
          {/* Left Column: Image Upload */}
          <div className="w-[300px] shrink-0">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center gap-6 border border-gray-100 shadow-sm">
              <div className="w-32 h-32 bg-gray-50 flex items-center justify-center rounded text-gray-200">
                <ImageIcon size={64} strokeWidth={1} />
              </div>
              <button className="bg-[#34a853] hover:bg-green-600 text-white px-6 py-1.5 rounded font-bold text-xs w-full transition-colors flex items-center justify-center gap-1">
                <Plus size={14} /> Add Image
              </button>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="flex-1 space-y-8">
            
            {/* General Info */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <FormField label="First Name" required placeholder="Enter First Name..." />
              <FormField label="Last Name" placeholder="Enter Last Name..." />
              <FormField label="Nickname" placeholder="Enter Nickname..." />
              <FormField label="Date of Birth" placeholder="Enter Date of Birth..." />
              <FormField label="Title" placeholder="Enter Title..." />
              <FormField label="ID number" placeholder="Enter ID number..." />
            </div>

            {/* Employment Details */}
            <Section title="Employment Details">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <FormField label="Employee ID" placeholder="Enter Employee ID..." />
                <FormField label="Department" placeholder="Enter Department..." />
                <FormField label="Hire Date" placeholder="Enter Hire Date..." />
                <FormField label="Issue Date" placeholder="Enter Issue Date..." />
                <FormField label="Expiration Date" placeholder="Enter Expiration Date..." />
              </div>
            </Section>

            {/* Contact Info & Addresses */}
            <Section title="Contact Info & Addresses">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <FormField label="Phone 1" placeholder="Enter Phone 1..." />
                <FormField label="Fax" placeholder="Enter Fax..." />
                <FormField label="Email" placeholder="Enter Email..." />
                <FormField label="Website" placeholder="Enter Website..." />
              </div>
              <div className="grid grid-cols-4 gap-x-8 gap-y-6 mt-6">
                <FormField label="Country" placeholder="Enter Country..." />
                <FormField label="Postal Code" placeholder="Enter Postal Code..." />
                <FormField label="State" placeholder="Enter State..." />
                <FormField label="City" placeholder="Enter City..." />
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-6">
                <FormField label="Street 1" placeholder="Enter Street 1..." />
                <FormField label="Street 2" placeholder="Enter Street 2..." />
              </div>
            </Section>

            {/* Additional Information */}
            <Section title="Additional Information">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
                <FormField label="Grade Level" placeholder="Enter Grade Level..." />
                <FormField label="Security Level" placeholder="Enter Security Level..." />
              </div>
              <div className="grid grid-cols-4 gap-x-8 gap-y-6 mb-6">
                <FormField label="Height" placeholder="Enter Height..." />
                <FormField label="Weight" placeholder="Enter Weight..." />
                <FormField label="Gender" placeholder="Enter Gender..." />
                <FormField label="Eye color" placeholder="Enter eye color..." />
              </div>
              <div className="flex justify-between items-end">
                <div className="w-[calc(25%-1.5rem)]">
                  <FormField label="Hair color" placeholder="Enter Hair color..." />
                </div>
                <button className="bg-[#34a853] hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold text-[11px] transition-colors flex items-center gap-1">
                  <Plus size={12} /> Add custom field
                </button>
              </div>
            </Section>

            {/* Bottom Special Fields */}
            <div className="grid grid-cols-4 gap-6 pt-4 pb-12">
              <div className="bg-white rounded-lg p-6 flex items-end justify-center h-32 border border-gray-100 shadow-sm">
                <button className="bg-[#34a853] hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold text-[11px] transition-colors flex items-center gap-1">
                  <Plus size={12} /> Add signature
                </button>
              </div>
              <div className="bg-white rounded-lg p-6 flex items-end justify-center h-32 border border-gray-100 shadow-sm">
                <button className="bg-[#34a853] hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold text-[11px] transition-colors flex items-center gap-1">
                  <Plus size={12} /> Add fingerprint
                </button>
              </div>
              <div className="bg-white rounded-lg p-6 flex items-end justify-center h-32 border border-gray-100 shadow-sm">
                <button className="bg-[#34a853] hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold text-[11px] transition-colors flex items-center gap-1">
                  <Plus size={12} /> Add division logo
                </button>
              </div>
              <div className="bg-white rounded-lg p-6 flex items-end justify-center h-32 border border-gray-100 shadow-sm">
                <button className="bg-[#34a853] hover:bg-green-600 text-white px-4 py-1.5 rounded font-bold text-[11px] transition-colors flex items-center gap-1">
                  <Plus size={12} /> Add custom Image field
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Form Field Subcomponent
const FormField = ({ label, placeholder, required = false }: { label: string, placeholder?: string, required?: boolean }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-gray-800 tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type="text" 
      placeholder={placeholder}
      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
    />
  </div>
);

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
