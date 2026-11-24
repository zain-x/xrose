// Firebase (the visit counter) is loaded lazily further down: the notes
// must never wait for a 400 KB library or a database round trip.

const _k1 = atob('QUl6YVN5RGZONUxiYWls');
const _k2 = atob('ODd2OW9rWEFWQjNqQnR4dnZGQjV6cVdr');
const _d1 = atob('Zmxvd2ZpcmUtYjllNDE=');
const _p1 = atob('NDMyMDQzNTQzODg5');
const _a1 = atob('MTo0MzIwNDM1NDM4ODk6d2ViOmNlOWRkMmQ0YTk2ZTZjYWE1NjU3NzA=');

const firebaseConfig = {
    apiKey: _k1 + _k2,
    authDomain: _d1 + '.firebaseapp.com',
    projectId: _d1,
    storageBucket: _d1 + '.appspot.com',
    messagingSenderId: _p1,
    appId: _a1,
    measurementId: 'G-RZTX8K7ZHM'
};


// 💬 the notes go to a Discord channel (its webhook link)
const _w1 = atob('aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU3NDcyOTY5ODE4Nzk0Mzk4OS94RV9zM1c3dzFkR1o0aHRNWXVzcXVIeVBDNXdRelZSNVl3RURzOQ==');
const _w2 = atob('Y2dZcTZkaC1MOWJERnhwZGs3MUgwdzhIaGdtNURT');
const DISCORD_URL = _w1 + _w2;

// 🧪 a local test (localhost, a LAN address, a file) never sends a note to
// Discord and never bumps the visit counter - the console shows what would
// have gone out instead
const LOCAL_TEST = (() => {
    try {
        const h = location.hostname;
        return (
            location.protocol === 'file:' ||
            h === '' ||
            h === 'localhost' ||
            h === '0.0.0.0' ||
            h === '[::1]' ||
            h.endsWith('.local') ||
            /^127\./.test(h) ||
            /^10\./.test(h) ||
            /^192\.168\./.test(h) ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(h)
        );
    } catch (e) {
        return false;
    }
})();

// one place for every note: it goes to Discord. `last` = the page
// may be going away: a keepalive request survives the tab closing (and
// iPhone's app switch), a plain fetch does not
// 🧟 notes from Rombie World (/rombie/) say so, so they're never mistaken for Rose World
const PAGE_TAG = (() => {
    try { return /^\/rombie(\/|$)/.test(location.pathname) ? '🧟 [Rombie World] ' : ''; } catch (e) { return ''; }
})();

function sendNote(text, last = false) {
    text = PAGE_TAG + text;
    if (LOCAL_TEST) {
        console.info('[local test] note not sent:', text);
        return Promise.resolve(false);
    }
    return postDiscord(text, last);
}

// Discord: the note's first line in bold, sent by the webhook's own name (notes
// from Rombie World by « Rombie World »)
function postDiscord(text, last) {
    if (!DISCORD_URL) return Promise.resolve(false);
    let content = text.replace(/^([^\n*]+)/, '**$1**');
    if (content.length > 2000) content = content.slice(0, 1999) + '…'; // (Discord's limit)
    const named = PAGE_TAG ? { username: 'Rombie World' } : {};
    if (last) {
        // the page is going away: a keepalive form post outlives it - a simple
        // request (no preflight) and, unlike a beacon, without the browser's
        // discord.com cookies; a beacon only where keepalive isn't there
        const form = new URLSearchParams({ content, ...named });
        try {
            fetch(DISCORD_URL, { method: 'POST', body: form, keepalive: true, mode: 'no-cors' }).catch(() => {});
            return Promise.resolve(true);
        } catch (e) {}
        try {
            if (navigator.sendBeacon && navigator.sendBeacon(DISCORD_URL, form)) return Promise.resolve(true);
        } catch (e) {}
    }
    return fetch(DISCORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...named, allowed_mentions: { parse: [] } }),
        keepalive: last
    }).then((r) => r.ok).catch(() => false);
}


function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    let os = 'Unknown';
    let browser = 'Unknown';
    
    // Detect device
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet/i.test(ua)) device = 'Tablet';
    
    // Detect OS
    if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac/i.test(ua)) os = 'MacOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    
    // Detect browser
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';
    
    return { device, os, browser };
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('ar-EG', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}


