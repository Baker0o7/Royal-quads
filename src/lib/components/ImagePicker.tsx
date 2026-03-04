import React, { useRef, useState } from 'react';
import { Camera, FolderOpen, X, ImageIcon } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function ImagePicker({ value, onChange, className = '' }: Props) {
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

  /* ── Preview state ── */
  if (value) {
    return (
      <div className={`relative rounded-xl overflow-hidden ${className}`}
        style={{ border: '1px solid var(--t-border)' }}>
        <img src={value} alt="Selected" className="w-full h-36 object-cover" />

        {/* Remove button */}
        <button type="button" onClick={() => onChange('')}
          className="absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-opacity hover:opacity-80"
          style={{ background: 'rgba(0,0,0,0.65)', color: 'white' }}>
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Re-pick overlay buttons */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
          <button type="button" onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.65)', color: 'white' }}>
            <FolderOpen className="w-3 h-3" /> Gallery
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.65)', color: 'white' }}>
            <Camera className="w-3 h-3" /> Camera
          </button>
        </div>

        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      </div>
    );
  }

  /* ── Empty state ── */
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed transition-all duration-200 ${className}`}
      style={{
        borderColor: dragging ? 'var(--t-accent)' : 'var(--t-border)',
        background: dragging
          ? 'color-mix(in srgb, var(--t-accent) 6%, transparent)'
          : 'color-mix(in srgb, var(--t-bg2) 60%, transparent)',
      }}>

      {/* Icon + label */}
      <div className="flex flex-col items-center gap-2 py-5 px-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--t-border) 60%, transparent)' }}>
          <ImageIcon className="w-5 h-5" style={{ color: 'var(--t-muted)' }} />
        </div>
        <p className="text-xs font-semibold" style={{ color: 'var(--t-text)' }}>Add photo</p>
      </div>

      {/* Pick buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button type="button" onClick={() => galleryRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--t-btn-bg)', color: 'var(--t-btn-text)' }}>
          <FolderOpen className="w-3.5 h-3.5" /> Internal Storage
        </button>
        <button type="button" onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-80"
          style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>
          <Camera className="w-3.5 h-3.5" /> Take Photo
        </button>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
    </div>
  );
}
