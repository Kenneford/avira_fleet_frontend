// Wraps the fleet dashboard routes. Polls the backend status and shows a
// full-screen card to everyone EXCEPT the developer:
//   • maintenance.active → "we'll be right back" card (also blocks the API)
//   • payment.active     → "contact developer" card (informational only)
//
// The card only appears AFTER login — auth routes (/login, /verify) are never
// covered, so the developer can always sign in and reach the dev dashboard.
// The developer is auto-exempt because the API client sends their auth token,
// so the backend reports active=false for them.
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { maintenanceAPI } from "../api/client";
import MaintenanceScreen from "./MaintenanceScreen";

const AUTH_PREFIXES = ["/login", "/verify", "/reset", "/forgot", "/activate"];

const EMPTY = {
  maintenance: { active: false, message: "" },
  payment: { active: false, message: "", email: "" },
};

export default function MaintenanceGate({ children }) {
  const { pathname } = useLocation();
  const [status, setStatus] = useState(EMPTY);

  const onAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const data = await maintenanceAPI.status();
        if (!cancelled) {
          setStatus({
            maintenance: data?.maintenance || EMPTY.maintenance,
            payment: data?.payment || EMPTY.payment,
          });
        }
      } catch {
        if (!cancelled) setStatus(EMPTY);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [pathname]);

  if (onAuthRoute) return <>{children}</>;

  // Maintenance takes priority over the payment notice when both are on.
  if (status.maintenance.active) {
    return (
      <>
        {children}
        <MaintenanceScreen message={status.maintenance.message} />
      </>
    );
  }

  if (status.payment.active) {
    return (
      <>
        {children}
        <MaintenanceScreen
          heading="Temporarily unavailable"
          footer="Please check back soon"
          message={status.payment.message}
        />
      </>
    );
  }

  return <>{children}</>;
}
