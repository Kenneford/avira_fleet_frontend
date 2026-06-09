// Full-screen status card. Defaults to the maintenance message; pass props to
// reuse it for other notices (e.g. the payment-issue "contact developer" card).
// Self-contained: pure React + inline styles + a scoped <style> block.
import { useEffect } from "react";

const CSS = `
@keyframes avmnt-fade-up {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes avmnt-spin { to { transform: rotate(360deg); } }
@keyframes avmnt-spin-rev { to { transform: rotate(-360deg); } }
@keyframes avmnt-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.08); opacity: 0.85; }
}
@keyframes avmnt-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
  50%      { box-shadow: 0 0 40px 10px rgba(220,38,38,0.18); }
}
@keyframes avmnt-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes avmnt-float {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(0, -22px); }
}
@keyframes avmnt-dot {
  0%, 80%, 100% { opacity: 0.25; }
  40%           { opacity: 1; }
}
.avmnt-root * { box-sizing: border-box; }
.avmnt-blob {
  position: absolute; border-radius: 50%; filter: blur(70px);
  opacity: 0.5; animation: avmnt-float 9s ease-in-out infinite;
}
`;

const Dot = ({ delay }) => (
  <span
    style={{
      width: 7, height: 7, borderRadius: "50%", background: "#dc2626",
      display: "inline-block", animation: `avmnt-dot 1.4s ease-in-out ${delay}s infinite`,
    }}
  />
);

const GearIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const MailIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export default function MaintenanceScreen({
  tag = "Avira",
  heading = "We’ll be right back",
  message = "We're carrying out scheduled maintenance to make Avira even better. We'll be back online shortly — thank you for your patience.",
  footer = "Maintenance in progress",
  email = null,
  icon = "gear",
}) {
  // Lock background scroll while the overlay is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="avmnt-root"
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background:
          "radial-gradient(1200px 600px at 50% -10%, #1c1c28 0%, #0b0b12 55%, #07070b 100%)",
        color: "#f5f5f7",
      }}
    >
      <style>{CSS}</style>

      <div className="avmnt-blob" style={{ width: 360, height: 360, top: "-80px", left: "-60px", background: "#dc2626", animationDelay: "0s" }} />
      <div className="avmnt-blob" style={{ width: 300, height: 300, bottom: "-90px", right: "-50px", background: "#7f1d1d", animationDelay: "1.5s" }} />

      <div
        style={{
          position: "relative", width: "100%", maxWidth: 480, textAlign: "center",
          padding: "44px 36px 36px",
          borderRadius: 24,
          background: "rgba(20,20,28,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          animation: "avmnt-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 26px" }}>
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid rgba(220,38,38,0.25)",
              borderTopColor: "#dc2626", borderRightColor: "#dc2626",
              animation: "avmnt-spin 3.5s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute", inset: 12, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.08)",
              borderBottomColor: "rgba(255,255,255,0.5)",
              animation: "avmnt-spin-rev 5s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute", inset: 26, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              animation: "avmnt-pulse 2.4s ease-in-out infinite, avmnt-glow 2.4s ease-in-out infinite",
            }}
          >
            {icon === "mail" ? <MailIcon /> : <GearIcon />}
          </div>
        </div>

        <div style={{ letterSpacing: "0.42em", fontSize: 13, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", marginBottom: 14 }}>
          {tag}
        </div>

        <h1 style={{ margin: "0 0 14px", fontSize: 27, fontWeight: 800, lineHeight: 1.2 }}>
          {heading}
        </h1>

        <p style={{ margin: "0 auto 26px", maxWidth: 380, fontSize: 15, lineHeight: 1.6, color: "rgba(245,245,247,0.72)" }}>
          {message}
        </p>

        {email && (
          <a
            href={`mailto:${email}`}
            style={{
              display: "inline-block", textDecoration: "none",
              padding: "11px 22px", borderRadius: 999, marginBottom: 24,
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(220,38,38,0.35)",
            }}
          >
            Contact developer · {email}
          </a>
        )}

        {!email && (
          <div style={{ position: "relative", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 22 }}>
            <div
              style={{
                position: "absolute", inset: 0, width: "45%",
                background: "linear-gradient(90deg, transparent, #dc2626, transparent)",
                animation: "avmnt-shimmer 1.8s ease-in-out infinite",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(245,245,247,0.55)", fontSize: 13 }}>
          <Dot delay={0} /><Dot delay={0.2} /><Dot delay={0.4} />
          <span style={{ marginLeft: 6 }}>{footer}</span>
        </div>
      </div>
    </div>
  );
}
