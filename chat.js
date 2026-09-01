import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";

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

document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chatBody');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const onlineCount = document.getElementById('onlineCount');

    if (minimizeBtn && chatBody) {
        minimizeBtn.addEventListener('click', () => {
            chatBody.classList.toggle('collapsed');
            minimizeBtn.textContent = chatBody.classList.contains('collapsed') ? '+' : '−';
        });
    }

    if (!chatMessages || !chatInput || !chatSendBtn) return;

    const playerName = "Player_" + Math.floor(Math.random() * 9000 + 1000);

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        try {
            await addDoc(collection(db, "global-chat"), {
                name: playerName,
                text: text,
                createdAt: serverTimestamp()
            });
            chatInput.value = '';
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    const q = query(collection(db, "global-chat"), orderBy("createdAt", "asc"), limit(50));
    onSnapshot(q, (snapshot) => {
        chatMessages.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message';
            
            const userSpan = document.createElement('span');
            userSpan.className = 'user';
            userSpan.textContent = `${data.name || 'Anonymous'}:`;
            
            const textNode = document.createTextNode(` ${data.text || ''}`);
            
            msgDiv.appendChild(userSpan);
            msgDiv.appendChild(textNode);
            chatMessages.appendChild(msgDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    if (onlineCount) {
        onlineCount.textContent = Math.floor(Math.random() * 5) + 1;
    }
});
