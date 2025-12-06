# P&L Management MCP Server

Connect your P&L Management Software directly with Claude AI using the Model Context Protocol (MCP). This integration allows Claude to analyze your business data, generate insights, calculate ROI, and provide AI-powered recommendations.

## Features

### MCP Tools Available

1. **analyze_profit_loss** - Complete P&L analysis with revenue, COGS, advertising costs, and profit margins
2. **get_asin_performance** - Detailed product (ASIN) performance metrics
3. **analyze_advertising_performance** - Ad campaign analysis with ROAS, ACOS, CTR, and CVR
4. **get_invoice_summary** - Invoice data summary with costs and quantities
5. **calculate_roi** - Return on Investment calculation
6. **get_business_insights** - AI-powered business recommendations and anomaly detection
7. **list_vendors** - List all configured vendors

### MCP Resources Available

Access your data directly through resource URIs:

- `pnl://vendors/{userId}` - Vendor list
- `pnl://asin-data/{userId}/{vendor}` - Product data
- `pnl://invoices/{userId}/{vendor}` - Invoice data
- `pnl://advertising/{userId}/{vendor}` - Ad campaign data
- `pnl://dashboard/{userId}/{vendor}` - Dashboard summary

## Prerequisites

- Node.js 18.0.0 or higher
- Firebase project with Realtime Database
- Firebase service account key
- Claude Desktop app (for connecting to Claude AI)

## Installation

### Step 1: Install Dependencies

```bash
cd mcp-server
npm install
```

### Step 2: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pnl-amzon**
3. Click the gear icon ⚙️ → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the downloaded JSON file as `firebase-service-account.json` in the `mcp-server` directory

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file if needed (default values should work for the pnl-amzon project).

### Step 4: Test the Server

```bash
npm start
```

You should see:
```
✅ Firebase Admin initialized successfully
🚀 P&L Management MCP Server running on stdio
📊 Available tools: analyze_profit_loss, get_asin_performance, analyze_advertising_performance, and more
🔗 Connect this server to Claude Desktop to start analyzing your business data
```

## Connecting to Claude Desktop

### Step 1: Install Claude Desktop

Download and install from: https://claude.ai/download

### Step 2: Configure MCP Server

Add this configuration to your Claude Desktop config file:

**On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**On Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**On Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pnl-management": {
      "command": "node",
      "args": [
        "/home/user/final-vendor-pNL/mcp-server/index.js"
      ],
      "env": {
        "FIREBASE_PROJECT_ID": "pnl-amzon",
        "FIREBASE_DATABASE_URL": "https://pnl-amzon-default-rtdb.firebaseio.com",
        "FIREBASE_SERVICE_ACCOUNT_PATH": "/home/user/final-vendor-pNL/mcp-server/firebase-service-account.json"
      }
    }
  }
}
```

**Important:** Update the paths in the config above to match your actual installation directory.

### Step 3: Restart Claude Desktop

Close and reopen Claude Desktop app. You should see a small hammer icon 🔨 indicating MCP tools are available.

## Usage Examples

Once connected to Claude Desktop, you can ask Claude questions like:

### Profit & Loss Analysis

```
Analyze the profit and loss for vendor E-Trade. My user ID is abc123.
```

```
Show me the P&L for Retailez for the period 2024-01-01 to 2024-12-31.
```

### Product Performance

```
What are the top 10 performing ASINs for ClickTech? User ID: abc123
```

```
Show me all ASIN performance data for E-Trade vendor.
```

### Advertising Analysis

```
Analyze advertising performance for Retailez. How is my ROAS looking?
```

```
What's my ACOS for E-Trade and how can I improve it?
```

### Business Insights

```
Give me business insights for all my vendors. User ID: abc123
```

```
What are the key recommendations for improving profitability in E-Trade?
```

### ROI Calculation

```
Calculate ROI for vendor ClickTech. User ID: abc123
```

### Finding Your User ID

Your Firebase User ID (UID) can be found in:

1. Firebase Console → Authentication → Users tab
2. In the P&L web app, open browser console and type: `firebase.auth().currentUser.uid`
3. In Firebase Realtime Database, check the `users/` node - the keys are user IDs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Desktop                          │
│                     (Claude AI Client)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ MCP Protocol
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  MCP Server (Node.js)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tools: analyze_profit_loss, get_asin_performance,     │  │
│  │        calculate_roi, get_business_insights, etc.     │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Resources: pnl://vendors, pnl://asin-data, etc.       │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Firebase Admin SDK
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Firebase Services                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Realtime Database: users/{userId}/asinData          │    │
│  │                    users/{userId}/savedInvoices     │    │
│  │                    users/{userId}/advertisingData   │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────────────────┐
│              P&L Management Web App (INDEX.html)             │
│                   Firebase Client SDK                        │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User** interacts with P&L web app (INDEX.html)
2. **Web app** stores data in Firebase Realtime Database
3. **MCP Server** reads data from Firebase using Admin SDK
4. **Claude AI** calls MCP tools to analyze data
5. **User** gets AI-powered insights through Claude Desktop

## Security Considerations

- Firebase service account key has admin access - keep it secure
- Never commit `firebase-service-account.json` to git
- The `.gitignore` file should exclude sensitive files
- User ID is required for all operations to ensure data isolation
- Consider implementing rate limiting for production use

## Troubleshooting

### Error: Cannot find firebase-service-account.json

Make sure you've downloaded the Firebase service account key and placed it in the `mcp-server` directory.

### Error: Permission denied

Ensure your Firebase service account has the following roles:
- Firebase Admin SDK Administrator Service Agent
- Cloud Datastore User

### Claude Desktop doesn't show MCP tools

1. Check that the paths in `claude_desktop_config.json` are absolute paths
2. Restart Claude Desktop completely
3. Check Claude Desktop logs for errors

### "User not found" errors

Make sure you're using the correct Firebase User ID (UID), not the email address.

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses Node's `--watch` flag to auto-reload on file changes.

### Adding New Tools

1. Add tool definition in `ListToolsRequestSchema` handler
2. Add tool implementation in `CallToolRequestSchema` handler
3. Update this README with usage examples

### Adding New Resources

1. Add resource definition in `ListResourcesRequestSchema` handler
2. Add resource implementation in `ReadResourceRequestSchema` handler

## Contributing

Contributions are welcome! Please ensure:

- Code follows existing patterns
- All tools return proper JSON structures
- Error handling is comprehensive
- Documentation is updated

## License

MIT

## Support

For issues and questions:
1. Check Firebase Console for data structure
2. Verify service account permissions
3. Check Claude Desktop logs
4. Review Firebase Realtime Database rules

## What You Can Ask Claude

With this MCP integration, Claude can now:

- Analyze profit and loss across all vendors
- Identify top-performing products (ASINs)
- Evaluate advertising campaign effectiveness
- Calculate ROI and profit margins
- Detect anomalies and trends in your data
- Provide actionable business recommendations
- Compare performance across different time periods
- Suggest cost optimization strategies
- Analyze pricing strategies
- Forecast revenue based on historical data

Just open Claude Desktop and start asking questions about your business data!
