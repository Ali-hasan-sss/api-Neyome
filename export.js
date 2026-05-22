const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportData() {
  const collections = await db.listCollections();

  const data = {};

  for (const collection of collections) {
    const snapshot = await collection.get();

    data[collection.id] = [];

    snapshot.forEach(doc => {
      data[collection.id].push({
        id: doc.id,
        ...doc.data()
      });
    });
  }

  fs.writeFileSync("firebase-export.json", JSON.stringify(data, null, 2));

  console.log("Export completed");
}

exportData();