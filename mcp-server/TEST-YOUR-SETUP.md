# Test Your MCP Setup - Step by Step

Follow these steps to diagnose and fix the issue where Claude AI can't load your data.

## Step 1: Run the Diagnostic Tool (1 minute)

Open your terminal and run:

```bash
cd /home/user/final-vendor-pNL/mcp-server
npm run diagnose
```

### What You Should See:

```
🔍 P&L MCP Server Diagnostic Tool
═══════════════════════════════════════════════════════════

Test 1: Checking Firebase service account file...
✅ Service account file found
   Project ID: pnl-amzon
   Client Email: firebase-adminsdk-xxxxx@pnl-amzon.iam.gserviceaccount.com

Test 2: Initializing Firebase Admin SDK...
✅ Firebase Admin SDK initialized successfully

Test 3: Testing database connection...
✅ Database connection successful

Test 4: Listing available users in database...
✅ Found 1 user(s) in database:

   User ID: abc123xyz
   Data available:
   - asinData (2 vendors: E-Trade, Retailez)
   - savedInvoices (2 vendors: E-Trade, Retailez)
   - advertisingData (1 vendors: E-Trade)
```

---

## If You See Errors:

### ❌ Error: "Service account file not found"

**This is the most common issue!**

#### Fix:

1. **Download the service account key:**
   - Go to: https://console.firebase.google.com/project/pnl-amzon/settings/serviceaccounts/adminsdk
   - Click the blue button: "Generate New Private Key"
   - Click "Generate Key" in the popup
   - A JSON file will download

2. **Rename and move the file:**
   ```bash
   # Move the downloaded file to the mcp-server folder
   mv ~/Downloads/pnl-amzon-firebase-adminsdk-*.json /home/user/final-vendor-pNL/mcp-server/firebase-service-account.json
   ```

3. **Verify the file exists:**
   ```bash
   ls -la /home/user/final-vendor-pNL/mcp-server/firebase-service-account.json
   ```

4. **Run diagnostic again:**
   ```bash
   npm run diagnose
   ```

---

### ⚠️ Warning: "No users found in database"

**This means you haven't logged into the web app yet.**

#### Fix:

1. Open `INDEX.html` in your browser
2. Sign in or create an account
3. Add some data (ASINs, invoices, or advertising campaigns)
4. Run diagnostic again: `npm run diagnose`

---

### ⚠️ Warning: "No data found for this user"

**You're logged in but haven't added any data yet.**

#### Fix:

1. Open `INDEX.html` in your browser
2. Upload CSV files for:
   - ASIN Master Data
   - DF Invoice / FC Invoice
   - Advertising Data
3. Run diagnostic again: `npm run diagnose`

---

## Step 2: Copy Your User ID (30 seconds)

From the diagnostic tool output, copy your User ID:

```
User ID: abc123xyz  ← Copy this!
```

Save this somewhere - you'll need it for every question you ask Claude.

---

## Step 3: Verify Claude Desktop Config (2 minutes)

