"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { ChipOption } from "@/lib/onboarding-options";
import { cn } from "@/lib/utils";

type Translate = (key: string) => string;

function optionLabel(option: ChipOption, t: Translate) {
  return t(option.labelKey);
}

function selectedLabel(value: string, options: ChipOption[], t: Translate) {
  return optionLabel(options.find((option) => option.value === value) ?? { value, labelKey: value }, t);
}

export function MultiChipField({
  label,
  helper,
  options,
  value,
  onChange,
  t,
  required,
}: {
  label: string;
  helper?: string;
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  t: Translate;
  required?: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [message, setMessage] = useState("");

  function toggle(nextValue: string) {
    setMessage("");
    if (value.includes(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }
    onChange([...value, nextValue]);
  }

  function addCustom() {
    const trimmed = customValue.trim();
    if (!trimmed) {
      setMessage(t("onboarding.validation.customRequired"));
      return;
    }
    if (value.some((item) => item.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
      setMessage(t("onboarding.validation.duplicateCustom"));
      return;
    }
    onChange([...value, trimmed]);
    setCustomValue("");
    setCustomOpen(false);
    setMessage("");
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="font-black text-foreground">
        {label}
        {required && <span className="text-amber-300"> *</span>}
      </legend>
      {helper && <p className="-mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={t("onboarding.selectedOptions")}>
          {value.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(value.filter((selected) => selected !== item))}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-3 py-1.5 text-left text-xs font-black text-violet-100"
            >
              <span className="truncate">{selectedLabel(item, options, t)}</span>
              <X size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-black transition sm:text-sm",
                selected
                  ? "border-primary bg-primary/20 text-violet-100 shadow-[0_0_18px_rgba(124,58,237,.16)]"
                  : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground",
              )}
              aria-pressed={selected}
            >
              <span className="truncate">{optionLabel(option, t)}</span>
              {option.recommended && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] uppercase text-amber-200">{t("common.recommended")}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setCustomOpen((open) => !open);
            setMessage("");
          }}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15 sm:text-sm"
        >
          <Plus size={15} />
          {t("common.addCustom")}
        </button>
      </div>

      {customOpen && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            placeholder={t("onboarding.customPlaceholder")}
          />
          <button
            type="button"
            onClick={addCustom}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 font-black text-cyan-100"
          >
            <Plus size={16} />
            {t("common.add")}
          </button>
        </div>
      )}
      {message && <p className="text-sm font-bold text-amber-200">{message}</p>}
    </fieldset>
  );
}

export function SingleChipField({
  label,
  helper,
  options,
  value,
  onChange,
  t,
  required,
  allowCustom = true,
}: {
  label: string;
  helper?: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  t: Translate;
  required?: boolean;
  allowCustom?: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [message, setMessage] = useState("");

  function addCustom() {
    const trimmed = customValue.trim();
    if (!trimmed) {
      setMessage(t("onboarding.validation.customRequired"));
      return;
    }
    if (value.toLocaleLowerCase() === trimmed.toLocaleLowerCase()) {
      setMessage(t("onboarding.validation.duplicateCustom"));
      return;
    }
    onChange(trimmed);
    setCustomValue("");
    setCustomOpen(false);
    setMessage("");
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="font-black text-foreground">
        {label}
        {required && <span className="text-amber-300"> *</span>}
      </legend>
      {helper && <p className="-mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>}

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-3 py-1.5 text-left text-xs font-black text-violet-100"
        >
          <span className="truncate">{selectedLabel(value, options, t)}</span>
          <X size={13} aria-hidden="true" />
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setMessage("");
              }}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-black transition sm:text-sm",
                selected
                  ? "border-primary bg-primary/20 text-violet-100 shadow-[0_0_18px_rgba(124,58,237,.16)]"
                  : "border-border bg-secondary text-muted-foreground hover:bg-elevated hover:text-foreground",
              )}
              aria-pressed={selected}
            >
              <span className="truncate">{optionLabel(option, t)}</span>
              {option.recommended && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] uppercase text-amber-200">{t("common.recommended")}</span>}
            </button>
          );
        })}
        {allowCustom && (
          <button
            type="button"
            onClick={() => {
              setCustomOpen((open) => !open);
              setMessage("");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15 sm:text-sm"
          >
            <Plus size={15} />
            {t("common.addCustom")}
          </button>
        )}
      </div>

      {customOpen && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            placeholder={t("onboarding.customPlaceholder")}
          />
          <button
            type="button"
            onClick={addCustom}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 font-black text-cyan-100"
          >
            <Plus size={16} />
            {t("common.add")}
          </button>
        </div>
      )}
      {message && <p className="text-sm font-bold text-amber-200">{message}</p>}
    </fieldset>
  );
}
