import React, { useState } from 'react';
import { Sliders, Wand2, Sparkles, Image, Eye, SunMedium, Moon, Palette, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BackgroundEffect {
  id: string;
  name: string;
  type: 'none' | 'blur' | 'image';
  preview: string;
  cssStyle?: string;
  blurAmount?: number;
}

export interface ColorFilter {
  id: string;
  name: string;
  description: string;
  filterCss: string;
  icon: any;
}

export const BACKGROUND_PRESETS: BackgroundEffect[] = [
  { id: 'none', name: 'Original', type: 'none', preview: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop&q=60' },
  { id: 'blur_soft', name: 'Soft Blur', type: 'blur', blurAmount: 8, preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=60' },
  { id: 'blur_deep', name: 'Studio Bokeh', type: 'blur', blurAmount: 20, preview: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=150&auto=format&fit=crop&q=60' },
  { id: 'office_glass', name: 'Executive Suite', type: 'image', preview: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=150&auto=format&fit=crop&q=60' },
  { id: 'library', name: 'Warm Library', type: 'image', preview: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=150&auto=format&fit=crop&q=60' },
  { id: 'tech_lab', name: 'Modern Studio', type: 'image', preview: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=60' },
  { id: 'penthouse', name: 'Skyline View', type: 'image', preview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&auto=format&fit=crop&q=60' },
];

export const COLOR_FILTERS: ColorFilter[] = [
  { id: 'natural', name: 'Natural Crisp', description: 'True-to-life tone & clarity', filterCss: 'none', icon: Eye },
  { id: 'studio', name: 'Studio Light Pro', description: 'Warm spotlight & highlight smoothing', filterCss: 'brightness(1.08) contrast(1.06) saturate(1.12)', icon: SunMedium },
  { id: 'low_light', name: 'AI Low-Light Boost', description: 'Illuminates dark webcam sensors', filterCss: 'brightness(1.22) contrast(1.12) saturate(1.08)', icon: Moon },
  { id: 'vibrant', name: 'Vibrant Dynamic', description: 'Vivid color pop & high dynamic range', filterCss: 'saturate(1.25) contrast(1.08) brightness(1.04)', icon: Palette },
  { id: 'cinema', name: 'Cinematic Teal', description: 'Corporate executive color grade', filterCss: 'contrast(1.14) saturate(1.18) sepia(0.08) hue-rotate(-6deg)', icon: Sparkles },
];

export function VideoEnhancerModal({
  activeFilter,
  activeBackground,
  onSelectFilter,
  onSelectBackground,
}: {
  activeFilter: string;
  activeBackground: string;
  onSelectFilter: (filterId: string) => void;
  onSelectBackground: (bgId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'enhancer' | 'background'>('enhancer');

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border bg-black/50 hover:bg-black/80 text-gray-200 border-white/10 flex items-center gap-1.5"
        title="Video Enhancer, Dynamic Colors & Virtual Backgrounds"
      >
        <Wand2 className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden md:inline">Enhance</span>
      </Button>

      {isOpen && (
        <div className="absolute top-11 right-0 w-80 bg-[#12141a]/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold tracking-wide uppercase text-white">Video Studio & FX</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white rounded p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl mb-3 border border-white/5">
            <button
              onClick={() => setActiveTab('enhancer')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'enhancer' ? 'bg-[#0b5cff] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Color Enhancer
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'background' ? 'bg-[#0b5cff] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Virtual Background
            </button>
          </div>

          {/* Tab: Color Enhancer */}
          {activeTab === 'enhancer' && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {COLOR_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isSelected = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => onSelectFilter(filter.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected 
                        ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/40' 
                        : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white/5 text-blue-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{filter.name}</div>
                        <div className="text-[10px] text-gray-400">{filter.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab: Virtual Background & Blur */}
          {activeTab === 'background' && (
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {BACKGROUND_PRESETS.map((bg) => {
                const isSelected = activeBackground === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => onSelectBackground(bg.id)}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition-all ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="h-16 w-full rounded-lg overflow-hidden bg-slate-800 relative">
                      <img src={bg.preview} alt={bg.name} className="w-full h-full object-cover" />
                      {bg.type === 'blur' && (
                        <div className="absolute inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded bg-black/60">
                            {bg.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <span className="text-[11px] font-medium text-gray-200 truncate">{bg.name}</span>
                      {isSelected && <Check className="h-3 w-3 text-blue-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