### Find your config file:

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/
```
Look for: `claude_desktop_config.json`

**Windows:**
```cmd
explorer %APPDATA%\Claude
```
Look for: `claude_desktop_config.json`

**Linux:**
```bash
xdg-open ~/.config/Claude/
```
Look for: `claude_desktop_config.json`

### Your config should look like this:

```json
{
  "mcpServers": {
    "pnl-management": {
      "command": "node",
      "args": [
        "/home/user/final-vendor-pNL/mcp-server/index.js"
      ]
    }
  }
}
```

**⚠️ IMPORTANT:**
- Use **absolute paths** (starting with `/` on macOS/Linux or `C:\` on Windows)
- Do NOT use `~` or `./` in the path
- Replace `/home/user/` with your actual home directory path

### Find your actual path:

```bash
cd /home/user/final-vendor-pNL/mcp-server
pwd
```

This shows your full path. Use that in the config!

---

## Step 4: Restart Claude Desktop (30 seconds)

**This is critical!** Claude Desktop only reads the config on startup.

1. **Completely quit Claude Desktop:**
   - macOS: `Cmd + Q` (not just close the window!)
   - Windows: Right-click system tray icon → Quit
   - Linux: Quit from menu

2. **Wait 5 seconds**

3. **Start Claude Desktop again**

4. **Look for the hammer icon** 🔨 in the Claude Desktop interface
   - If you see it, MCP is connected!
   - If you don't see it, check your config file again

---

## Step 5: Test with Claude AI (1 minute)

Ask Claude these questions **in this exact format**:

### Test 1: List Vendors

```
List my vendors. User ID: abc123xyz
```

Replace `abc123xyz` with YOUR user ID from Step 2.

**Expected response:**
```json
{
  "userId": "abc123xyz",
  "vendors": ["E-Trade", "Retailez"],
  "totalVendors": 2
}
```

---

### Test 2: Analyze P&L

```
Analyze profit and loss for E-Trade vendor. User ID: abc123xyz
```

**Expected response:**
```json
{
  "vendor": "E-Trade",
  "metrics": {
    "revenue": "$45,230.50",
    "cogs": "$25,100.00",
    "grossProfit": "$20,130.50",
    "netProfit": "$14,900.50",
    "profitMargin": "32.94%"
  }
}
```

---

### Test 3: Get Business Insights

```
Give me business insights. User ID: abc123xyz
```

**Expected response:**
Claude will analyze your data and provide recommendations!

---

## Common Mistakes

### ❌ Wrong: No User ID

```
Analyze profit for E-Trade
```

### ✅ Correct: Include User ID

```
Analyze profit and loss for E-Trade vendor. User ID: abc123xyz
```

---

### ❌ Wrong: Using email instead of UID

```
User ID: myemail@gmail.com
```

### ✅ Correct: Using UID

```
User ID: abc123xyz
```

---

### ❌ Wrong: Wrong vendor name

```
Analyze profit for etrade
```

### ✅ Correct: Exact vendor name (case-sensitive)

```
Analyze profit and loss for E-Trade vendor
```

---

## Still Not Working?

### Quick Checklist:

- [ ] Ran `npm run diagnose` and all tests passed
- [ ] Copied correct User ID (not email!)
- [ ] Claude Desktop config has absolute path
- [ ] Restarted Claude Desktop after config changes
- [ ] See hammer icon 🔨 in Claude Desktop
- [ ] Including "User ID: ..." in every question

### Get More Help:

Read the full troubleshooting guide:
```bash
cat /home/user/final-vendor-pNL/mcp-server/TROUBLESHOOTING.md
```

Or open: `/home/user/final-vendor-pNL/mcp-server/TROUBLESHOOTING.md`

---

## What's Happening Behind the Scenes

When you ask Claude a question:

1. **Claude Desktop** receives your message
2. **Claude AI** recognizes you're asking about P&L data
3. **Claude** calls the MCP server tool (e.g., `analyze_profit_loss`)
4. **MCP Server** connects to Firebase using the service account key
5. **MCP Server** fetches your data from Firebase Realtime Database
6. **MCP Server** calculates metrics and returns results to Claude
7. **Claude** formats the data and shows you the answer

If any step fails, you'll get an error. The diagnostic tool checks steps 4-6.

---

## Example: Working Session

```bash
# 1. Run diagnostic
$ npm run diagnose

✅ All tests passed
User ID: K8mPx2QvNnabcdefghijklm

# 2. Open Claude Desktop
# (Make sure you see the hammer icon 🔨)

# 3. Ask Claude:
"List my vendors. User ID: K8mPx2QvNnabcdefghijklm"

# 4. Claude responds:
# {
#   "userId": "K8mPx2QvNnabcdefghijklm",
#   "vendors": ["E-Trade", "Retailez"],
#   "totalVendors": 2
# }

# 5. Ask for analysis:
"Analyze profit and loss for E-Trade. User ID: K8mPx2QvNnabcdefghijklm"

# 6. Claude shows detailed P&L metrics!
```

---

## Success!

If you got results from Claude, you're all set! 🎉

You can now ask Claude:
- Any question about your P&L data
- For business insights and recommendations
- To analyze specific vendors or products
- To calculate ROI and profit margins
- To identify trends and anomalies

No more manual calculations! Just ask Claude in plain English.

---

**Need help?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.
