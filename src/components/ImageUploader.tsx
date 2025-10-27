import React, { useRef, useState } from 'react';
import { UploadIcon, CameraIcon } from './icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    cameraInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-4 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-accent bg-blue-50' : 'border-gray-300 hover:border-accent hover:bg-gray-50'}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={disabled}
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          capture="environment"
          disabled={disabled}
        />
        <div className="flex flex-col items-center text-gray-600">
          <UploadIcon />
          <p className="mt-4 text-lg font-semibold">Sleep een foto van je bon hierheen</p>
          <p className="text-sm text-gray-500">of klik om een bestand te selecteren</p>
        </div>
      </div>

      <button
        onClick={handleCameraClick}
        disabled={disabled}
        className="w-full bg-primary text-white font-bold py-4 px-6 rounded-lg hover:bg-primary-hover transition-colors duration-200 disabled:bg-gray-400 flex items-center justify-center gap-3 shadow-md"
      >
        <CameraIcon />
        <span>Maak een Foto</span>
      </button>
    </div>
  );
};

export default ImageUploader;
