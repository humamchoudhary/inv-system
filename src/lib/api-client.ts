// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function fetchSales() {
  const response = await fetch(`${API_BASE_URL}/sales`);
  if (!response.ok) {
    throw new Error("Failed to fetch sales");
  }
  return response.json();
}

export async function createSale(data: any) {
  const response = await fetch(`${API_BASE_URL}/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create sale");
  }

  return response.json();
}

export async function updateSale(id: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update sale");
  }

  return response.json();
}
