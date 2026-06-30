"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { matchesSearch } from "@/lib/string/normalize-search";
import { useTranslations } from "@/lib/i18n/use-translator";
import { formatPersonName, type Person } from "@/types/person";

type PersonSelectEmptyOption = {
  value: string;
  label: string;
};

type PersonSelectProps = {
  id?: string;
  className?: string;
  persons: Person[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyOption?: PersonSelectEmptyOption;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

export function PersonSelect({
  id,
  className,
  persons,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  emptyOption,
}: PersonSelectProps) {
  const t = useTranslations();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const selectedPerson = persons.find((person) => person.id === value);
  const selectedLabel =
    emptyOption && value === emptyOption.value
      ? emptyOption.label
      : selectedPerson
        ? formatPersonName(selectedPerson)
        : null;

  const normalizedQuery = query.trim();
  const filteredPersons = persons.filter((person) =>
    matchesSearch(formatPersonName(person), normalizedQuery),
  );

  const showEmptyOption =
    emptyOption &&
    (!normalizedQuery || matchesSearch(emptyOption.label, normalizedQuery));

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
      setQuery("");
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(nextValue: string) {
    onValueChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  function closeDropdown() {
    setOpen(false);
    setQuery("");
    setPosition(null);
  }

  const dropdown =
    open && position
      ? createPortal(
          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="bg-popover text-popover-foreground fixed z-50 rounded-md border p-1 shadow-md"
          >
            <div className="p-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("tree.searchPlaceholder")}
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-1">
              {showEmptyOption && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === emptyOption.value}
                  className={cn(
                    "hover:bg-accent flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
                    value === emptyOption.value && "bg-accent",
                  )}
                  onClick={() => handleSelect(emptyOption.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      value === emptyOption.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{emptyOption.label}</span>
                </button>
              )}

              {filteredPersons.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  role="option"
                  aria-selected={value === person.id}
                  className={cn(
                    "hover:bg-accent flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
                    value === person.id && "bg-accent",
                  )}
                  onClick={() => handleSelect(person.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      value === person.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{formatPersonName(person)}</span>
                </button>
              ))}

              {!showEmptyOption && filteredPersons.length === 0 && (
                <p className="text-muted-foreground px-2 py-1.5 text-sm">
                  {t("person.noResults")}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={triggerRef}
        id={triggerId}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        className={cn(
          "border-input dark:bg-input/30 h-9 w-full justify-between bg-transparent font-normal shadow-xs",
          !selectedLabel && "text-muted-foreground",
        )}
        onClick={() => {
          if (open) {
            closeDropdown();
            return;
          }

          setOpen(true);
        }}
      >
        <span className="truncate">
          {selectedLabel ?? placeholder ?? t("relationship.selectPerson")}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </Button>

      {dropdown}
    </div>
  );
}
