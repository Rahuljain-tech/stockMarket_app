// // pages/api/stock-prices.js
// import axios from 'axios';

// // Create a session store (this will reset on server restart)
// let session: { headers: any; cookies: any; } | null = null;

// // Function to get a session or create new one
// async function getSession() {
//   const headers = {
//     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
//     'Accept-Language': 'en-US,en;q=0.9',
//     'Referer': 'https://www.nseindia.com/'
//   };

//   try {
//     const response = await axios.get('https://www.nseindia.com', {
//       headers: headers
//     });
    
//     // Extract cookies
//     const cookies = response.headers['set-cookie'];
//     session = { headers, cookies };
//     return session;
//   } catch (error) {
//     console.error('Error creating session:', error);
//     throw error;
//   }
// }

// // Helper function to fetch single stock price
// async function fetchStockPrice(symbol) {
//   try {
//     if (!session) {
//       session = await getSession();
//     }

//     const headers = {
//       ...session.headers,
//       Cookie: session.cookies.join('; ')
//     };

//     const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;
//     const response = await axios.get(url, { headers });

//     return {
//       symbol,
//       lastPrice: response.data.priceInfo.lastPrice,
//       change: response.data.priceInfo.change,
//       pChange: response.data.priceInfo.pChange,
//       timestamp: response.data.lastUpdateTime
//     };
//   } catch (error) {
//     // If session expired, retry once with new session
//     if (error.response?.status === 401 || error.response?.status === 403) {
//       session = await getSession();
//       return fetchStockPrice(symbol);
//     }
    
//     return {
//       symbol,
//       error: 'Failed to fetch price'
//     };
//   }
// }

// export async function handler(req, res) {
//   // Enable CORS
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   // Handle OPTIONS request for CORS
//   if (req.method === 'OPTIONS') {
//     res.status(200).end();
//     return;
//   }

//   // Handle POST request for batch stock prices
//   if (req.method === 'POST') {
//     try {
//       const { symbols } = req.body;

//       if (!Array.isArray(symbols)) {
//         return res.status(400).json({ error: 'Symbols must be an array' });
//       }

//       // Fetch all stock prices in parallel
//       const promises = symbols.map(symbol => fetchStockPrice(symbol));
//       const results = await Promise.all(promises);

//       res.status(200).json(results);
//     } catch (error) {
//       console.error('Error processing request:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   }

//   // Handle GET request for single stock price
//   else if (req.method === 'GET') {
//     try {
//       const { symbol } = req.query;

//       if (!symbol) {
//         return res.status(400).json({ error: 'Symbol is required' });
//       }

//       const result = await fetchStockPrice(symbol);
//       res.status(200).json(result);
//     } catch (error) {
//       console.error('Error processing request:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   }

//   // Handle unsupported methods
//   else {
//     res.setHeader('Allow', ['GET', 'POST']);
//     res.status(405).json({ error: `Method ${req.method} Not Allowed` });
//   }
// }

// // Configure API route to handle larger payloads
// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '1mb',
//     },
//   },
// }

// import { NextResponse } from 'next/server';
// import axios from 'axios';

// // Store session
// let session: { headers: any; cookies: any } | null = null;

// // Function to create a new session
// async function getSession() {
//   const headers = {
//     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
//     'Accept-Language': 'en-US,en;q=0.9',
//     'Referer': 'https://www.nseindia.com/'
//   };

//   try {
//     const response = await axios.get('https://www.nseindia.com', { headers });

//     // Extract cookies
//     const cookies = response.headers['set-cookie'] || [];
//     session = { headers, cookies };
//     return session;
//   } catch (error) {
//     console.error('Error creating session:', error);
//     throw error;
//   }
// }

// // Function to fetch stock price
// async function fetchStockPrice(symbol: string, retry = 1) {
//   try {
//     if (!session) {
//       session = await getSession();
//     }

//     const headers = {
//       ...session.headers,
//       Cookie: session.cookies.join('; ')
//     };

//     const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;
//     const response = await axios.get(url, { headers });

//     return NextResponse.json({
//       symbol,
//       lastPrice: response.data.priceInfo.lastPrice,
//       change: response.data.priceInfo.change,
//       pChange: response.data.priceInfo.pChange,
//       timestamp: response.data.lastUpdateTime
//     });
//   } catch (error: any) {
//     console.error(`Error fetching stock price for ${symbol}:`, error.message);

//     if ((error.response?.status === 401 || error.response?.status === 403) && retry > 0) {
//       session = await getSession();
//       return fetchStockPrice(symbol, retry - 1);
//     }

//     return NextResponse.json({ symbol, error: 'Failed to fetch price' }, { status: 500 });
//   }
// }

// // ✅ Correct Export Format for Next.js API Routes
// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const symbol = searchParams.get('symbol');

//   if (!symbol) {
//     return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
//   }

//   return fetchStockPrice(symbol);
// }

// export async function POST(req: Request) {
//   try {
//     const { symbols } = await req.json();

//     if (!Array.isArray(symbols)) {
//       return NextResponse.json({ error: 'Symbols must be an array' }, { status: 400 });
//     }

//     const stockData = await Promise.all(symbols.map(symbol => fetchStockPrice(symbol)));
//     return NextResponse.json(stockData);
//   } catch (error: any) {
//     console.error('Error processing request:', error.message);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import axios from 'axios';

// Store session
let session: { headers: Record<string, string>; cookies: string[] } | null = null;

// Function to create a new session
async function getSession() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
  };

  try {
    const response = await axios.get('https://www.nseindia.com', { headers });

    // Extract cookies
    const cookies = response.headers['set-cookie'] || [];
    session = { headers, cookies };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Function to fetch stock price
async function fetchStockPrice(symbol: string, retry = 1) {
  try {
    if (!session) {
      await getSession();
    }

    const headers = {
      ...session!.headers,
      Cookie: session!.cookies.join('; '),
    };

    const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;
    const response = await axios.get(url, { headers });

    return {
      symbol,
      lastPrice: response.data.priceInfo.lastPrice,
      change: response.data.priceInfo.change,
      pChange: response.data.priceInfo.pChange,
      timestamp: response.data.lastUpdateTime,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error(`Error fetching stock price for ${symbol}:`, error.message);
    } else {
        console.error(`Error fetching stock price for ${symbol}:`, error);
    }

    // Safely extract response status using type assertion
    const status = (error as { response: { status: number } | undefined })?.response?.status as number | undefined;
    // If session expired, retry once with a new session
    if ((status === 401 || status === 403) && retry > 0) {
        await getSession();
        return await fetchStockPrice(symbol, retry - 1);
    }

    return { symbol, error: 'Failed to fetch price' };
}

}

// ✅ Correct Export Format for Next.js API Routes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const stockData = await fetchStockPrice(symbol);
  return NextResponse.json(stockData);
}

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();

    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols must be an array' }, { status: 400 });
    }

    const stockData = await Promise.all(symbols.map((symbol) => fetchStockPrice(symbol)));
    return NextResponse.json(stockData);
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Error processing request:', error.message);
  } else {
    console.error('Error processing request:', error);
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
   
}
