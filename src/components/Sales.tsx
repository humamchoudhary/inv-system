"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Mic,
  Trash2,
  Check,
  X,
  Package,
  BarChart2,
  Clock,
  SlidersHorizontal,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  Tag,
  DollarSign,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SheetSummary = {
  id: string;
  name: string;
  createdAt: Date | null;
};

export type SaleEntry = {
  id: string;
  name: string;
  price: number;
  createdAt: Date | null;
  sheetId: string;
  transcriptionText?: string;
};

type TranscriptionGroup = {
  transcriptionId: string;
  transcriptionText: string;
  createdAt: Date | null;
  sheetId: string;
  items: SaleEntry[];
  total: number;
};

type ItemSummary = {
  name: string;
  qtySold: number;
  totalRevenue: number;
  avgPrice: number;
};

type ViewMode = "by-sale" | "by-item";
type DateFilter = "today" | "week" | "month" | "all";
type SortField = "name" | "price" | "qty";
type SortDir = "asc" | "desc";

interface AdvancedFilters {
  itemName: string;
  minPrice: string;
  maxPrice: string;
  dateFrom: string;
  dateTo: string;
  sheetId: string;
}

interface SalesPageProps {
  sheets: SheetSummary[];
  sales: SaleEntry[];
  currencyCode?: string;
  businessName?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatCurrency(amount: number, code = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}

function formatTime(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date | null) {
  if (!date) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isInQuickRange(date: Date | null, filter: DateFilter): boolean {
  if (!date || filter === "all") return true;
  const now = new Date();
  const d = new Date(date);
  if (filter === "today") return d.toDateString() === now.toDateString();
  const cutoff = new Date(now);
  if (filter === "week") cutoff.setDate(now.getDate() - 7);
  if (filter === "month") cutoff.setDate(now.getDate() - 30);
  return d >= cutoff;
}

function groupIntoSessions(sales: SaleEntry[]): TranscriptionGroup[] {
  const grouped = new Map<string, TranscriptionGroup>();
  for (const sale of sales) {
    const minuteKey = sale.createdAt
      ? `${sale.sheetId}__${Math.floor(new Date(sale.createdAt).getTime() / 60000)}`
      : `${sale.sheetId}__unknown`;
    if (!grouped.has(minuteKey)) {
      grouped.set(minuteKey, {
        transcriptionId: minuteKey,
        transcriptionText: sale.transcriptionText ?? "",
        createdAt: sale.createdAt,
        sheetId: sale.sheetId,
        items: [],
        total: 0,
      });
    }
    const g = grouped.get(minuteKey)!;
    g.items.push(sale);
    g.total += sale.price;
    if (sale.transcriptionText && !g.transcriptionText)
      g.transcriptionText = sale.transcriptionText;
  }
  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function buildItemSummary(sales: SaleEntry[]): ItemSummary[] {
  const map = new Map<string, ItemSummary>();
  for (const sale of sales) {
    const key = sale.name.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, {
        name: sale.name,
        qtySold: 0,
        totalRevenue: 0,
        avgPrice: 0,
      });
    }
    const item = map.get(key)!;
    item.qtySold += 1;
    item.totalRevenue += sale.price;
  }
  return Array.from(map.values()).map((i) => ({
    ...i,
    avgPrice: i.totalRevenue / i.qtySold,
  }));
}

const DATE_FILTERS: { label: string; value: DateFilter }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "30 Days", value: "month" },
  { label: "All", value: "all" },
];

const DEFAULT_FILTERS: AdvancedFilters = {
  itemName: "",
  minPrice: "",
  maxPrice: "",
  dateFrom: "",
  dateTo: "",
  sheetId: "all",
};

// ─────────────────────────────────────────────
// InlineEdit — click-to-edit any value
// ─────────────────────────────────────────────

