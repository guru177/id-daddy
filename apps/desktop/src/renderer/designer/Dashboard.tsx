import React from 'react';
import { CreditCard, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  thumbnail: string;
}

const templates: Template[] = [
  { id: '1', name: 'Student ID', thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80' },
  { id: '2', name: 'Medical ID', thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173bdd99625?w=400&q=80' },
  { id: '3', name: 'Police ID', thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e443d1fe?w=400&q=80' },
  { id: '4', name: 'Press ID', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80' },
  { id: '5', name: 'Employee ID', thumbnail: 'https://images.unsplash.com/photo-1454165833767-6216839b2747?w=400&q=80' },
];

export const Dashboard = ({ onSelect }: { onSelect: (id: string | null) => void }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-10">
      <h1 className="text-xl font-bold text-gray-800 mb-8">Select a Design</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {/* Blank Canvas */}
        <button 
          onClick={() => onSelect(null)}
          className="flex flex-col group"
        >
          <div className="aspect-[3.5/2] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 transition-all group-hover:border-green-500 group-hover:shadow-lg">
             <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-colors group-hover:bg-green-50 group-hover:text-green-600">
                <Plus size={24} />
             </div>
             <span className="text-xs font-bold text-gray-600 group-hover:text-green-600">Blank Canvas</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
             <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white text-[8px] font-bold italic">ID</div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creator</span>
          </div>
        </button>

        {templates.map(t => (
          <button 
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="flex flex-col group"
          >
            <div className="aspect-[3.5/2] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all group-hover:border-green-500 group-hover:shadow-lg relative">
               <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
               <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center text-white text-[8px] font-bold italic">ID</div>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creator</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
