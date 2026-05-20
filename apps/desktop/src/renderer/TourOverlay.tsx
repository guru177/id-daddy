import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarChart3,
  Database,
  FileDown,
  LayoutTemplate,
  User as UserIcon,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FolderPlus,
  Plus,
  Upload,
  Download,
  Settings,
  Save,
  Layers,
  ZoomIn,
  PlayCircle,
  Star,
} from "lucide-react";
import { DesktopPage, useAuthStore } from "./store";

/* ─────────────────────────────────────────────────────────────── */
/*  Types                                                           */
/* ─────────────────────────────────────────────────────────────── */
interface TourStep {
  id: string;
  page: DesktopPage | null;            // null = no navigation needed
  targetSelector?: string;             // CSS selector to spotlight
  position: "center" | "right" | "left" | "bottom" | "top";
  title: string;
  description: string;
  icon: React.ReactNode;
  waitMs?: number;                     // extra delay after page change
  /** If set, this selector is clicked after page nav, before spotlighting (sub-navigation) */
  subClickSelector?: string;
  subClickWaitMs?: number;
}

interface TourOverlayProps {
  onFinish: () => void;
}

/* ─────────────────────────────────────────────────────────────── */
/*  All tour steps                                                  */
/* ─────────────────────────────────────────────────────────────── */
const STEPS: TourStep[] = [
  /* ── Welcome ── */
  {
    id: "welcome",
    page: null,
    position: "center",
    title: "Welcome to ID Daddy! 🎉",
    description:
      "You're just a few steps away from creating professional ID cards for your organization. Let us walk you through every feature — it'll only take a minute!",
    icon: <Sparkles className="h-8 w-8 text-amber-400" />,
  },

  /* ── Dashboard ── */
  {
    id: "dashboard-overview",
    page: "dashboard",
    position: "center",
    title: "Your Command Center",
    description:
      "The Dashboard shows a live snapshot of your workspace — active templates, total members, and department breakdown — all at a glance.",
    icon: <BarChart3 className="h-6 w-6 text-orange-500" />,
    waitMs: 600,
  },
  {
    id: "dashboard-new-design",
    page: "dashboard",
    targetSelector: "[data-tour='dashboard-new-design']",
    position: "bottom",
    title: "Quick-Start Buttons",
    description:
      "Jump straight into the Designer or upload new member data from here. No digging through menus.",
    icon: <Plus className="h-6 w-6 text-emerald-500" />,
  },
  {
    id: "dashboard-metrics",
    page: "dashboard",
    targetSelector: "[data-tour='dashboard-metrics']",
    position: "bottom",
    title: "Live Workspace Metrics",
    description:
      "See how many templates you've created, how many members are in your database, and how many unique departments/classes exist.",
    icon: <BarChart3 className="h-6 w-6 text-orange-500" />,
  },
  {
    id: "dashboard-quicklinks",
    page: "dashboard",
    targetSelector: "[data-tour='dashboard-quicklinks']",
    position: "top",
    title: "Quick Links",
    description:
      "One-click shortcuts to Manage Designs, Manage Data, or go straight to Bulk Generate. These mirror the sidebar navigation.",
    icon: <PlayCircle className="h-6 w-6 text-violet-500" />,
  },

  /* ── Data Upload ── */
  {
    id: "upload-intro",
    page: "upload",
    position: "center",
    title: "Data Upload — Your Member Database",
    description:
      "Every ID card is powered by member data stored here. Organise members into folders (e.g. by class, department, or batch) and manage them easily.",
    icon: <Database className="h-6 w-6 text-blue-500" />,
    waitMs: 600,
  },
  {
    id: "upload-new-folder",
    page: "upload",
    targetSelector: "[data-tour='upload-new-folder']",
    position: "bottom",
    title: "Create Folders",
    description:
      "Click \"New Folder\" to organise members into groups like Grade 10A, HR Department, or Security Staff. Folders help bulk-generate cards for specific groups.",
    icon: <FolderPlus className="h-6 w-6 text-amber-500" />,
  },
  // Steps below require navigating into the 'All Members' list view first
  {
    id: "upload-import-excel",
    page: "upload",
    // Click "All Members" folder card to enter member list view
    subClickSelector: "[data-tour='upload-all-members']",
    subClickWaitMs: 500,
    targetSelector: "[data-tour='upload-import-excel']",
    position: "bottom",
    title: "Import from Excel / CSV",
    description:
      "Have data in a spreadsheet? Use the Import button to upload hundreds of members at once. Download our template first to see the exact column format expected.",
    icon: <Upload className="h-6 w-6 text-blue-500" />,
  },
  {
    id: "upload-download-template",
    page: "upload",
    targetSelector: "[data-tour='upload-download-template']",
    position: "bottom",
    title: "Download Excel Template",
    description:
      "Not sure about the format? Download the pre-filled template, fill in your member details, and re-import. All fields match the ID card fields exactly.",
    icon: <Download className="h-6 w-6 text-emerald-500" />,
  },
  {
    id: "upload-add-member",
    page: "upload",
    targetSelector: "[data-tour='upload-add-member']",
    position: "bottom",
    title: "Add Members Manually",
    description:
      "Prefer typing? Click \"+ Add New Member\" to fill in a form for each person — name, photo, ID number, department, and all custom fields you've configured.",
    icon: <Plus className="h-6 w-6 text-emerald-500" />,
  },
  {
    id: "upload-settings",
    page: "upload",
    targetSelector: "[data-tour='upload-settings']",
    position: "bottom",
    title: "Configure Fields & Organisation Type",
    description:
      "Open Settings to choose your organization type (Corporate / Education / Healthcare) and toggle which fields appear in member forms and ID cards.",
    icon: <Settings className="h-6 w-6 text-slate-500" />,
  },

  /* ── Designer ── */
  {
    id: "designer-intro",
    page: "designer",
    position: "center",
    title: "The Card Designer",
    description:
      "This is where the magic happens. Design your ID card layout using drag-and-drop tools, add smart fields that auto-fill with member data, and preview live.",
    icon: <LayoutTemplate className="h-6 w-6 text-violet-500" />,
    waitMs: 800,
  },
  {
    id: "designer-tabs",
    page: "designer",
    targetSelector: "[data-tour='designer-tabs']",
    position: "bottom",
    title: "Get Started · Card Designer · My Designs",
    description:
      "Three tabs power the Designer. \"Get Started\" has ready-made templates. \"Card Designer\" is the live canvas editor. \"My Designs\" is your saved template library.",
    icon: <LayoutTemplate className="h-6 w-6 text-violet-500" />,
  },
  {
    id: "designer-toolbar",
    page: "designer",
    // Click "Card Designer" tab first so the toolbar appears
    subClickSelector: "[data-tour='designer-tabs'] button:nth-child(2)",
    subClickWaitMs: 500,
    targetSelector: "[data-tour='designer-toolbar']",
    position: "bottom",
    title: "Design Toolbar",
    description:
      "Add text, shapes, images, barcodes, and smart data fields from the left panel. Use the right panel to style the selected object — fonts, colors, borders, shadows.",
    icon: <Settings className="h-6 w-6 text-slate-500" />,
  },
  {
    id: "designer-save",
    page: "designer",
    targetSelector: "[data-tour='designer-save']",
    position: "left",
    title: "Save Your Design",
    description:
      "Always save before generating! Saved designs appear in \"My Designs\" and can be reused across batches. The ★ star marks your default template for bulk generation.",
    icon: <Save className="h-6 w-6 text-emerald-500" />,
  },
  {
    id: "designer-undo",
    page: "designer",
    targetSelector: "[data-tour='designer-undo']",
    position: "bottom",
    title: "Undo & Redo",
    description:
      "Made a mistake? Hit Undo (Ctrl+Z) to go back step-by-step. Redo restores what you undid. Your full edit history is kept until you close the session.",
    icon: <ChevronLeft className="h-6 w-6 text-slate-500" />,
  },
  {
    id: "designer-zoom",
    page: "designer",
    targetSelector: "[data-tour='designer-toolbar']",
    position: "bottom",
    title: "Canvas Controls",
    description:
      "Zoom in to fine-tune tiny details or zoom out to see the full card. Use Ctrl+Scroll on the canvas for smooth zooming. The toolbar also lets you toggle the grid, download a preview, or start a new design.",
    icon: <ZoomIn className="h-6 w-6 text-blue-500" />,
  },

  /* ── Bulk Generator ── */
  {
    id: "generate-intro",
    page: "generate",
    position: "center",
    title: "Bulk Generator — Export All Cards",
    description:
      "Select a design template, pick which members to include, and generate a combined PDF with one click. Perfect for printing hundreds of cards at once.",
    icon: <FileDown className="h-6 w-6 text-emerald-500" />,
    waitMs: 600,
  },
  {
    id: "generate-select-template",
    page: "generate",
    targetSelector: "[data-tour='generate-select-template']",
    position: "right",
    title: "Choose a Template",
    description:
      "Pick which saved design to use. The active (⭐) template is pre-selected. You can switch to any design in your library before generating.",
    icon: <Star className="h-6 w-6 text-amber-500" />,
  },
  {
    id: "generate-export",
    page: "generate",
    targetSelector: "[data-tour='generate-export']",
    position: "right",
    title: "Export Options",
    description:
      "Export as a single merged PDF (ideal for print shops) or as individual PNG/PDF files per member. High-resolution output ensures crisp, print-ready cards.",
    icon: <Download className="h-6 w-6 text-emerald-500" />,
  },

  /* ── Profile ── */
  {
    id: "profile-intro",
    page: "profile",
    position: "center",
    title: "Account Settings",
    description:
      `Manage your workspace name, password, and subscription plan. This is also where you can replay this tour anytime using the "Replay Tour" button.`,
    icon: <UserIcon className="h-6 w-6 text-pink-500" />,
    waitMs: 500,
  },

  /* ── Done ── */
  {
    id: "done",
    page: null,
    position: "center",
    title: "You're All Set! 🚀",
    description:
      "Head to Data Upload to add your first members, then design a card and bulk-generate. You can replay this tour anytime from the Profile page. Good luck!",
    icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
  },
];

