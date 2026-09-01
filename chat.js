import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPFmx35ClB3c5vGBtv8rzVAiTK4rcwAik",
    authDomain: "pixvinz2026.firebaseapp.com",
    projectId: "pixvinz2026",
    storageBucket: "pixvinz2026.firebasestorage.app",
    messagingSenderId: "45609077809",
    appId: "1:45609077809:web:575611e46acda9f64c5910",
    measurementId: "G-W7FSERE8ZJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

function getChatDisplayName() {
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.displayName) return userObj.displayName;
        if (userObj && userObj.username) return userObj.username;
    } catch (e) {}
    return localStorage.getItem('vinpix_username') || "Player_" + Math.floor(Math.random() * 9000 + 1000);
}

// DOM Elements
const chatWidget = document.getElementById('chatWidget');
const chatIconBtn = document.getElementById('chatIconBtn');
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

// Start collapsed (showing only the icon)
chatWidget.classList.add('collapsed');

chatIconBtn.addEventListener('click', () => {
    chatWidget.classList.remove('collapsed');
    chatInput.focus();
});

chatToggleBtn.addEventListener('click', () => {
    chatWidget.classList.add('collapsed');
});

// Send Message Logic
async function sendMessage() {
    const playerName = getChatDisplayName();
    const text = chatInput.value.trim();
    if (!text) return;

    try {
        await addDoc(collection(db, "global-chat"), {
            name: playerName,
            text: text,
            timestamp: serverTimestamp()
        });
        chatInput.value = '';
        chatInput.focus();
    } catch (error) {
        console.error("Error sending message: ", error);
    }
}

chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// --- REAL-TIME ONLINE PRESENCE TRACKING ---
const sessionId = 'session_' + Math.random().toString(36).substring(2);
const presenceRef = doc(db, "chat-presence", sessionId);

async function updatePresence() {
    try {
        await setDoc(presenceRef, { lastSeen: serverTimestamp() });
    } catch (e) {}
}

updatePresence();
const presenceInterval = setInterval(updatePresence, 30000); // Heartbeat every 30s

window.addEventListener('beforeunload', () => {
    deleteDoc(presenceRef).catch(() => {});
});

// Listen to active users in presence collection
const onlineIndicatorEl = document.querySelector('.online-indicator');
const presenceQuery = query(collection(db, "chat-presence"));
onSnapshot(presenceQuery, (snapshot) => {
    let activeCount = 0;
    const now = Date.now();
    snapshot.forEach((dSnap) => {
        const data = dSnap.data();
        if (data.lastSeen) {
            const seenTime = data.lastSeen.toMillis ? data.lastSeen.toMillis() : now;
            // Consider online if active within last 60 seconds
            if (now - seenTime < 60000) {
                activeCount++;
            }
        } else {
            activeCount++;
        }
    });
    if (onlineIndicatorEl) {
        onlineIndicatorEl.innerHTML = `● ${Math.max(1, activeCount)} online`;
    }
});

// Helper for consistent player colors
function getPlayerColorClass(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = (Math.abs(hash) % 4) + 1;
    return `color-${colorIndex}`;
}

// Helper to format timestamp into "11:46 pm"
function formatMessageTime(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
}

// Real-time message listener
const q = query(collection(db, "global-chat"), orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = '';
    const myCurrentName = getChatDisplayName();

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const senderName = data.name || 'Anonymous';
        
        // Header container for Name and Time stamp
        const headerSpan = document.createElement('div');
        headerSpan.style.display = 'flex';
        headerSpan.style.alignItems = 'baseline';
        headerSpan.style.justifyContent = 'space-between';
        headerSpan.style.marginBottom = '2px';

        const userSpan = document.createElement('span');
        userSpan.className = 'user';
        if (senderName === myCurrentName) {
            userSpan.classList.add('my-name');
        } else {
            userSpan.classList.add(getPlayerColorClass(senderName));
        }
        userSpan.textContent = senderName;

        const timeSpan = document.createElement('span');
        timeSpan.style.fontSize = '10px';
        timeSpan.style.color = 'rgba(255, 255, 255, 0.4)';
        timeSpan.style.fontWeight = '400';
        timeSpan.textContent = formatMessageTime(data.timestamp);

        headerSpan.appendChild(userSpan);
        headerSpan.appendChild(timeSpan);

        const textDiv = document.createElement('div');
        textDiv.style.wordBreak = 'break-word';
        textDiv.textContent = data.text || '';

        messageDiv.appendChild(headerSpan);
        messageDiv.appendChild(textDiv);
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
