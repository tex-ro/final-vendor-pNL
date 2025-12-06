# P&L Management Software with Claude AI Integration

A comprehensive Profit & Loss management system for multi-vendor e-commerce businesses, now with direct Claude AI integration through Model Context Protocol (MCP).

## Features

### Core P&L Management
- Multi-vendor profit & loss tracking (E-Trade, Retailez, ClickTech)
- ASIN (product) performance analytics
- Invoice management (DF Invoice & FC Invoice)
- Advertising campaign analysis (ROAS, ACOS metrics)
- VRET (Variable Rate Expenses) and COGS tracking
- ROI calculation and monthly P&L reports
- CSV import/export functionality
- Real-time Firebase integration

### Claude AI Integration (NEW!)
- Direct connection to Claude AI via MCP
- AI-powered business insights and recommendations
- Natural language queries about your business data
- Automated anomaly detection
- Smart profit optimization suggestions
- Conversational data analysis

## Quick Start

### Option 1: Use the Web App Only

1. Open `INDEX.html` in your browser
2. Sign in with your Firebase credentials
3. Start managing your P&L data

### Option 2: Connect with Claude AI (Recommended!)

1. **Set up the web app** (same as Option 1)

2. **Install MCP Server:**
   ```bash
   cd mcp-server
   npm install
   ```

