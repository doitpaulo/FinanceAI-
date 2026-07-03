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
      {/* Animated Illustrative Logo Container */}
      <div className={`relative ${currentSize.icon} bg-gradient-to-br from-amber-500/10 to-amber-600/30 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-950/20 overflow-hidden shrink-0 group`}>
        {/* Ambient background grid lines in SVG */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
        
        {/* Premium Custom SVG Illustration connecting Finance (Ascending Trend) & AI (Synaptic Neural Nodes) */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 transition-transform duration-500 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="trendGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="aiNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Neural Synapse Grid / Background Connections */}
          <line x1="20" y1="75" x2="45" y2="55" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <line x1="45" y1="55" x2="65" y2="65" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <line x1="65" y1="65" x2="80" y2="30" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <line x1="45" y1="55" x2="35" y2="30" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
          <line x1="65" y1="65" x2="75" y2="55" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />

          {/* Central AI Nucleus Nodes */}
          <circle cx="35" cy="30" r="2.5" fill="#f59e0b" opacity="0.6" />
          <circle cx="75" cy="55" r="2.5" fill="#fbbf24" opacity="0.6" />

          {/* Main Financial Trend Arc (Ascending Arrow) */}
          <path 
            d="M 20 75 Q 40 65 50 45 T 80 25" 
            stroke="url(#trendGrad)" 
            strokeWidth="4" 
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Golden Arrowhead pointing high */}
          <path 
            d="M 72 25 H 80 V 33" 
            stroke="url(#trendGrad)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* AI Synaptic Nodes / Microchip Pin Points (Glow elements) */}
          <circle cx="50" cy="45" r="5" fill="url(#aiNodeGrad)" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" />
          <circle cx="80" cy="25" r="4" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" filter="url(#glow)" />
          <circle cx="20" cy="75" r="3.5" fill="#f59e0b" />

          {/* Inner pulse circle for AI node */}
          <circle cx="80" cy="25" r="1.5" fill="#f59e0b" className="animate-ping" style={{ transformOrigin: "80px 25px" }} />
          <circle cx="50" cy="45" r="2" fill="#111111" />
        </svg>

        {/* Outer orbital decorative ring */}
        <div className="absolute inset-0 border border-amber-500/10 rounded-2xl scale-110 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-display font-bold text-white tracking-tight leading-none`}>
            Finance<span className="text-amber-400">AI</span>
          </h1>
          <span className={`${currentSize.subtitle} font-mono text-slate-500 uppercase tracking-widest block mt-1 font-semibold`}>
            SISTEMA OPERACIONAL FINANCEIRO
          </span>
        </div>
      )}
    </div>
  );
}
