// pages/api/stock-prices.js
import axios from 'axios';

// Create a session store (this will reset on server restart)
let session = null;

// Function to get a session or create new one
async function getSession() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/'
  };

  try {
    const response = await axios.get('https://www.nseindia.com', {
      headers: headers
    });
    
    // Extract cookies
    const cookies = response.headers['set-cookie'];
    session = { headers, cookies };
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Helper function to fetch single stock price
async function fetchStockPrice(symbol) {
  try {
    if (!session) {
      session = await getSession();
    }

    const headers = {
      ...session.headers,
      Cookie: session.cookies.join('; ')
    };

    const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;
    const response = await axios.get(url, { headers });

    return {
      symbol,
      lastPrice: response.data.priceInfo.lastPrice,
      change: response.data.priceInfo.change,
      pChange: response.data.priceInfo.pChange,
      timestamp: response.data.lastUpdateTime
    };
  } catch (error) {
    // If session expired, retry once with new session
    if (error.response?.status === 401 || error.response?.status === 403) {
      session = await getSession();
      return fetchStockPrice(symbol);
    }
    
    return {
      symbol,
      error: 'Failed to fetch price'
    };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle POST request for batch stock prices
  if (req.method === 'POST') {
    try {
      const { symbols } = req.body;

      if (!Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Symbols must be an array' });
      }

      // Fetch all stock prices in parallel
      const promises = symbols.map(symbol => fetchStockPrice(symbol));
      const results = await Promise.all(promises);

      res.status(200).json(results);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle GET request for single stock price
  else if (req.method === 'GET') {
    try {
      const { symbol } = req.query;

      if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
      }

      const result = await fetchStockPrice(symbol);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle unsupported methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Configure API route to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}