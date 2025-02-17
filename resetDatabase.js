// Skript lokal ausführen mit "node resetDatabase.js"

const admin = require("firebase-admin");

// Firebase Admin SDK initialisieren
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Neue Grundstruktur der Firestore-Datenbank definieren
const defaultData = {
    users: {},
    messages: {},
    channels: {}
};

// entwickler:  vfphslFFYLqC4hHHlM8y
// allgemein: q6m6NQIQepOmjULyneBJ 


async function resetDatabase() {
    try {
        console.log("Lösche aktuelle Daten...");
        const collections = await db.listCollections();
        for (const collection of collections) {
            const snapshot = await collection.get();
            snapshot.forEach(async (doc) => {
                await doc.ref.delete();
            });
        }

        console.log("Setze Standardwerte...");
        for (const [key, value] of Object.entries(defaultData)) {
            await db.collection(key).doc("default").set(value);
        }

        console.log("Datenbank erfolgreich zurückgesetzt!");
    } catch (error) {
        console.error("Fehler beim Zurücksetzen der Datenbank:", error);
    }
}

resetDatabase();
