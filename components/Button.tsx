
import React from 'react';
import { audioService } from '../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  onClick,
  ...props 
}) => {
  const baseStyles = "py-4 px-6 rounded-xl font-bold text-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg";
  
  const variants = {
    primary: "bg-game-primary hover:bg-indigo-600 text-white shadow-indigo-500/30",
    secondary: "bg-game-surface hover:bg-slate-700 text-slate-200 border border-slate-600",
    danger: "bg-game-danger hover:bg-red-600 text-white shadow-red-500/30",
    success: "bg-game-success hover:bg-green-600 text-white shadow-green-500/30",
    outline: "bg-transparent border-2 border-indigo-500 text-indigo-300 hover:bg-indigo-500/10",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    audioService.playSfx('click');
    if (onClick) onClick(e);
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
