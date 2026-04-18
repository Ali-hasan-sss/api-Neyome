#!/usr/bin/env node
'use strict';

// Firestore full export to JSON (collections and nested subcollections)
// Usage examples:
//   node export-firestore.js -a neyome-350a6-firebase-adminsdk-fbsvc-5dbfa7c216.json -o original.json
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node export-firestore.js -o backup.json
// Optional: -p <projectId>

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { account: process.env.GOOGLE_APPLICATION_CREDENTIALS || '', out: 'firestore-export.json', projectId: '' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '-a' || a === '--account') && args[i + 1]) {
      opts.account = args[++i];
    } else if ((a === '-o' || a === '--out') && args[i + 1]) {
      opts.out = args[++i];
    } else if ((a === '-p' || a === '--project') && args[i + 1]) {
      opts.projectId = args[++i];
    } else if (a === '-h' || a === '--help') {
      console.log('Usage: node export-firestore.js [-a serviceAccount.json] [-o output.json] [-p projectId]');
      process.exit(0);
    }
  }
  return opts;
}

function initFirebase({ account, projectId }) {
  const hasApp = admin.apps && admin.apps.length > 0;
  if (hasApp) return;

  const credPath = account && account.trim().length > 0 ? account.trim() : process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    console.error('Missing service account JSON. Provide with -a or set GOOGLE_APPLICATION_CREDENTIALS');
    process.exit(1);
  }
  const resolved = path.resolve(credPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Service account file not found: ${resolved}`);
    process.exit(1);
  }
  const serviceAccount = require(resolved);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
  });
}

// Serialize Firestore data to JSON-friendly values (timestamps, geopoints, refs)
function serializeValue(v) {
  if (v === null || v === undefined) return v;
  // Firestore Timestamp
  if (v._seconds !== undefined && v._nanoseconds !== undefined && typeof v.toDate === 'function') {
    return { __datatype: 'timestamp', value: v.toDate().toISOString() };
  }
  // admin.firestore.Timestamp instance check
  if (typeof v === 'object' && v.constructor && v.constructor.name === 'Timestamp' && typeof v.toDate === 'function') {
    return { __datatype: 'timestamp', value: v.toDate().toISOString() };
  }
  // GeoPoint
  if (typeof v === 'object' && v.constructor && v.constructor.name === 'GeoPoint' && typeof v.latitude === 'number') {
    return { __datatype: 'geopoint', value: { latitude: v.latitude, longitude: v.longitude } };
  }
  // DocumentReference
  if (typeof v === 'object' && v.constructor && v.constructor.name === 'DocumentReference' && typeof v.path === 'string') {
    return { __datatype: 'document_reference', value: v.path };
  }
  if (Array.isArray(v)) return v.map(serializeValue);
  if (typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = serializeValue(val);
    return out;
  }
  return v;
}

async function exportCollectionRecursive(colRef) {
  const snapshot = await colRef.get();
  const collectionName = colRef.id;
  const result = {};

  for (const doc of snapshot.docs) {
    const data = serializeValue(doc.data());
    const subcollections = await doc.ref.listCollections();
    const sub = {};
    for (const subCol of subcollections) {
      sub[subCol.id] = await exportCollectionRecursive(subCol);
    }
    result[doc.id] = { __doc: data, __subcollections: sub };
  }
  return result;
}

async function exportAll() {
  const db = admin.firestore();
  // Use recursive export per top-level collection
  const topCollections = await db.listCollections();
  const exportData = { __meta: { exportedAt: new Date().toISOString() }, __collections: {} };
  for (const col of topCollections) {
    process.stdout.write(`Exporting collection: ${col.id}\n`);
    exportData.__collections[col.id] = await exportCollectionRecursive(col);
  }
  return exportData;
}

(async () => {
  const opts = parseArgs();
  initFirebase(opts);
  try {
    const data = await exportAll();
    const outPath = path.resolve(opts.out);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Export complete -> ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
