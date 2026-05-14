import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw, X, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface UpdateInfo {
  version: string;
  releaseNotes: string;
  mandatory: boolean;
}

type UpdatePhase = "idle" | "ready" | "installing";

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [showNotes, setShowNotes] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.idDaddy?.onUpdateDownloaded) return;

    const cleanup = window.idDaddy.onUpdateDownloaded((info) => {
      setUpdateInfo(info);
      setPhase("ready");
      // Slide in after a short delay so the app has painted
      setTimeout(() => setVisible(true), 400);
    });

    // Tell main process we're ready — it will re-send cached update info if any
    window.idDaddy?.rendererReady?.();

    return () => {
      cleanup?.();
    };
  }, []);

  const handleInstall = useCallback(async () => {
    setPhase("installing");
    await window.idDaddy?.installUpdate();
  }, []);

  const handleLater = useCallback(async () => {
    if (!updateInfo?.mandatory) {
      setVisible(false);
      setTimeout(async () => {
        setUpdateInfo(null);
        setPhase("idle");
        await window.idDaddy?.dismissUpdate();
      }, 350);
    }
  }, [updateInfo]);

  if (!updateInfo || phase === "idle") return null;

  const isMandatory = updateInfo.mandatory;
  const isInstalling = phase === "installing";
  const hasNotes = updateInfo.releaseNotes?.trim().length > 0;

  return (
    <>
      {/* Backdrop — only shown for mandatory */}
      {isMandatory && (
        <div
          className="update-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.35s ease"
          }}
        />
      )}

      {/* Notification card */}
      <div
        style={{
          position: "fixed",
          bottom: isMandatory ? "auto" : "24px",
          top: isMandatory ? "50%" : "auto",
          right: isMandatory ? "auto" : "24px",
          left: isMandatory ? "50%" : "auto",
          transform: isMandatory
            ? visible ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.92)"
            : visible ? "translateY(0)" : "translateY(120px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
          zIndex: 9999,
          width: isMandatory ? "min(460px, 92vw)" : "min(400px, 92vw)",
          fontFamily: "'Inter', 'Segoe UI', sans-serif"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f9fdf9 100%)",
            borderRadius: "24px",
            border: "1.5px solid rgba(26,93,26,0.15)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(26,93,26,0.08)",
            overflow: "hidden"
          }}
        >
          {/* Header bar */}
          <div
            style={{
              background: isMandatory
                ? "linear-gradient(135deg, #b45309 0%, #d97706 100%)"
                : "linear-gradient(135deg, #1a5d1a 0%, #2d7a2d 100%)",
              padding: "18px 20px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              position: "relative"
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {isMandatory
                ? <AlertTriangle size={20} color="white" />
                : <Sparkles size={20} color="white" />
              }
            </div>

            {/* Title + subtitle */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: "white", fontWeight: 800, fontSize: "15px", lineHeight: 1.2 }}>
                {isMandatory ? "Mandatory Update Required" : "Update Available"}
              </p>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "12px" }}>
                Version <span style={{ fontWeight: 800, color: "white" }}>v{updateInfo.version}</span> is ready to install
              </p>
            </div>

            {/* Close button — only for optional */}
            {!isMandatory && !isInstalling && (
              <button
                onClick={handleLater}
                title="Dismiss"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "8px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                <X size={14} color="white" />
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: "20px" }}>
            {/* Mandatory notice */}
            {isMandatory && (
              <div
                style={{
                  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                  border: "1px solid #f59e0b",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <AlertTriangle size={14} color="#92400e" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#92400e" }}>
                  This update is required to continue using the app. It will install automatically when you close the app.
                </p>
              </div>
            )}

            {/* Release notes toggle */}
            {hasNotes && (
              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={() => setShowNotes(v => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    color: "#1a5d1a",
                    fontWeight: 700,
                    fontSize: "12px",
                    marginBottom: showNotes ? "10px" : "0"
                  }}
                >
                  {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showNotes ? "Hide" : "Show"} Release Notes
                </button>

                {showNotes && (
                  <div
                    style={{
                      background: "#f8faf8",
                      border: "1px solid #e0ede0",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      maxHeight: "180px",
                      overflowY: "auto",
                      fontSize: "12px",
                      lineHeight: "1.7",
                      color: "#374151",
                      fontWeight: 500,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}
                    dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }}
                  />
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Install / Restart button */}
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "12px",
                  border: "none",
                  background: isInstalling
                    ? "linear-gradient(135deg, #6b7280, #9ca3af)"
                    : isMandatory
                      ? "linear-gradient(135deg, #b45309, #d97706)"
                      : "linear-gradient(135deg, #1a5d1a, #2d7a2d)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: isInstalling ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  transform: "scale(1)",
                  boxShadow: isInstalling ? "none" : "0 4px 12px rgba(26,93,26,0.3)"
                }}
                onMouseEnter={e => {
                  if (!isInstalling) e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isInstalling ? (
                  <>
                    <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />
                    Installing…
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    {isMandatory ? "Install Now" : "Install & Restart"}
                  </>
                )}
              </button>

              {/* Later button — only for optional */}
              {!isMandatory && !isInstalling && (
                <button
                  onClick={handleLater}
                  style={{
                    height: "44px",
                    paddingInline: "20px",
                    borderRadius: "12px",
                    border: "1.5px solid #e0ede0",
                    background: "white",
                    color: "#374151",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e0ede0";
                  }}
                >
                  Later
                </button>
              )}
            </div>

            {/* Mandatory: install on close hint */}
            {isMandatory && !isInstalling && (
              <p
                style={{
                  margin: "12px 0 0",
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#9ca3af"
                }}
              >
                Closing the app will automatically install the update.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
