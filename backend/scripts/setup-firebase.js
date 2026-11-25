const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Load .env from backend root
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\n/g, "\n");
    if (!process.env[key]) process.env[key] = val;
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

const USERS = [
  { email: "rangga@harsarekaniaga.id", password: "RanggaHarsa!2026", displayName: "Rangga", role: "admin" },
  { email: "hafids@harsarekaniaga.id", password: "HafidsHarsa!2026", displayName: "Hafids", role: "admin" },
];

async function ensureUser(u) {
  let record;
  try {
    record = await auth.getUserByEmail(u.email);
    await auth.updateUser(record.uid, { password: u.password, displayName: u.displayName, emailVerified: true });
    console.log(`UPDATED auth user: ${u.email} (${record.uid})`);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      record = await auth.createUser({ email: u.email, password: u.password, displayName: u.displayName, emailVerified: true });
      console.log(`CREATED auth user: ${u.email} (${record.uid})`);
    } else {
      throw e;
    }
  }
  await auth.setCustomUserClaims(record.uid, { role: u.role, admin: true });
  await db.collection("users").doc(record.uid).set({
    id: record.uid,
    email: u.email,
    name: u.displayName,
    role: u.role,
    active: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`UPSERTED Firestore users/${record.uid}`);
  return { ...u, uid: record.uid };
}

async function seedData() {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const distRef = db.collection("commissionDistribution").doc("main");
  await distRef.set({
    id: "main",
    partnerAShare: 40,
    partnerBShare: 40,
    operationalReserve: 20,
    demo: true,
    updatedAt: now,
    createdAt: now,
  }, { merge: true });
  console.log("UPSERTED commissionDistribution/main");

  // Seed sample records only if collections are empty
  const seedIfEmpty = async (col, docs) => {
    const snap = await db.collection(col).limit(1).get();
    if (!snap.empty) { console.log(`SKIP ${col}: already has data`); return; }
    const batch = db.batch();
    for (const d of docs) {
      const ref = db.collection(col).doc(d.id);
      batch.set(ref, { ...d, createdAt: now, updatedAt: now });
    }
    await batch.commit();
    console.log(`SEEDED ${col}: ${docs.length} docs`);
  };

  await seedIfEmpty("suppliers", [
    { id: "sup-001", companyName: "PT Rempah Nusantara", country: "Indonesia", contact: "Budi Santoso", demo: true },
  ]);
  await seedIfEmpty("buyers", [
    { id: "buy-001", companyName: "Global Spice Trading", country: "Singapore", contact: "Tan Wei Ming", demo: true },
  ]);
  await seedIfEmpty("products", [
    { id: "prod-001", productName: "Vanilla Beans Grade A", productCategory: "Spices", price: 2500000, demo: true },
  ]);
}

async function main() {
  console.log("== Firebase setup start ==");
  console.log("Project:", process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const results = [];
  for (const u of USERS) results.push(await ensureUser(u));
  await seedData();
  console.log("\n== ACCOUNTS ==");
  for (const r of results) {
    console.log(`Email: ${r.email}`);
    console.log(`Password: ${r.password}`);
    console.log(`UID: ${r.uid}`);
    console.log("---");
  }
  console.log("== Done ==");
}

main().catch((e) => { console.error(e); process.exit(1); });
