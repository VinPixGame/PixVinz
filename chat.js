import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

// Open chat when clicking the floating icon
chatIconBtn.addEventListener('click', () => {
    chatWidget.classList.remove('collapsed');
    chatInput.focus();
});

// Close chat back to icon when clicking '-'
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

// Real-time listener
const q = query(collection(db, "global-chat"), orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = '';
    snapshot.forEach((doc) => {
        const data = doc.data();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const userSpan = document.createElement('span');
        userSpan.className = 'user';
        userSpan.textContent = `${data.name || 'Anonymous'}:`;
        
        const textNode = document.createTextNode(data.text || '');
        
        messageDiv.appendChild(userSpan);
        messageDiv.appendChild(textNode);
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
