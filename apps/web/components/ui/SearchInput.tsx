"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
}

// Debounced so every keystroke doesn't fire an API call - the same
// pattern every future table's search box should reuse rather than
// rolling its own debounce logic per screen.
export function SearchInput({ placeholder = "Search...", onSearch, debounceMs = 300 }: SearchInputProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-72">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-input border border-border py-2 pl-9 pr-3 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
