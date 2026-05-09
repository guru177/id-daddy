import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { SavedDesign } from './store';

export const Dashboard = ({ onSelect }: { onSelect: (design: SavedDesign | null) => void }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] px-6 py-10">
      <div className="w-full">
        <header className="mb-10">

          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Select a Design</h1>
          <p className="text-gray-500 font-medium mt-2">Start with a fresh canvas or pick from your saved templates.</p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
          {/* Elegant Blank Canvas */}
          <button 
            onClick={() => onSelect(null)}
            className="flex flex-col group relative"
          >
            <div className="aspect-[3.5/2] w-full bg-white border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all duration-500 group-hover:border-green-500 group-hover:bg-green-50/30 group-hover:shadow-[0_20px_50px_rgba(34,197,94,0.15)] group-hover:-translate-y-2">
               <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 transition-all duration-500 group-hover:bg-white group-hover:text-green-600 group-hover:shadow-lg group-hover:rotate-90">
                  <Plus size={32} strokeWidth={2.5} />
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-sm font-black text-gray-800 tracking-tight transition-colors group-hover:text-green-700">Blank Canvas</span>
                 <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Sparkles size={10} className="text-green-500 fill-green-500" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Start Fresh</span>
                 </div>
               </div>
            </div>
            
          </button>

          {/* This grid is ready for user saved designs later */}
        </div>
      </div>
    </div>
  );
};


