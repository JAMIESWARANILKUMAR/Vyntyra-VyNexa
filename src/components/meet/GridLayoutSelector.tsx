import React, { useState } from 'react';
import { LayoutGrid, Grid3X3, Users, Maximize2, MonitorPlay, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GridOption {
  id: string;
  label: string;
  count: number;
  description: string;
  icon: any;
  columnsClass: string;
}

export const GRID_LAYOUT_OPTIONS: GridOption[] = [
  { id: '4', label: '4 Tiles (Focus)', count: 4, description: '2x2 High Definition focus view', icon: LayoutGrid, columnsClass: 'grid-cols-2' },
  { id: '8', label: '8 Tiles (Standard)', count: 8, description: '4x2 balanced team layout', icon: Grid3X3, columnsClass: 'grid-cols-4' },
  { id: '12', label: '12 Tiles (Team)', count: 12, description: '4x3 presentation & squad layout', icon: Grid3X3, columnsClass: 'grid-cols-4' },
  { id: '16', label: '16 Tiles (Department)', count: 16, description: '4x4 multi-presenter layout', icon: Grid3X3, columnsClass: 'grid-cols-4' },
  { id: '24', label: '24 Tiles (Townhall)', count: 24, description: '6x4 wide conference gallery', icon: Users, columnsClass: 'grid-cols-6' },
  { id: '49', label: '49 Tiles (Mega)', count: 49, description: '7x7 high-density all-hands gallery', icon: Users, columnsClass: 'grid-cols-7' },
  { id: '100', label: '100 Tiles (Auditorium)', count: 100, description: 'Dynamic 100+ active participant spotlight', icon: Users, columnsClass: 'grid-cols-10' },
  { id: '1000', label: '1000+ Scale (Enterprise)', count: 1000, description: 'AI Smart Active Speaker spotlight up to 1000 participants', icon: MonitorPlay, columnsClass: 'grid-cols-12' },
];

export function GridLayoutSelector({ 
  currentLayout, 
  onSelectLayout 
}: { 
  currentLayout: string; 
  onSelectLayout: (layoutId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = GRID_LAYOUT_OPTIONS.find(o => o.id === currentLayout) || GRID_LAYOUT_OPTIONS[0];

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border bg-black/50 hover:bg-black/80 text-gray-200 border-white/10 flex items-center gap-1.5"
        title="Change Participant Grid Layout (4 to 1000 Tiles)"
      >
        <LayoutGrid className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden md:inline">{selected.count}+ Grid</span>
        <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
      </Button>

      {isOpen && (
        <div className="absolute top-11 right-0 w-64 bg-[#12141a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-white/10 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
              Dynamic Grid Sizing
            </span>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto">
            {GRID_LAYOUT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === currentLayout;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    onSelectLayout(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected 
                      ? 'bg-[#0b5cff]/20 text-[#0b5cff] font-medium border border-[#0b5cff]/30' 
                      : 'hover:bg-white/10 text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-blue-400" />
                    <div>
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-[10px] text-gray-400">{option.description}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#0b5cff] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
