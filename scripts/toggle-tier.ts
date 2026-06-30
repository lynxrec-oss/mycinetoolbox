import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA4Qb_xT-Q33qowX-DIXohPj6TGYETk59o",
  authDomain: "tembo-page-prod-25.firebaseapp.com",
  projectId: "tembo-page-prod-25",
  storageBucket: "tembo-page-prod-25.firebasestorage.app",
  messagingSenderId: "130718915454",
  appId: "1:130718915454:web:0fbcd5c8161185ffe0312f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const arg = process.argv[2];
  if (!arg) {
    console.log("Usage: npx tsx scripts/toggle-tier.ts [free|pro|get]");
    process.exit(1);
  }

  const docRef = doc(db, 'creators', 'elenarust');

  if (arg === 'get') {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log(`Current Account Tier: "${data.tier || 'free'}"`);
    } else {
      console.log("Elena Rust creator document not found!");
    }
  } else {
    const tier = arg.toLowerCase();
    await updateDoc(docRef, { tier });
    console.log(`Successfully updated creator tier to: "${tier}"`);
  }
  process.exit(0);
}

run().catch(console.error);
