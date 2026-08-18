import { AdminVerseShortcut } from "@/components/AdminVerseShortcut";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        /* Keep every admin navigation item on the same left edge. */
        aside[class*="w-[280px]"] nav {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          justify-content: flex-start !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        aside[class*="w-[280px]"] nav > a {
          display: flex !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          flex: 0 0 auto !important;
          align-items: center !important;
          justify-content: flex-start !important;
          text-align: left !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        aside[class*="w-[280px]"] nav > a > span:first-child {
          flex: 0 0 2rem !important;
          width: 2rem !important;
          min-width: 2rem !important;
          margin-left: 0 !important;
        }
        aside[class*="w-[280px]"] nav > a > span:last-child {
          min-width: 0 !important;
          text-align: left !important;
        }
        @media (max-width: 1023px) {
          aside[class*="w-[280px]"] {
            width: min(280px, 86vw) !important;
            max-width: 86vw !important;
          }
        }
      `}</style>
      {children}
      <AdminVerseShortcut />
    </>
  );
}