#!/usr/bin/env node

/**
 * Firebase Data Inspector
 * Inspects the actual data structure in Firebase to understand how data is stored
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

console.log('\n🔍 Firebase Data Structure Inspector\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  join(__dirname, 'firebase-service-account.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account loaded\n');
} catch (error) {
  console.log('❌ Service account file not found:', serviceAccountPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://pnl-amzon-default-rtdb.firebaseio.com'
});

const realtimeDb = admin.database();

async function inspectData() {
  console.log('Fetching users...\n');

  const usersSnapshot = await realtimeDb.ref('users').once('value');
  const usersData = usersSnapshot.val();

  if (!usersData) {
    console.log('❌ No users found in database\n');
    process.exit(0);
  }

  const userIds = Object.keys(usersData);
  console.log(`Found ${userIds.length} user(s)\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const userId = await new Promise((resolve) => {
    rl.question(`Enter User ID to inspect (default: ${userIds[0]}): `, (answer) => {
      resolve(answer.trim() || userIds[0]);
    });
  });

  console.log(`\n📊 Inspecting data for User: ${userId}\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const userData = usersData[userId];

  if (!userData) {
    console.log(`❌ User ${userId} not found\n`);
    rl.close();
    process.exit(0);
  }

  // Inspect ASIN Data
  if (userData.asinData) {
    console.log('📦 ASIN DATA STRUCTURE:\n');
    const vendors = Object.keys(userData.asinData);

    for (const vendor of vendors) {
      console.log(`   Vendor: "${vendor}"`);
      const vendorData = userData.asinData[vendor];

      console.log(`   Data type: ${typeof vendorData}`);
      console.log(`   Is array: ${Array.isArray(vendorData)}`);

      if (vendorData && typeof vendorData === 'object') {
        const keys = Object.keys(vendorData);
        console.log(`   Keys: ${keys.join(', ')}`);

        // Check if it's batched
        if (vendorData.meta) {
          console.log(`   Structure: BATCHED`);
          console.log(`   Meta:`, JSON.stringify(vendorData.meta, null, 2));

          // Check batches
          const batchKeys = keys.filter(k => k.startsWith('batch_'));
          console.log(`   Batch keys: ${batchKeys.join(', ')}`);

          if (batchKeys.length > 0) {
            const firstBatch = vendorData[batchKeys[0]];
            console.log(`   First batch type: ${typeof firstBatch}`);
            console.log(`   First batch is array: ${Array.isArray(firstBatch)}`);

            if (Array.isArray(firstBatch)) {
              console.log(`   First batch length: ${firstBatch.length}`);
              if (firstBatch.length > 0) {
                console.log(`   Sample item from batch:`, JSON.stringify(firstBatch[0], null, 2));
              }
            } else if (firstBatch) {
              console.log(`   First batch keys:`, Object.keys(firstBatch).slice(0, 5).join(', '));
              const firstKey = Object.keys(firstBatch)[0];
              if (firstKey) {
                console.log(`   Sample item:`, JSON.stringify(firstBatch[firstKey], null, 2));
              }
            }
          }
        } else if (Array.isArray(vendorData)) {
          console.log(`   Structure: DIRECT ARRAY`);
          console.log(`   Length: ${vendorData.length}`);
          if (vendorData.length > 0) {
            console.log(`   Sample item:`, JSON.stringify(vendorData[0], null, 2));
          }
        } else {
          console.log(`   Structure: OBJECT (not batched)`);
          const sampleKeys = keys.slice(0, 5);
          console.log(`   Sample keys: ${sampleKeys.join(', ')}`);

          if (keys.length > 0) {
            const firstKey = keys[0];
            console.log(`   Sample item (${firstKey}):`, JSON.stringify(vendorData[firstKey], null, 2));
          }
        }
      }

      console.log('');
    }
  } else {
    console.log('⚠️  No ASIN data found\n');
  }

  // Inspect Invoice Data
  if (userData.savedInvoices) {
    console.log('📄 INVOICE DATA STRUCTURE:\n');
    const vendors = Object.keys(userData.savedInvoices);

    for (const vendor of vendors) {
      console.log(`   Vendor: "${vendor}"`);
      const vendorData = userData.savedInvoices[vendor];

      console.log(`   Data type: ${typeof vendorData}`);
      console.log(`   Is array: ${Array.isArray(vendorData)}`);

      if (vendorData && typeof vendorData === 'object') {
        const keys = Object.keys(vendorData);
        console.log(`   Keys: ${keys.join(', ')}`);

        if (vendorData.meta) {
          console.log(`   Structure: BATCHED`);
          const batchKeys = keys.filter(k => k.startsWith('batch_'));
          console.log(`   Batch keys: ${batchKeys.join(', ')}`);

          if (batchKeys.length > 0) {
            const firstBatch = vendorData[batchKeys[0]];
            if (Array.isArray(firstBatch) && firstBatch.length > 0) {
              console.log(`   First batch length: ${firstBatch.length}`);
              console.log(`   Sample invoice:`, JSON.stringify(firstBatch[0], null, 2));
            }
          }
        } else if (Array.isArray(vendorData)) {
          console.log(`   Structure: DIRECT ARRAY`);
          console.log(`   Length: ${vendorData.length}`);
          if (vendorData.length > 0) {
            console.log(`   Sample invoice:`, JSON.stringify(vendorData[0], null, 2));
          }
        }
      }

      console.log('');
    }
  } else {
    console.log('⚠️  No invoice data found\n');
  }

  // Inspect Advertising Data
  if (userData.advertisingData) {
    console.log('📢 ADVERTISING DATA STRUCTURE:\n');
    const vendors = Object.keys(userData.advertisingData);

    for (const vendor of vendors) {
      console.log(`   Vendor: "${vendor}"`);
      const vendorData = userData.advertisingData[vendor];

      console.log(`   Data type: ${typeof vendorData}`);
      console.log(`   Is array: ${Array.isArray(vendorData)}`);

      if (vendorData && typeof vendorData === 'object') {
        const keys = Object.keys(vendorData);
        console.log(`   Keys: ${keys.join(', ')}`);

        if (vendorData.meta) {
          console.log(`   Structure: BATCHED`);
          const batchKeys = keys.filter(k => k.startsWith('batch_'));
          console.log(`   Batch keys: ${batchKeys.join(', ')}`);

          if (batchKeys.length > 0) {
            const firstBatch = vendorData[batchKeys[0]];
            if (Array.isArray(firstBatch) && firstBatch.length > 0) {
              console.log(`   First batch length: ${firstBatch.length}`);
              console.log(`   Sample ad data:`, JSON.stringify(firstBatch[0], null, 2));
            }
          }
        } else if (Array.isArray(vendorData)) {
          console.log(`   Structure: DIRECT ARRAY`);
          console.log(`   Length: ${vendorData.length}`);
          if (vendorData.length > 0) {
            console.log(`   Sample ad data:`, JSON.stringify(vendorData[0], null, 2));
          }
        }
      }

      console.log('');
    }
  } else {
    console.log('⚠️  No advertising data found\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('💡 Analysis:\n');

  // Provide recommendations
  const allVendors = new Set();
  if (userData.asinData) Object.keys(userData.asinData).forEach(v => allVendors.add(v));
  if (userData.savedInvoices) Object.keys(userData.savedInvoices).forEach(v => allVendors.add(v));
  if (userData.advertisingData) Object.keys(userData.advertisingData).forEach(v => allVendors.add(v));

  console.log(`   Unique vendors found: ${Array.from(allVendors).join(', ')}\n`);
  console.log('   When asking Claude AI, use the exact vendor name shown above.\n');
  console.log('   Vendor names are case-sensitive!\n');

  rl.close();
  process.exit(0);
}

inspectData().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
