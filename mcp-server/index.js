#!/usr/bin/env node

/**
 * P&L Management MCP Server
 * Provides Claude AI with access to profit & loss data and business analytics
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import admin from 'firebase-admin';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Initialize Firebase Admin
let db, realtimeDb;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    join(__dirname, 'firebase-service-account.json');

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://pnl-amzon-default-rtdb.firebaseio.com'
  });

  db = admin.firestore();
  realtimeDb = admin.database();
  console.error('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('Please ensure firebase-service-account.json exists and .env is configured');
}

// Create MCP server instance
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'pnl-management-server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Helper function to get user data from Firebase Realtime Database
async function getUserData(userId, path) {
  try {
    const snapshot = await realtimeDb.ref(`users/${userId}/${path}`).once('value');
    return snapshot.val();
  } catch (error) {
    throw new Error(`Failed to fetch data from ${path}: ${error.message}`);
  }
}

// Helper function to reconstruct batched data
function reconstructBatchedData(batchedData) {
  if (!batchedData || !batchedData.meta) return [];

  const { totalBatches } = batchedData.meta;
  let allData = [];

  for (let i = 0; i < totalBatches; i++) {
    const batchKey = `batch_${i}`;
    if (batchedData[batchKey]) {
      allData = allData.concat(batchedData[batchKey]);
    }
  }

  return allData;
}

// Helper function to calculate P&L metrics
function calculatePnLMetrics(asinData, invoiceData, advertisingData) {
  const metrics = {
    totalRevenue: 0,
    totalCOGS: 0,
    totalAdvertising: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    roas: 0,
    acos: 0
  };

  // Calculate revenue from ASIN data
  if (Array.isArray(asinData)) {
    asinData.forEach(asin => {
      const revenue = parseFloat(asin.revenue || asin.totalRevenue || 0);
      metrics.totalRevenue += revenue;
    });
  }

  // Calculate COGS from invoice data
  if (Array.isArray(invoiceData)) {
    invoiceData.forEach(invoice => {
      const cogs = parseFloat(invoice.cogs || invoice.totalCost || 0);
      metrics.totalCOGS += cogs;
    });
  }

  // Calculate advertising costs
  if (Array.isArray(advertisingData)) {
    advertisingData.forEach(ad => {
      const spend = parseFloat(ad.spend || ad.adSpend || 0);
      metrics.totalAdvertising += spend;
    });
  }

  // Calculate derived metrics
  metrics.grossProfit = metrics.totalRevenue - metrics.totalCOGS;
  metrics.netProfit = metrics.grossProfit - metrics.totalAdvertising;
  metrics.profitMargin = metrics.totalRevenue > 0
    ? (metrics.netProfit / metrics.totalRevenue) * 100
    : 0;
  metrics.roas = metrics.totalAdvertising > 0
    ? metrics.totalRevenue / metrics.totalAdvertising
    : 0;
  metrics.acos = metrics.totalRevenue > 0
    ? (metrics.totalAdvertising / metrics.totalRevenue) * 100
    : 0;

  return metrics;
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_profit_loss',
        description: 'Analyze profit and loss data for a specific vendor and time period. Returns comprehensive P&L metrics including revenue, COGS, advertising costs, gross profit, net profit, and profit margins.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID) of the account owner',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name (e.g., E-Trade, Retailez, ClickTech)',
            },
            startDate: {
              type: 'string',
              description: 'Start date for analysis (YYYY-MM-DD format, optional)',
            },
            endDate: {
              type: 'string',
              description: 'End date for analysis (YYYY-MM-DD format, optional)',
            },
          },
          required: ['userId', 'vendor'],
        },
      },
      {
        name: 'get_asin_performance',
        description: 'Get detailed performance metrics for all ASINs (products) of a specific vendor. Returns data including revenue, units sold, pricing, and rankings.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID)',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name',
            },
            topN: {
              type: 'number',
              description: 'Return only top N performing ASINs (optional)',
            },
          },
          required: ['userId', 'vendor'],
        },
      },
      {
        name: 'analyze_advertising_performance',
        description: 'Analyze advertising campaign performance including ROAS (Return on Ad Spend), ACOS (Advertising Cost of Sale), impressions, clicks, and conversions.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID)',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name',
            },
          },
          required: ['userId', 'vendor'],
        },
      },
      {
        name: 'get_invoice_summary',
        description: 'Get summary of all invoices (DF Invoice and FC Invoice) for a vendor, including total costs, quantities, and freight charges.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID)',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name',
            },
          },
          required: ['userId', 'vendor'],
        },
      },
      {
        name: 'calculate_roi',
        description: 'Calculate Return on Investment (ROI) for a specific vendor, taking into account all costs and revenues.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID)',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name',
            },
          },
          required: ['userId', 'vendor'],
        },
      },
      {
        name: 'get_business_insights',
        description: 'Get AI-powered business insights and recommendations based on P&L data, identifying trends, anomalies, and optimization opportunities.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID)',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name (optional - if not provided, analyzes all vendors)',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'list_vendors',
        description: 'List all vendors available for a user account.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Firebase user ID (UID)',
            },
          },
          required: ['userId'],
        },
      },
    ],
  };
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'pnl://vendors/{userId}',
        name: 'Vendor List',
        description: 'List of all vendors for a user',
        mimeType: 'application/json',
      },
      {
        uri: 'pnl://asin-data/{userId}/{vendor}',
        name: 'ASIN Data',
        description: 'All ASIN (product) data for a specific vendor',
        mimeType: 'application/json',
      },
      {
        uri: 'pnl://invoices/{userId}/{vendor}',
        name: 'Invoice Data',
        description: 'All invoice data for a specific vendor',
        mimeType: 'application/json',
      },
      {
        uri: 'pnl://advertising/{userId}/{vendor}',
        name: 'Advertising Data',
        description: 'All advertising campaign data for a specific vendor',
        mimeType: 'application/json',
      },
      {
        uri: 'pnl://dashboard/{userId}/{vendor}',
        name: 'Dashboard Summary',
        description: 'Dashboard summary with key metrics for a vendor',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const parts = uri.replace('pnl://', '').split('/');

  try {
    if (parts[0] === 'vendors' && parts[1]) {
      const userId = parts[1];
      const userRef = realtimeDb.ref(`users/${userId}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();

      const vendors = [];
      if (userData) {
        // Extract vendor names from asinData keys
        if (userData.asinData) {
          vendors.push(...Object.keys(userData.asinData));
        }
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify([...new Set(vendors)], null, 2),
          },
        ],
      };
    }

    if (parts[0] === 'asin-data' && parts[1] && parts[2]) {
      const userId = parts[1];
      const vendor = parts[2];
      const data = await getUserData(userId, `asinData/${vendor}`);
      const asinData = reconstructBatchedData(data);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(asinData, null, 2),
          },
        ],
      };
    }

    if (parts[0] === 'invoices' && parts[1] && parts[2]) {
      const userId = parts[1];
      const vendor = parts[2];
      const data = await getUserData(userId, `savedInvoices/${vendor}`);
      const invoiceData = reconstructBatchedData(data);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(invoiceData, null, 2),
          },
        ],
      };
    }

    if (parts[0] === 'advertising' && parts[1] && parts[2]) {
      const userId = parts[1];
      const vendor = parts[2];
      const data = await getUserData(userId, `advertisingData/${vendor}`);
      const adData = reconstructBatchedData(data);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(adData, null, 2),
          },
        ],
      };
    }

    if (parts[0] === 'dashboard' && parts[1] && parts[2]) {
      const userId = parts[1];
      const vendor = parts[2];

      const asinData = reconstructBatchedData(await getUserData(userId, `asinData/${vendor}`));
      const invoiceData = reconstructBatchedData(await getUserData(userId, `savedInvoices/${vendor}`));
      const adData = reconstructBatchedData(await getUserData(userId, `advertisingData/${vendor}`));

      const metrics = calculatePnLMetrics(asinData, invoiceData, adData);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              vendor,
              summary: metrics,
              totalASINs: asinData.length,
              totalInvoices: invoiceData.length,
              totalAdCampaigns: adData.length,
            }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    throw new Error(`Failed to read resource ${uri}: ${error.message}`);
  }
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_vendors': {
        const { userId } = args;
        const userRef = realtimeDb.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        const vendors = [];
        if (userData && userData.asinData) {
          vendors.push(...Object.keys(userData.asinData));
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                userId,
                vendors: [...new Set(vendors)],
                totalVendors: [...new Set(vendors)].length,
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_profit_loss': {
        const { userId, vendor, startDate, endDate } = args;

        const asinData = reconstructBatchedData(await getUserData(userId, `asinData/${vendor}`));
        const invoiceData = reconstructBatchedData(await getUserData(userId, `savedInvoices/${vendor}`));
        const adData = reconstructBatchedData(await getUserData(userId, `advertisingData/${vendor}`));

        // Apply date filtering if provided
        let filteredAsinData = asinData;
        let filteredInvoiceData = invoiceData;
        let filteredAdData = adData;

        if (startDate || endDate) {
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();

          filteredAsinData = asinData.filter(item => {
            const date = new Date(item.date || item.orderDate || 0);
            return date >= start && date <= end;
          });

          filteredInvoiceData = invoiceData.filter(item => {
            const date = new Date(item.date || item.invoiceDate || 0);
            return date >= start && date <= end;
          });

          filteredAdData = adData.filter(item => {
            const date = new Date(item.date || item.campaignDate || 0);
            return date >= start && date <= end;
          });
        }

        const metrics = calculatePnLMetrics(filteredAsinData, filteredInvoiceData, filteredAdData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vendor,
                period: {
                  startDate: startDate || 'all time',
                  endDate: endDate || 'present',
                },
                metrics: {
                  revenue: `$${metrics.totalRevenue.toFixed(2)}`,
                  cogs: `$${metrics.totalCOGS.toFixed(2)}`,
                  advertisingCosts: `$${metrics.totalAdvertising.toFixed(2)}`,
                  grossProfit: `$${metrics.grossProfit.toFixed(2)}`,
                  netProfit: `$${metrics.netProfit.toFixed(2)}`,
                  profitMargin: `${metrics.profitMargin.toFixed(2)}%`,
                  roas: metrics.roas.toFixed(2),
                  acos: `${metrics.acos.toFixed(2)}%`,
                },
                dataPoints: {
                  asins: filteredAsinData.length,
                  invoices: filteredInvoiceData.length,
                  adCampaigns: filteredAdData.length,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'get_asin_performance': {
        const { userId, vendor, topN } = args;
        const asinData = reconstructBatchedData(await getUserData(userId, `asinData/${vendor}`));

        // Sort by revenue
        const sortedASINs = asinData.sort((a, b) => {
          const revA = parseFloat(a.revenue || a.totalRevenue || 0);
          const revB = parseFloat(b.revenue || b.totalRevenue || 0);
          return revB - revA;
        });

        const result = topN ? sortedASINs.slice(0, topN) : sortedASINs;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vendor,
                totalASINs: asinData.length,
                returned: result.length,
                asins: result.map(asin => ({
                  asin: asin.asin || asin.ASIN,
                  title: asin.title || asin.productTitle,
                  revenue: parseFloat(asin.revenue || asin.totalRevenue || 0),
                  units: parseInt(asin.units || asin.unitsSold || 0),
                  price: parseFloat(asin.price || asin.sellingPrice || 0),
                  ranking: asin.ranking || asin.salesRank,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_advertising_performance': {
        const { userId, vendor } = args;
        const adData = reconstructBatchedData(await getUserData(userId, `advertisingData/${vendor}`));

        let totalSpend = 0;
        let totalRevenue = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalConversions = 0;

        adData.forEach(ad => {
          totalSpend += parseFloat(ad.spend || ad.adSpend || 0);
          totalRevenue += parseFloat(ad.revenue || ad.sales || 0);
          totalImpressions += parseInt(ad.impressions || 0);
          totalClicks += parseInt(ad.clicks || 0);
          totalConversions += parseInt(ad.conversions || ad.orders || 0);
        });

        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        const acos = totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0;
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const cvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vendor,
                totalCampaigns: adData.length,
                metrics: {
                  totalSpend: `$${totalSpend.toFixed(2)}`,
                  totalRevenue: `$${totalRevenue.toFixed(2)}`,
                  roas: roas.toFixed(2),
                  acos: `${acos.toFixed(2)}%`,
                  totalImpressions: totalImpressions,
                  totalClicks: totalClicks,
                  totalConversions: totalConversions,
                  ctr: `${ctr.toFixed(2)}%`,
                  cvr: `${cvr.toFixed(2)}%`,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'get_invoice_summary': {
        const { userId, vendor } = args;
        const invoiceData = reconstructBatchedData(await getUserData(userId, `savedInvoices/${vendor}`));

        let totalCost = 0;
        let totalQuantity = 0;
        let totalFreight = 0;

        invoiceData.forEach(invoice => {
          totalCost += parseFloat(invoice.totalCost || invoice.amount || 0);
          totalQuantity += parseInt(invoice.quantity || invoice.qty || 0);
          totalFreight += parseFloat(invoice.freight || invoice.freightCost || 0);
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vendor,
                totalInvoices: invoiceData.length,
                summary: {
                  totalCost: `$${totalCost.toFixed(2)}`,
                  totalQuantity: totalQuantity,
                  totalFreight: `$${totalFreight.toFixed(2)}`,
                  averageCostPerInvoice: `$${(totalCost / invoiceData.length).toFixed(2)}`,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'calculate_roi': {
        const { userId, vendor } = args;

        const asinData = reconstructBatchedData(await getUserData(userId, `asinData/${vendor}`));
        const invoiceData = reconstructBatchedData(await getUserData(userId, `savedInvoices/${vendor}`));
        const adData = reconstructBatchedData(await getUserData(userId, `advertisingData/${vendor}`));

        const metrics = calculatePnLMetrics(asinData, invoiceData, adData);

        const totalInvestment = metrics.totalCOGS + metrics.totalAdvertising;
        const roi = totalInvestment > 0
          ? ((metrics.netProfit / totalInvestment) * 100)
          : 0;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                vendor,
                roi: {
                  percentage: `${roi.toFixed(2)}%`,
                  totalInvestment: `$${totalInvestment.toFixed(2)}`,
                  totalRevenue: `$${metrics.totalRevenue.toFixed(2)}`,
                  netProfit: `$${metrics.netProfit.toFixed(2)}`,
                },
                breakdown: {
                  cogs: `$${metrics.totalCOGS.toFixed(2)}`,
                  advertising: `$${metrics.totalAdvertising.toFixed(2)}`,
                  grossProfit: `$${metrics.grossProfit.toFixed(2)}`,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'get_business_insights': {
        const { userId, vendor } = args;

        let insights = {
          userId,
          generatedAt: new Date().toISOString(),
          insights: [],
        };

        if (vendor) {
          // Single vendor analysis
          const asinData = reconstructBatchedData(await getUserData(userId, `asinData/${vendor}`));
          const invoiceData = reconstructBatchedData(await getUserData(userId, `savedInvoices/${vendor}`));
          const adData = reconstructBatchedData(await getUserData(userId, `advertisingData/${vendor}`));
          const metrics = calculatePnLMetrics(asinData, invoiceData, adData);

          insights.vendor = vendor;

          // Profit margin insights
          if (metrics.profitMargin < 10) {
            insights.insights.push({
              type: 'warning',
              category: 'profitability',
              message: `Low profit margin of ${metrics.profitMargin.toFixed(2)}%. Consider reviewing pricing or reducing costs.`,
            });
          } else if (metrics.profitMargin > 30) {
            insights.insights.push({
              type: 'success',
              category: 'profitability',
              message: `Excellent profit margin of ${metrics.profitMargin.toFixed(2)}%. This is a highly profitable vendor.`,
            });
          }

          // ROAS insights
          if (metrics.roas < 2) {
            insights.insights.push({
              type: 'warning',
              category: 'advertising',
              message: `Low ROAS of ${metrics.roas.toFixed(2)}. Ad spend may not be efficient. Target ROAS should be above 3.0.`,
            });
          } else if (metrics.roas > 5) {
            insights.insights.push({
              type: 'success',
              category: 'advertising',
              message: `Excellent ROAS of ${metrics.roas.toFixed(2)}. Advertising campaigns are performing very well.`,
            });
          }

          // ACOS insights
          if (metrics.acos > 30) {
            insights.insights.push({
              type: 'warning',
              category: 'advertising',
              message: `High ACOS of ${metrics.acos.toFixed(2)}%. Consider optimizing ad campaigns to reduce advertising cost ratio.`,
            });
          } else if (metrics.acos < 15) {
            insights.insights.push({
              type: 'success',
              category: 'advertising',
              message: `Low ACOS of ${metrics.acos.toFixed(2)}%. Advertising efficiency is excellent.`,
            });
          }

          // Product performance insights
          const topASINs = asinData.sort((a, b) => {
            const revA = parseFloat(a.revenue || a.totalRevenue || 0);
            const revB = parseFloat(b.revenue || b.totalRevenue || 0);
            return revB - revA;
          }).slice(0, 5);

          const topASINRevenue = topASINs.reduce((sum, asin) =>
            sum + parseFloat(asin.revenue || asin.totalRevenue || 0), 0);

          const topASINPercentage = metrics.totalRevenue > 0
            ? (topASINRevenue / metrics.totalRevenue) * 100
            : 0;

          if (topASINPercentage > 80) {
            insights.insights.push({
              type: 'info',
              category: 'product-mix',
              message: `Top 5 ASINs generate ${topASINPercentage.toFixed(1)}% of revenue. Consider diversifying product portfolio to reduce risk.`,
            });
          }

        } else {
          // Multi-vendor analysis
          const userRef = realtimeDb.ref(`users/${userId}/asinData`);
          const snapshot = await userRef.once('value');
          const vendorData = snapshot.val();

          if (vendorData) {
            const vendors = Object.keys(vendorData);
            insights.vendors = vendors;
            insights.totalVendors = vendors.length;

            insights.insights.push({
              type: 'info',
              category: 'overview',
              message: `You have ${vendors.length} vendor(s) configured. Use vendor-specific analysis for detailed insights.`,
            });
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(insights, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 P&L Management MCP Server running on stdio');
  console.error('📊 Available tools: analyze_profit_loss, get_asin_performance, analyze_advertising_performance, and more');
  console.error('🔗 Connect this server to Claude Desktop to start analyzing your business data');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
