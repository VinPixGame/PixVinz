import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
const chatSoundBtn = document.getElementById('chatSoundBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
const typingIndicator = document.getElementById('typingIndicator');

// --- SOUND SETTINGS ---
let isMuted = localStorage.getItem('chat_muted') === 'true';
updateSoundButtonIcon();

chatSoundBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('chat_muted', isMuted);
    updateSoundButtonIcon();
});

function updateSoundButtonIcon() {
    chatSoundBtn.textContent = isMuted ? '🔇' : '🔊';
}

function playPopSound() {
    if (isMuted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
}

// --- PROFANITY FILTER ---
const badWords = ['fuck you', 'shit', 'bitch', 'whore', 'mother fucker', 'idiot', 'peasant', 'patay gutom', 'putang ina mo', 'puki ng ina mo', 'vagina', 'pussy', 'dick', 'titi', 'kiki', 'pukengkeng', 'suck', 'sucks', 'sucking', 'sucked', 'fucked', 'fucking', 'kantot', 'iyot', 'iyutan', 'kantutan', 'kantotan', 'kantowtan', 'dede', 'suso', 'chupa', 'chupain', 'subo mo to', 'isubo mo to', 'pepe', 'kain pepe', 'kain puke', 'bayag', 'asshole', 'ashole', 'assholle', 'fuck your ass', 'suck my dick', 'I will kill you', 'kill', 'suicide', 'rape', 'nipple', 'mipple', 'nnipple', 'ffuck', 'fffuck', 'ffffuckkk', 'fuckkk', 'damnit', 'gago', 'sira ulo', 'tarantado', 'tangna mo', ]; 

function filterProfanity(text) {
    // 1. Normalize text to strip accents (e.g., 'fùck' becomes 'fuck')
    const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let filtered = text;

    // 2. Automatically mask email addresses (e.g., player@gmail.com)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    filtered = filtered.replace(emailRegex, (match) => '*'.repeat(match.length));
    
    badWords.forEach(phrase => {
        // Split multi-word phrases so spaces between words become optional
        const words = phrase.split(/\s+/);
        const escapedWords = words.map(word => 
            word.split('').map(char => char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('[\\s\\W]*')
        );
        
        // Allow zero or more spaces/symbols between words (catches 'fuckyou' and 'fuck you')
        const pattern = escapedWords.join('[\\s\\W]*');
        const regex = new RegExp(pattern, 'gi');
        
        // Find matches in normalized text and mask the equivalent length in original text
        let match;
        while ((match = regex.exec(normalizedText)) !== null) {
            const matchLen = match[0].length;
            const dynamicRegex = new RegExp(pattern, 'gi');
            filtered = filtered.replace(dynamicRegex, (m) => '*'.repeat(m.length));
        }
    });

    return filtered;
}


// Toggle Widget State
chatWidget.classList.add('collapsed');

chatIconBtn.addEventListener('click', () => {
    chatWidget.classList.remove('collapsed');
    chatInput.focus();
    scrollToBottom();
});

chatToggleBtn.addEventListener('click', () => {
    chatWidget.classList.add('collapsed');
});

// Send Message Logic
async function sendMessage() {
    const playerName = getChatDisplayName();
    const rawText = chatInput.value.trim();
    if (!rawText) return;

    const cleanText = filterProfanity(rawText);

    try {
        await addDoc(collection(db, "global-chat"), {
            name: playerName,
            text: cleanText,
            timestamp: serverTimestamp()
        });
        chatInput.value = '';
        updatePresence(false);
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

// --- QUICK EMOJIS ---
document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        chatInput.value += btn.getAttribute('data-emoji');
        chatInput.focus();
    });
});

// --- REAL-TIME ONLINE & TYPING PRESENCE ---
const sessionId = 'session_' + Math.random().toString(36).substring(2);
const presenceRef = doc(db, "chat-presence", sessionId);
let typingTimeout = null;

async function updatePresence(isTyping = false) {
    try {
        await setDoc(presenceRef, { 
            lastSeen: serverTimestamp(),
            name: getChatDisplayName(),
            isTyping: isTyping 
        }, { merge: true });
    } catch (e) {}
}

updatePresence(false);
const presenceInterval = setInterval(() => updatePresence(false), 30000);

chatInput.addEventListener('input', () => {
    updatePresence(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        updatePresence(false);
    }, 2000);
});

window.addEventListener('beforeunload', () => {
    deleteDoc(presenceRef).catch(() => {});
});

// Listen to active users and typing indicators
const onlineIndicatorEl = document.querySelector('.online-indicator');
const presenceQuery = query(collection(db, "chat-presence"));
onSnapshot(presenceQuery, (snapshot) => {
    let activeCount = 0;
    const typingUsers = [];
    const now = Date.now();

    snapshot.forEach((dSnap) => {
        const data = dSnap.data();
        if (data.lastSeen) {
            const seenTime = data.lastSeen.toMillis ? data.lastSeen.toMillis() : now;
            if (now - seenTime < 60000) {
                activeCount++;
                if (data.isTyping && data.name && data.name !== getChatDisplayName()) {
                    typingUsers.push(data.name);
                }
            }
        } else {
            activeCount++;
        }
    });

    if (onlineIndicatorEl) {
        onlineIndicatorEl.innerHTML = `● ${Math.max(1, activeCount)} online`;
    }

    if (typingIndicator) {
        if (typingUsers.length > 0) {
            typingIndicator.textContent = `${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`;
        } else {
            typingIndicator.textContent = '';
        }
    }
});

// Helpers for colors, timestamps, and date headers
function getPlayerColorClass(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = (Math.abs(hash) % 4) + 1;
    return `color-${colorIndex}`;
}

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

function formatDateHeader(timestamp) {
    if (!timestamp) return 'Today';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Scroll Handling
let isUserScrolledUp = false;

chatMessages.addEventListener('scroll', () => {
    const threshold = 30;
    const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight <= threshold;
    isUserScrolledUp = !isAtBottom;
    if (isAtBottom) {
        scrollToBottomBtn.classList.add('hidden');
    }
});

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    scrollToBottomBtn.classList.add('hidden');
    isUserScrolledUp = false;
}

scrollToBottomBtn.addEventListener('click', scrollToBottom);

// Real-time message listener with Date Grouping
const q = query(collection(db, "global-chat"), orderBy("timestamp", "asc"));
let initialLoad = true;

onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = '';
    const myCurrentName = getChatDisplayName();
    let lastRenderedDate = '';

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Check and insert date divider if day changed
        const msgDateStr = formatDateHeader(data.timestamp);
        if (msgDateStr !== lastRenderedDate) {
            lastRenderedDate = msgDateStr;
            const dividerDiv = document.createElement('div');
            dividerDiv.className = 'chat-date-divider';
            dividerDiv.innerHTML = `<span>${msgDateStr}</span>`;
            chatMessages.appendChild(dividerDiv);
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const senderName = data.name || 'Anonymous';
        
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

    if (initialLoad) {
        scrollToBottom();
        initialLoad = false;
    } else {
        if (isUserScrolledUp) {
            scrollToBottomBtn.classList.remove('hidden');
        } else {
            scrollToBottom();
            playPopSound();
        }
    }
});
