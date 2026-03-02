import { useRef, useState } from 'react';
import { Camera, FolderOpen, X, ImageIcon } from 'lucide-react';
import { cn } from '../utils';

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function ImagePicker({ value, onChange, className }: ImagePickerProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        const scale  = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  if (value) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden border border-[#c9b99a]/20 dark:border-[#c9b99a]/10', className)}>
        <img src={value} alt="Selected" className="w-full h-36 object-cover" />
        <button type="button" onClick={() => onChange('')}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
          <X className="w-3.5 h-3.5" />
        </button>
        {/* Re-pick buttons */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
          <button type="button" onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-semibold hover:bg-black/80 transition-colors backdrop-blur-sm">
            <FolderOpen className="w-3 h-3" /> Gallery
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/60 text-white text-[10px] font-semibold hover:bg-black/80 transition-colors backdrop-blur-sm">
            <Camera className="w-3 h-3" /> Camera
          </button>
        </div>
        {/* Gallery: no capture */}
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        {/* Camera: capture only */}
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'rounded-xl border-2 border-dashed transition-all duration-200',
        dragging ? 'border-[#c9972a] bg-[#c9972a]/5' : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/15 bg-[#f5f0e8]/40 dark:bg-[#1a1612]/40',
        className
      )}>
      {/* Icon header */}
      <div className="flex flex-col items-center gap-2 py-5 px-4">
        <div className="w-10 h-10 rounded-xl bg-[#c9b99a]/15 dark:bg-[#c9b99a]/8 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[#7a6e60] dark:text-[#a09070]" />
        </div>
        <p className="text-xs font-semibold text-[#1a1612] dark:text-[#f5f0e8]">Add photo</p>
      </div>
      {/* Two pick buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button type="button" onClick={() => galleryRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1a1612] dark:bg-[#f5f0e8]/10 text-white dark:text-[#f5f0e8] text-xs font-semibold hover:bg-[#2d2318] transition-colors">
          <FolderOpen className="w-3.5 h-3.5" /> Internal Storage
        </button>
        <button type="button" onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#c9b99a]/30 dark:border-[#c9b99a]/15 text-[#7a6e60] dark:text-[#a09070] text-xs font-semibold hover:border-[#c9972a]/50 hover:text-[#c9972a] transition-colors">
          <Camera className="w-3.5 h-3.5" /> Take Photo
        </button>
      </div>
      {/* Inputs */}
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
    </div>
  );
}
