export function filterDataByDateRange<
  T extends { date?: string; month?: string },
>(
  data: T[],
  range: "7d" | "30d" | "90d" | "1y" | "all",
  dateKey: "date" | "month" = "date",
): T[] {
  if (range === "all") return data;

  const now = new Date();
  let cutoffDate = new Date();

  switch (range) {
    case "7d":
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case "30d":
      cutoffDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      cutoffDate.setDate(now.getDate() - 90);
      break;
    case "1y":
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return data
    .filter((item) => {
      const dateValue = item[dateKey];
      if (!dateValue) return false;

      const itemDate = new Date(dateValue);
      return itemDate >= cutoffDate && itemDate <= now;
    })
    .sort((a, b) => {
      const dateA = new Date(a[dateKey] || "");
      const dateB = new Date(b[dateKey] || "");
      return dateA.getTime() - dateB.getTime();
    });
}

// Function to calculate KPIs from filtered data
export function calculateKPIsFromData(
  dailyData: Array<{ date: string; revenue: number }>,
  monthlyData: Array<{ month: string; revenue: number }>,
  products: Array<{ totalQuantity: number; totalRevenue: number }>,
  range: "7d" | "30d" | "90d" | "1y" | "all",
) {
  const filteredDaily = filterDataByDateRange(dailyData, range, "date");
  const filteredMonthly = filterDataByDateRange(monthlyData, range, "month");

  const totalRevenue = filteredDaily.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  const totalOrders = filteredDaily.length;
  const totalQuantity = products.reduce(
    (sum, product) => sum + product.totalQuantity,
    0,
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate net revenue (assuming 15% tax for demo)
  const netRevenue = totalRevenue * 0.85;

  // Calculate average unit price (assuming each product entry represents units sold)
  const totalUnits = products.reduce(
    (sum, product) => sum + product.totalQuantity,
    0,
  );
  const averageUnitPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  return {
    totalOrders,
    totalQuantity,
    grossRevenue: totalRevenue,
    netRevenue,
    averageOrderValue,
    averageUnitPrice,
    dailyData: filteredDaily,
    monthlyData: filteredMonthly,
  };
}
