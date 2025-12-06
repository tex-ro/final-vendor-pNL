#!/usr/bin/env node

/**
 * MCP Server Diagnostic Tool
 * Run this to test your Firebase connection and data structure
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

console.log('\n🔍 P&L MCP Server Diagnostic Tool\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Check service account file
console.log('Test 1: Checking Firebase service account file...');
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  join(__dirname, 'firebase-service-account.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account file found');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}\n`);
} catch (error) {
  console.log('❌ Service account file not found or invalid');
  console.log(`   Looking for: ${serviceAccountPath}`);
  console.log(`   Error: ${error.message}\n`);
  console.log('📝 To fix: Download service account key from Firebase Console');
  console.log('   https://console.firebase.google.com/project/pnl-amzon/settings/serviceaccounts/adminsdk\n');
  process.exit(1);
}

// Test 2: Initialize Firebase
console.log('Test 2: Initializing Firebase Admin SDK...');
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://pnl-amzon-default-rtdb.firebaseio.com'
  });
  console.log('✅ Firebase Admin SDK initialized successfully\n');
} catch (error) {
  console.log('❌ Firebase initialization failed');
  console.log(`   Error: ${error.message}\n`);
  process.exit(1);
}

const realtimeDb = admin.database();

// Test 3: Check database connection
console.log('Test 3: Testing database connection...');
try {
  await realtimeDb.ref('.info/connected').once('value');
  console.log('✅ Database connection successful\n');
} catch (error) {
  console.log('❌ Database connection failed');
  console.log(`   Error: ${error.message}\n`);
  process.exit(1);
}

// Test 4: List users
console.log('Test 4: Listing available users in database...');
try {
  const usersSnapshot = await realtimeDb.ref('users').once('value');
  const usersData = usersSnapshot.val();

  if (!usersData) {
    console.log('⚠️  No users found in database');
    console.log('   Make sure you have logged into the web app (INDEX.html) first\n');
    process.exit(0);
  }

  const userIds = Object.keys(usersData);
  console.log(`✅ Found ${userIds.length} user(s) in database:`);

  for (const userId of userIds) {
    console.log(`\n   User ID: ${userId}`);

    // Check what data this user has
    const userData = usersData[userId];
    const dataTypes = [];

    if (userData.asinData) {
      const vendors = Object.keys(userData.asinData);
      dataTypes.push(`asinData (${vendors.length} vendors: ${vendors.join(', ')})`);
    }
    if (userData.savedInvoices) {
      const vendors = Object.keys(userData.savedInvoices);
      dataTypes.push(`savedInvoices (${vendors.length} vendors: ${vendors.join(', ')})`);
    }
    if (userData.advertisingData) {
      const vendors = Object.keys(userData.advertisingData);
      dataTypes.push(`advertisingData (${vendors.length} vendors: ${vendors.join(', ')})`);
    }

    if (dataTypes.length > 0) {
      console.log(`   Data available:`);
      dataTypes.forEach(dt => console.log(`   - ${dt}`));
    } else {
      console.log(`   ⚠️  No data found for this user`);
    }
  }

  console.log('\n');

  // Interactive test
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Interactive Test: Let\'s test the MCP tools with your data\n');

  const userId = await new Promise((resolve) => {
    rl.question(`Enter a User ID to test (press Enter for ${userIds[0]}): `, (answer) => {
      resolve(answer.trim() || userIds[0]);
    });
  });

  console.log(`\nTesting with User ID: ${userId}\n`);

  // Test 5: List vendors
  console.log('Test 5: Testing list_vendors tool...');
  try {
    const userData = usersData[userId];
    if (!userData) {
      console.log(`❌ User ${userId} not found in database\n`);
    } else {
      const vendors = [];
      if (userData.asinData) {
        vendors.push(...Object.keys(userData.asinData));
      }

      if (vendors.length > 0) {
        console.log(`✅ Found ${vendors.length} vendor(s): ${vendors.join(', ')}\n`);

        // Test 6: Analyze vendor data
        const vendor = vendors[0];
        console.log(`Test 6: Testing analyze_profit_loss for vendor "${vendor}"...`);

        try {
          const asinData = userData.asinData[vendor];
          const invoiceData = userData.savedInvoices?.[vendor];
          const adData = userData.advertisingData?.[vendor];

          console.log(`   ASIN Data: ${asinData ? '✅ Available' : '❌ Not found'}`);
          console.log(`   Invoice Data: ${invoiceData ? '✅ Available' : '❌ Not found'}`);
          console.log(`   Advertising Data: ${adData ? '✅ Available' : '❌ Not found'}`);

          // Reconstruct batched data
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

          const asinArray = reconstructBatchedData(asinData);
          const invoiceArray = reconstructBatchedData(invoiceData);
          const adArray = reconstructBatchedData(adData);

          console.log(`\n   Reconstructed Data:`);
          console.log(`   - ASINs: ${asinArray.length} items`);
          console.log(`   - Invoices: ${invoiceArray.length} items`);
          console.log(`   - Ad Campaigns: ${adArray.length} items`);

          if (asinArray.length > 0) {
            console.log(`\n   Sample ASIN data structure:`);
            console.log(`   ${JSON.stringify(asinArray[0], null, 2).split('\n').slice(0, 10).join('\n   ')}`);
          }

          // Calculate metrics
          let totalRevenue = 0;
          let totalCOGS = 0;
          let totalAd = 0;

          asinArray.forEach(asin => {
            totalRevenue += parseFloat(asin.revenue || asin.totalRevenue || 0);
          });

          invoiceArray.forEach(invoice => {
            totalCOGS += parseFloat(invoice.cogs || invoice.totalCost || 0);
          });

          adArray.forEach(ad => {
            totalAd += parseFloat(ad.spend || ad.adSpend || 0);
          });

          console.log(`\n   Calculated Metrics:`);
          console.log(`   - Total Revenue: $${totalRevenue.toFixed(2)}`);
          console.log(`   - Total COGS: $${totalCOGS.toFixed(2)}`);
          console.log(`   - Total Ad Spend: $${totalAd.toFixed(2)}`);
          console.log(`   - Gross Profit: $${(totalRevenue - totalCOGS).toFixed(2)}`);
          console.log(`   - Net Profit: $${(totalRevenue - totalCOGS - totalAd).toFixed(2)}`);

          console.log(`\n✅ P&L analysis working correctly!\n`);

        } catch (error) {
          console.log(`❌ Error analyzing data: ${error.message}\n`);
        }

      } else {
        console.log(`⚠️  No vendors found. Please add data in the web app first.\n`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  rl.close();

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 Summary:\n');
  console.log('To use with Claude AI, ask questions like:\n');
  console.log(`   "List my vendors. User ID: ${userId}"\n`);
  console.log(`   "Analyze profit and loss for E-Trade. User ID: ${userId}"\n`);
  console.log(`   "Get business insights. User ID: ${userId}"\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);

} catch (error) {
  console.log('❌ Error listing users');
  console.log(`   Error: ${error.message}\n`);
  console.log('   Stack trace:', error.stack);
  process.exit(1);
}