function InlineEdit({
  value,
  type = "text",
  onSave,
  className = "",
  placeholder = "",
}: {
  value: string;
  type?: "text" | "number";
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if parent value changes (e.g. after save round-trip)
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`group/ie flex items-center gap-1 text-left min-w-0 transition-colors duration-100 hover:text-[#ff79c6] ${className}`}
        title="Click to edit"
      >
        <span className="truncate">
          {value || <span className="italic opacity-40">{placeholder}</span>}
        </span>
        <Pencil className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover/ie:opacity-50 transition-opacity ml-0.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="flex-1 min-w-0 px-2 py-1 text-sm rounded-lg border border-[#ff79c6] bg-white text-[#171717] outline-none ring-2 ring-[#ff79c6]/20"
        placeholder={placeholder}
      />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          commit();
        }}
        className="w-6 h-6 rounded-md bg-[#ff79c6] flex items-center justify-center shrink-0 shadow-sm shadow-[#ff79c6]/30"
      >
        <Check className="w-3 h-3 text-white" />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          cancel();
        }}
        className="w-6 h-6 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0"
      >
        <X className="w-3 h-3 text-[#171717]/50" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ambient
// ─────────────────────────────────────────────

function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0">
      <div className="absolute top-[-10%] right-[-15%] w-[420px] h-[420px] rounded-full bg-[#ffb3d9] opacity-[0.12] blur-[120px]" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#ff79c6] opacity-[0.07] blur-[100px]" />
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-[#f0f0f0] flex items-center justify-center">
        <Package className="w-5 h-5 text-[#171717]/30" />
      </div>
      <p className="text-sm font-medium text-[#171717]/50">{message}</p>
      {sub && <p className="text-xs text-[#171717]/30">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sale item row — inside expanded session card
// ─────────────────────────────────────────────

function SaleItemRow({
  item,
  currencyCode,
  onUpdate,
  onDelete,
}: {
  item: SaleEntry;
  currencyCode: string;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="grid grid-cols-[1fr_120px_36px] items-center gap-2 px-5 py-3 border-b border-[#f0f0f0] last:border-0 group/row bg-white hover:bg-[#fdfcff] transition-colors duration-100">
      {/* Name */}
      <InlineEdit
        value={item.name}
        type="text"
        placeholder="Item name"
        onSave={(v) => onUpdate(item.id, "name", v)}
        className="text-sm text-[#171717]"
      />

      {/* Price */}
      <InlineEdit
        value={String(item.price)}
        type="number"
        placeholder="0"
        onSave={(v) => onUpdate(item.id, "price", v)}
        className="text-sm font-semibold text-[#171717] tabular-nums justify-end"
      />

      {/* Delete */}
      <div className="flex items-center justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onDelete(item.id);
                setConfirmDelete(false);
              }}
              className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white" />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-6 h-6 rounded-lg bg-[#f0f0f0] flex items-center justify-center"
            >
              <X className="w-3 h-3 text-[#171717]/50" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#171717]/20 hover:text-red-400 hover:bg-red-50 transition-colors duration-150 opacity-0 group-hover/row:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Session card
// ─────────────────────────────────────────────

function SaleSessionCard({
  group,
  sheetName,
  currencyCode,
  onUpdateItem,
  onDeleteItem,
}: {
  group: TranscriptionGroup;
  sheetName: string;
  currencyCode: string;
  onUpdateItem: (id: string, field: "name" | "price", value: string) => void;
  onDeleteItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const preview =
    group.items
      .map((i) => i.name)
      .slice(0, 3)
      .join(", ") +
    (group.items.length > 3 ? ` +${group.items.length - 3}` : "");

  const liveTotal = group.items.reduce((s, i) => s + i.price, 0);

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
        expanded
          ? "border-[#ffb3d9]/60 shadow-md shadow-[#ff79c6]/08"
          : "border-[#f0f0f0] hover:border-[#ffb3d9]/40"
      }`}
    >
      {/* Clickable header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest">
              {formatDate(group.createdAt)}
            </span>
            <span className="text-[#171717]/15">·</span>
            <span className="text-[10px] text-[#171717]/30">
              {formatTime(group.createdAt)}
            </span>
            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0f0f0]/60 border border-[#f0f0f0] shrink-0">
              <FileText className="w-2.5 h-2.5 text-[#171717]/25" />
              <span className="text-[9px] text-[#171717]/35 font-medium">
                {sheetName}
              </span>
            </span>
          </div>
          {/* Preview */}
          <p className="text-sm text-[#171717] font-medium truncate">
            {preview}
          </p>
          {group.transcriptionText && (
            <p className="text-xs text-[#171717]/30 italic mt-0.5 truncate">
              "{group.transcriptionText}"
            </p>
          )}
        </div>

        {/* Right: total + chevron */}
        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
          <p className="text-sm font-bold text-[#171717] tabular-nums">
            {formatCurrency(liveTotal, currencyCode)}
          </p>
          <div className="flex items-center gap-1 text-[#171717]/25">
            <span className="text-[10px]">{group.items.length} items</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded — editable rows */}
      {expanded && (
        <div className="border-t border-[#f0f0f0]">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_120px_36px] gap-2 px-5 py-2 bg-[#fafafa] border-b border-[#f0f0f0]">
            <span className="text-[10px] font-semibold text-[#171717]/30 uppercase tracking-wider">
              Item
            </span>
            <span className="text-[10px] font-semibold text-[#171717]/30 uppercase tracking-wider text-right">
              Price
            </span>
            <span />
          </div>

          {group.items.map((item) => (
            <SaleItemRow
              key={item.id}
              item={item}
              currencyCode={currencyCode}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
            />
          ))}

          {/* Total footer */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#fafafa] border-t border-[#f0f0f0]">
            <span className="text-xs font-semibold text-[#171717]/35 uppercase tracking-wider">
              Total
            </span>
            <span className="text-sm font-bold text-[#ff79c6] tabular-nums">
              {formatCurrency(liveTotal, currencyCode)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Item summary row (By Item view)
// ─────────────────────────────────────────────

function ItemSummaryRow({
  item,
  totalRevenue,
  currencyCode,
}: {
  item: ItemSummary;
  totalRevenue: number;
  currencyCode: string;
}) {
  const pct = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-0 hover:bg-[#fdfcff] transition-colors duration-100">
      <div className="w-8 h-8 rounded-xl bg-[#ff79c6]/10 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-[#ff79c6]">
          {item.name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#171717] truncate">
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 flex-1 rounded-full bg-[#f0f0f0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff79c6] to-[#ffb3d9] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-[#171717]/30 tabular-nums w-7 text-right shrink-0">
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <p className="text-sm font-bold text-[#171717] tabular-nums">
          {formatCurrency(item.totalRevenue, currencyCode)}
        </p>
        <p className="text-[10px] text-[#171717]/40 text-right">
          {item.qtySold} {item.qtySold === 1 ? "sale" : "sales"} · avg{" "}
          {formatCurrency(item.avgPrice, currencyCode)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sort button
// ─────────────────────────────────────────────

function SortBtn({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: () => void;
}) {
  const active = current === field;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150 ${
        active ? "text-[#ff79c6]" : "text-[#171717]/30 hover:text-[#171717]/50"
      }`}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// Advanced Filter Panel
// ─────────────────────────────────────────────

function FilterPanel({
  filters,
  sheets,
  onChange,
  onClear,
  activeCount,
}: {
  filters: AdvancedFilters;
  sheets: SheetSummary[];
  onChange: (f: Partial<AdvancedFilters>) => void;
  onClear: () => void;
  activeCount: number;
}) {
  const inputCls =
    "w-full px-3 py-2.5 text-sm rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/25 outline-none focus:border-[#ff79c6] focus:bg-white focus:ring-2 focus:ring-[#ff79c6]/15 transition-all duration-200";

  return (
    <div
      className="bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm"
      style={{ animation: "fadeUp 0.2s ease both" }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff79c6]" />
          <span className="text-xs font-semibold text-[#171717]">
            Advanced Filters
          </span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#ff79c6] text-white text-[9px] font-bold">
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-[#171717]/40 hover:text-[#ff79c6] transition-colors font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Item name search */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
            <Tag className="w-3 h-3" /> Item name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#171717]/25 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Shirt, Cap, Trouser…"
              value={filters.itemName}
              onChange={(e) => onChange({ itemName: e.target.value })}
              className={`${inputCls} pl-9 pr-8`}
            />
            {filters.itemName && (
              <button
                onClick={() => onChange({ itemName: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-[#171717]/25 hover:text-[#171717]/60 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Price range */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
            <DollarSign className="w-3 h-3" /> Price range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className={inputCls}
            />
            <span className="text-[#171717]/20 shrink-0">–</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        {/* Custom date range */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
            <CalendarDays className="w-3 h-3" /> Date range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
              className={inputCls}
            />
            <span className="text-[#171717]/20 shrink-0">–</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              className={inputCls}
            />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <p className="text-[10px] text-[#ff79c6] mt-1.5">
              Custom range overrides quick-date pills above.
            </p>
          )}
        </div>

        {/* Sheet filter */}
        {sheets.length > 1 && (
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
              <FileText className="w-3 h-3" /> Sheet
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onChange({ sheetId: "all" })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  filters.sheetId === "all"
                    ? "bg-[#ff79c6] text-white shadow-sm shadow-[#ff79c6]/25"
                    : "bg-[#f0f0f0]/70 text-[#171717]/50 hover:text-[#171717]/70"
                }`}
              >
                All sheets
              </button>
              {sheets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ sheetId: s.id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    filters.sheetId === s.id
                      ? "bg-[#ff79c6] text-white shadow-sm shadow-[#ff79c6]/25"
                      : "bg-[#f0f0f0]/70 text-[#171717]/50 hover:text-[#171717]/70"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function SalesPage({
  sheets,
  sales,
  currencyCode = "USD",
  businessName = "My Shop",
}: SalesPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("by-sale");
  const [quickDate, setQuickDate] = useState<DateFilter>("week");
  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] =
    useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("qty");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Optimistic local state
  const [localSales, setLocalSales] = useState<SaleEntry[]>(sales);

  // ── Filtering ──────────────────────────────────

  const filteredSales = useMemo(() => {
    const hasAdvDate = !!(advFilters.dateFrom || advFilters.dateTo);

    return localSales.filter((sale) => {
      // Quick date (only when no custom range)
      if (!hasAdvDate && !isInQuickRange(sale.createdAt, quickDate))
        return false;

      // Custom date range
      if (advFilters.dateFrom) {
        const from = new Date(advFilters.dateFrom);
        if (!sale.createdAt || new Date(sale.createdAt) < from) return false;
      }
      if (advFilters.dateTo) {
        const to = new Date(advFilters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (!sale.createdAt || new Date(sale.createdAt) > to) return false;
      }

      // Item name search
      if (advFilters.itemName) {
        const q = advFilters.itemName.toLowerCase();
        if (
          !sale.name.toLowerCase().includes(q) &&
          !(sale.transcriptionText ?? "").toLowerCase().includes(q)
        )
          return false;
      }

      // Price range
      if (advFilters.minPrice && sale.price < parseFloat(advFilters.minPrice))
        return false;
      if (advFilters.maxPrice && sale.price > parseFloat(advFilters.maxPrice))
        return false;

      // Sheet
      if (advFilters.sheetId !== "all" && sale.sheetId !== advFilters.sheetId)
        return false;

      return true;
    });
  }, [localSales, quickDate, advFilters]);

  // ── By-Sale grouping ───────────────────────────

  const sessions = useMemo(
    () => groupIntoSessions(filteredSales),
    [filteredSales],
  );

  const sessionsByDate = useMemo(() => {
    const groups: { label: string; sessions: TranscriptionGroup[] }[] = [];
    let currentLabel = "";
    for (const s of sessions) {
      const label = formatDate(s.createdAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, sessions: [] });
      }
      groups[groups.length - 1].sessions.push(s);
    }
    return groups;
  }, [sessions]);

  // ── By-Item aggregation ────────────────────────

  const itemSummaries = useMemo(() => {
    const raw = buildItemSummary(filteredSales);
    return [...raw].sort((a, b) => {
      if (sortField === "name")
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      if (sortField === "price")
        return sortDir === "asc"
          ? a.totalRevenue - b.totalRevenue
          : b.totalRevenue - a.totalRevenue;
      // qty
      return sortDir === "asc" ? a.qtySold - b.qtySold : b.qtySold - a.qtySold;
    });
  }, [filteredSales, sortField, sortDir]);

  const totalFilteredRevenue = useMemo(
    () => filteredSales.reduce((s, e) => s + e.price, 0),
    [filteredSales],
  );

  const sheetMap = useMemo(
    () => new Map(sheets.map((s) => [s.id, s.name])),
    [sheets],
  );

  const stats = useMemo(
    () => ({
      revenue: totalFilteredRevenue,
      items: filteredSales.length,
      entries: sessions.length,
    }),
    [totalFilteredRevenue, filteredSales.length, sessions.length],
  );

  const advActiveCount = useMemo(() => {
    let n = 0;
    if (advFilters.itemName) n++;
    if (advFilters.minPrice || advFilters.maxPrice) n++;
    if (advFilters.dateFrom || advFilters.dateTo) n++;
    if (advFilters.sheetId !== "all") n++;
    return n;
  }, [advFilters]);

  // ── Mutations ──────────────────────────────────

  const handleUpdateItem = useCallback(
    async (id: string, field: "name" | "price", value: string) => {
      setLocalSales((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                [field]: field === "price" ? parseFloat(value) || 0 : value,
              }
            : s,
        ),
      );
      try {
        const sale = localSales.find((s) => s.id === id);
        if (!sale) return;
        await fetch(`/api/sales/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: field === "name" ? value : sale.name,
            price: field === "price" ? parseFloat(value) : sale.price,
          }),
        });
      } catch {
        /* silent */
      }
    },
    [localSales],
  );

  const handleDeleteItem = useCallback(async (id: string) => {
    setLocalSales((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/sales/${id}`, { method: "DELETE" });
    } catch {
      /* silent */
    }
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-5 pt-10 pb-4"
        style={{ animation: "fadeDown 0.4s ease both" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0f0f0] hover:bg-[#ffb3d9]/30 transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-[#171717]/60" />
          </a>
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-[#171717] leading-tight">
              Sales & Inventory
            </h1>
            <p className="text-[11px] text-[#171717]/40">{businessName}</p>
          </div>
        </div>
        <a
          href="/record"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ff79c6] text-white text-xs font-semibold shadow-md shadow-[#ff79c6]/30 hover:bg-[#ff79c6]/90 active:scale-[0.97] transition-all duration-200"
        >
          <Mic className="w-3.5 h-3.5" />
          Record
        </a>
      </header>

      <div className="relative z-10 mx-5 h-px bg-[#f0f0f0]" />

      {/* Summary stats */}
      <div
        className="relative z-10 mx-5 mt-4 grid grid-cols-2 rounded-2xl border border-[#f0f0f0] bg-white overflow-hidden shadow-sm shadow-black/[0.03]"
        style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
      >
        {[
          {
            label: "Revenue",
            value: formatCurrency(stats.revenue, currencyCode),
          },
          { label: "Items", value: stats.items },
          // { label: "Entries", value: stats.entries },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`px-4 py-3 flex flex-col gap-0.5 ${i < 2 ? "border-r border-[#f0f0f0]" : ""}`}
          >
            <p className="text-base font-bold text-[#171717] tabular-nums">
              {s.value}
            </p>
            <p className="text-[10px] text-[#171717]/40 uppercase tracking-wider">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div
        className="relative z-10 px-5 mt-4 flex flex-col gap-3"
        style={{ animation: "fadeUp 0.4s 0.1s ease both" }}
      >
        {/* Row 1: quick date + filter button */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {DATE_FILTERS.map((f) => {
              const hasAdvDate = !!(advFilters.dateFrom || advFilters.dateTo);
              const active = !hasAdvDate && quickDate === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => {
                    setQuickDate(f.value);
                    setAdvFilters((p) => ({ ...p, dateFrom: "", dateTo: "" }));
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    active
                      ? "bg-[#171717] text-white"
                      : "bg-[#f0f0f0]/70 text-[#171717]/50 hover:text-[#171717]/70"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              showFilters || advActiveCount > 0
                ? "bg-[#ff79c6]/10 text-[#ff79c6] border-[#ff79c6]/30"
                : "bg-[#f0f0f0]/70 text-[#171717]/50 border-transparent"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Filter
            {advActiveCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ff79c6] text-white text-[9px] font-bold flex items-center justify-center">
                {advActiveCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced filter panel */}
        {showFilters && (
          <FilterPanel
            filters={advFilters}
            sheets={sheets}
            onChange={(partial) =>
              setAdvFilters((prev) => ({ ...prev, ...partial }))
            }
            onClear={() => setAdvFilters(DEFAULT_FILTERS)}
            activeCount={advActiveCount}
          />
        )}

        {/* Row 2: view toggle + active filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl bg-[#f0f0f0]/70 p-0.5">
            <button
              onClick={() => setViewMode("by-sale")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                viewMode === "by-sale"
                  ? "bg-white text-[#171717] shadow-sm"
                  : "text-[#171717]/40 hover:text-[#171717]/60"
              }`}
            >
              <Clock className="w-3 h-3" />
              By Sale
            </button>
            <button
              onClick={() => setViewMode("by-item")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                viewMode === "by-item"
                  ? "bg-white text-[#171717] shadow-sm"
                  : "text-[#171717]/40 hover:text-[#171717]/60"
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              By Item
            </button>
          </div>

          {/* Active filter chips (dismissible) */}
          {advFilters.itemName && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff79c6]/10 border border-[#ff79c6]/20 text-[10px] text-[#ff79c6] font-medium">
              <Tag className="w-2.5 h-2.5" />"{advFilters.itemName}"
              <button
                onClick={() => setAdvFilters((p) => ({ ...p, itemName: "" }))}
                className="ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {(advFilters.minPrice || advFilters.maxPrice) && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff79c6]/10 border border-[#ff79c6]/20 text-[10px] text-[#ff79c6] font-medium">
              <DollarSign className="w-2.5 h-2.5" />
              {advFilters.minPrice || "0"} – {advFilters.maxPrice || "∞"}
              <button
                onClick={() =>
                  setAdvFilters((p) => ({ ...p, minPrice: "", maxPrice: "" }))
                }
                className="ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {advFilters.sheetId !== "all" && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff79c6]/10 border border-[#ff79c6]/20 text-[10px] text-[#ff79c6] font-medium">
              <FileText className="w-2.5 h-2.5" />
              {sheetMap.get(advFilters.sheetId) ?? "Sheet"}
              <button
                onClick={() => setAdvFilters((p) => ({ ...p, sheetId: "all" }))}
                className="ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-5 mt-4 pb-28"
        style={{ animation: "fadeUp 0.4s 0.15s ease both" }}
      >
        {/* ── BY SALE ── */}
        {viewMode === "by-sale" && (
          <>
            {sessions.length === 0 ? (
              <EmptyState
                message="No sales found"
                sub="Try changing your filters or record a new sale"
              />
            ) : (
              <div className="flex flex-col gap-5">
                {sessionsByDate.map(({ label, sessions: daySessions }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-[#171717]/25 uppercase tracking-widest mb-2">
                      {label}
                    </p>
                    <div className="flex flex-col gap-2">
                      {daySessions.map((group) => (
                        <SaleSessionCard
                          key={group.transcriptionId}
                          group={group}
                          sheetName={sheetMap.get(group.sheetId) ?? "Sheet"}
                          currencyCode={currencyCode}
                          onUpdateItem={handleUpdateItem}
                          onDeleteItem={handleDeleteItem}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BY ITEM ── */}
        {viewMode === "by-item" && (
          <>
            {itemSummaries.length === 0 ? (
              <EmptyState
                message="No items found"
                sub="Try changing your filters or record a new sale"
              />
            ) : (
              <div className="bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm shadow-black/[0.03]">
                {/* Sort header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-6 px-5 py-2.5 bg-[#fafafa] border-b border-[#f0f0f0]">
                  <SortBtn
                    label="Item"
                    field="name"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                  <SortBtn
                    label="Sales"
                    field="qty"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("qty")}
                  />
                  <SortBtn
                    label="Revenue"
                    field="price"
                    current={sortField}
                    dir={sortDir}
                    onClick={() => toggleSort("price")}
                  />
                </div>

                {itemSummaries.map((item) => (
                  <ItemSummaryRow
                    key={item.name}
                    item={item}
                    totalRevenue={totalFilteredRevenue}
                    currencyCode={currencyCode}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-5 z-20">
        <a
          href="/record"
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#171717] text-white text-sm font-semibold shadow-2xl shadow-black/25 hover:bg-[#171717]/90 active:scale-[0.97] transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-[#ff79c6] flex items-center justify-center shadow-sm shadow-[#ff79c6]/40">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          Record a sale
        </a>
      </div>

      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </main>
  );
}
