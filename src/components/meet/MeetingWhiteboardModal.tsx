import React, { useState, useRef, useEffect } from 'react';
import { 
  Pen, Eraser, Square, Circle, ArrowRight, Type, 
  Trash2, Download, Undo2, Redo2, X, Sparkles, Palette 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingWhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userName?: string;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'line';

const COLORS = [
  { id: '#0b5cff', name: 'Vyntyra Blue' },
  { id: '#10b981', name: 'Emerald' },
  { id: '#8b5cf6', name: 'Purple' },
  { id: '#f43f5e', name: 'Rose' },
  { id: '#f59e0b', name: 'Amber' },
  { id: '#ffffff', name: 'White' },
  { id: '#090b0e', name: 'Black' },
];

export function MeetingWhiteboardModal({
  isOpen,
  onClose,
  roomId,
  userName = 'You',
}: MeetingWhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#0b5cff');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match container
    canvas.width = canvas.parentElement?.clientWidth || 900;
    canvas.height = 560;

    // Fill white or dark canvas
    ctx.fillStyle = '#0f121a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial blank state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialState]);
    setHistoryIndex(0);

    // Listen for peer drawing strokes via Supabase broadcast
    const channel = supabase.channel(`meet-whiteboard-${roomId}`)
      .on('broadcast', { event: 'draw_stroke' }, ({ payload }) => {
        if (!payload || payload.sender === userName) return;
        const peerCtx = canvas.getContext('2d');
        if (!peerCtx) return;

        peerCtx.strokeStyle = payload.color;
        peerCtx.lineWidth = payload.width;
        peerCtx.lineCap = 'round';
        peerCtx.lineJoin = 'round';

        peerCtx.beginPath();
        peerCtx.moveTo(payload.x0, payload.y0);
        peerCtx.lineTo(payload.x1, payload.y1);
        peerCtx.stroke();
      })
      .on('broadcast', { event: 'clear_board' }, () => {
        const peerCtx = canvas.getContext('2d');
        if (!peerCtx) return;
        peerCtx.fillStyle = '#0f121a';
        peerCtx.fillRect(0, 0, canvas.width, canvas.height);
        toast.info("Whiteboard cleared by attendee.");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomId, userName]);

  // Drawing event handlers
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    lastPosRef.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);

    if (selectedTool === 'eraser') {
      ctx.strokeStyle = '#0f121a';
      ctx.lineWidth = strokeWidth * 4;
    } else if (selectedTool === 'highlighter') {
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = strokeWidth * 3;
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = strokeWidth;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Broadcast stroke to peers in meeting
    supabase.channel(`meet-whiteboard-${roomId}`).send({
      type: 'broadcast',
      event: 'draw_stroke',
      payload: {
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: x,
        y1: y,
        color: selectedTool === 'eraser' ? '#0f121a' : strokeColor,
        width: selectedTool === 'eraser' ? strokeWidth * 4 : strokeWidth,
        sender: userName
      }
    }).catch(() => {});

    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Push new history state
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, currentState]);
    setHistoryIndex(newHistory.length);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f121a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    supabase.channel(`meet-whiteboard-${roomId}`).send({
      type: 'broadcast',
      event: 'clear_board',
      payload: { sender: userName }
    }).catch(() => {});

    const blankState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([...history, blankState]);
    setHistoryIndex(history.length);
    toast.success("Whiteboard cleared");
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Vyntyra-Whiteboard-${roomId.slice(0, 8)}-${Date.now()}.png`;
    a.click();
    toast.success("Whiteboard snapshot downloaded!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[96vw] bg-[#0c0e14]/98 backdrop-blur-3xl border-white/15 text-white rounded-3xl p-4 sm:p-6 shadow-2xl font-sans max-h-[94vh] flex flex-col">
        <DialogHeader className="pb-2 border-b border-white/10 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Interactive Collaborative Whiteboard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Sync
                </span>
              </DialogTitle>
              <p className="text-xs text-gray-400">Collaborate, sketch diagrams, and solve doubt tasks in real time.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="h-8 px-2.5 text-xs rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
              title="Save Whiteboard Snapshot"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-blue-400" />
              <span className="hidden sm:inline">Save Image</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="h-8 px-2.5 text-xs rounded-xl border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
              title="Clear entire canvas"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar & Controls */}
        <div className="py-2.5 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Tool Selector */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setSelectedTool('pen')}
              className={`p-1.5 rounded-lg transition-all ${
                selectedTool === 'pen' ? 'bg-[#0b5cff] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Pen Brush"
            >
              <Pen className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedTool('highlighter')}
              className={`p-1.5 rounded-lg transition-all ${
                selectedTool === 'highlighter' ? 'bg-[#0b5cff] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Highlighter"
            >
              <Palette className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedTool('eraser')}
              className={`p-1.5 rounded-lg transition-all ${
                selectedTool === 'eraser' ? 'bg-[#0b5cff] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1.5 rounded-xl">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setStrokeColor(c.id)}
                style={{ backgroundColor: c.id }}
                className={`h-5 w-5 rounded-full transition-all border ${
                  strokeColor === c.id ? 'scale-125 border-white shadow-md' : 'border-white/20 hover:scale-110'
                }`}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Width Slider */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-xl text-gray-300">
            <span className="text-[10px] uppercase font-semibold text-gray-400">Width</span>
            <input
              type="range"
              min="1"
              max="16"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 sm:w-24 accent-[#0b5cff] cursor-pointer"
            />
            <span className="font-mono text-[10px] text-blue-400 w-4">{strokeWidth}px</span>
          </div>
        </div>

        {/* Whiteboard Drawing Canvas Area */}
        <div className="flex-1 w-full bg-[#0f121a] rounded-2xl border border-white/10 overflow-hidden relative shadow-inner cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full block touch-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
