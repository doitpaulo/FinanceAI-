import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function FinanceAILogo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: { icon: "w-8 h-8", text: "text-base", subtitle: "text-[9px]" },
    md: { icon: "w-10 h-10", text: "text-xl", subtitle: "text-[10px]" },
    lg: { icon: "w-14 h-14", text: "text-2xl", subtitle: "text-[11px]" }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Gradient Logo Icon */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center shrink-0 group`}>
        {/* Modern high-fidelity representation of the official circular gradient robot F logo */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            {/* Smooth Cyan to Purple/Magenta gradient matching the official asset */}
            <linearGradient id="officialLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E0FF" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Thick outer circle with open gap at bottom-right */}
          <path 
            d="M 52 86 A 38 38 0 1 1 85 64" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Antenna stalk */}
          <path 
            d="M 50 26 L 50 20" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
          />

          {/* Antenna circular tip */}
          <circle cx="50" cy="16" r="3.5" fill="url(#officialLogoGrad)" />

          {/* Side Ears */}
          <path 
            d="M 32.5 32 L 32.5 40" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
          />
          <path 
            d="M 67.5 32 L 67.5 40" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
          />

          {/* Robot Head Frame */}
          <rect 
            x="35" 
            y="26" 
            width="30" 
            height="20" 
            rx="7.5" 
            ry="7.5" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            fill="#111111" 
          />

          {/* White Eyes */}
          <circle cx="44" cy="36" r="2.5" fill="white" />
          <circle cx="56" cy="36" r="2.5" fill="white" />

          {/* Cheerful Smile */}
          <path 
            d="M 47 40.5 Q 50 43.5 53 40.5" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Stylized 'F' Stem flowing gracefully from the neck under-center */}
          <path 
            d="M 43 74 L 43 54 C 43 49 46.5 46 50 46" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* 'F' Upper Bar */}
          <path 
            d="M 43 54 L 57 54" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
          />

          {/* 'F' Middle Bar */}
          <path 
            d="M 43 64 L 53 64" 
            stroke="url(#officialLogoGrad)" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-display font-bold text-white tracking-tight leading-none`}>
            financeAI
          </h1>
          <span className={`${currentSize.subtitle} font-mono text-slate-500 uppercase tracking-widest block mt-1 font-semibold`}>
            SISTEMA OPERACIONAL FINANCEIRO
          </span>
        </div>
      )}
    </div>
  );
}
