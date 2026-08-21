import React from 'react';

interface HungTriFoodLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
}

export const HungTriFoodLogo: React.FC<HungTriFoodLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Flame Icon with HT Emblem */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0 relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flame Ring */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" />
          {/* Flame Body & Stylized HT */}
          <path
            d="M50 12C50 12 60 28 52 38C44 48 58 56 58 56C58 56 46 54 44 42C42 30 32 38 32 46C32 58 42 66 50 66C62 66 70 54 68 40C66 26 50 12 50 12Z"
            fill="currentColor"
          />
          <path
            d="M38 48H44V76H38V48ZM56 48H62V76H56V48ZM40 60H60V66H40V60Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Text Branding */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-tight font-headline uppercase text-orange-600 ${textSizes[size]}`}>
            HÙNG TRÍ
          </span>
          <span className={`font-bold tracking-widest text-[10px] text-amber-600 uppercase ${textColor}`}>
            FOOD
          </span>
        </div>
      )}
    </div>
  );
};
