import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface Option {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (val: any) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- เลือกรายการ --",
  disabled = false,
  required = false,
  className = ""
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm flex items-center justify-between cursor-pointer transition-all bg-white shadow-sm ${
          disabled ? "bg-slate-100 cursor-not-allowed opacity-75" : "hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
        } ${isOpen ? "border-blue-500 ring-2 ring-blue-100" : ""}`}
      >
        <span className={`truncate ${selectedOption ? "font-bold text-slate-800" : "text-slate-400 font-normal"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !required && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหา..."
              className="w-full text-xs font-medium focus:outline-none bg-transparent text-slate-800"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[10px] text-slate-400 font-bold hover:text-slate-600">
                ล้าง
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                  }`}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.sublabel && <div className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</div>}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </div>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                ไม่พบรายการที่ค้นหา
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
