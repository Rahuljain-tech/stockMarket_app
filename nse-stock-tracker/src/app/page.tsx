"use client";
import { useState, useEffect } from "react";
import Head from "next/head";

const DEFAULT_STOCKS: string[] = ["RELIANCE", "TCS", "INFY"];
const API_BASE_URL = "http://localhost:3000"; // Update this

interface StockData {
  symbol: string;
  lastPrice: number | null;
  change: number | null;
  pChange: number | null;
  timestamp: string | null;
  error?: string;
}

export default function Home() {
  const [stocks, setStocks] = useState<string[]>(DEFAULT_STOCKS);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(10);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(false);
  const [newStock, setNewStock] = useState<string>("");

  const fetchStockData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/batch-stock-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: stocks }),
      });

      if (!response.ok) throw new Error("Failed to fetch stock data");

      const data: StockData[] = await response.json();
      setStockData(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    if (isAutoRefresh) {
      const interval = setInterval(fetchStockData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [stocks, isAutoRefresh, refreshInterval]);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const upperStock = newStock.trim().toUpperCase();
    if (upperStock && !stocks.includes(upperStock)) {
      setStocks([...stocks, upperStock]);
      setNewStock("");
    }
  };

  const handleRemoveStock = (stockToRemove: string) => {
    setStocks(stocks.filter((stock) => stock !== stockToRemove));
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);
  };

  return (
    <div className="min-h-screen bg-black">
      <Head>
        <title>NSE Stock Tracker</title>
        <meta name="description" content="Real-time NSE Stock Price Tracker" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">NSE Stock Price Tracker</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleAddStock} className="flex gap-4 mb-4">
            <input
              type="text"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="Enter stock symbol (e.g., RELIANCE)"
              className="flex-1 p-2 border rounded"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add Stock
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-700">Refresh Interval (seconds):</label>
              <input
                type="number"
                min="5"
                max="60"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-20 p-2 border rounded text-gray-700"
              />
            </div>

            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-4 py-2 rounded ${isAutoRefresh ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white`}
            >
              {isAutoRefresh ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
            </button>

            <button onClick={fetchStockData} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Refresh Now
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Stock Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : (
                stockData.map((stock) => (
                  <tr key={stock.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{stock.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatPrice(stock.lastPrice)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${stock.change && stock.change > 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPrice(stock.change)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${stock.pChange && stock.pChange > 0 ? "text-green-600" : "text-red-600"}`}>
                      {stock.pChange ? `${stock.pChange.toFixed(2)}%` : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.timestamp || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => handleRemoveStock(stock.symbol)} className="text-red-600 hover:text-red-900">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
