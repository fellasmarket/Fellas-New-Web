import React, { useState, useRef, useEffect } from 'react';

interface ProductImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  productName?: string;
  label?: string;
  showToast?: (msg: string) => void;
  compact?: boolean;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  value,
  onChange,
  productName = 'Producto',
  label = 'Foto del Producto',
  showToast,
  compact = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    originalSize?: number;
    compressedSize?: number;
    savingsPercent?: number;
    storage?: string;
  } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    r2Configured: boolean;
    bucket: string | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Cloudflare R2 status once
  useEffect(() => {
    fetch('/api/admin/storage-status')
      .then(res => res.json())
      .then(data => {
        setStorageStatus({
          r2Configured: !!data.r2Configured,
          bucket: data.bucket || null
        });
      })
      .catch(() => {
        setStorageStatus(null);
      });
  }, []);

  // Format bytes for human readable display
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Upload file from PC to server (with Sharp compression and Cloudflare R2)
  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast?.('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.)');
      return;
    }

    setIsUploading(true);
    setUploadStats(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (productName) {
        formData.append('productName', productName);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      onChange(data.url);
      setUploadStats({
        originalSize: data.originalSize || file.size,
        compressedSize: data.compressedSize,
        savingsPercent: data.savingsPercent,
        storage: data.storage === 'cloudflare-r2' ? 'Cloudflare R2' : 'Almacenamiento Local'
      });

      if (data.storage === 'cloudflare-r2') {
        showToast?.(`¡Imagen comprimida (${data.savingsPercent || 0}% más ligera) y guardada en Cloudflare R2!`);
      } else {
        showToast?.(`¡Imagen comprimida (${data.savingsPercent || 0}% más ligera) y lista!`);
      }
    } catch (err: any) {
      console.error('Error subiendo imagen desde PC:', err);
      showToast?.(`Error al subir imagen: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
    // reset input so the same file can be chosen again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  // Paste image from clipboard support (Ctrl + V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processAndUploadFile(file);
          break;
        }
      }
    }
  };

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      {/* Header with storage badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
          <i className="fa-solid fa-camera text-[#ffd025]"></i>
          <span>{label}</span>
        </label>
        
        {storageStatus && (
          <span 
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
              storageStatus.r2Configured 
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50' 
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
            title={storageStatus.r2Configured ? `Bucket: ${storageStatus.bucket || 'Cloudflare R2'}` : 'Configura credenciales R2 en .env para sincronizar con Cloudflare'}
          >
            <i className={`fa-solid ${storageStatus.r2Configured ? 'fa-cloud text-amber-400' : 'fa-hard-drive text-gray-400'}`}></i>
            <span>{storageStatus.r2Configured ? 'Cloudflare R2' : 'Compresión Sharp'}</span>
          </span>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Upload / Preview Area */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
        {/* Thumbnail Preview (if image exists) */}
        {value && (
          <div className="sm:col-span-4 bg-[#141414] border border-gray-800 rounded-2xl p-2 flex flex-col items-center justify-center relative group overflow-hidden min-h-[140px]">
            <img
              src={value}
              alt="Vista previa"
              className="max-h-28 max-w-full object-contain transition group-hover:scale-105"
              onError={(e) => {
                // Fallback for broken images
                (e.target as HTMLElement).style.opacity = '0.5';
              }}
            />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[#ffd025] hover:bg-yellow-400 text-black text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow"
                title="Cambiar foto desde PC"
              >
                <i className="fa-solid fa-arrows-rotate"></i> Cambiar
              </button>
            </div>
          </div>
        )}

        {/* Dropzone & PC Upload Button */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`${value ? 'sm:col-span-8' : 'sm:col-span-12'} border-2 border-dashed rounded-2xl p-4 transition text-center cursor-pointer flex flex-col items-center justify-center min-h-[140px] relative ${
            isDragging
              ? 'border-[#ffd025] bg-[#ffd025]/10 scale-[1.01]'
              : 'border-gray-700 hover:border-[#ffd025]/80 bg-[#141414] hover:bg-[#181818]'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-[#ffd025]"></i>
              <div className="text-xs font-bold text-white">Comprimiendo con Sharp y guardando...</div>
              <div className="text-[10px] text-gray-400">Optimizando peso y enviando a almacenamiento</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center py-1">
              <div className="w-10 h-10 rounded-full bg-[#ffd025]/10 text-[#ffd025] flex items-center justify-center text-lg border border-[#ffd025]/30 group-hover:scale-110 transition">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Cargar foto desde tu PC
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Haz clic para examinar o arrastra la imagen aquí
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  (Se comprime automáticamente en WebP ultra rápido)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compression & Optimization Stats */}
      {uploadStats && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-300">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <div>
              <span className="font-bold">Comprimida con éxito: </span>
              <span className="text-gray-300 line-through mr-1">{formatBytes(uploadStats.originalSize)}</span>
              <i className="fa-solid fa-arrow-right text-[10px] text-emerald-400 mx-1"></i>
              <span className="font-black text-white">{formatBytes(uploadStats.compressedSize)}</span>
              {uploadStats.savingsPercent !== undefined && uploadStats.savingsPercent > 0 && (
                <span className="ml-1.5 bg-emerald-500/20 text-emerald-300 font-black px-1.5 py-0.5 rounded-full text-[10px]">
                  -{uploadStats.savingsPercent}%
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full shrink-0">
            {uploadStats.storage}
          </span>
        </div>
      )}

      {/* Optional Manual URL fallback */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition flex items-center gap-1 cursor-pointer"
        >
          <i className={`fa-solid ${showUrlInput ? 'fa-chevron-up' : 'fa-link'}`}></i>
          <span>{showUrlInput ? 'Ocultar enlace manual' : '¿Prefieres pegar un enlace web de imagen?'}</span>
        </button>

        {showUrlInput && (
          <div className="mt-2 space-y-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://ejemplo.com/foto-producto.jpg"
              className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
            />
            <p className="text-[10px] text-gray-500">
              Puedes pegar una URL directa de imagen web o un data:image en base64.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProductImageUploader;
