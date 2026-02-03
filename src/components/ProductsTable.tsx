"use client";

import { ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";

interface Product {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  avgUnitPrice: number;
}

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Product;
    direction: "asc" | "desc";
  }>({ key: "totalRevenue", direction: "desc" });

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [products, sortConfig]);

  const requestSort = (key: keyof Product) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  return (
    <div className="bg-background-sec rounded-xl p-6 shadow-sm border border-primary-sec/20">
      <h3 className="text-foreground text-lg font-semibold mb-4">
        Product Performance
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-sec/30">
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => requestSort("productName")}
                  className="flex items-center font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Product Name
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => requestSort("totalQuantity")}
                  className="flex items-center font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Quantity Sold
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => requestSort("totalRevenue")}
                  className="flex items-center font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Total Revenue
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => requestSort("avgUnitPrice")}
                  className="flex items-center font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Avg. Price
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, index) => (
              <tr
                key={product.productName}
                className={`border-b border-primary-sec/20 hover:bg-primary-sec/10 transition-colors ${
                  index === 0 ? "bg-primary-sec/5" : ""
                }`}
              >
                <td className="py-3 px-4 text-foreground">
                  {product.productName}
                </td>
                <td className="py-3 px-4 text-foreground/90">
                  {product.totalQuantity.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-foreground/90 font-medium">
                  ${product.totalRevenue.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-foreground/90">
                  ${product.avgUnitPrice.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
