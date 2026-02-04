// app/data/page.tsx
"use client";

import { useRef } from "react";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  X,
  Mic,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Client-side types
type ClientSale = {
  id: number;
  product_name: string;
  unit_price: number;
  total_price: number;
  quantity: number;
  createdAt: string;
  tax_percent: number | null;
};

type SaleInput = {
  product_name: string;
  unit_price?: number;
  quantity?: number;
  total_price?: number;
  tax_percent?: number;
  createdAt?: string;
};

type SortConfig = {
  key: keyof ClientSale;
  direction: "asc" | "desc";
};

type FilterConfig = {
  productName: string;
  minPrice: string;
  maxPrice: string;
  minQuantity: string;
  maxQuantity: string;
  dateFrom: string;
  dateTo: string;
};

export default function SalesPage() {
  const [sales, setSales] = useState<ClientSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  // Set default date filter to 30 days ago
  const getDefaultDateFrom = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    productName: "",
    minPrice: "",
    maxPrice: "",
    minQuantity: "",
    maxQuantity: "",
    dateFrom: getDefaultDateFrom(),
    dateTo: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    rowId: number;
    field: keyof ClientSale;
  } | null>(null);
  const [newRow, setNewRow] = useState<Partial<ClientSale>>({
    product_name: "",
    unit_price: 0,
    quantity: 1,
    total_price: 0,
    tax_percent: 0,
    createdAt: new Date().toISOString(),
  });
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Load initial data
  useEffect(() => {
    fetchSales();
  }, []);

  const tableBottomRef = useRef<HTMLTableRowElement>(null);

  // Add this useEffect to scroll when adding a row
  useEffect(() => {
    if (isAddingRow && tableBottomRef.current) {
      console.log("Scroll");
      tableBottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isAddingRow]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sales");
      if (!response.ok) {
        throw new Error(`Failed to fetch sales: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse the data from API
      const parsedData: ClientSale[] = data.map((item: any) => ({
        id: item.id,
        product_name: item.product_name,
        unit_price: parseFloat(item.unit_price) || 0,
        total_price: parseFloat(item.total_price) || 0,
        quantity: item.quantity,
        createdAt: item.createdAt,
        tax_percent: item.tax_percent ? parseFloat(item.tax_percent) : null,
      }));

      setSales(parsedData);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load sales data",
      );
    } finally {
      setLoading(false);
    }
  };

  // Apply sorting and filtering
  const processedSales = useMemo(() => {
    let result = [...sales];

    // Apply search
    if (searchQuery) {
      result = result.filter((sale) =>
        sale.product_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply filters
    if (filterConfig.productName) {
      result = result.filter((sale) =>
        sale.product_name
          .toLowerCase()
          .includes(filterConfig.productName.toLowerCase()),
      );
    }

    if (filterConfig.minPrice) {
      result = result.filter(
        (sale) => sale.unit_price >= Number(filterConfig.minPrice),
      );
    }

    if (filterConfig.maxPrice) {
      result = result.filter(
        (sale) => sale.unit_price <= Number(filterConfig.maxPrice),
      );
    }

    if (filterConfig.minQuantity) {
      result = result.filter(
        (sale) => sale.quantity >= Number(filterConfig.minQuantity),
      );
    }

    if (filterConfig.maxQuantity) {
      result = result.filter(
        (sale) => sale.quantity <= Number(filterConfig.maxQuantity),
      );
    }

    if (filterConfig.dateFrom) {
      const dateFrom = new Date(filterConfig.dateFrom);
      result = result.filter((sale) => new Date(sale.createdAt) >= dateFrom);
    }

    if (filterConfig.dateTo) {
      const dateTo = new Date(filterConfig.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      result = result.filter((sale) => new Date(sale.createdAt) <= dateTo);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null || bValue == null) return 0;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [sales, searchQuery, filterConfig, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(processedSales.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSales = processedSales.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterConfig, sortConfig]);

  const handleSort = (key: keyof ClientSale) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleAddRow = async () => {
    try {
      if (!newRow.product_name?.trim()) {
        alert("Product name is required");
        return;
      }

      const saleData: SaleInput = {
        product_name: newRow.product_name!,
        unit_price: newRow.unit_price,
        quantity: newRow.quantity,
        total_price: newRow.total_price,
        tax_percent: newRow.tax_percent!,
        createdAt: newRow.createdAt,
      };

      // Auto-calculate if needed (mimicking your resolvePricing logic)
      if (
        saleData.unit_price !== undefined &&
        saleData.quantity !== undefined &&
        saleData.total_price === undefined
      ) {
        saleData.total_price = saleData.unit_price * saleData.quantity;
      } else if (
        saleData.unit_price !== undefined &&
        saleData.total_price !== undefined &&
        saleData.quantity === undefined
      ) {
        saleData.quantity = Math.round(
          saleData.total_price / saleData.unit_price,
        );
      } else if (
        saleData.quantity !== undefined &&
        saleData.total_price !== undefined &&
        saleData.unit_price === undefined
      ) {
        saleData.unit_price = saleData.total_price / saleData.quantity;
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create sale");
      }

      await fetchSales();
      resetNewRow();
      setIsAddingRow(false);
    } catch (error) {
      console.error("Error adding sale:", error);
      alert(error instanceof Error ? error.message : "Failed to add sale");
    }
  };

  const handleUpdateRow = async (id: number) => {
    try {
      const sale = sales.find((s) => s.id === id);
      if (!sale) return;

      const saleData: SaleInput = {
        product_name: sale.product_name,
        unit_price: sale.unit_price,
        quantity: sale.quantity,
        total_price: sale.total_price,
        tax_percent: sale.tax_percent || 0,
      };

      const response = await fetch(`/api/sales/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update sale");
      }

      setEditingCell(null);
      await fetchSales();
    } catch (error) {
      console.error("Error updating sale:", error);
      alert(error instanceof Error ? error.message : "Failed to update sale");
    }
  };

  const resetNewRow = () => {
    setNewRow({
      product_name: "",
      unit_price: 0,
      quantity: 1,
      total_price: 0,
      tax_percent: 0,
      createdAt: new Date().toISOString(),
    });
  };

  const handleFieldChange = (
    id: number | "new",
    field: keyof ClientSale,
    value: any,
  ) => {
    if (id === "new") {
      setNewRow((prev) => {
        const updated = { ...prev, [field]: value };

        // Auto-calculate pricing
        if (field === "unit_price" || field === "quantity") {
          const unitPrice =
            field === "unit_price"
              ? Number(value)
              : Number(prev.unit_price || 0);
          const quantity =
            field === "quantity" ? Number(value) : Number(prev.quantity || 1);

          if (
            !isNaN(unitPrice) &&
            !isNaN(quantity) &&
            unitPrice > 0 &&
            quantity > 0
          ) {
            updated.total_price = unitPrice * quantity;
          }
        }

        // If total_price changes and we have quantity, update unit_price
        if (field === "total_price" && prev.quantity && prev.quantity > 0) {
          const totalPrice = Number(value);
          if (!isNaN(totalPrice) && totalPrice > 0) {
            updated.unit_price = totalPrice / Number(prev.quantity);
          }
        }

        return updated;
      });
    } else {
      setSales((prev) =>
        prev.map((sale) => {
          if (sale.id === id) {
            const updated = { ...sale, [field]: value };

            // Auto-calculate pricing when unit_price or quantity changes
            if (field === "unit_price" || field === "quantity") {
              const unitPrice =
                field === "unit_price" ? Number(value) : sale.unit_price;
              const quantity =
                field === "quantity" ? Number(value) : sale.quantity;

              if (
                !isNaN(unitPrice) &&
                !isNaN(quantity) &&
                unitPrice > 0 &&
                quantity > 0
              ) {
                updated.total_price = unitPrice * quantity;
              }
            }

            // If total_price changes and we have quantity, update unit_price
            if (field === "total_price" && sale.quantity && sale.quantity > 0) {
              const totalPrice = Number(value);
              if (!isNaN(totalPrice)) {
                updated.unit_price = totalPrice / sale.quantity;
              }
            }

            return updated;
          }
          return sale;
        }),
      );
    }
  };

  const clearFilters = () => {
    setFilterConfig({
      productName: "",
      minPrice: "",
      maxPrice: "",
      minQuantity: "",
      maxQuantity: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchQuery("");
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Product Name",
      "Unit Price",
      "Quantity",
      "Total Price",
      "Tax %",
      "Created At",
    ];
    const csvContent = [
      headers.join(","),
      ...processedSales.map((sale) =>
        [
          sale.id,
          `"${sale.product_name}"`,
          sale.unit_price.toFixed(2),
          sale.quantity,
          sale.total_price.toFixed(2),
          sale.tax_percent?.toFixed(1) || "0",
          new Date(sale.createdAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-700">Loading sales data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={fetchSales}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 w-full">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Sales Sheet</h1>
        <p className="text-gray-600">Manage and track your sales data</p>
      </header>

      {/* Controls Bar */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <div className="relative">
              <button
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>

              {showAddDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Mic className="w-4 h-4 text-green-600" />
                    <span>Add with voice</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingRow(true);
                      setShowAddDropdown(false);
                      setTimeout(() => {
                        tableBottomRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 100);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-200"
                  >
                    <Pencil className="w-4 h-4 text-green-600" />
                    <span>Add manually</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={filterConfig.productName}
                  onChange={(e) =>
                    setFilterConfig((prev) => ({
                      ...prev,
                      productName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Min Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={filterConfig.minPrice}
                    onChange={(e) =>
                      setFilterConfig((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Max Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={filterConfig.maxPrice}
                    onChange={(e) =>
                      setFilterConfig((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Min Qty
                  </label>
                  <input
                    type="number"
                    value={filterConfig.minQuantity}
                    onChange={(e) =>
                      setFilterConfig((prev) => ({
                        ...prev,
                        minQuantity: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Max Qty
                  </label>
                  <input
                    type="number"
                    value={filterConfig.maxQuantity}
                    onChange={(e) =>
                      setFilterConfig((prev) => ({
                        ...prev,
                        maxQuantity: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filterConfig.dateFrom}
                  onChange={(e) =>
                    setFilterConfig((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filterConfig.dateTo}
                  onChange={(e) =>
                    setFilterConfig((prev) => ({
                      ...prev,
                      dateTo: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Excel-like Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                {[
                  { key: "sr", label: "SR#", width: "w-4" },
                  { key: "id", label: "ID", width: "w-16" },
                  { key: "product_name", label: "Product Name", width: "w-64" },
                  { key: "unit_price", label: "Unit Price", width: "w-32" },
                  { key: "quantity", label: "Quantity", width: "w-24" },
                  { key: "total_price", label: "Total Price", width: "w-32" },
                  { key: "tax_percent", label: "Tax %", width: "w-24" },
                  { key: "createdAt", label: "Created At", width: "w-32" },
                  { key: "actions", label: "Actions", width: "w-4" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className={`${column.width} py-2 px-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 last:border-r-0 ${
                      column.key !== "actions"
                        ? "cursor-pointer hover:bg-gray-200"
                        : ""
                    }`}
                    onClick={() =>
                      column.key !== "actions" &&
                      handleSort(column.key as keyof ClientSale)
                    }
                  >
                    <div className="flex items-center justify-between">
                      {column.label}
                      {column.key !== "actions" && (
                        <div className="flex flex-col ml-1">
                          <ChevronUp
                            className={`w-3 h-3 ${
                              sortConfig.key === column.key &&
                              sortConfig.direction === "asc"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 -mt-1 ${
                              sortConfig.key === column.key &&
                              sortConfig.direction === "desc"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Existing Sales Rows */}
              {paginatedSales.map((sale, index) => (
                <tr
                  key={sale.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="py-2 px-2 text-sm text-gray-600 border-r border-gray-200">
                    {index}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600 border-r border-gray-200">
                    {sale.id}
                  </td>
                  <td
                    className="py-2 px-3 text-sm border-r border-gray-200 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ rowId: sale.id, field: "product_name" })
                    }
                  >
                    {editingCell?.rowId === sale.id &&
                    editingCell?.field === "product_name" ? (
                      <input
                        type="text"
                        value={sale.product_name}
                        onChange={(e) =>
                          handleFieldChange(
                            sale.id,
                            "product_name",
                            e.target.value,
                          )
                        }
                        onBlur={() => handleUpdateRow(sale.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateRow(sale.id);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                            fetchSales();
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-400 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-800">{sale.product_name}</span>
                    )}
                  </td>
                  <td
                    className="py-2 px-3 text-sm border-r border-gray-200 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ rowId: sale.id, field: "unit_price" })
                    }
                  >
                    {editingCell?.rowId === sale.id &&
                    editingCell?.field === "unit_price" ? (
                      <input
                        type="number"
                        step="0.01"
                        value={sale.unit_price}
                        onChange={(e) =>
                          handleFieldChange(
                            sale.id,
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        onBlur={() => handleUpdateRow(sale.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateRow(sale.id);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                            fetchSales();
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-400 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-800">
                        ${sale.unit_price.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td
                    className="py-2 px-3 text-sm border-r border-gray-200 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ rowId: sale.id, field: "quantity" })
                    }
                  >
                    {editingCell?.rowId === sale.id &&
                    editingCell?.field === "quantity" ? (
                      <input
                        type="number"
                        value={sale.quantity}
                        onChange={(e) =>
                          handleFieldChange(
                            sale.id,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        onBlur={() => handleUpdateRow(sale.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateRow(sale.id);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                            fetchSales();
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-400 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-800">{sale.quantity}</span>
                    )}
                  </td>
                  <td
                    className="py-2 px-3 text-sm font-medium text-gray-800 border-r border-gray-200 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ rowId: sale.id, field: "total_price" })
                    }
                  >
                    {editingCell?.rowId === sale.id &&
                    editingCell?.field === "total_price" ? (
                      <input
                        type="number"
                        step="0.01"
                        value={sale.total_price}
                        onChange={(e) =>
                          handleFieldChange(
                            sale.id,
                            "total_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        onBlur={() => handleUpdateRow(sale.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateRow(sale.id);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                            fetchSales();
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-400 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span>${sale.total_price.toFixed(2)}</span>
                    )}
                  </td>
                  <td
                    className="py-2 px-3 text-sm border-r border-gray-200 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ rowId: sale.id, field: "tax_percent" })
                    }
                  >
                    {editingCell?.rowId === sale.id &&
                    editingCell?.field === "tax_percent" ? (
                      <input
                        type="number"
                        step="0.1"
                        value={sale.tax_percent || 0}
                        onChange={(e) =>
                          handleFieldChange(
                            sale.id,
                            "tax_percent",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        onBlur={() => handleUpdateRow(sale.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateRow(sale.id);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                            fetchSales();
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-400 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-800">
                        {(sale.tax_percent || 0).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td
                    className="py-2 px-3 text-sm text-gray-600 border-r border-gray-200 cursor-pointer"
                    onDoubleClick={() =>
                      setEditingCell({ rowId: sale.id, field: "createdAt" })
                    }
                  >
                    {editingCell?.rowId === sale.id &&
                    editingCell?.field === "createdAt" ? (
                      <input
                        type="date"
                        value={sale.createdAt.split("T")[0]}
                        onChange={(e) =>
                          handleFieldChange(
                            sale.id,
                            "createdAt",
                            new Date(e.target.value).toISOString(),
                          )
                        }
                        onBlur={() => handleUpdateRow(sale.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateRow(sale.id);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                            fetchSales();
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-400 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span>{formatDate(sale.createdAt)}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this sale?",
                            )
                          ) {
                            try {
                              const response = await fetch(
                                `/api/sales/${sale.id}`,
                                {
                                  method: "DELETE",
                                },
                              );
                              if (!response.ok) {
                                throw new Error("Failed to delete sale");
                              }
                              await fetchSales();
                            } catch (error) {
                              console.error("Error deleting sale:", error);
                              alert("Failed to delete sale");
                            }
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* New Row Form */}
              {isAddingRow && (
                <tr
                  ref={tableBottomRef}
                  className="border-b-2 border-green-400 bg-green-50"
                >
                  <td className="py-2 px-3 text-sm text-gray-500 border-r border-gray-200">
                    --
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-500 border-r border-gray-200">
                    New
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="text"
                      value={newRow.product_name || ""}
                      onChange={(e) =>
                        handleFieldChange("new", "product_name", e.target.value)
                      }
                      placeholder="Product name"
                      className="w-full px-2 py-1 border border-green-400 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="number"
                      step="0.01"
                      value={newRow.unit_price || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "new",
                          "unit_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className="w-full px-2 py-1 border border-green-400 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="number"
                      value={newRow.quantity || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "new",
                          "quantity",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      placeholder="1"
                      className="w-full px-2 py-1 border border-green-400 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="number"
                      step="0.01"
                      value={newRow.total_price || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "new",
                          "total_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className="w-full px-2 py-1 border border-green-400 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="number"
                      step="0.1"
                      value={newRow.tax_percent || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "new",
                          "tax_percent",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.0"
                      className="w-full px-2 py-1 border border-green-400 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <input
                      type="date"
                      value={
                        newRow.createdAt
                          ? newRow.createdAt.split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          "new",
                          "createdAt",
                          new Date(e.target.value).toISOString(),
                        )
                      }
                      className="w-full px-2 py-1 border border-green-400 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAddRow}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingRow(false);
                          resetNewRow();
                        }}
                        className="px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddingRow(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, processedSales.length)} of{" "}
              {processedSales.length} entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <span className="text-sm text-gray-700 px-2">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total Sales</div>
          <div className="text-2xl font-bold text-gray-800">
            {processedSales.length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-800">
            $
            {processedSales
              .reduce((sum, sale) => sum + sale.total_price, 0)
              .toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Avg. Order Value</div>
          <div className="text-2xl font-bold text-gray-800">
            $
            {processedSales.length > 0
              ? (
                  processedSales.reduce(
                    (sum, sale) => sum + sale.total_price,
                    0,
                  ) / processedSales.length
                ).toFixed(2)
              : "0.00"}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total Quantity</div>
          <div className="text-2xl font-bold text-gray-800">
            {processedSales.reduce((sum, sale) => sum + sale.quantity, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
