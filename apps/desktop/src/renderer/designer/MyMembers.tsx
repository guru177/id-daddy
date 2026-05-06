import React, { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useDesignerStore } from './store';
import { generatePreviews, VdpResult } from './VdpEngine';

export const MyMembers = () => {
  const { 
    savedDesigns, 
    members, 
    activeTemplateId, 
    previewResults, 
    setPreviewResults,
    isGeneratingPreviews,
    setIsGeneratingPreviews 
  } = useDesignerStore();

  useEffect(() => {
    // Automatically use the active template or the most recent design if none is selected
    const designId = activeTemplateId || (savedDesigns.length > 0 ? savedDesigns[0].id : null);
    
    if (!designId || members.length === 0) {
      setPreviewResults([]);
      return;
    }

    // If we already have results for all members, don't re-generate
    if (previewResults.length >= members.length) {
      return;
    }

    // Clear partial results to ensure a fresh full run if something changed
    if (previewResults.length > 0 && previewResults.length < members.length) {
      setPreviewResults([]);
    }

    const design = savedDesigns.find(d => d.id === designId);
    if (!design) return;

    let isMounted = true;
    setIsGeneratingPreviews(true);
    const controller = new AbortController();
    
    // Batch UI updates to prevent React from choking on large lists
    let updateBuffer: VdpResult[] = [];
    let processedCount = 0;

    generatePreviews(design, members, (result) => {
      if (!isMounted) return;
      
      updateBuffer.push(result);
      processedCount++;

      // Update UI every 3 results or at the very end
      if (updateBuffer.length >= 3 || processedCount === members.length) {
        const batch = [...updateBuffer];
        updateBuffer = [];
        
        useDesignerStore.setState(state => ({
          previewResults: [...state.previewResults, ...batch]
        }));
      }
    }, controller.signal).then(() => {
      if (isMounted) {
        setIsGeneratingPreviews(false);
      }
    });

    return () => { 
      isMounted = false; 
      controller.abort();
    };
  }, [activeTemplateId, members, savedDesigns]);

  const handleExportPDF = () => {
    alert("Batch PDF Export will be integrated next!");
  };

  const handleExportPNG = () => {
    alert("Batch PNG Export will be integrated next!");
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-800">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-gray-900">Member Previews</h1>
          {isGeneratingPreviews && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-wider">Rendering {previewResults.length}/{members.length}</span>
            </div>
          )}
          {savedDesigns.length > 0 && (
            <>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Template:</span>
                <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  {savedDesigns.find(d => d.id === (activeTemplateId || savedDesigns[0].id))?.name}
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex gap-3">
          <button onClick={handleExportPDF} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
            <Download size={16} /> Export All (PDF)
          </button>
          <button onClick={handleExportPNG} className="bg-[#34a853] hover:bg-green-600 text-white px-6 py-2 rounded font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
            <Download size={16} /> Export All (PNGs)
          </button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        {!activeTemplateId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
             <p className="font-bold">Select a template from the top dropdown to generate previews.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
             <p className="font-bold">No members found. Go to the Add Member tab to add data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-12">
            {previewResults.map((preview, index) => {
              const member = members.find(m => m.id === preview.memberId);
              return (
                <div key={preview.memberId} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden shrink-0">
                       {member?.profileImage && <img src={member.profileImage} alt="" className="w-full h-full object-cover" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-gray-900 truncate">{member?.firstName} {member?.lastName}</p>
                       <p className="text-xs text-gray-500 truncate">{member?.department || 'No Department'}</p>
                     </div>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4">
                    <div className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200">
                      <img src={preview.front} alt="Front Preview" className="w-full h-auto object-contain bg-white" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-[10px] font-black text-white rounded uppercase tracking-widest">Front</div>
                    </div>
                    
                    <div className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200">
                      <img src={preview.back} alt="Back Preview" className="w-full h-auto object-contain bg-white" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-[10px] font-black text-white rounded uppercase tracking-widest">Back</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
