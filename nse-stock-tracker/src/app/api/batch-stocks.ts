"use server"
import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
        return res.status(400).json({ error: "Symbols must be an array" });
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nseindia.com/",
    };

    try {
        // Create a new session to fetch cookies
        const sessionResponse = await axios.get("https://www.nseindia.com", { headers });
        const cookies = sessionResponse.headers["set-cookie"] || [];

        const fetchStockData = async (symbol) => {
            try {
                const response = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${symbol}`, {
                    headers: { ...headers, Cookie: cookies.join("; ") },
                });

                return {
                    symbol,
                    lastPrice: response.data.priceInfo.lastPrice,
                    change: response.data.priceInfo.change,
                    pChange: response.data.priceInfo.pChange,
                    timestamp: response.data.lastUpdateTime,
                };
            } catch (error) {
                return { symbol, error: "Failed to fetch price" };
            }
        };

        const results = await Promise.all(symbols.map(fetchStockData));
        return res.json(results);

    } catch (error) {
        console.error("Batch request error:", error);
        return res.status(500).json({ error: "Failed to fetch stock prices" });
    }
}
