import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ImagePlus, Loader2, Palette, Sparkles, SwatchBook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVisualStorefront } from "@/hooks/useVisualStorefront";
import { toast } from "sonner";

const VISUAL_STOREFRONT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visual-storefront`;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function VisualSearchPanel() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveResult } = useVisualStorefront();
  const [preview, setPreview] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Upload an image file.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      toast.error("Use an image under 6 MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreview(dataUrl);
      setFileName(file.name);
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const analyzeImage = async () => {
    if (!preview || loading) return;

    setLoading(true);

    try {
      const response = await fetch(VISUAL_STOREFRONT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ image_data_url: preview }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to generate your visual storefront.");
      }

      saveResult({
        ...body,
        imagePreview: preview,
      });

      navigate("/visual-storefront");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate your visual storefront.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="grid gap-6 overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-yellow-100/90 via-amber-50/85 to-yellow-50/75 dark:from-[#0f0f0f] dark:via-[#161616] dark:to-[#000000] p-6 shadow-[0_28px_70px_-50px_hsl(var(--foreground)/0.5)] md:grid-cols-[1.15fr_0.85fr] md:p-8 backdrop-blur-sm">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 dark:border-amber-400/40 dark:bg-amber-900/30 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Search by aesthetic
            </div>

            <div className="space-y-3">
              <h2 className="max-w-2xl font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Upload a vibe. We build the storefront.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Drop in a room, outfit, landscape, or artwork. The vision model extracts the palette, materials, and mood, then curates a landing page from products already in your catalog.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Palette, label: "Palette", value: "Dominant colours and contrast" },
                { icon: SwatchBook, label: "Materials", value: "Texture, finish, and tactile cues" },
                { icon: ImagePlus, label: "Mood", value: "Aesthetic direction and vibe" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/50 bg-card/80 dark:bg-[#222222] dark:border-[#2f2f2f] p-4 backdrop-blur-sm">
                  <item.icon className="h-5 w-5 text-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button type="button" size="lg" className="rounded-2xl px-5" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="rounded-2xl px-5 border-border/60 hover:bg-accent/10 dark:bg-card/80 dark:hover:bg-card dark:text-foreground dark:border-border/50"
                onClick={analyzeImage}
                disabled={!preview || loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Generate Storefront
              </Button>
              {fileName && <p className="self-center text-xs text-muted-foreground">Selected: {fileName}</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-slate-950/95 p-4 text-slate-50 shadow-inner">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>Preview</span>
              <span>{preview ? "Ready" : "Awaiting image"}</span>
            </div>
            <div className="mt-4 flex min-h-[320px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
              {preview ? (
                <img src={preview} alt="Uploaded inspiration" className="h-full w-full object-cover" />
              ) : (
                <div className="max-w-xs space-y-3 px-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <ImagePlus className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-50">No inspiration image yet</p>
                  <p className="text-xs leading-5 text-slate-400">
                    Upload a Pinterest-style reference and we will translate the aesthetic into a product edit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}