

import express, { json } from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());

// Create a session store to maintain cookies
const sessions = new Map();

// Function to get a session or create new one
const getSession = async () => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/'
    };

    try {
        // Create a new session
        const response = await axios.get('https://www.nseindia.com', {
            headers: headers
        });

        // Extract cookies from response
        const cookies = response.headers['set-cookie'];
        return { headers, cookies };
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

// API endpoint to get stock price
app.get('/api/stock-price/:symbol', async (req, res) => {
    const { symbol } = req.params;

    try {
        // Get or create session
        const session = await getSession();
        
        // Add cookies to headers
        const headers = {
            ...session.headers,
            Cookie: session.cookies.join('; ')
        };

        // Make request to NSE API
        const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;
        const response = await axios.get(url, { headers });

        if (response.data && response.data.priceInfo) {
            res.json({
                symbol,
                lastPrice: response.data.priceInfo.lastPrice,
                change: response.data.priceInfo.change,
                pChange: response.data.priceInfo.pChange,
                timestamp: response.data.lastUpdateTime
            });
        } else {
            res.status(404).json({ error: 'Stock price data not found' });
        }
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        res.status(500).json({ 
            error: 'Failed to fetch stock price',
            message: error.message 
        });
    }
});

// Batch endpoint to get multiple stock prices
app.post('/api/batch-stock-prices', async (req, res) => {
    const { symbols } = req.body;

    if (!Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Symbols must be an array' });
    }

    try {
        // Get or create session
        const session = await getSession();
        
        // Add cookies to headers
        const headers = {
            ...session.headers,
            Cookie: session.cookies.join('; ')
        };

        // Fetch prices for all symbols
        const promises = symbols.map(async (symbol) => {
            try {
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
                return {
                    symbol,
                    error: 'Failed to fetch price'
                };
            }
        });

        const results = await Promise.all(promises);
        res.json(results);
    } catch (error) {
        console.error('Error in batch request:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stock prices',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});