3. **Configure Firebase:**
   - Download service account key from [Firebase Console](https://console.firebase.google.com/project/pnl-amzon/settings/serviceaccounts/adminsdk)
   - Save as `mcp-server/firebase-service-account.json`

4. **Set up Claude Desktop:**
   - Install [Claude Desktop](https://claude.ai/download)
   - Add MCP configuration (see `mcp-server/QUICKSTART.md`)

5. **Start asking Claude questions:**
   ```
   Analyze my profit and loss for E-Trade. User ID: [your-uid]
   ```

## Project Structure

```
final-vendor-pNL/
├── INDEX.html                          # Main P&L web application
├── README.md                           # This file
└── mcp-server/                         # Claude AI MCP integration
    ├── index.js                        # MCP server implementation
    ├── package.json                    # Node.js dependencies
    ├── .env.example                    # Environment configuration template
    ├── .gitignore                      # Git ignore rules
    ├── README.md                       # Detailed MCP documentation
    ├── QUICKSTART.md                   # 5-minute setup guide
    └── claude-ai-integration.html      # Setup helper page
```

## Technology Stack

### Web Application
- HTML5, CSS3, Vanilla JavaScript
- Firebase Realtime Database
- Firebase Authentication
- Firebase Analytics

### MCP Server
- Node.js 18+
- @modelcontextprotocol/sdk
- firebase-admin
- Model Context Protocol (MCP)

## Documentation

- **[MCP Server Setup](mcp-server/README.md)** - Comprehensive MCP integration guide
- **[Quick Start Guide](mcp-server/QUICKSTART.md)** - 5-minute setup instructions
- **[Integration Helper](mcp-server/claude-ai-integration.html)** - Web-based setup assistant

## What Can Claude AI Do?

Once connected via MCP, Claude can:

1. **Analyze P&L Data**
   - "Show me profit and loss for E-Trade vendor"
   - "What's my profit margin for last month?"

2. **Product Performance**
   - "What are my top 10 performing ASINs?"
   - "Which products have the highest ROI?"

3. **Advertising Analysis**
   - "How is my ROAS for Retailez?"
   - "What's my advertising efficiency?"

4. **Business Insights**
   - "Give me recommendations to improve profitability"
   - "Identify any anomalies in my data"

5. **ROI Calculation**
   - "Calculate ROI for all my vendors"
   - "What's my return on investment for ClickTech?"

6. **Comparative Analysis**
   - "Compare performance across all vendors"
   - "Which vendor is most profitable?"

## MCP Tools Available

| Tool | Description |
|------|-------------|
| `analyze_profit_loss` | Complete P&L analysis with margins |
| `get_asin_performance` | Product performance metrics |
| `analyze_advertising_performance` | Ad campaign analytics |
| `get_invoice_summary` | Invoice data summary |
| `calculate_roi` | ROI calculation |
| `get_business_insights` | AI-powered recommendations |
| `list_vendors` | List configured vendors |

## MCP Resources Available

| Resource | Description |
|----------|-------------|
| `pnl://vendors/{userId}` | Vendor list |
| `pnl://asin-data/{userId}/{vendor}` | Product data |
| `pnl://invoices/{userId}/{vendor}` | Invoice data |
| `pnl://advertising/{userId}/{vendor}` | Ad campaign data |
| `pnl://dashboard/{userId}/{vendor}` | Dashboard summary |

## Security

- Firebase Authentication for user management
- Role-based data access via Firebase security rules
- Service account key for secure backend access
- Never commit sensitive credentials to git

## Finding Your User ID

Your Firebase User ID is required when talking to Claude AI. Find it:

1. **Firebase Console**: [Authentication Users](https://console.firebase.google.com/project/pnl-amzon/authentication/users)
2. **Browser Console**: `firebase.auth().currentUser.uid`
3. **Firebase Database**: Check the keys under `users/` node
4. **Helper Page**: Open `mcp-server/claude-ai-integration.html`

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Claude Desktop                         │
│                  (Claude AI Client)                        │
└─────────────────────┬──────────────────────────────────────┘
                      │ MCP Protocol
                      │
┌─────────────────────▼──────────────────────────────────────┐
│                 MCP Server (Node.js)                       │
│  - Tools: analyze_profit_loss, get_asin_performance, etc. │
│  - Resources: pnl://vendors, pnl://asin-data, etc.        │
└─────────────────────┬──────────────────────────────────────┘
                      │ Firebase Admin SDK
                      │
┌─────────────────────▼──────────────────────────────────────┐
│              Firebase Realtime Database                    │
│  - users/{userId}/asinData                                 │
│  - users/{userId}/savedInvoices                            │
│  - users/{userId}/advertisingData                          │
└─────────────────────▲──────────────────────────────────────┘
                      │
┌─────────────────────┴──────────────────────────────────────┐
│            P&L Web App (INDEX.html)                        │
│              Firebase Client SDK                           │
└────────────────────────────────────────────────────────────┘
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## Firebase Configuration

Project: **pnl-amzon**
- Database: Realtime Database
- Authentication: Email/Password
- Storage: Firebase Storage
- Analytics: Google Analytics

## Development

### Running the Web App
Simply open `INDEX.html` in a web browser.

### Running the MCP Server
```bash
cd mcp-server
npm install
npm start
```

### Running in Development Mode
```bash
cd mcp-server
npm run dev
```

## Troubleshooting

### Web App Issues
- Clear browser cache if data doesn't load
- Check Firebase Console for authentication issues
- Verify internet connection for Firebase

### MCP Connection Issues
- Ensure firebase-service-account.json exists
- Verify Claude Desktop config path is absolute
- Check Node.js version (must be 18+)
- Restart Claude Desktop after config changes

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues:
1. Check the [MCP documentation](mcp-server/README.md)
2. Review [Firebase Console](https://console.firebase.google.com/project/pnl-amzon)
3. Test with the [integration helper](mcp-server/claude-ai-integration.html)
4. Open an issue on GitHub

## Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced forecasting models
- [ ] Custom report builder
- [ ] Mobile app integration
- [ ] Multi-currency support
- [ ] Automated email reports
- [ ] API for third-party integrations

## Changelog

### Version 1.0.0 (2025-12-06)
- Initial release with P&L management
- Multi-vendor support
- ASIN performance tracking
- Invoice management
- Advertising analytics
- **NEW**: Claude AI MCP integration
- **NEW**: 7 AI-powered tools
- **NEW**: 5 resource endpoints
- **NEW**: Natural language data queries

---

**Made with ❤️ for e-commerce business analytics**

For quick setup, see [QUICKSTART.md](mcp-server/QUICKSTART.md)
