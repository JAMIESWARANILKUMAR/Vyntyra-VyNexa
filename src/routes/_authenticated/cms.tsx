import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNews, createNews, listAnnouncements, createAnnouncement } from "@/lib/cms.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { RichContentRenderer } from "@/components/rich-content-renderer";

export const Route = createFileRoute("/_authenticated/cms")({
  head: () => ({ meta: [{ title: "CMS | Vyntyra Admin" }] }),
  component: CMSPage,
});

function MediaToolbar({ onInsertMedia }: { onInsertMedia: (tag: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-border/50 mb-2">
      <span className="text-xs text-muted-foreground font-medium mr-1">Insert Media:</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => {
          const url = prompt("Enter Image URL (e.g. https://example.com/photo.jpg):");
          if (url) {
            onInsertMedia(`\n![Image](${url.trim()})\n`);
          }
        }}
      >
        <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
        Add Image URL
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => {
          const url = prompt("Enter Video URL (YouTube, Vimeo, or MP4 video link):");
          if (url) {
            onInsertMedia(`\n![Video](${url.trim()})\n`);
          }
        }}
      >
        <VideoIcon className="h-3.5 w-3.5 text-red-500" />
        Add Video URL
      </Button>
    </div>
  );
}

function CMSPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground mr-2">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back to Admin
              </Link>
            </Button>
            <div>
              <div className="font-serif text-lg font-bold text-primary leading-none">Content Management</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                Manage News and Announcements
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
      <Tabs defaultValue="news">
        <TabsList className="mb-4">
          <TabsTrigger value="news">News & Updates</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>
        <TabsContent value="news"><NewsTab /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
      </Tabs>
      </main>
    </div>
  );
}

function NewsTab() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const { data: news, isLoading } = useQuery({ queryKey: ["cms-news"], queryFn: () => listNews() });
  const { mutate, isPending } = useMutation({
    mutationFn: createNews,
    onSuccess: () => {
      toast.success("News published!");
      setTitle(""); setContent(""); setIsPublished(false);
      qc.invalidateQueries({ queryKey: ["cms-news"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle>Create News</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="News Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <MediaToolbar onInsertMedia={(tag) => setContent((prev) => prev + tag)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea placeholder="News Content (Markdown, Image & Video URLs supported)" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px]" />
              <div className="border rounded-md p-4 min-h-[200px] bg-muted/20 overflow-y-auto max-h-[300px]">
                {content ? (
                  <RichContentRenderer content={content} />
                ) : (
                  <span className="text-muted-foreground text-sm italic">Live Media & Markdown Preview...</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            <span>Publish Immediately</span>
          </div>
          <Button onClick={() => mutate({ data: { title, content, is_published: isPublished } })} disabled={isPending || !title || !content}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create News
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent News</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <Loader2 className="animate-spin" /> : news?.map(n => (
            <div key={n.id} className="p-4 border rounded-md bg-card">
              <h3 className="font-bold text-base">{n.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">{n.is_published ? "Published" : "Draft"}</p>
              <RichContentRenderer content={n.content} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AnnouncementsTab() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState<"info"|"warning"|"urgent">("info");
  const [isActive, setIsActive] = useState(true);

  const { data: ann, isLoading } = useQuery({ queryKey: ["cms-announcements"], queryFn: () => listAnnouncements() });
  const { mutate, isPending } = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      toast.success("Announcement posted!");
      setTitle(""); setContent("");
      qc.invalidateQueries({ queryKey: ["cms-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle>Create Announcement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Announcement Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <MediaToolbar onInsertMedia={(tag) => setContent((prev) => prev + tag)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea 
                placeholder="Content (Markdown, Image & Video URLs supported)" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="min-h-[200px]"
              />
              <div className="border rounded-md p-4 min-h-[200px] bg-muted/20 overflow-y-auto max-h-[300px]">
                {content ? (
                  <RichContentRenderer content={content} />
                ) : (
                  <span className="text-muted-foreground text-sm italic">Live Media & Markdown Preview...</span>
                )}
              </div>
            </div>
          </div>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="w-full p-2 border rounded-md bg-background">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
          <div className="flex items-center space-x-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span>Active</span>
          </div>
          <Button onClick={() => mutate({ data: { title, content, severity, is_active: isActive } })} disabled={isPending || !title || !content}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Post Announcement
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Active Announcements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <Loader2 className="animate-spin" /> : ann?.map(a => (
            <div key={a.id} className="p-4 border rounded-md bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{a.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary font-medium uppercase">{a.severity}</span>
              </div>
              <RichContentRenderer content={a.content} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

