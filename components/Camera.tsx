
import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';

interface CameraProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 } }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Could not access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Resize to very small size to ensure fast P2P transfer
      const MAX_WIDTH = 200; 
      const scale = MAX_WIDTH / videoRef.current.videoWidth;
      
      canvas.width = MAX_WIDTH;
      canvas.height = videoRef.current.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        // Heavy compression for speed
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        {error ? (
          <div className="p-8 text-center text-red-400">
            <p>{error}</p>
            <Button onClick={onCancel} className="mt-4" variant="secondary">Close</Button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-auto object-cover transform -scale-x-100" 
            />
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
               <button 
                onClick={onCancel}
                className="w-12 h-12 rounded-full bg-slate-800/80 text-white flex items-center justify-center backdrop-blur"
               >
                 ✕
               </button>
               
               <button 
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
               >
                 <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform" />
               </button>

               <div className="w-12 h-12" /> {/* Spacer for balance */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
