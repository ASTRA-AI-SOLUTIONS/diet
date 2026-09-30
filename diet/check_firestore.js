import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const users = await getDocs(collection(db, 'users'));
  console.log("Users:", users.docs.length);
  for (const doc of users.docs) {
    const meals = await getDocs(collection(db, 'users', doc.id, 'meals'));
    console.log(`User ${doc.id} has ${meals.docs.length} meals`);
  }
}
check();
