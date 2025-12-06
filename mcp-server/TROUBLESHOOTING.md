# Troubleshooting Guide

## MCP Connected But Claude Can't Load Data

If the MCP server is connected to Claude Desktop but you're not getting results, follow these steps:

### Step 1: Run the Diagnostic Tool

```bash
cd /home/user/final-vendor-pNL/mcp-server
npm run diagnose
```

This will check:
- ✅ Service account file exists
- ✅ Firebase connection works
- ✅ Users exist in database
- ✅ Data structure is correct
- ✅ Tools can access data

### Step 2: Common Issues and Solutions

#### Issue: "Service account file not found"

**Problem:** The MCP server can't find `firebase-service-account.json`

**Solution:**
1. Go to Firebase Console: https://console.firebase.google.com/project/pnl-amzon/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Save the file as `firebase-service-account.json` in the `mcp-server` folder
4. Restart Claude Desktop

#### Issue: "No users found in database"

**Problem:** The database is empty

**Solution:**
1. Open the P&L web app (`INDEX.html`)
2. Sign in with your account
3. Add some data (ASINs, invoices, or advertising data)
4. Try Claude AI again

#### Issue: "User ID not found"

**Problem:** You're using the wrong User ID

**Solution:**
Find your correct User ID:

**Option 1:** Run the diagnostic tool
```bash
npm run diagnose
```

**Option 2:** Open browser console on INDEX.html
```javascript
firebase.auth().currentUser.uid
```

**Option 3:** Firebase Console
- Go to: https://console.firebase.google.com/project/pnl-amzon/authentication/users
- Copy the UID next to your email

#### Issue: "No vendors found"

**Problem:** No data exists for this user/vendor

**Solution:**
1. Make sure you've uploaded data in the web app
2. Check vendor name spelling (case-sensitive: "E-Trade", "Retailez", "ClickTech")
3. Verify data exists in Firebase Console: https://console.firebase.google.com/project/pnl-amzon/database/pnl-amzon-default-rtdb/data

#### Issue: "Permission denied"

**Problem:** Firebase security rules or service account permissions

**Solution:**
1. Check Firebase Database Rules in console
2. Ensure service account has Admin SDK permissions
3. Verify the service account JSON is for the correct project (pnl-amzon)

#### Issue: Claude says "I don't have access to that tool"

**Problem:** MCP server configuration in Claude Desktop

**Solution:**
1. Check your Claude Desktop config file path:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Verify the config content:
```json
{
  "mcpServers": {
    "pnl-management": {
      "command": "node",
      "args": [
        "/absolute/path/to/final-vendor-pNL/mcp-server/index.js"
      ]
    }
  }
}
```

3. **Important:** Use absolute paths, not relative paths like `~/` or `./`
4. Restart Claude Desktop completely

### Step 3: Test with Correct Format

When asking Claude, use this exact format:

```
List my vendors. User ID: abc123xyz
```

```
Analyze profit and loss for E-Trade vendor. User ID: abc123xyz
```

**Common mistakes:**
- ❌ "Analyze profit for E-Trade" (missing User ID)
- ❌ "User ID: myemail@gmail.com" (use UID, not email)
- ❌ "Vendor: etrade" (case-sensitive, should be "E-Trade")
- ✅ "Analyze profit and loss for E-Trade vendor. User ID: abc123xyz"

### Step 4: Check Claude Desktop Logs

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```cmd
type %USERPROFILE%\AppData\Local\Claude\logs\mcp*.log
```

**Linux:**
```bash
tail -f ~/.config/Claude/logs/mcp*.log
```

Look for error messages that indicate what's failing.

### Step 5: Verify Data Structure in Firebase

1. Go to Firebase Console: https://console.firebase.google.com/project/pnl-amzon/database/pnl-amzon-default-rtdb/data

2. Navigate to: `users/[YOUR_USER_ID]/`

3. You should see:
   ```
   users/
     └── abc123xyz/
         ├── asinData/
         │   └── E-Trade/
         │       ├── meta
         │       └── batch_0
         ├── savedInvoices/
         │   └── E-Trade/
         │       ├── meta
         │       └── batch_0
         └── advertisingData/
             └── E-Trade/
                 ├── meta
                 └── batch_0
   ```

4. If this structure is missing, add data through the web app first.

