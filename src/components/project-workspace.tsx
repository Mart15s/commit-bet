"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LayoutDashboard, ListChecks, FileText, Layers3, ClipboardCheck } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import "@/app/workspace.css";

export function WorkspaceCopy({ en, lt }: { en: string; lt: string }) {
  const { language } = useI18n();
  return language === "lt" ? lt : en;
}

const sections = [
  { key: "overview", en: "Overview", lt: "Apžvalga", icon: LayoutDashboard },
  { key: "plan", en: "Plan", lt: "Planas", icon: Layers3 },
  { key: "tasks", en: "Tasks", lt: "Užduotys", icon: ListChecks },
  { key: "evidence", en: "Evidence", lt: "Įrodymai", icon: FileText },
  { key: "reviews", en: "Reviews", lt: "Peržiūros", icon: ClipboardCheck },
] as const;
type Section = typeof sections[number]["key"];

/** Server-rendered sections share the page's one authorized data fetch. */
export function ProjectWorkspace({ overview, plan, tasks, evidence, reviews, taskCount, reviewCount }: {
  overview: ReactNode; plan: ReactNode; tasks: ReactNode; evidence: ReactNode; reviews: ReactNode;
  taskCount: number; reviewCount: number;
}) {
  const { language } = useI18n();
  const [active, setActive] = useState<Section>("overview");
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const content = { overview, plan, tasks, evidence, reviews };
  useEffect(() => {
    const followHash = () => {
      const key = window.location.hash.slice(1);
      if (key === "edit-plan") setActive("plan");
      else if (sections.some((section) => section.key === key)) setActive(key as Section);
    };
    window.queueMicrotask(followHash);
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, []);
  useEffect(() => {
    if (active === "plan" && window.location.hash === "#edit-plan") {
      document.getElementById("edit-plan")?.scrollIntoView({ block: "start" });
    }
  }, [active]);
  function select(key: Section) {
    setActive(key);
    window.history.replaceState(null, "", `#${key}`);
  }
  return <div className="project-workspace">
    <div role="tablist" aria-label={language === "lt" ? "Projekto skyriai" : "Project sections"} className="workspace-tabs">
      {sections.map((section, index) => <button
        key={section.key} ref={(element) => { buttons.current[index] = element; }}
        type="button" role="tab" id={`${id}-${section.key}-tab`}
        aria-controls={`${id}-${section.key}-panel`} aria-selected={active === section.key}
        tabIndex={active === section.key ? 0 : -1} onClick={() => select(section.key)}
        onKeyDown={(event) => {
          let next: number | undefined;
          if (event.key === "ArrowRight") next = (index + 1) % sections.length;
          if (event.key === "ArrowLeft") next = (index - 1 + sections.length) % sections.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = sections.length - 1;
          if (next !== undefined) { event.preventDefault(); select(sections[next].key); buttons.current[next]?.focus(); }
        }}
      ><section.icon size={16} /><span>{language === "lt" ? section.lt : section.en}</span>
        {section.key === "tasks" && <span className="tab-count">{taskCount}</span>}
        {section.key === "reviews" && reviewCount > 0 && <span className="tab-count">{reviewCount}</span>}
      </button>)}
    </div>
    {sections.map((section) => <div key={section.key} role="tabpanel" id={`${id}-${section.key}-panel`}
      aria-labelledby={`${id}-${section.key}-tab`} hidden={active !== section.key} tabIndex={0} className={`workspace-panel workspace-panel-${section.key}`}>
      {content[section.key]}
    </div>)}
  </div>;
}
