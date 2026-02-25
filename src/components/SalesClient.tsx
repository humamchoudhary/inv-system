"use client";

import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

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
  transcriptionId?: string;
  transcriptionText?: string;
};

type TranscriptionGroup = {
  key: string;
  transcriptionText: string;
  createdAt: Date | null;
  sheetId: string;
  items: SaleEntry[];
};

type ItemSummary = {
  name: string;
  qtySold: number;
  totalRevenue: number;
  avgPrice: number;
  pct: number;
};

type SortField = "name" | "price" | "qty";
type SortDir = "asc" | "desc";

interface SalesClientProps {
  sheets: SheetSummary[];
  sales: SaleEntry[];
  currencyCode: string;
  businessName: string;
  activeSheet: string;
  dateFilter: string;
  viewMode: string;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalItems: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmt(amount: number, code = "USD") {
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

// ── FIXED: accepts pre-computed stable strings, never calls new Date() here ──
function formatDate(date: Date | null, todayStr: string, yesterdayStr: string) {
  if (!date) return "";
  const d = new Date(date);
  const dStr = d.toDateString();
  if (todayStr && dStr === todayStr) return "Today";
  if (yesterdayStr && dStr === yesterdayStr) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupIntoSessions(sales: SaleEntry[]): TranscriptionGroup[] {
  const grouped = new Map<string, TranscriptionGroup>();
  for (const sale of sales) {
    const key = sale.transcriptionId
      ? sale.transcriptionId
      : sale.createdAt
        ? `${sale.sheetId}__${Math.floor(new Date(sale.createdAt).getTime() / 60000)}`
        : `${sale.sheetId}__unknown`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        transcriptionText: sale.transcriptionText ?? "",
        createdAt: sale.createdAt,
        sheetId: sale.sheetId,
        items: [],
      });
    }
    const g = grouped.get(key)!;
    g.items.push(sale);
    if (sale.transcriptionText && !g.transcriptionText)
      g.transcriptionText = sale.transcriptionText;
  }
  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function buildItemSummary(
  sales: SaleEntry[],
  totalRevenue: number,
): ItemSummary[] {
  const map = new Map<string, { qtySold: number; totalRevenue: number }>();
  for (const sale of sales) {
    const key = sale.name.toLowerCase().trim();
    if (!map.has(key)) map.set(key, { qtySold: 0, totalRevenue: 0 });
    const item = map.get(key)!;
    item.qtySold += 1;
    item.totalRevenue += sale.price;
  }
  return Array.from(map.entries()).map(([key, data]) => ({
    name: sales.find((s) => s.name.toLowerCase().trim() === key)?.name ?? key,
    qtySold: data.qtySold,
    totalRevenue: data.totalRevenue,
    avgPrice: data.totalRevenue / data.qtySold,
    pct: totalRevenue > 0 ? (data.totalRevenue / totalRevenue) * 100 : 0,
  }));
}

const DATE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "30 Days", value: "month" },
  { label: "All Time", value: "all" },
];

// ─────────────────────────────────────────────
// URL builder
// ─────────────────────────────────────────────

function buildUrl(
  base: Record<string, string>,
  overrides: Record<string, string>,
) {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== "") params.set(k, v);
  }
  return `/sales?${params.toString()}`;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0">
      <div className="absolute top-[-10%] right-[-15%] w-[420px] h-[420px] rounded-full bg-[#1e1e1e] opacity-[0.12] blur-[120px]" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#171717] opacity-[0.07] blur-[100px]" />
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
        className={`group/ie flex items-center gap-1 text-left min-w-0 hover:text-[#171717] transition-colors duration-100 ${className}`}
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
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="flex-1 min-w-0 px-2 py-1 text-sm rounded-lg border border-[#171717] bg-white text-[#171717] outline-none ring-2 ring-[#171717]/20"
        placeholder={placeholder}
      />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          commit();
        }}
        className="w-6 h-6 rounded-md bg-[#171717] flex items-center justify-center shrink-0"
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

function SaleItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: SaleEntry;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="grid grid-cols-[1fr_100px_36px] items-center gap-2 px-5 py-3 border-b border-[#f0f0f0] last:border-0 group/row hover:bg-[#fdfcff] transition-colors duration-100">
      <InlineEdit
        value={item.name}
        type="text"
        placeholder="Item name"
        onSave={(v) => onUpdate(item.id, "name", v)}
        className="text-sm text-[#171717]"
      />
      <InlineEdit
        value={String(item.price)}
        type="number"
        placeholder="0"
        onSave={(v) => onUpdate(item.id, "price", v)}
        className="text-sm font-semibold text-[#171717] tabular-nums justify-end"
      />
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
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#171717]/20 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover/row:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── FIXED: todayStr/yesterdayStr passed as props, never derived inside ──
function SaleSessionCard({
  group,
  sheetName,
  currencyCode,
  onUpdateItem,
  onDeleteItem,
  todayStr,
  yesterdayStr,
}: {
  group: TranscriptionGroup;
  sheetName: string;
  currencyCode: string;
  onUpdateItem: (id: string, field: "name" | "price", value: string) => void;
  onDeleteItem: (id: string) => void;
  todayStr: string;
  yesterdayStr: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const liveTotal = group.items.reduce((s, i) => s + i.price, 0);
  const preview =
    group.items
      .map((i) => i.name)
      .slice(0, 3)
      .join(", ") +
    (group.items.length > 3 ? ` +${group.items.length - 3}` : "");

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${expanded ? "border-[#1e1e1e]/60 shadow-md shadow-[#171717]/[0.08]" : "border-[#f0f0f0] hover:border-[#1e1e1e]/40"}`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest">
              {formatDate(group.createdAt, todayStr, yesterdayStr)}
            </span>
            <span className="text-[#171717]/15">·</span>
            {/* ── FIXED: formatTime is locale-independent (hours/minutes only) so safe ── */}
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
          <p className="text-sm text-[#171717] font-medium truncate">
            {preview}
          </p>
          {group.transcriptionText && (
            <p className="text-xs text-[#171717]/30 italic mt-0.5 truncate">
              &quot;{group.transcriptionText}&quot;
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
          <p className="text-sm font-bold text-[#171717] tabular-nums">
            {fmt(liveTotal, currencyCode)}
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

      {expanded && (
        <div className="border-t border-[#f0f0f0]">
          <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-5 py-2 bg-[#fafafa] border-b border-[#f0f0f0]">
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
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
            />
          ))}
          <div className="flex items-center justify-between px-5 py-3 bg-[#fafafa] border-t border-[#f0f0f0]">
            <span className="text-xs font-semibold text-[#171717]/35 uppercase tracking-wider">
              Total
            </span>
            <span className="text-sm font-bold text-[#171717] tabular-nums">
              {fmt(liveTotal, currencyCode)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  currencyCode,
}: {
  item: ItemSummary;
  currencyCode: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-0 hover:bg-[#fdfcff] transition-colors duration-100">
      <div className="w-8 h-8 rounded-xl bg-[#171717]/10 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-[#171717]">
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
              className="h-full rounded-full bg-gradient-to-r from-[#171717] to-[#1e1e1e] transition-all duration-500"
              style={{ width: `${item.pct}%` }}
            />
          </div>
          <span className="text-[10px] text-[#171717]/30 tabular-nums w-7 text-right shrink-0">
            {item.pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <p className="text-sm font-bold text-[#171717] tabular-nums">
          {fmt(item.totalRevenue, currencyCode)}
        </p>
        <p className="text-[10px] text-[#171717]/40 text-right">
          {item.qtySold} {item.qtySold === 1 ? "sale" : "sales"} · avg{" "}
          {fmt(item.avgPrice, currencyCode)}
        </p>
      </div>
    </div>
  );
}

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
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${active ? "text-[#171717]" : "text-[#171717]/30 hover:text-[#171717]/50"}`}
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
// Main Client Component
// ─────────────────────────────────────────────

export default function SalesClient({
  sheets,
  sales,
  currencyCode,
  businessName,
  activeSheet,
  dateFilter,
  viewMode,
  searchQuery,
  minPrice,
  maxPrice,
  dateFrom,
  dateTo,
  totalRevenue,
  totalItems,
}: SalesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── FIXED: always start as empty strings (matches SSR), set after mount ──
  const [todayStr, setTodayStr] = useState<string>("");
  const [yesterdayStr, setYesterdayStr] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    setTodayStr(now.toDateString());
    setYesterdayStr(yesterday.toDateString());
    setMounted(true);
  }, []);

  const [sortField, setSortField] = useState<SortField>("qty");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [localSales, setLocalSales] = useState<SaleEntry[]>(sales);
  useEffect(() => {
    setLocalSales(sales);
  }, [sales]);

  const [showFilters, setShowFilters] = useState(false);
  const [draftQ, setDraftQ] = useState(searchQuery);
  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom);
  const [draftDateTo, setDraftDateTo] = useState(dateTo);

  const currentFilters = {
    sheet: activeSheet,
    date: dateFilter,
    view: viewMode,
    q: searchQuery,
    minPrice,
    maxPrice,
    dateFrom,
    dateTo,
  };

  const navigate = (overrides: Record<string, string>) => {
    startTransition(() => {
      router.push(buildUrl(currentFilters, overrides));
    });
  };

  const applySearch = () => {
    navigate({
      q: draftQ,
      minPrice: draftMin,
      maxPrice: draftMax,
      dateFrom: draftDateFrom,
      dateTo: draftDateTo,
    });
  };

  const clearFilters = () => {
    setDraftQ("");
    setDraftMin("");
    setDraftMax("");
    setDraftDateFrom("");
    setDraftDateTo("");
    navigate({ q: "", minPrice: "", maxPrice: "", dateFrom: "", dateTo: "" });
  };

  const itemSummaries = useMemo(() => {
    const raw = buildItemSummary(localSales, totalRevenue);
    return [...raw].sort((a, b) => {
      if (sortField === "name")
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      if (sortField === "price")
        return sortDir === "asc"
          ? a.totalRevenue - b.totalRevenue
          : b.totalRevenue - a.totalRevenue;
      return sortDir === "asc" ? a.qtySold - b.qtySold : b.qtySold - a.qtySold;
    });
  }, [localSales, sortField, sortDir, totalRevenue]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sessions = useMemo(() => groupIntoSessions(localSales), [localSales]);

  // ── FIXED: sessionsByDate depends on todayStr/yesterdayStr which are stable
  //    empty strings on SSR, so the date labels are always "" on first render.
  //    After mount they fill in correctly. This eliminates the mismatch where
  //    server renders "Feb 24" and client renders "Feb 25". ──
  const sessionsByDate = useMemo(() => {
    // If not mounted yet (SSR), return ungrouped sessions to match server render
    if (!mounted) {
      return sessions.map((s) => ({ label: "", sessions: [s] }));
    }

    const groups: { label: string; sessions: typeof sessions }[] = [];
    let currentLabel = "";
    for (const s of sessions) {
      const label = formatDate(s.createdAt, todayStr, yesterdayStr);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, sessions: [] });
      }
      groups[groups.length - 1].sessions.push(s);
    }
    return groups;
  }, [sessions, todayStr, yesterdayStr, mounted]);

  const sheetMap = useMemo(
    () => new Map(sheets.map((s) => [s.id, s.name])),
    [sheets],
  );

  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const bySheet = new Map<string, SaleEntry[]>();

    if (activeSheet === "all") {
      for (const sheet of sheets) bySheet.set(sheet.id, []);
      for (const sale of localSales) {
        if (!bySheet.has(sale.sheetId)) bySheet.set(sale.sheetId, []);
        bySheet.get(sale.sheetId)!.push(sale);
      }
    } else {
      bySheet.set(activeSheet, localSales);
    }

    for (const [sheetId, entries] of bySheet.entries()) {
      const sheetName = sheetMap.get(sheetId) ?? sheetId.slice(0, 8);
      const rows = entries.map((s) => ({
        "Item Name": s.name,
        Price: s.price,
        Date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "",
        Transcription: s.transcriptionText ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 50 }];
      const safeName = sheetName.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeName || "Sheet");
    }

    const dateTag = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `sales-export-${dateTag}.xlsx`);
  }, [localSales, activeSheet, sheets, sheetMap]);

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

  const activeFilterCount = [
    searchQuery,
    minPrice || maxPrice,
    dateFrom || dateTo,
  ].filter(Boolean).length;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-center justify-between px-5 pt-10 pb-4"
        style={{ animation: "fadeDown 0.4s ease both" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0f0f0] hover:bg-[#1e1e1e]/30 transition-colors duration-200"
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
        <div className="flex items-center gap-2">
          {isPending && (
            <Loader2 className="w-4 h-4 text-[#171717] animate-spin" />
          )}
          <button
            onClick={() => exportToExcel()}
            disabled={localSales.length === 0}
            title={`Export ${localSales.length} sale${localSales.length !== 1 ? "s" : ""} to Excel`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#f0f0f0] bg-white text-[#171717]/60 text-xs font-semibold hover:border-[#171717]/30 hover:text-[#171717] hover:bg-[#f0f0f0]/50 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <a
            href="/record"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171717] text-white text-xs font-semibold shadow-md shadow-[#171717]/30 hover:bg-[#171717]/90 active:scale-[0.97] transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
              <path
                d="M5 10a7 7 0 0014 0"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="21"
                x2="15"
                y2="21"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            Record
          </a>
        </div>
      </header>

      <div className="relative z-10 mx-5 h-px bg-[#f0f0f0]" />

      {/* ── Stats strip ── */}
      <div
        className="relative z-10 mx-5 mt-4 grid grid-cols-2 rounded-2xl border border-[#f0f0f0] bg-white overflow-hidden shadow-sm shadow-black/[0.03]"
        style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
      >
        <div className="px-4 py-3 border-r border-[#f0f0f0]">
          <p className="text-base font-bold text-[#171717] tabular-nums">
            {fmt(totalRevenue, currencyCode)}
          </p>
          <p className="text-[10px] text-[#171717]/40 uppercase tracking-wider">
            Revenue
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-base font-bold text-[#171717] tabular-nums">
            {totalItems}
          </p>
          <p className="text-[10px] text-[#171717]/40 uppercase tracking-wider">
            Items
          </p>
        </div>
      </div>

      {/* ── Sheet Tabs ── */}
      {sheets.length > 0 && (
        <div
          className="relative z-10 px-5 mt-4"
          style={{ animation: "fadeUp 0.4s 0.08s ease both" }}
        >
          <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest mb-2">
            Sheet
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => navigate({ sheet: "all" })}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${activeSheet === "all" ? "bg-[#171717] text-white border-[#171717] shadow-sm" : "bg-white text-[#171717]/50 border-[#f0f0f0] hover:border-[#1e1e1e]/50 hover:text-[#171717]/70"}`}
            >
              <FileText className="w-3 h-3" />
              All Sheets
            </button>
            {sheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => navigate({ sheet: sheet.id })}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${activeSheet === sheet.id ? "bg-[#171717] text-white border-[#171717] shadow-sm shadow-[#171717]/25" : "bg-white text-[#171717]/50 border-[#f0f0f0] hover:border-[#1e1e1e]/50 hover:text-[#171717]/70"}`}
              >
                <FileText className="w-3 h-3" />
                {sheet.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div
        className="relative z-10 px-5 mt-4 flex flex-col gap-3"
        style={{ animation: "fadeUp 0.4s 0.1s ease both" }}
      >
        {/* Row 1: date pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {DATE_OPTIONS.map((f) => {
            const hasCustomDate = !!(dateFrom || dateTo);
            const active = !hasCustomDate && dateFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() =>
                  navigate({ date: f.value, dateFrom: "", dateTo: "" })
                }
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${active ? "bg-[#171717] text-white" : "bg-[#f0f0f0]/70 text-[#171717]/50 hover:text-[#171717]/70"}`}
              >
                {f.label}
              </button>
            );
          })}
          {(dateFrom || dateTo) && (
            <span className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#171717]/10 text-[#171717] border border-[#171717]/20">
              <CalendarDays className="w-3 h-3" />
              Custom range
            </span>
          )}
        </div>

        {/* Row 2: filter button + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${showFilters || activeFilterCount > 0 ? "bg-[#171717]/10 text-[#171717] border-[#171717]/30" : "bg-[#f0f0f0]/70 text-[#171717]/50 border-transparent"}`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#171717] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center rounded-xl bg-[#f0f0f0]/70 p-0.5">
            <button
              onClick={() => navigate({ view: "by-sale" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${viewMode === "by-sale" ? "bg-white text-[#171717] shadow-sm" : "text-[#171717]/40 hover:text-[#171717]/60"}`}
            >
              <Clock className="w-3 h-3" />
              By Sale
            </button>
            <button
              onClick={() => navigate({ view: "by-item" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${viewMode === "by-item" ? "bg-white text-[#171717] shadow-sm" : "text-[#171717]/40 hover:text-[#171717]/60"}`}
            >
              <BarChart2 className="w-3 h-3" />
              By Item
            </button>
          </div>
        </div>

        {/* Advanced filter panel */}
        {showFilters && (
          <div
            className="bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm"
            style={{ animation: "fadeUp 0.2s ease both" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#171717]" />
                <span className="text-xs font-semibold text-[#171717]">
                  Filters
                </span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#171717] text-white text-[9px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-[#171717]/40 hover:text-[#171717] transition-colors font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
                  <Tag className="w-3 h-3" /> Item name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#171717]/25 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Shirt, Cap…"
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applySearch()}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/25 outline-none focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
                  <DollarSign className="w-3 h-3" /> Price range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draftMin}
                    onChange={(e) => setDraftMin(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/25 outline-none focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/15 transition-all"
                  />
                  <span className="text-[#171717]/20 shrink-0">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draftMax}
                    onChange={(e) => setDraftMax(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] placeholder:text-[#171717]/25 outline-none focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171717]/40 uppercase tracking-wider mb-2">
                  <CalendarDays className="w-3 h-3" /> Custom date range
                </label>
                <div className="flex items-center md:flex-nowrap flex-wrap gap-2 justify-center">
                  <input
                    type="date"
                    value={draftDateFrom}
                    onChange={(e) => setDraftDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] outline-none focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/15 transition-all"
                  />
                  <span className="text-[#171717]/20 shrink-0">–</span>
                  <input
                    type="date"
                    value={draftDateTo}
                    onChange={(e) => setDraftDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#f0f0f0] bg-[#f0f0f0]/50 text-[#171717] outline-none focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/15 transition-all"
                  />
                </div>
                {(draftDateFrom || draftDateTo) && (
                  <p className="text-[10px] text-[#171717] mt-1.5">
                    Overrides quick-date selection above.
                  </p>
                )}
              </div>

              <button
                onClick={applySearch}
                disabled={isPending}
                className="w-full py-3 rounded-xl bg-[#171717] hover:bg-[#171717]/90 disabled:opacity-60 text-white text-sm font-semibold tracking-wide shadow-lg shadow-[#171717]/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {(searchQuery || minPrice || maxPrice || dateFrom || dateTo) && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171717]/10 border border-[#171717]/20 text-[10px] text-[#171717] font-medium">
                <Tag className="w-2.5 h-2.5" />
                &quot;{searchQuery}&quot;
                <button
                  onClick={() => {
                    setDraftQ("");
                    navigate({ q: "" });
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171717]/10 border border-[#171717]/20 text-[10px] text-[#171717] font-medium">
                <DollarSign className="w-2.5 h-2.5" />
                {minPrice || "0"} – {maxPrice || "∞"}
                <button
                  onClick={() => {
                    setDraftMin("");
                    setDraftMax("");
                    navigate({ minPrice: "", maxPrice: "" });
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171717]/10 border border-[#171717]/20 text-[10px] text-[#171717] font-medium">
                <CalendarDays className="w-2.5 h-2.5" />
                {dateFrom || "Start"} – {dateTo || "End"}
                <button
                  onClick={() => {
                    setDraftDateFrom("");
                    setDraftDateTo("");
                    navigate({ dateFrom: "", dateTo: "" });
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-5 mt-4 pb-28"
        style={{ animation: "fadeUp 0.4s 0.15s ease both" }}
      >
        {/* BY SALE */}
        {viewMode === "by-sale" &&
          (sessions.length === 0 ? (
            <EmptyState
              message="No sales found"
              sub="Try changing your filters or record a new sale"
            />
          ) : (
            <div className="flex flex-col gap-5">
              {sessionsByDate.map(({ label, sessions: daySessions }, idx) => (
                <div key={idx}>
                  {/* Only show the date header after mount, otherwise render an empty div with same height to prevent layout shift */}
                  {mounted ? (
                    <p className="text-[10px] font-semibold text-[#171717]/25 uppercase tracking-widest mb-2">
                      {label}
                    </p>
                  ) : (
                    <div className="h-[18px] mb-2" /> // Placeholder to maintain layout
                  )}
                  <div className="flex flex-col gap-2">
                    {daySessions.map((group) => (
                      <SaleSessionCard
                        key={group.key}
                        group={group}
                        sheetName={sheetMap.get(group.sheetId) ?? "Sheet"}
                        currencyCode={currencyCode}
                        onUpdateItem={handleUpdateItem}
                        onDeleteItem={handleDeleteItem}
                        todayStr={mounted ? todayStr : ""}
                        yesterdayStr={mounted ? yesterdayStr : ""}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {viewMode === "by-item" &&
          (itemSummaries.length === 0 ? (
            <EmptyState
              message="No items found"
              sub="Try changing your filters or record a new sale"
            />
          ) : (
            <div className="bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm shadow-black/[0.03]">
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
                <ItemRow
                  key={item.name}
                  item={item}
                  currencyCode={currencyCode}
                />
              ))}
            </div>
          ))}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-5 z-20">
        <a
          href="/record"
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#171717] text-white text-sm font-semibold shadow-2xl shadow-black/25 hover:bg-[#171717]/90 active:scale-[0.97] transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-[#171717] flex items-center justify-center shadow-sm shadow-[#171717]/40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
              <path
                d="M5 10a7 7 0 0014 0"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
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
