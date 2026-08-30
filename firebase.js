// --- FIREBASE CONFIGURATION & INITIALIZATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQvHD8EfaYS7Oz0cw0_Sap6ay3OkdWBg0",
    authDomain: "yourpixvinz.firebaseapp.com",
    projectId: "yourpixvinz",
    storageBucket: "yourpixvinz.firebasestorage.app",
    messagingSenderId: "775243159534",
    appId: "1:775243159534:web:829fbbd49db4adcb8b60ff",
    measurementId: "G-GH1TXYJPQX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Make database tools globally accessible for your other script files
window.pixvinzDb = { db, doc, getDoc, setDoc };

// --- GLOBAL CLOUD SYNC FUNCTIONS ---

window.saveUserDataToCloud = async function() {
    try {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user || !user.username) return;

        // Gather all localStorage keys tied to this user, plus explicit game stats
        const userData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
                key.startsWith(user.username) || 
                key.includes('currentChallenge') || 
                key.includes('challenge') ||
                key.includes('level') ||
                key.includes('xp') ||
                key.includes('bonusXp') ||
                key.includes('coins') ||
                key.includes('totalCoins') ||
                key.includes('avatar')
            ) {
                userData[key] = localStorage.getItem(key);
            }
        }

        // Save safely to Firestore under a 'players' collection
        await setDoc(doc(db, 'players', user.username), {
            username: user.username,
            data: userData,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        console.log("Player progress (challenge, level, xp, coins, avatar) successfully synced to cloud.");
    } catch (error) {
        console.error("Cloud sync failed:", error);
    }
};

window.loadUserDataFromCloud = async function(username) {
    try {
        const userSnap = await getDoc(doc(db, 'players', username));
        if (userSnap.exists()) {
            const cloudData = userSnap.data().data;
            if (cloudData) {
                // Restore all keys back into localStorage so cross-device sync works seamlessly
                for (const [key, value] of Object.entries(cloudData)) {
                    localStorage.setItem(key, value);
                }
                console.log("Player progress successfully restored from cloud.");
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Failed to load cloud data:", error);
        return false;
    }
};
