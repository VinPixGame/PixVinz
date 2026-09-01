import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
const badWords = ['fuck you', 'shit', 'bitch', 'whore', 'mother fucker', 'idiot', 'peasant', 'patay gutom', 'putang ina mo', 'puki ng ina mo', 'vagina', 'pussy', 'dick', 'titi', 'kiki', 'pukengkeng', 'suck', 'sucks', 'sucking', 'sucked', 'fucked', 'fucking', 'kantot', 'iyot', 'iyutan', 'kantutan', 'kantotan', 'kantowtan', 'dede', 'suso', 'chupa', 'chupain', 'subo mo to', 'isubo mo to', 'pepe', 'kain pepe', 'kain puke', 'bayag', 'asshole', 'ashole', 'assholle', 'fuck your ass', 'suck my dick', 'I will kill you', 'kill', 'suicide', 'rape', 'nipple', 'mipple', 'nnipple', 'ffuck', 'fffuck', 'ffffuckkk', 'fuckkk', 'damnit', 'gago', 'sira ulo', 'tarantado', 'tangna mo']; 

function filterProfanity(text) {
    const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let filtered = text;

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    filtered = filtered.replace(emailRegex, (match) => '*'.repeat(match.length));
    
    badWords.forEach(phrase => {
        const words = phrase.split(/\s+/);
        const escapedWords = words.map(word => 
            word.split('').map(char => char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('[\\s\\W]*')
        );
        
        const pattern = escapedWords.join('[\\s\\W]*');
        const regex = new RegExp(pattern, 'gi');
        
        let match;
        while ((match = regex.exec(normalizedText)) !== null) {
            const dynamicRegex = new RegExp(pattern, 'gi');
            filtered = filtered.replace(dynamicRegex, (m) => '*'.repeat(m.length));
        }
    });

    return filtered;
}

// --- RATE LIMITING & ANTI-SPAM VARIABLES ---
let lastMessageTime = 0;
let lastMessageContent = '';
const COOLDOWN_MS = 1500;
const MAX_LENGTH = 250;

function canSendMessage(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > MAX_LENGTH) {
        alert(`Message exceeds the ${MAX_LENGTH} character limit.`);
        return false;
    }
    const now = Date.now();
    if (now - lastMessageTime < COOLDOWN_MS) {
        console.warn("Rate limit hit: slow down.");
        return false;
    }
    if (trimmed === lastMessageContent) {
        console.warn("Duplicate message blocked.");
        return false;
    }
    return true;
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

// --- MENTION AUTO-COMPLETE DROPDOWN SETUP ---
let mentionDropdown = document.getElementById('chatMentionDropdown');
if (!mentionDropdown && chatInput && chatInput.parentNode) {
    mentionDropdown = document.createElement('div');
    mentionDropdown.id = 'chatMentionDropdown';
    mentionDropdown.style.cssText = 'display:none; position:absolute; bottom:100%; left:0; right:0; background:#1e1e1e; border:1px solid #444; border-radius:6px; max-height:120px; overflow-y:auto; z-index:1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
    chatInput.parentNode.appendChild(mentionDropdown);
}

function hideMentionDropdown() {
    if (mentionDropdown) mentionDropdown.style.display = 'none';
}

// Send Message Logic
async function sendMessage() {
    const playerName = getChatDisplayName();
    const rawText = chatInput.value.trim();
    if (!canSendMessage(rawText)) return;

    const cleanText = filterProfanity(rawText);

    try {
        await addDoc(collection(db, "global-chat"), {
            name: playerName,
            text: cleanText,
            timestamp: serverTimestamp(),
            reactions: {}
        });
        lastMessageTime = Date.now();
        lastMessageContent = rawText;
        chatInput.value = '';
        hideMentionDropdown();
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

// Unified input listener for typing status and @mention auto-complete
chatInput.addEventListener('input', () => {
    updatePresence(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        updatePresence(false);
    }, 2000);

    const value = chatInput.value;
    const cursorPosition = chatInput.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (match && mentionDropdown) {
        const queryStr = match[1].toLowerCase();
        const activeUsers = window.activeChatUsers || [getChatDisplayName()];
        const filteredUsers = activeUsers.filter(u => u.toLowerCase().startsWith(queryStr) && u !== getChatDisplayName());

        if (filteredUsers.length > 0) {
            mentionDropdown.innerHTML = '';
            filteredUsers.forEach(username => {
                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.cursor = 'pointer';
                item.style.color = '#fff';
                item.style.fontSize = '12px';
                item.textContent = `@${username}`;
                
                item.addEventListener('mouseover', () => item.style.background = '#333');
                item.addEventListener('mouseout', () => item.style.background = 'transparent');

                item.addEventListener('click', () => {
                    const before = value.slice(0, match.index);
                    const after = value.slice(cursorPosition);
                    chatInput.value = `${before}@${username} ${after}`;
                    hideMentionDropdown();
                    chatInput.focus();
                });
                
                mentionDropdown.appendChild(item);
            });
            mentionDropdown.style.display = 'block';
            return;
        }
    }
    hideMentionDropdown();
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
    const activeNamesSet = new Set();
    const now = Date.now();

    snapshot.forEach((dSnap) => {
        const data = dSnap.data();
        if (data.lastSeen) {
            const seenTime = data.lastSeen.toMillis ? data.lastSeen.toMillis() : now;
            if (now - seenTime < 60000) {
                activeCount++;
                if (data.name) activeNamesSet.add(data.name);
                if (data.isTyping && data.name && data.name !== getChatDisplayName()) {
                    typingUsers.push(data.name);
                }
            }
        } else {
            activeCount++;
            if (data.name) activeNamesSet.add(data.name);
        }
    });

    window.activeChatUsers = Array.from(activeNamesSet);

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

// --- EXCLUSIVE SINGLE-EMOJI REACTION LOGIC ---
async function toggleReaction(messageId, emoji, currentReactions) {
    const currentUserId = getChatDisplayName();
    let updatedReactions = JSON.parse(JSON.stringify(currentReactions || {}));
    let existingEmojiKey = null;

    for (const [emj, users] of Object.entries(updatedReactions)) {
        if (Array.isArray(users) && users.includes(currentUserId)) {
            existingEmojiKey = emj;
            break;
        }
    }

    if (existingEmojiKey === emoji) {
        updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== currentUserId);
        if (updatedReactions[emoji].length === 0) {
            delete updatedReactions[emoji];
        }
    } else {
        if (existingEmojiKey) {
            updatedReactions[existingEmojiKey] = updatedReactions[existingEmojiKey].filter(id => id !== currentUserId);
            if (updatedReactions[existingEmojiKey].length === 0) {
                delete updatedReactions[existingEmojiKey];
            }
        }
        if (!updatedReactions[emoji]) {
            updatedReactions[emoji] = [];
        }
        updatedReactions[emoji].push(currentUserId);
    }

    try {
        const messageRef = doc(db, "global-chat", messageId);
        await updateDoc(messageRef, { reactions: updatedReactions });
    } catch (error) {
        console.error("Error updating reaction:", error);
    }
}

function renderReactions(messageData, messageId) {
    const reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'message-reactions';
    reactionsContainer.style.display = 'flex';
    reactionsContainer.style.gap = '6px';
    reactionsContainer.style.marginTop = '6px';
    reactionsContainer.style.flexWrap = 'wrap';

    const emojis = ['👍', '😂', '🔥', '❤️'];
    const currentUserId = getChatDisplayName();

    emojis.forEach(emoji => {
        const usersWhoReacted = messageData.reactions?.[emoji] || [];
        const count = usersWhoReacted.length;
        const hasReacted = usersWhoReacted.includes(currentUserId);

        const badge = document.createElement('button');
        badge.type = 'button';
        badge.style.background = hasReacted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
        badge.style.border = '1px solid rgba(255,255,255,0.1)';
        badge.style.borderRadius = '10px';
        badge.style.padding = '2px 6px';
        badge.style.color = '#fff';
        badge.style.fontSize = '11px';
        badge.style.cursor = 'pointer';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '3px';
        badge.textContent = `${emoji} ${count > 0 ? count : ''}`;

        badge.addEventListener('click', () => {
            toggleReaction(messageId, emoji, messageData.reactions);
        });

        reactionsContainer.appendChild(badge);
    });

    return reactionsContainer;
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

// Real-time message listener with Date Grouping and Reactions Fully Intact
const q = query(collection(db, "global-chat"), orderBy("timestamp", "asc"));
let initialLoad = true;

onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = '';
    const myCurrentName = getChatDisplayName();
    let lastRenderedDate = '';

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const messageId = docSnap.id;
        
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

        // FULLY PRESERVED REACTION SYSTEM INTEGRATION
        const reactionsEl = renderReactions(data, messageId);
        messageDiv.appendChild(reactionsEl);

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
