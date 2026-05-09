import React from 'react';
import { Plus, Sparkles, Globe, Star, Clock } from 'lucide-react';
import { SavedDesign } from './store';

export const Dashboard = ({ onSelect }: { onSelect: (design: SavedDesign | null) => void }) => {
  const savedDesigns = JSON.parse(localStorage.getItem('saved_id_designs') || '[]');
  
  const officialTemplates = savedDesigns.filter((d: any) => d.isGlobal);
  const myRecent = savedDesigns.filter((d: any) => !d.isGlobal).slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] px-10 py-12 custom-scrollbar">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Get Started</h1>
          <p className="text-gray-500 font-medium mt-2 text-lg">Pick a professional template or start from scratch.</p>
        </header>

        {/* Section: Official Templates */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-2 bg-green-100 text-green-600 rounded-xl">
               <Globe size={20} strokeWidth={2.5} />
             </div>
             <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest text-sm">Official ID Templates</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {/* Blank Canvas Option */}
            <button 
              onClick={() => onSelect(null)}
              className="flex flex-col group"
            >
              <div className="aspect-[3.5/2] w-full bg-white border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all duration-500 group-hover:border-green-500 group-hover:bg-green-50/30 group-hover:shadow-[0_20px_50px_rgba(34,197,94,0.15)] group-hover:-translate-y-2">
                 <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 transition-all duration-500 group-hover:bg-white group-hover:text-green-600 group-hover:shadow-lg group-hover:rotate-90">
                    <Plus size={32} strokeWidth={2.5} />
                 </div>
                 <span className="text-sm font-black text-gray-800 tracking-tight transition-colors group-hover:text-green-700">Blank Canvas</span>
              </div>
            </button>

            {/* Global Templates */}
            {officialTemplates.map((design: any) => (
              <button 
                key={design.id}
                onClick={() => onSelect(design)}
                className="flex flex-col group text-left"
              >
                <div className="aspect-[3.5/2] w-full bg-white border border-gray-100 rounded-[32px] overflow-hidden transition-all duration-500 group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] group-hover:border-green-500 group-hover:-translate-y-2 relative">
                   <img src={design.thumbnailFront} className="w-full h-full object-cover p-2" alt={design.name} />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
                   <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Sparkles size={14} className="text-green-500 fill-green-500" />
                   </div>
                </div>
                <div className="mt-4 px-2">
                   <h3 className="text-sm font-black text-gray-900 group-hover:text-green-600 transition-colors truncate">{design.name}</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Official Design</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section: Your Recent Work */}
        {myRecent.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                 <Clock size={20} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest text-sm">Your Recent Designs</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {myRecent.map((design: any) => (
                <button 
                  key={design.id}
                  onClick={() => onSelect(design)}
                  className="flex flex-col group text-left"
                >
                  <div className="aspect-[3.5/2] w-full bg-white border border-gray-100 rounded-[32px] overflow-hidden transition-all duration-500 group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] group-hover:border-amber-500 group-hover:-translate-y-2 relative">
                    <img src={design.thumbnailFront} className="w-full h-full object-cover p-2" alt={design.name} />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 px-2">
                    <h3 className="text-sm font-black text-gray-900 group-hover:text-amber-600 transition-colors truncate">{design.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Modified {new Date(design.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