// the counter: bump it and hand back { visitCount, lastVisit } (or null if the
// database is slow / unreachable - the note goes out without the number then)
async function countVisit() {
    try {
        const [{ initializeApp }, fs] = await Promise.all([
            import('firebase/app'),
            import('firebase/firestore')
        ]);
        const db = fs.getFirestore(initializeApp(firebaseConfig));
        const visitorRef = fs.doc(db, 'visitors', 'rose');
        const snap = await fs.getDoc(visitorRef);
        if (snap.exists()) {
            const data = snap.data();
            fs.updateDoc(visitorRef, {
                visitCount: fs.increment(1),
                lastVisit: fs.serverTimestamp(),
                device: getDeviceInfo()
            }).catch(() => {});
            return { visitCount: (data.visitCount || 0) + 1, lastVisit: data.lastVisit?.toDate() };
        }
        fs.setDoc(visitorRef, {
            visitCount: 1,
            firstVisit: fs.serverTimestamp(),
            lastVisit: fs.serverTimestamp(),
            device: getDeviceInfo()
        }).catch(() => {});
        return { visitCount: 1, lastVisit: null };
    } catch (error) {
        return null;
    }
}

function visitMessage(visitData) {
    const { device, os, browser } = getDeviceInfo();
    const now = new Date();
    const lines = ['🌹 Rose visited the website!', ''];
    if (visitData) lines.push(`زيارة رقم: ${visitData.visitCount}`);
    lines.push(`الوقت: ${formatTime(now)}`, `التاريخ: ${formatDate(now)}`, '');
    lines.push(`الجهاز: ${device} (${os})`, `المتصفح: ${browser}`);
    if (visitData) {
        lines.push('', visitData.lastVisit
            ? `آخر زيارة: ${formatDate(new Date(visitData.lastVisit))}`
            : 'الزيارة الأولى! 💜');
    }
    return lines.join('\n');
}

// the page reloading itself to its newest version is not a new visit
function isFreshReload() {
    try {
        return Date.now() - (+sessionStorage.getItem('rose-fresh-reload') || 0) < 20000;
    } catch (e) {
        return false;
    }
}

// Track visit: the note leaves right away - the counter gets 1.5 s to add its
// number, never more
async function trackVisit() {
    if (isFreshReload() || LOCAL_TEST) return;
    const visitData = await Promise.race([
        countVisit(),
        new Promise((resolve) => setTimeout(() => resolve(null), 1500))
    ]);
    sendNote(visitMessage(visitData));
}

// Time on the site = the time the page was really on screen. Leaving (closing
// the tab, switching app, locking the phone) sends it at once; coming back after
// a while is a new stay, with a note of its own.
const AWAY_IS_NEW_STAY = 60000;
let shownAt = document.visibilityState === 'visible' ? Date.now() : 0;
let onScreen = 0; // ms of this stay so far
let hiddenAt = 0;
let leftSent = false;

function fmtSpent(ms) {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
    return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
}

function onLeave() {
    if (shownAt) {
        onScreen += Date.now() - shownAt;
        shownAt = 0;
    }
    if (!hiddenAt) hiddenAt = Date.now();
    if (leftSent || onScreen <= 10000) return; // only a stay of more than 10 seconds
    leftSent = true;
    sendNote(`⏱ Rose spent ${fmtSpent(onScreen)} on the website\n\nالوقت: ${formatTime(new Date())}`, true);
}

function onReturn() {
    if (shownAt) return;
    const away = hiddenAt ? Date.now() - hiddenAt : 0;
    shownAt = Date.now();
    hiddenAt = 0;
    leftSent = false;
    if (away >= AWAY_IS_NEW_STAY) {
        onScreen = 0;
        const now = new Date();
        sendNote(`🌹 Rose came back to the website\n\nالوقت: ${formatTime(now)}\nالتاريخ: ${formatDate(now)}`);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onLeave();
    else onReturn();
});
window.addEventListener('pagehide', onLeave);
window.addEventListener('pageshow', (e) => {
    if (e.persisted && document.visibilityState === 'visible') onReturn();
});

// Initialize tracking
trackVisit();

// Track button clicks
export async function trackButtonClick(buttonName) {
    const now = new Date();
    await sendNote(`🎯 Rose clicked: ${buttonName}

الوقت: ${formatTime(now)}
التاريخ: ${formatDate(now)}`);
}

// Make function available globally
window.trackButtonClick = trackButtonClick;

// 💋 a note of her own to his Discord (the kiss balance claim) - the time and
// the date go under it, like the other notes
export async function sendRoseMessage(text) {
    const now = new Date();
    return sendNote(`${text}

الوقت: ${formatTime(now)}
التاريخ: ${formatDate(now)}`);
}
window.sendRoseMessage = sendRoseMessage;
