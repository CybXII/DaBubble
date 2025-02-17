// ausführen via:
// node resetDatabase.js 

const admin = require("firebase-admin");

// Firebase Admin SDK initialisieren
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Neue Grundstruktur der Firestore-Datenbank definieren
const defaultData = {
    users: [
        {
            email: "admin@admin.de",
            name: "Admin",
            photoURL: "/img/avatars/avatar1.svg",
            privateNoteRef: "",
            provider: "password",
            status: true,
            userId: "admin"
        }
    ],
    messages: {},
    channels: [
        {
            id: "allgemein",
            name: "Allgemein",
            description: "Allgemein-Chat",
            createdAt: admin.firestore.Timestamp.now(),
            createdBy: "admin",
            isPrivate: false,
            members: []
        },
        {
            id: "entwickler",
            name: "Entwickler",
            description: "Entwickler-Chat",
            createdAt: admin.firestore.Timestamp.now(),
            createdBy: "admin",
            isPrivate: false,
            members: []
        },
        // {
        //     id: "guestsonly",
        //     name: "Gäste only",
        //     description: "Ein Chat nur für Gäste",
        //     createdAt: admin.firestore.Timestamp.now(),
        //     createdBy: "admin",
        //     isPrivate: false,
        //     members: []
        // }
    ]
};

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

        // users und messages initialisieren
        for (const user of defaultData.users) {
            await db.collection("users").doc(user.userId).set(user);
        }

        await db.collection("messages").doc("default").set({ placeholder: true });

        // channels als einzelne Dokumente speichern
        for (const channel of defaultData.channels) {
            await db.collection("channels").doc(channel.id).set(channel);
        }

        console.log("Datenbank erfolgreich zurückgesetzt!");
    } catch (error) {
        console.error("Fehler beim Zurücksetzen der Datenbank:", error);
    }
}

resetDatabase();
