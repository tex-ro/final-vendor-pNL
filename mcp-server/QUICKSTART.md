# Quick Start Guide - Connect P&L Management with Claude AI

## 5-Minute Setup

### 1. Install Dependencies (1 minute)

```bash
cd /home/user/final-vendor-pNL/mcp-server
npm install
```

### 2. Get Firebase Service Account Key (2 minutes)

1. Visit: https://console.firebase.google.com/project/pnl-amzon/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json` in the `mcp-server` folder

### 3. Configure Claude Desktop (2 minutes)

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

Add this:

```json
{
  "mcpServers": {
    "pnl-management": {
      "command": "node",
      "args": ["/home/user/final-vendor-pNL/mcp-server/index.js"]
    }
  }
}
```

**Important:** Change `/home/user/` to your actual home directory path!

### 4. Restart Claude Desktop

Close and reopen Claude Desktop. Look for the hammer icon 🔨.

### 5. Start Using!

Ask Claude questions like:

```
List my vendors. User ID: [YOUR_USER_ID]
```

```
Analyze profit and loss for E-Trade vendor. User ID: [YOUR_USER_ID]
```

## Finding Your User ID

**Option 1:** Firebase Console
1. Go to https://console.firebase.google.com/project/pnl-amzon/authentication/users
2. Your UID is listed next to your email

**Option 2:** Browser Console
1. Open your P&L web app (INDEX.html)
2. Open browser developer console (F12)
3. Type: `firebase.auth().currentUser.uid`

**Option 3:** Firebase Database
1. Go to https://console.firebase.google.com/project/pnl-amzon/database/pnl-amzon-default-rtdb/data
2. Expand the `users` node
3. The keys are user IDs

## Example Conversations with Claude

**"Analyze my business performance"**
```
Show me the profit and loss analysis for E-Trade vendor.
My user ID is: abc123xyz
```

**"What are my best products?"**
```
Get the top 5 performing ASINs for Retailez.
User ID: abc123xyz
```

**"How are my ads performing?"**
```
Analyze advertising performance for ClickTech.
What's my ROAS and ACOS?
User ID: abc123xyz
```

**"Give me business insights"**
```
Give me business insights and recommendations.
User ID: abc123xyz
```

**"Calculate my ROI"**
```
Calculate ROI for E-Trade vendor.
User ID: abc123xyz
```

## Troubleshooting

### "MCP tools not showing in Claude Desktop"
- Make sure you used the correct config file path
- Verify the absolute path to index.js is correct
- Restart Claude Desktop completely

### "Firebase error: Permission denied"
- Make sure firebase-service-account.json is in the mcp-server folder
- Verify the file is valid JSON
- Check that you downloaded it from the correct Firebase project

### "Cannot find module @modelcontextprotocol/sdk"
- Run `npm install` in the mcp-server directory
- Make sure Node.js version is 18 or higher: `node --version`

## What's Next?

Once connected, Claude can:
- Analyze your P&L data in real-time
- Identify trends and anomalies
- Provide business recommendations
- Calculate complex metrics
- Compare vendor performance
- Forecast revenue
- Optimize advertising spend

Just ask Claude anything about your business data!

## Need Help?

1. Read the full [README.md](./README.md)
2. Check [Firebase Console](https://console.firebase.google.com/project/pnl-amzon)
3. Verify your data in Firebase Realtime Database
4. Test the MCP server: `npm start`
