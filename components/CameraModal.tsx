import React, { useRef, useState, useEffect } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [captureSuccess, setCaptureSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera niet ondersteund door deze browser');
      setIsLoading(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLoading(false);
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);

      // Handle specific errors
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera toegang geweigerd. Geef toestemming om de camera te gebruiken.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Geen camera gevonden op dit apparaat.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is al in gebruik door een andere applicatie.');
      } else {
        setError('Kon camera niet starten. Probeer het opnieuw.');
      }

      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsLoading(true);
    setError(null);
    setCaptureSuccess(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob and then to File
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `receipt-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });

          // Show success animation
          setCaptureSuccess(true);

          // Close modal and pass file after brief delay
          setTimeout(() => {
            onCapture(file);
            onClose();
          }, 300);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleClose}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
          aria-label="Sluiten"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {isLoading && !error && (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Camera wordt geladen...</p>
          </div>
        )}

        {error && (
          <div className="text-white text-center px-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Probeer opnieuw
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`max-w-full max-h-full object-contain ${isLoading || error ? 'hidden' : ''}`}
        />

        {captureSuccess && (
          <div className="absolute inset-0 bg-white animate-pulse"></div>
        )}
      </div>

      {/* Capture button */}
      {!isLoading && !error && (
        <div className="p-6 flex justify-center">
          <button
            onClick={capturePhoto}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center gap-3 text-lg"
            disabled={captureSuccess}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Foto maken</span>
          </button>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;
