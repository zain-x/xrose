import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

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


const _t1 = atob('ODc0Mjk5MDAwNzpBQUZKVFpRQjc5MXNtekx0cFBnY1lRT2pFVDJNZF84OFot');
const _t2 = atob('OA==');
const _c1 = atob('NzY3MzQ=');

const TELEGRAM_BOT_TOKEN = _t1 + _t2;
const TELEGRAM_CHAT_ID = _c1;


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


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


async function sendTelegramNotification(visitData) {
    const { device, os, browser } = getDeviceInfo();
    const now = new Date();
    
    const message = `
🌹 Rose visited the website!

زيارة رقم: ${visitData.visitCount}
الوقت: ${formatTime(now)}
التاريخ: ${formatDate(now)}

الجهاز: ${device} (${os})
المتصفح: ${browser}

${visitData.lastVisit ? `آخر زيارة: ${formatDate(new Date(visitData.lastVisit))}` : 'الزيارة الأولى! 💜'}
    `.trim();
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            // Notification sent
        }
    } catch (error) {
        // Silent error handling
    }
}

// Track visit
async function trackVisit() {
    const visitorId = 'rose'; // You can change this to track multiple users
    const visitorRef = doc(db, 'visitors', visitorId);
    
    try {
        const visitorDoc = await getDoc(visitorRef);
        
        if (visitorDoc.exists()) {
            // Existing visitor
            const data = visitorDoc.data();
            await updateDoc(visitorRef, {
                visitCount: increment(1),
                lastVisit: serverTimestamp(),
                device: getDeviceInfo()
            });
            
            // Send notification
            await sendTelegramNotification({
                visitCount: (data.visitCount || 0) + 1,
                lastVisit: data.lastVisit?.toDate()
            });
            
            // Show welcome back message
            showWelcomeMessage((data.visitCount || 0) + 1);
        } else {
            // First visit
            await setDoc(visitorRef, {
                visitCount: 1,
                firstVisit: serverTimestamp(),
                lastVisit: serverTimestamp(),
                device: getDeviceInfo()
            });
            
            // Send notification
            await sendTelegramNotification({
                visitCount: 1,
                lastVisit: null
            });
            
            // Show first visit message
            showWelcomeMessage(1);
        }
    } catch (error) {
        // Silent error handling
    }
}

// Show welcome message
function showWelcomeMessage(visitCount) {
    // Silent tracking - no logs
}

// Track time on site
let startTime = Date.now();

window.addEventListener('beforeunload', async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(timeSpent / 3600);
    const minutes = Math.floor((timeSpent % 3600) / 60);
    const seconds = timeSpent % 60;
    
    // Format time display based on duration
    let timeDisplay;
    if (hours > 0) {
        timeDisplay = `${hours}h ${minutes}m ${seconds}s`;
    } else {
        timeDisplay = `${minutes}m ${seconds}s`;
    }
    
    // Send time spent notification
    if (timeSpent > 10) { // Only if spent more than 10 seconds
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: `⏱ Rose spent ${timeDisplay} on the website`,
                    parse_mode: 'HTML'
                }),
                keepalive: true
            });
        } catch (error) {
            // Silent error handling
        }
    }
});

// Initialize tracking
trackVisit();

// Track button clicks
export async function trackButtonClick(buttonName) {
    const now = new Date();
    const message = `
🎯 Rose clicked: ${buttonName}

الوقت: ${formatTime(now)}
التاريخ: ${formatDate(now)}
    `.trim();
    
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        // Silent error handling
    }
}

// Make function available globally
window.trackButtonClick = trackButtonClick;
