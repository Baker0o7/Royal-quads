import { useRef, useState } from 'react';
import { Camera, X, ImageIcon } from 'lucide-react';
import { cn } from '../utils';

interface ImagePickerProps {
  value: string;          // base64 or URL or ''
  onChange: (val: string) => void;
  className?: string;
}

export function ImagePicker({ value, onChange, className }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      // Resize large images to save storage space
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so same file can be picked again
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
        <img src={value} alt="Quad" className="w-full h-32 object-cover" />
        <button type="button" onClick={() => onChange('')}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm">
          <X className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 text-white text-[10px] font-semibold hover:bg-black/70 transition-colors backdrop-blur-sm">
          <Camera className="w-3 h-3" /> Change
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
        dragging
          ? 'border-[#c9972a] bg-[#c9972a]/5'
          : 'border-[#c9b99a]/30 dark:border-[#c9b99a]/15 bg-[#f5f0e8]/40 dark:bg-[#1a1612]/40 hover:border-[#c9972a]/50 hover:bg-[#c9972a]/3',
        className
      )}>
      <div className="w-10 h-10 rounded-xl bg-[#c9b99a]/15 dark:bg-[#c9b99a]/8 flex items-center justify-center">
        <ImageIcon className="w-5 h-5 text-[#7a6e60] dark:text-[#a09070]" />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[#1a1612] dark:text-[#f5f0e8]">Tap to upload photo</p>
        <p className="text-[10px] font-mono text-[#7a6e60] dark:text-[#a09070] mt-0.5">JPG, PNG, WEBP</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
    </div>
  );
}
