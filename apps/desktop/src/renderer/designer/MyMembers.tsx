import React, { useState, useEffect } from 'react';
import { Download, Loader2, X, Eye, FileDown, Image as ImageIcon, Search } from 'lucide-react';
import { useDesignerStore } from './store';
import { generatePreviews, VdpResult, generateSingleHighRes } from './VdpEngine';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

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

  const [selectedHighRes, setSelectedHighRes] = useState<{ member: any, design: any } | null>(null);
  const [highResImages, setHighResImages] = useState<{ front: string, back: string } | null>(null);
  const [isGeneratingHighRes, setIsGeneratingHighRes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState<{ active: boolean, current: number, total: number, type: 'PDF' | 'PNG' | null }>({ active: false, current: 0, total: 0, type: null });

  const filteredPreviews = previewResults.filter((preview) => {
    if (!searchQuery) return true;
    const member = members.find(m => m.id === preview.memberId);
    if (!member) return false;
    const query = searchQuery.toLowerCase();
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
    const department = (member.department || '').toLowerCase();
    return fullName.includes(query) || department.includes(query);
  });

  useEffect(() => {
    if (!selectedHighRes) {
      setHighResImages(null);
      return;
    }
    let isMounted = true;
    setIsGeneratingHighRes(true);
    
    // Use multiplier 4 for ultra-high resolution (~1200 PPI, >1.5MB files)
    generateSingleHighRes(selectedHighRes.design, selectedHighRes.member, 4).then((res) => {
      if (isMounted) {
        setHighResImages(res);
        setIsGeneratingHighRes(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedHighRes]);

  const downloadImage = (dataUrl: string, name: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHighResPNGs = () => {
    if (!highResImages || !selectedHighRes) return;
    const { member } = selectedHighRes;
    const nameStr = `${member.firstName}_${member.lastName}`.replace(/\s+/g, '_');
    downloadImage(highResImages.front, `${nameStr}_Front_1200PPI.png`);
    downloadImage(highResImages.back, `${nameStr}_Back_1200PPI.png`);
  };

  const downloadHighResPDF = () => {
    if (!highResImages || !selectedHighRes) return;
    const { design, member } = selectedHighRes;
    const nameStr = `${member.firstName}_${member.lastName}`.replace(/\s+/g, '_');
    
    // CR80 ID Card dimensions: ~86mm x ~54mm
    const isHorizontal = design.config.orientation === 'horizontal';
    const cardWidth = isHorizontal ? 86 : 54;
    const cardHeight = isHorizontal ? 54 : 86;
    
    const doc = new jsPDF({
      orientation: isHorizontal ? 'l' : 'p',
      unit: 'mm',
      format: [cardWidth, cardHeight]
    });
    
    doc.addImage(highResImages.front, 'PNG', 0, 0, cardWidth, cardHeight);
    
    doc.addPage();
    doc.addImage(highResImages.back, 'PNG', 0, 0, cardWidth, cardHeight);
    
    doc.save(`${nameStr}_ID_Card_1200PPI.pdf`);
  };

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

  const handleExportPDF = async () => {
    const design = savedDesigns.find(d => d.id === (activeTemplateId || savedDesigns[0]?.id));
    if (!design || members.length === 0) return;

    setIsExporting({ active: true, current: 0, total: members.length, type: 'PDF' });
    const zip = new JSZip();

    const isHorizontal = design.config.orientation === 'horizontal';
    const cardWidth = isHorizontal ? 86 : 54;
    const cardHeight = isHorizontal ? 54 : 86;

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      setIsExporting(prev => ({ ...prev, current: i + 1 }));
      
      // Use multiplier 4 for ultra-high quality PDF images
      const res = await generateSingleHighRes(design, member, 4);
      
      const doc = new jsPDF({
        orientation: isHorizontal ? 'l' : 'p',
        unit: 'mm',
        format: [cardWidth, cardHeight]
      });
      
      doc.addImage(res.front, 'PNG', 0, 0, cardWidth, cardHeight);
      doc.addPage();
      doc.addImage(res.back, 'PNG', 0, 0, cardWidth, cardHeight);
      
      const pdfBlob = doc.output('blob');
      const nameStr = `${member.firstName || 'User'}_${member.lastName || i}`.replace(/\s+/g, '_');
      zip.file(`${nameStr}_ID_Card.pdf`, pdfBlob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ID_Cards_PDF_Batch.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsExporting({ active: false, current: 0, total: 0, type: null });
  };

  const handleExportPNG = async () => {
    const design = savedDesigns.find(d => d.id === (activeTemplateId || savedDesigns[0]?.id));
    if (!design || members.length === 0) return;

    setIsExporting({ active: true, current: 0, total: members.length, type: 'PNG' });
    const zip = new JSZip();

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      setIsExporting(prev => ({ ...prev, current: i + 1 }));
      
      // Use multiplier 4 for ultra-high quality PNG exports
      const res = await generateSingleHighRes(design, member, 4);
      
      const nameStr = `${member.firstName || 'User'}_${member.lastName || i}`.replace(/\s+/g, '_');
      const folder = zip.folder(nameStr);
      
      if (folder) {
        folder.file(`${nameStr}_Front.png`, res.front.split(',')[1], { base64: true });
        folder.file(`${nameStr}_Back.png`, res.back.split(',')[1], { base64: true });
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ID_Cards_PNG_Batch.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsExporting({ active: false, current: 0, total: 0, type: null });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-900 font-medium">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between gap-8 shrink-0 sticky top-0 z-10  overflow-hidden">
        <div className="flex items-center gap-6 min-w-0">
          <div className="flex items-center gap-4 shrink-0">
            <h1 className="text-xl font-black text-gray-900 shrink-0">Member Previews</h1>
            {isGeneratingPreviews && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100  animate-in fade-in zoom-in duration-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Rendering {previewResults.length}/{members.length}</span>
              </div>
            )}
          </div>
          
          <div className="relative w-48 xl:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/5 transition-all placeholder:text-gray-900"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          {savedDesigns.length > 0 && (
            <div className="flex items-center gap-2.5 bg-stone-50/50 px-4 py-2 rounded-xl border border-stone-100">
              <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Template:</span>
              <span className="text-xs font-black text-[#1a5d1a]">
                {savedDesigns.find(d => d.id === (activeTemplateId || savedDesigns[0].id))?.name}
              </span>
            </div>
          )}

          <div className="h-8 w-px bg-gray-200 mx-1" />
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportPDF} 
              disabled={isExporting.active}
              className="h-11 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all  flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300"
            >
              {isExporting.active && isExporting.type === 'PDF' ? (
                <><Loader2 size={16} className="animate-spin text-green-600" /> {isExporting.current}/{isExporting.total} PDFs</>
              ) : (
                <><Download size={16} /> Export All (PDF)</>
              )}
            </button>
            <button 
              onClick={handleExportPNG} 
              disabled={isExporting.active}
              className="h-11 bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] hover:scale-[1.02] active:scale-[0.98] text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all   flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting.active && isExporting.type === 'PNG' ? (
                <><Loader2 size={16} className="animate-spin" /> {isExporting.current}/{isExporting.total} Folders</>
              ) : (
                <><Download size={16} /> Export All (PNGs)</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        {!activeTemplateId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-900 gap-4">
             <p className="font-bold">Select a template from the top dropdown to generate previews.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-900 gap-4">
             <p className="font-bold">No members found. Go to the Add Member tab to add data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 pb-12">
            {filteredPreviews.length === 0 && searchQuery ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-900">
                <p className="font-bold">No members match your search.</p>
              </div>
            ) : null}
            {filteredPreviews.map((preview, index) => {
              const member = members.find(m => m.id === preview.memberId);
              return (
                <div key={preview.memberId} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden   transition-all duration-300">
                  <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                     <div className="flex items-center gap-3 min-w-0">
                       <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden shrink-0">
                         {member?.profileImage && <img src={member.profileImage} alt="" className="w-full h-full object-cover" />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-black text-gray-900 truncate">{member?.firstName} {member?.lastName}</p>
                         <p className="text-xs text-gray-900 truncate">{member?.department || 'No Department'}</p>
                       </div>
                     </div>
                     <button
                       onClick={() => {
                         const design = savedDesigns.find(d => d.id === (activeTemplateId || savedDesigns[0].id));
                         if (design && member) {
                           setSelectedHighRes({ member, design });
                         }
                       }}
                       className="px-3 py-1.5 flex items-center gap-1.5 bg-white text-xs font-bold text-gray-900 hover:text-green-600 hover:bg-green-50 rounded-lg  border border-gray-200 transition-all shrink-0"
                       title="Download High Resolution"
                     >
                       <Download size={14} />
                       Download
                     </button>
                  </div>
                  
                  <div className="p-4 flex flex-row gap-4">
                    <div className="flex-1 relative group rounded-xl overflow-hidden  border border-gray-100 bg-stone-50">
                      <img src={preview.front} alt="Front Preview" className="w-full h-auto max-h-[300px] object-contain mx-auto" />
                      <div className="absolute top-2 left-2 px-3 py-1 bg-black/50 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.1em] rounded-full shadow-lg border border-white/10 z-10">Front</div>
                    </div>
                    
                    <div className="flex-1 relative group rounded-xl overflow-hidden  border border-gray-100 bg-stone-50">
                      <img src={preview.back} alt="Back Preview" className="w-full h-auto max-h-[300px] object-contain mx-auto" />
                      <div className="absolute top-2 left-2 px-3 py-1 bg-black/50 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.1em] rounded-full shadow-lg border border-white/10 z-10">Back</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4K Modal Viewer */}
      {selectedHighRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setSelectedHighRes(null)} />
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-stone-100 rounded-[32px]  flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-white px-8 py-5 flex items-center justify-between border-b border-gray-200 shrink-0  z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                  {selectedHighRes.member?.profileImage && <img src={selectedHighRes.member.profileImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{selectedHighRes.member.firstName} {selectedHighRes.member.lastName}</h2>
                  <p className="text-sm text-gray-900 font-bold uppercase tracking-widest">{selectedHighRes.member.department || 'ID Card'} • 1200 PPI ULTRA HIGH RESOLUTION</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadHighResPNGs}
                  disabled={!highResImages}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 hover:text-green-600 transition-all disabled:opacity-50"
                >
                  <ImageIcon size={18} /> Download PNGs
                </button>
                <button
                  onClick={downloadHighResPDF}
                  disabled={!highResImages}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600   transition-all disabled:opacity-50"
                >
                  <FileDown size={18} /> Download PDF
                </button>
                <div className="w-px h-8 bg-gray-200 mx-2" />
                <button onClick={() => setSelectedHighRes(null)} className="p-2.5 text-gray-900 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-8 bg-stone-100 flex justify-center items-center min-h-0 overflow-hidden">
              {isGeneratingHighRes ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-900">
                  <Loader2 size={40} className="animate-spin text-green-500" />
                  <p className="font-bold text-lg text-gray-900 animate-pulse">Rendering Ultra HD Textures...</p>
                </div>
              ) : highResImages ? (
                <div className="flex flex-row w-full h-full max-w-5xl gap-12 items-center justify-center">
                  <div className="flex flex-col gap-4 h-full min-h-0 flex-1 justify-center items-center w-full">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest text-center shrink-0">Front Side</span>
                    <div className="relative min-h-0 flex shrink w-full h-full justify-center items-center">
                      <img src={highResImages.front} alt="Ultra HD Front" className="max-w-full max-h-full object-contain rounded-[24px]  border-4 border-white bg-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 h-full min-h-0 flex-1 justify-center items-center w-full">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest text-center shrink-0">Back Side</span>
                    <div className="relative min-h-0 flex shrink w-full h-full justify-center items-center">
                      <img src={highResImages.back} alt="Ultra HD Back" className="max-w-full max-h-full object-contain rounded-[24px]  border-4 border-white bg-white" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