/* ─────────────────────────────────────────────────────────────── */
/*  Helpers                                                         */
/* ─────────────────────────────────────────────────────────────── */
const PAD = 10;
const TOOLTIP_W = 380;

function getRect(selector?: string): DOMRect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function buildClipPath(rect: DOMRect): string {
  const { top, left, bottom, right } = rect;
  return `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%,
    0% ${top - PAD}px,
    ${left - PAD}px ${top - PAD}px,
    ${left - PAD}px ${bottom + PAD}px,
    ${right + PAD}px ${bottom + PAD}px,
    ${right + PAD}px ${top - PAD}px,
    0% ${top - PAD}px,
    0% 0%
  )`;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                       */
/* ─────────────────────────────────────────────────────────────── */
export function TourOverlay({ onFinish }: TourOverlayProps) {
  const setPage = useAuthStore((s) => s.setPage);

  const [stepIdx, setStepIdx] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [animKey, setAnimKey] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navigatingRef = useRef(false);

  const current = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  /* ── Navigate to the page required for the current step ───── */
  useEffect(() => {
    navigatingRef.current = true;
    setSpotlightRect(null); // hide old spotlight while navigating

    if (current.page) {
      setPage(current.page);
    }

    // Base wait
    const baseDelay = current.waitMs ?? (current.page ? 500 : 100);

    const timer = setTimeout(() => {
      // If this step needs a sub-navigation click (e.g. enter All Members, click Card Designer tab)
      if (current.subClickSelector) {
        const el = document.querySelector(current.subClickSelector) as HTMLElement | null;
        if (el) el.click();
        // Extra wait after sub-click before spotlighting
        setTimeout(() => {
          navigatingRef.current = false;
          recalculate();
        }, current.subClickWaitMs ?? 500);
      } else {
        navigatingRef.current = false;
        recalculate();
      }
    }, baseDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  /* ── Recalculate spotlight & tooltip position ────────────── */
  const recalculate = useCallback(() => {
    if (navigatingRef.current) return;

    const rect = getRect(current.targetSelector);
    setSpotlightRect(rect);
    setAnimKey((k) => k + 1);

    if (!rect || current.position === "center") {
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: TOOLTIP_W,
      });
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MARGIN = 16;

    let style: React.CSSProperties = { position: "fixed", width: TOOLTIP_W };

    if (current.position === "right") {
      style.left = Math.min(rect.right + PAD + MARGIN, vw - TOOLTIP_W - MARGIN);
      style.top = Math.max(MARGIN, Math.min(rect.top + rect.height / 2, vh - 300));
      style.transform = "translateY(-50%)";
    } else if (current.position === "left") {
      style.left = Math.max(MARGIN, rect.left - TOOLTIP_W - PAD - MARGIN);
      style.top = Math.max(MARGIN, Math.min(rect.top + rect.height / 2, vh - 300));
      style.transform = "translateY(-50%)";
    } else if (current.position === "bottom") {
      style.top = rect.bottom + PAD + MARGIN;
      style.left = Math.max(MARGIN, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - MARGIN));
      // Flip to top if not enough space below
      if ((style.top as number) + 320 > vh) {
        style.top = Math.max(MARGIN, rect.top - PAD - MARGIN - 320);
      }
    } else if (current.position === "top") {
      style.top = Math.max(MARGIN, rect.top - PAD - MARGIN - 320);
      style.left = Math.max(MARGIN, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - MARGIN));
    }

    setTooltipStyle(style);
  }, [current]);

  useEffect(() => {
    window.addEventListener("resize", recalculate);
    return () => window.removeEventListener("resize", recalculate);
  }, [recalculate]);

  /* ── Navigation ─────────────────────────────────────────── */
  const goNext = useCallback(() => {
    if (isLast) { onFinish(); return; }
    setStepIdx((i) => i + 1);
  }, [isLast, onFinish]);

  const goPrev = useCallback(() => {
    if (!isFirst) setStepIdx((i) => i - 1);
  }, [isFirst]);

  /* ── Keyboard navigation ─────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onFinish]);

  /* ── Progress percentage ─────────────────────────────────── */
  const progress = ((stepIdx) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, pointerEvents: "none" }}>

      {/* ── Dimmed backdrop with spotlight cutout ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 10, 15, 0.75)",
          backdropFilter: "blur(1.5px)",
          clipPath: spotlightRect ? buildClipPath(spotlightRect) : undefined,
          transition: "clip-path 0.45s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "all",
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* ── Spotlight glow ring ── */}
      {spotlightRect && (
        <div
          style={{
            position: "absolute",
            left: spotlightRect.left - PAD - 2,
            top: spotlightRect.top - PAD - 2,
            width: spotlightRect.width + PAD * 2 + 4,
            height: spotlightRect.height + PAD * 2 + 4,
            borderRadius: 14,
            boxShadow:
              "0 0 0 2.5px #1a5d1a, 0 0 0 5px rgba(26,93,26,0.3), 0 0 28px 6px rgba(26,93,26,0.18)",
            transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
            animation: "tourPulse 2.2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Tooltip card ── */}
      <div
        ref={tooltipRef}
        key={`tooltip-${stepIdx}`}
        style={{
          ...tooltipStyle,
          zIndex: 2,
          pointerEvents: "all",
          animation: "tourSlideIn 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f8f5f0 100%)",
          borderRadius: 26,
          overflow: "hidden",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(26,93,26,0.15)",
        }}>

          {/* ── Progress bar ── */}
          <div style={{ height: 4, background: "#f0ebe4" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #1a5d1a, #2d7a2d)",
              transition: "width 0.4s ease",
              borderRadius: 99,
            }} />
          </div>

          <div style={{ padding: "24px 26px 22px" }}>
            {/* ── Header row ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              {/* Icon + page badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: "rgba(26,93,26,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {current.icon}
                </div>

                {current.page && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#1a5d1a",
                    background: "rgba(26,93,26,0.08)", padding: "3px 10px",
                    borderRadius: 99, border: "1px solid rgba(26,93,26,0.15)",
                  }}>
                    {{
                      dashboard: "Dashboard",
                      upload: "Data Upload",
                      designer: "Designer",
                      generate: "Bulk Generator",
                      profile: "Profile",
                    }[current.page]}
                  </span>
                )}
              </div>

              {/* Step counter + close */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af" }}>
                  {stepIdx + 1}/{STEPS.length}
                </span>
                <button
                  onClick={onFinish}
                  title="Skip tour (Esc)"
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: "1px solid #e5e7eb", background: "#f9fafb",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#9ca3af",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = "#fee2e2"; (e.currentTarget).style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = "#f9fafb"; (e.currentTarget).style.color = "#9ca3af"; }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Title ── */}
            <h3 style={{ fontSize: 19, fontWeight: 900, color: "#1c1917", margin: "0 0 9px", lineHeight: 1.25 }}>
              {current.title}
            </h3>

            {/* ── Description ── */}
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "#57534e", margin: "0 0 22px", lineHeight: 1.7 }}>
              {current.description}
            </p>

            {/* ── Progress dots ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 18, flexWrap: "wrap" }}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStepIdx(i)}
                  style={{
                    height: 5,
                    width: i === stepIdx ? 22 : 5,
                    borderRadius: 99,
                    background: i === stepIdx ? "#1a5d1a" : i < stepIdx ? "#86efac" : "#e5e7eb",
                    cursor: "pointer",
                    border: "none",
                    padding: 0,
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                  }}
                  title={`Step ${i + 1}: ${STEPS[i].title}`}
                />
              ))}
            </div>

            {/* ── Keyboard hint ── */}
            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#c4b5a8", marginBottom: 14, letterSpacing: "0.02em" }}>
              ← → Arrow keys to navigate · Esc to skip
            </p>

            {/* ── Navigation buttons ── */}
            <div style={{ display: "flex", gap: 10 }}>
              {!isFirst && (
                <button
                  onClick={goPrev}
                  style={{
                    flex: 1, height: 44, borderRadius: 14,
                    border: "1.5px solid #e5e7eb", background: "#fff",
                    fontWeight: 800, fontSize: 13.5, color: "#374151",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget).style.background = "#f3f4f6"}
                  onMouseLeave={(e) => (e.currentTarget).style.background = "#fff"}
                >
                  <ChevronLeft size={15} /> Back
                </button>
              )}

              <button
                onClick={goNext}
                style={{
                  flex: 2, height: 44, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #1a5d1a 0%, #2d7a2d 100%)",
                  fontWeight: 900, fontSize: 13.5, color: "#fff",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 4px 16px -4px rgba(26,93,26,0.5)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.transform = "translateY(-1px)"; (e.currentTarget).style.boxShadow = "0 8px 24px -6px rgba(26,93,26,0.55)"; }}
                onMouseLeave={(e) => { (e.currentTarget).style.transform = "translateY(0)"; (e.currentTarget).style.boxShadow = "0 4px 16px -4px rgba(26,93,26,0.5)"; }}
              >
                {isLast ? <><CheckCircle2 size={15} /> Finish Tour</> : <>Next <ChevronRight size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes tourPulse {
          0%,100% { box-shadow: 0 0 0 2.5px #1a5d1a, 0 0 0 5px rgba(26,93,26,0.3), 0 0 28px 6px rgba(26,93,26,0.15); }
          50%      { box-shadow: 0 0 0 2.5px #1a5d1a, 0 0 0 8px rgba(26,93,26,0.1), 0 0 38px 10px rgba(26,93,26,0.08); }
        }
        @keyframes tourSlideIn {
          from { opacity: 0; transform: scale(0.93) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px); }
        }
      `}</style>
    </div>
  );
}
