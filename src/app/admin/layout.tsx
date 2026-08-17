export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        aside[class*="w-[280px]"] nav { width: 100%; justify-items: stretch; align-items: stretch; }
        aside[class*="w-[280px]"] nav > a { width: 100%; min-width: 0; justify-content: flex-start; text-align: left; }
        aside[class*="w-[280px]"] nav > a > span:last-child { min-width: 0; text-align: left; }
        @media (max-width: 1023px) {
          aside[class*="w-[280px]"] { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>
      {children}
    </>
  );
}