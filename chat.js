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

// Pull the true display name using your profile's session logic
function getChatDisplayName() {
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.displayName) {
            return userObj.displayName;
        }
        if (userObj && userObj.username) {
            return userObj.username;
        }
    } catch (e) {}
    
    return localStorage.getItem('vinpix_username') || "Player_" + Math.floor(Math.random() * 9000 + 1000);
}

let playerName = getChatDisplayName();

const chatBody = document.getElementById('chatBody');
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

let isCollapsed = false;
chatToggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    chatBody.classList.toggle('collapsed', isCollapsed);
    chatToggleBtn.textContent = isCollapsed ? '+' : '−';
});

async function sendMessage() {
    // Refresh name in case they updated it in profile settings
    playerName = getChatDisplayName();
    
    const text = chatInput.value.trim();
    if (!text) return;

    try {
        await addDoc(collection(db, "global-chat"), {
            name: playerName,
            text: text,
            timestamp: serverTimestamp()
        });
        chatInput.value = '';
    } catch (error) {
        console.error("Error sending message: ", error);
    }
}

chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

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