### Step 6: Manual Test

Test the MCP server manually:

```bash
cd /home/user/final-vendor-pNL/mcp-server
npm start
```

You should see:
```
✅ Firebase Admin initialized successfully
🚀 P&L Management MCP Server running on stdio
```

If you see errors here, the server isn't starting correctly.

### Step 7: Check Node.js Version

```bash
node --version
```

Must be v18.0.0 or higher. Update if needed:
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install latest LTS
nvm install --lts
nvm use --lts
```

### Step 8: Reinstall Dependencies

```bash
cd /home/user/final-vendor-pNL/mcp-server
rm -rf node_modules package-lock.json
npm install
```

Restart Claude Desktop after reinstalling.

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] `firebase-service-account.json` exists in `mcp-server/` folder
- [ ] Logged into web app (INDEX.html) at least once
- [ ] Data added to web app (ASINs, invoices, or advertising)
- [ ] User ID copied from diagnostic tool or Firebase Console
- [ ] Claude Desktop config has absolute path to index.js
- [ ] Restarted Claude Desktop after configuration
- [ ] Node.js version is 18 or higher
- [ ] `npm install` completed without errors
- [ ] Diagnostic tool (`npm run diagnose`) passes all tests

## Example Working Session

Here's what a working session looks like:

**1. Run diagnostic:**
```bash
$ npm run diagnose

✅ Service account file found
✅ Firebase Admin SDK initialized successfully
✅ Database connection successful
✅ Found 1 user(s) in database:
   User ID: abc123xyz
   Data available:
   - asinData (2 vendors: E-Trade, Retailez)
   - savedInvoices (2 vendors: E-Trade, Retailez)
   - advertisingData (1 vendors: E-Trade)
```

**2. Ask Claude:**
```
List my vendors. User ID: abc123xyz
```

**3. Claude's response:**
```json
{
  "userId": "abc123xyz",
  "vendors": ["E-Trade", "Retailez"],
  "totalVendors": 2
}
```

**4. Analyze data:**
```
Analyze profit and loss for E-Trade vendor. User ID: abc123xyz
```

**5. Claude's response:**
```json
{
  "vendor": "E-Trade",
  "metrics": {
    "revenue": "$45,230.50",
    "cogs": "$25,100.00",
    "advertisingCosts": "$5,230.00",
    "grossProfit": "$20,130.50",
    "netProfit": "$14,900.50",
    "profitMargin": "32.94%",
    "roas": "8.65",
    "acos": "11.56%"
  }
}
```

## Still Having Issues?

If you've tried all the above and it's still not working:

1. **Capture the exact error:**
   - What question did you ask Claude?
   - What was Claude's exact response?
   - What does `npm run diagnose` show?

2. **Check the basics:**
   - Is the file `firebase-service-account.json` from the correct Firebase project (pnl-amzon)?
   - Is your internet connection stable?
   - Did you restart Claude Desktop after every config change?

3. **Common working configurations:**

   **macOS example:**
   ```json
   {
     "mcpServers": {
       "pnl-management": {
         "command": "node",
         "args": [
           "/Users/yourname/final-vendor-pNL/mcp-server/index.js"
         ]
       }
     }
   }
   ```

   **Windows example:**
   ```json
   {
     "mcpServers": {
       "pnl-management": {
         "command": "node",
         "args": [
           "C:\\Users\\yourname\\final-vendor-pNL\\mcp-server\\index.js"
         ]
       }
     }
   }
   ```

   **Linux example:**
   ```json
   {
     "mcpServers": {
       "pnl-management": {
         "command": "node",
         "args": [
           "/home/yourname/final-vendor-pNL/mcp-server/index.js"
         ]
       }
     }
   }
   ```

## Debug Mode

For detailed logging, modify your Claude Desktop config:

```json
{
  "mcpServers": {
    "pnl-management": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-server/index.js"
      ],
      "env": {
        "DEBUG": "mcp:*",
        "NODE_ENV": "development"
      }
    }
  }
}
```

This will show detailed logs in Claude Desktop's log files.

## Need More Help?

Create an issue with:
1. Output from `npm run diagnose`
2. Your Claude Desktop config (with paths redacted if needed)
3. The exact question you asked Claude
4. Claude's exact error response
5. Your Node.js version (`node --version`)
6. Your operating system
