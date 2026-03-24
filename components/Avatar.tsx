
import React from 'react';

interface AvatarProps {
  seed: string;
  url?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({ seed, url, name, size = 'md', highlight, className = '', onClick }) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-16 h-16 text-sm",
    lg: "w-24 h-24 text-base",
    xl: "w-32 h-32 text-lg"
  };

  // Use uploaded URL if available, otherwise fallback to seed
  const src = url || `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`} onClick={onClick}>
      <div className={`relative rounded-full overflow-hidden bg-slate-700 border-4 transition-all ${sizeClasses[size]} ${highlight ? 'border-game-accent shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'border-transparent'}`}>
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      </div>
      {name && <span className="font-semibold text-slate-200 truncate max-w-[120px] text-center">{name}</span>}
    </div>
  );
};
