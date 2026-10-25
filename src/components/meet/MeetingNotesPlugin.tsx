import React, { useState, useEffect } from 'react';
import { 
  FileText, Copy, Download, CheckSquare, Plus, Trash2, 
  Sparkles, CheckCircle2, ListTodo, Share2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingNotesPluginProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meetingTitle?: string;
  userName?: string;
}

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
}

export function MeetingNotesPlugin({
  isOpen,
  onClose,
  roomId,
  meetingTitle = 'Meeting',
  userName = 'You',
}: MeetingNotesPluginProps) {
  const [notes, setNotes] = useState<string>('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { id: '1', text: 'Document task implementation details', completed: false },
    { id: '2', text: 'Review pull request & submit code changes', completed: false },
  ]);
  const [newActionText, setNewActionText] = useState('');

  // Initial load and sync via Supabase Realtime channel
  useEffect(() => {
    if (!isOpen) return;

    // Load persisted notes from local cache if any
    const savedNotes = localStorage.getItem(`vyntyra_meet_notes_${roomId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    } else {
      setNotes(`## ${meetingTitle}\nDate: ${new Date().toLocaleDateString()}\nRoom Code: ${roomId}\n\n### Key Discussion Points:\n- \n\n### Decisions & Solutions:\n- `);
    }

    const channel = supabase.channel(`meet-notes-${roomId}`)
      .on('broadcast', { event: 'notes_updated' }, ({ payload }) => {
        if (!payload || payload.sender === userName) return;
        if (typeof payload.notes === 'string') {
          setNotes(payload.notes);
          localStorage.setItem(`vyntyra_meet_notes_${roomId}`, payload.notes);
        }
        if (Array.isArray(payload.actionItems)) {
          setActionItems(payload.actionItems);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomId, meetingTitle, userName]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem(`vyntyra_meet_notes_${roomId}`, val);

    // Broadcast update
    supabase.channel(`meet-notes-${roomId}`).send({
      type: 'broadcast',
      event: 'notes_updated',
      payload: { notes: val, actionItems, sender: userName }
    }).catch(() => {});
  };

  const toggleActionItem = (id: string) => {
    const updated = actionItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setActionItems(updated);

    supabase.channel(`meet-notes-${roomId}`).send({
      type: 'broadcast',
      event: 'notes_updated',
      payload: { notes, actionItems: updated, sender: userName }
    }).catch(() => {});
  };

  const addActionItem = () => {
    if (!newActionText.trim()) return;
    const newItem: ActionItem = {
      id: crypto.randomUUID(),
      text: newActionText.trim(),
      completed: false,
      assignee: userName
    };
    const updated = [...actionItems, newItem];
    setActionItems(updated);
    setNewActionText('');

    supabase.channel(`meet-notes-${roomId}`).send({
      type: 'broadcast',
      event: 'notes_updated',
      payload: { notes, actionItems: updated, sender: userName }
    }).catch(() => {});
  };

  const removeActionItem = (id: string) => {
    const updated = actionItems.filter(item => item.id !== id);
    setActionItems(updated);

    supabase.channel(`meet-notes-${roomId}`).send({
      type: 'broadcast',
      event: 'notes_updated',
      payload: { notes, actionItems: updated, sender: userName }
    }).catch(() => {});
  };

  const handleCopyNotes = () => {
    const fullContent = `${notes}\n\n### Action Items:\n${actionItems.map(a => `- [${a.completed ? 'x' : ' '}] ${a.text}`).join('\n')}`;
    navigator.clipboard.writeText(fullContent);
    toast.success("Notes & Action Items copied to clipboard!");
  };

  const handleDownloadNotes = () => {
    const fullContent = `${notes}\n\n### Action Items:\n${actionItems.map(a => `- [${a.completed ? 'x' : ' '}] ${a.text}`).join('\n')}`;
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VCS-Notes-${roomId.slice(0, 8)}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Meeting notes exported as Markdown file!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[96vw] bg-[#0c0e14]/98 backdrop-blur-3xl border-white/15 text-white rounded-3xl p-5 sm:p-6 shadow-2xl font-sans max-h-[92vh] flex flex-col">
        <DialogHeader className="pb-2 border-b border-white/10 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Meeting Notes & Action Items</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Shared
                </span>
              </DialogTitle>
              <p className="text-xs text-gray-400">Live collaborative notes and tasks checklist synced across attendees.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyNotes}
              className="h-8 px-2.5 text-xs rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
              title="Copy All to Clipboard"
            >
              <Copy className="h-3.5 w-3.5 mr-1 text-blue-400" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadNotes}
              className="h-8 px-2.5 text-xs rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
              title="Download Markdown"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-purple-400" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {/* Main Notes Editor */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Discussion Notes (Markdown Supported)</span>
              <span className="text-[10px] text-emerald-400 font-mono">Auto-saving</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Write meeting notes, architecture decisions, and summary..."
              className="min-h-[220px] bg-black/50 border-white/10 text-white text-xs font-mono rounded-2xl p-3.5 leading-relaxed focus:border-blue-500 resize-y"
            />
          </div>

          {/* Action Items & Tasks Checklist */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5 text-purple-400" />
              <span>Session Action Items & Assigned Tasks</span>
            </label>

            {/* Add Action Item Input */}
            <div className="flex gap-2">
              <Input
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addActionItem()}
                placeholder="Add a new task or action item..."
                className="h-9 bg-black/50 border-white/10 text-xs text-white rounded-xl"
              />
              <Button
                size="sm"
                onClick={addActionItem}
                className="h-9 px-3 bg-[#0b5cff] hover:bg-[#094bdd] text-white rounded-xl text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    item.completed 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-gray-400 line-through' 
                      : 'bg-black/40 border-white/10 text-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleActionItem(item.id)}
                    className="flex items-center gap-2 text-left flex-1 text-xs"
                  >
                    <CheckSquare className={`h-4 w-4 shrink-0 ${item.completed ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span className="truncate">{item.text}</span>
                  </button>

                  <button
                    onClick={() => removeActionItem(item.id)}
                    className="p-1 hover:text-rose-400 text-gray-500 transition-colors"
                    title="Remove task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
