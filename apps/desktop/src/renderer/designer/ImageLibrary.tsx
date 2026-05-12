import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDesignerStore } from './store';
import { fabric } from 'fabric';
import { 
  X, 
  Upload, 
  Folder, 
  Search, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Camera, 
  Library,
  MoreVertical,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

export const ImageLibraryModal = () => {
  const { 
    isImageLibraryOpen, 
    setIsImageLibraryOpen, 
    canvas, 
    uploadedImages, 
    addUploadedImage,
    libraryMode,
    setLibraryMode,
    selectedObject
  } = useDesignerStore();
  const [activeFolder, setActiveFolder] = React.useState('My Images');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isImageLibraryOpen) return null;

  const addImageToCanvas = (url: string) => {
    if (!canvas) return;

    fabric.Image.fromURL(url, (img) => {
      if (libraryMode === 'replace' && selectedObject) {
        // If it's a placeholder (group), we remove it and add the image at the same position
        const { left, top, width, height, scaleX, scaleY } = selectedObject;
        
        // Calculate scale to fit original bounds
        const targetWidth = (width || 100) * (scaleX || 1);
        img.scaleToWidth(targetWidth);
        img.set({
          left,
          top,
          // @ts-ignore
          placeholder: selectedObject.placeholder,
          // @ts-ignore
          variableType: 'image'
        });

        canvas.remove(selectedObject);
        canvas.add(img);
        canvas.setActiveObject(img);
      } else {
        img.scaleToWidth(150);
        canvas.add(img);
        canvas.setActiveObject(img);
      }
      
      canvas.renderAll();
      setIsImageLibraryOpen(false);
      setLibraryMode('add'); // Reset
    }, { crossOrigin: 'anonymous' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (f) => {
          const data = f.target?.result as string;
          addUploadedImage(data);
        };
        reader.readAsDataURL(file);
      });
      setActiveFolder('My Images');
    }
  };

  const folders = [
    { name: 'My Images', count: uploadedImages.length, icon: <Folder size={16} /> },
    { name: 'Stock Images', count: 5, icon: <Folder size={16} /> },
  ];

  const stockImages = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=533&fit=crop'
  ];

  const currentImages = activeFolder === 'My Images' ? uploadedImages : stockImages;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        multiple
        className="hidden" 
      />
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl  flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between ">
          <h2 className="text-white font-bold text-lg">My Images</h2>
          <button 
            onClick={() => setIsImageLibraryOpen(false)}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-72 border-r border-gray-100 p-6 space-y-6 bg-gray-50/30">
            <div className="flex items-center justify-between text-gray-900">
              <span className="text-[11px] font-black uppercase tracking-wider">My Folders</span>
            </div>

            <div className="space-y-1">
              {folders.map(folder => (
                <button
                  key={folder.name}
                  onClick={() => setActiveFolder(folder.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${activeFolder === folder.name ? 'bg-green-100/50 text-green-700 ring-1 ring-green-200' : 'text-gray-900 hover:bg-white '}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeFolder === folder.name ? 'text-green-600' : 'text-gray-900'}>{folder.icon}</span>
                    <span>{folder.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeFolder === folder.name ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {folder.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Library View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* Toolbar */}
            <div className="p-6 border-bottom border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold  hover:bg-green-700 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  <span>Upload files</span>
                </button>
              </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {currentImages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-900 gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <Upload size={32} />
                  </div>
                  <p className="text-sm font-bold">No images found in this folder</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-green-600 text-xs font-black uppercase hover:underline"
                  >
                    Upload your first image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-6">
                  {currentImages.map((url, i) => (
                    <div key={i} className="group relative" onClick={() => addImageToCanvas(url)}>
                      <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-green-500 transition-all   cursor-pointer">
                        <img 
                          src={url} 
                          alt="Asset" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <button className="p-2 bg-white rounded-full text-green-600  hover:scale-110 transition-transform">
                              <Plus size={20} />
                           </button>
                        </div>
                      </div>
                      <div className="mt-3 px-1">
                        <p className="text-[11px] font-bold text-gray-900 truncate">
                          {activeFolder === 'My Images' ? `My Upload ${i + 1}` : `Stock Asset ${i + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const AddImageDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { setIsImageLibraryOpen, canvas, addUploadedImage } = useDesignerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (f) => {
          const data = f.target?.result as string;
          addUploadedImage(data);
          
          // Only add the first image to canvas directly to prevent clutter
          if (index === 0) {
            fabric.Image.fromURL(data, (img) => {
              img.scaleToWidth(150);
              canvas?.add(img);
              canvas?.setActiveObject(img);
              onClose();
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
      <div className="bg-white rounded-2xl  overflow-hidden w-[500px] border border-white/50 animate-in zoom-in-95 duration-200">
        <div className="bg-green-600 px-6 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm">Add Image</h3>
          <button onClick={onClose} className="text-white hover:opacity-80"><X size={18} /></button>
        </div>
        <div className="p-8 flex items-center justify-center gap-4 bg-gray-50/50">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-4 border-2 border-green-500 rounded-xl text-green-600 font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Upload
          </button>
          <button 
            onClick={() => { setIsImageLibraryOpen(true); onClose(); }}
            className="flex-1 py-4 border-2 border-green-500 rounded-xl text-green-600 font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
          >
            <Library size={18} />
            Library
          </button>
          <button className="flex-1 py-4 border-2 border-green-500 rounded-xl text-green-600 font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
            <Camera size={18} />
            Webcam
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
