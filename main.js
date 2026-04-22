import * as THREE from 'three';
import { initBreathingExercise, startBreathing, stopBreathing } from './breathe.js';
import { initRosePortrait } from './rose-portrait.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Add ambient light for thunder effect
const ambientLight = new THREE.AmbientLight(0x9370DB, 0.3);
scene.add(ambientLight);

// Create lightning flash light
const lightningLight = new THREE.PointLight(0xBA94FF, 0, 100);
lightningLight.position.set(0, 20, 0);
scene.add(lightningLight);

// Lightning bolt geometry
const lightningBolts = [];

function createLightningBolt() {
    const points = [];
    const startX = (Math.random() - 0.5) * 40;
    const startY = 30;
    const startZ = (Math.random() - 0.5) * 40;
    
    let currentX = startX;
    let currentY = startY;
    let currentZ = startZ;
    
    // Create jagged lightning path
    for (let i = 0; i < 15; i++) {
        points.push(new THREE.Vector3(currentX, currentY, currentZ));
        currentX += (Math.random() - 0.5) * 3;
        currentY -= Math.random() * 3 + 1;
        currentZ += (Math.random() - 0.5) * 3;
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xE6E6FA,
        linewidth: 3,
        transparent: true,
        opacity: 0
    });
    
    const lightning = new THREE.Line(geometry, material);
    return lightning;
}

// Create multiple lightning bolts (hidden initially)
for (let i = 0; i < 3; i++) {
    const bolt = createLightningBolt();
    lightningBolts.push(bolt);
    scene.add(bolt);
}

// Create subtle floating particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 500;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 60;
    posArray[i + 1] = (Math.random() - 0.5) * 60;
    posArray[i + 2] = (Math.random() - 0.5) * 60;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xBA94FF,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Create tiny delicate flowers
function createFlower(x, y, z) {
    const flowerGroup = new THREE.Group();
    
    // Flower petals (5 tiny petals)
    const petalGeometry = new THREE.CircleGeometry(0.08, 16);
    const petalMaterial = new THREE.MeshBasicMaterial({
        color: 0xBA94FF,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 5; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        const angle = (i / 5) * Math.PI * 2;
        petal.position.x = Math.cos(angle) * 0.1;
        petal.position.y = Math.sin(angle) * 0.1;
        flowerGroup.add(petal);
    }
    
    // Tiny flower center
    const centerGeometry = new THREE.CircleGeometry(0.05, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({
        color: 0xD8BFD8,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.z = 0.01;
    flowerGroup.add(center);
    
    flowerGroup.position.set(x, y, z);
    return flowerGroup;
}

// Create many tiny flowers scattered
const flowers = [];

for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 50;
    const y = (Math.random() - 0.5) * 40;
    const z = (Math.random() - 0.5) * 40;
    const flower = createFlower(x, y, z);
    flowers.push(flower);
    scene.add(flower);
}

// Create flowing lavender waves (background)
const waveGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
const waveMaterial = new THREE.MeshBasicMaterial({
    color: 0x9370DB,
    wireframe: true,
    transparent: true,
    opacity: 0.08
});
const wave = new THREE.Mesh(waveGeometry, waveMaterial);
wave.rotation.x = -Math.PI / 2;
wave.position.y = -10;
scene.add(wave);

camera.position.z = 20;

// Mouse/Touch interaction for background scene
let mouseX = 0;
let mouseY = 0;
let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Touch events for background rotation
document.addEventListener('touchstart', (event) => {
    if (event.target.closest('#messagebox-container') || 
        event.target.closest('.mood-option') ||
        event.target.closest('button')) {
        return; // Don't interfere with other interactive elements
    }
    
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isDragging = true;
}, { passive: true });

document.addEventListener('touchmove', (event) => {
    if (!isDragging) return;
    
    if (event.target.closest('#messagebox-container') || 
        event.target.closest('.mood-option') ||
        event.target.closest('button')) {
        return;
    }
    
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    
    // Update mouse position based on touch delta
    mouseX += deltaX / window.innerWidth * 2;
    mouseY -= deltaY / window.innerHeight * 2;
    
    // Clamp values
    mouseX = Math.max(-1, Math.min(1, mouseX));
    mouseY = Math.max(-1, Math.min(1, mouseY));
    
    touchStartX = touchX;
    touchStartY = touchY;
}, { passive: true });

document.addEventListener('touchend', () => {
    isDragging = false;
}, { passive: true });

// Animation
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.001;
    
    // Rotate particles slowly
    particlesMesh.rotation.y += 0.0005;
    particlesMesh.rotation.x = mouseY * 0.1;
    particlesMesh.rotation.y += mouseX * 0.0005;
    
    // Animate flowers - very gentle rotation and floating
    flowers.forEach((flower, index) => {
        flower.rotation.z += 0.001;
        flower.position.y += Math.sin(time * 1.5 + index) * 0.008;
        flower.position.x += Math.cos(time + index) * 0.003;
    });
    
    // Animate wave
    const positions = waveGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        positions[i + 2] = Math.sin(x * 0.1 + time * 2) * Math.cos(y * 0.1 + time * 2) * 2;
    }
    waveGeometry.attributes.position.needsUpdate = true;
    
    // Gentle camera movement
    camera.position.x = mouseX * 2;
    camera.position.y = mouseY * 2;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Rain Effect
const rainContainer = document.getElementById('rain-container');
const thunderFlash = document.getElementById('thunder-flash');

function createRain() {
    // Clear existing rain
    rainContainer.innerHTML = '';
    
    // Detect mobile device
    const isMobile = window.innerWidth <= 768;
    
    // Create fewer raindrops on mobile (60 vs 120)
    const rainCount = isMobile ? 60 : 120;
    
    for (let i = 0; i < rainCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = Math.random() * 100 + '%';
        
        // Random starting position (spread throughout the fall)
        const randomStart = -(Math.random() * 100);
        drop.style.top = randomStart + 'vh';
        
        // Faster fall speed (0.4-0.8s)
        const duration = Math.random() * 0.4 + 0.4;
        drop.style.animationDuration = duration + 's';
        
        // No delay - start immediately from random positions
        drop.style.animationDelay = '0s';
        
        rainContainer.appendChild(drop);
    }
}

createRain();

// Recreate rain on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (rainContainer.classList.contains('active')) {
            createRain();
        }
    }, 500);
});

// Thunder effect with 3D lightning
function triggerThunder() {
    // Flash the overlay
    thunderFlash.classList.add('active');
    setTimeout(() => {
        thunderFlash.classList.remove('active');
    }, 400);
    
    // Animate 3D lightning bolts
    const numBolts = Math.floor(Math.random() * 2) + 1; // 1-2 bolts
    
    for (let i = 0; i < numBolts; i++) {
        const bolt = lightningBolts[i];
        
        // Recreate bolt with new random path
        const points = [];
        const startX = (Math.random() - 0.5) * 40;
        const startY = 30;
        const startZ = (Math.random() - 0.5) * 40;
        
        let currentX = startX;
        let currentY = startY;
        let currentZ = startZ;
        
        for (let j = 0; j < 15; j++) {
            points.push(new THREE.Vector3(currentX, currentY, currentZ));
            currentX += (Math.random() - 0.5) * 3;
            currentY -= Math.random() * 3 + 1;
            currentZ += (Math.random() - 0.5) * 3;
        }
        
        bolt.geometry.setFromPoints(points);
        
        // Flash sequence
        setTimeout(() => {
            bolt.material.opacity = 1;
            lightningLight.intensity = 15;
            lightningLight.position.set(startX, startY, startZ);
            
            setTimeout(() => {
                bolt.material.opacity = 0;
                lightningLight.intensity = 0;
            }, 80);
            
            setTimeout(() => {
                bolt.material.opacity = 0.8;
                lightningLight.intensity = 12;
            }, 120);
            
            setTimeout(() => {
                bolt.material.opacity = 0;
                lightningLight.intensity = 0;
            }, 180);
            
            setTimeout(() => {
                bolt.material.opacity = 0.6;
                lightningLight.intensity = 8;
            }, 220);
            
            setTimeout(() => {
                bolt.material.opacity = 0;
                lightningLight.intensity = 0;
            }, 280);
        }, i * 100);
    }
    
    // Sometimes triple flash
    if (Math.random() > 0.6) {
        setTimeout(() => {
            thunderFlash.classList.add('active');
            lightningLight.intensity = 10;
            setTimeout(() => {
                thunderFlash.classList.remove('active');
                lightningLight.intensity = 0;
            }, 150);
        }, 600);
    }
}

// Music toggle with rain and thunder
const musicBtn = document.getElementById('music-toggle');
const audio = new Audio('music.mp3');
audio.loop = true;
audio.volume = 0.5;
let isPlaying = false;
let thunderInterval;
const waterFill = document.getElementById('water-fill');
const breatheBtn = document.getElementById('breathe-btn');

musicBtn.addEventListener('click', () => {
    if (isPlaying) {
        // Stop music and effects
        audio.pause();
        musicBtn.classList.remove('playing');
        rainContainer.classList.remove('active');
        waterFill.classList.remove('active');
        breatheBtn.classList.remove('visible');
        stopBubbles();
        clearInterval(thunderInterval);
        
        // Track music stop
        if (window.trackButtonClick) {
            window.trackButtonClick('🎵 Music Button (Stopped)');
        }
        
        // Reset water level
        setTimeout(() => {
            waterFill.style.transition = 'height 2s ease-out';
            waterFill.style.height = '0';
            setTimeout(() => {
                waterFill.style.transition = 'height 180s linear';
            }, 2000);
        }, 100);
    } else {
        // Start music and effects
        audio.play().catch(err => {});
        musicBtn.classList.add('playing');
        rainContainer.classList.add('active');
        
        // Track music start
        if (window.trackButtonClick) {
            window.trackButtonClick('🎵 Music Button (Started)');
        }
        
        // Start water fill
        setTimeout(() => {
            waterFill.classList.add('active');
            // Start creating bubbles
            startBubbles();
            
            // Show breathe button when water reaches 25% (45 seconds out of 180)
            setTimeout(() => {
                breatheBtn.classList.add('visible');
            }, 45000);
        }, 500);
        
        // More frequent thunder every 5-10 seconds
        thunderInterval = setInterval(() => {
            if (Math.random() > 0.2) { // 80% chance
                triggerThunder();
            }
        }, Math.random() * 5000 + 5000);
        
        // Trigger first thunder after 2 seconds
        setTimeout(triggerThunder, 2000);
    }
    isPlaying = !isPlaying;
});

// Breathe button - drain water
let bubblesInterval;

function startBubbles() {
    bubblesInterval = setInterval(() => {
        createBubble();
    }, 800);
}

function stopBubbles() {
    clearInterval(bubblesInterval);
}

function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 8 + 4; // 4-12px instead of 10-30px
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.animationDuration = (Math.random() * 3 + 3) + 's';
    
    waterFill.appendChild(bubble);
    
    setTimeout(() => {
        bubble.remove();
    }, 6000);
}

breatheBtn.addEventListener('click', () => {
    // Track breathe button click
    if (window.trackButtonClick) {
        window.trackButtonClick('💜 مستحيل أغرق! Button');
    }
    
    // Add draining class for faster animation
    waterFill.classList.add('draining');
    stopBubbles();
    
    // Create rose petals instead of breath particles
    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const petal = document.createElement('div');
            petal.innerHTML = '🌹';
            petal.style.position = 'fixed';
            petal.style.left = '80px';
            petal.style.bottom = '80px';
            petal.style.fontSize = Math.random() * 15 + 15 + 'px';
            petal.style.pointerEvents = 'none';
            petal.style.zIndex = '1000';
            petal.style.transition = 'all 2.5s ease-out';
            petal.style.opacity = '1';
            
            document.body.appendChild(petal);
            
            const angle = (Math.random() - 0.5) * Math.PI;
            const distance = Math.random() * 250 + 150;
            
            setTimeout(() => {
                petal.style.transform = `translate(${Math.cos(angle) * distance}px, ${-Math.abs(Math.sin(angle) * distance) - 150}px) rotate(${Math.random() * 360}deg) scale(0)`;
                petal.style.opacity = '0';
            }, 50);
            
            setTimeout(() => petal.remove(), 2500);
        }, i * 40);
    }
    
    // Reset water after draining
    setTimeout(() => {
        waterFill.classList.remove('draining');
        waterFill.classList.remove('active');
        breatheBtn.classList.remove('visible');
        
        // Don't restart water fill - prevent refilling
    }, 3000);
});

// Initialize breathing exercise
window.addEventListener('DOMContentLoaded', () => {
    initBreathingExercise();
    initRosePortrait();
});

// Close breathing exercise button
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-breathe');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            stopBreathing();
        });
    }
});

// Scroll reveal animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('revealed');
            }, index * 100);
        }
    });
}, observerOptions);

// Observe all scroll-reveal elements
document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el);
});

// Add floating hearts animation in background
function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.innerHTML = '💜';
    heart.style.position = 'fixed';
    heart.style.fontSize = Math.random() * 20 + 15 + 'px';
    heart.style.left = Math.random() * 100 + '%';
    heart.style.bottom = '-50px';
    heart.style.opacity = '0.3';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '0';
    heart.style.transition = 'all 8s linear';
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
        heart.style.bottom = '110vh';
        heart.style.opacity = '0';
        heart.style.transform = `translateX(${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg)`;
    }, 100);
    
    setTimeout(() => {
        heart.remove();
    }, 8000);
}

// Create hearts periodically
setInterval(createFloatingHeart, 3000);

// Add rose effect on mouse click
document.addEventListener('click', (e) => {
    // Don't create roses on button clicks
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
    }
    
    // Create multiple purple roses on each click
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const rose = document.createElement('div');
            rose.innerHTML = '💜';
            rose.style.position = 'fixed';
            rose.style.left = e.clientX + 'px';
            rose.style.top = e.clientY + 'px';
            rose.style.fontSize = (Math.random() * 15 + 20) + 'px';
            rose.style.pointerEvents = 'none';
            rose.style.zIndex = '1000';
            rose.style.transition = 'all 2s ease-out';
            rose.style.opacity = '1';
            
            document.body.appendChild(rose);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            
            setTimeout(() => {
                rose.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 360}deg) scale(0)`;
                rose.style.opacity = '0';
            }, 50);
            
            setTimeout(() => rose.remove(), 2000);
        }, i * 100);
    }
});

// Secret message reveal
const secretBox = document.getElementById('secret-box');
const secretLock = secretBox.querySelector('.secret-lock');

secretBox.addEventListener('click', () => {
    const wasLocked = !secretBox.classList.contains('unlocked');
    
    secretBox.classList.toggle('unlocked');
    if (secretBox.classList.contains('unlocked')) {
        secretLock.innerHTML = '🔓';
        
        // Track secret message opened
        if (window.trackButtonClick) {
            window.trackButtonClick('🔓 Secret Message (Opened)');
        }
        
        // Scroll to ensure the message is visible on mobile
        setTimeout(() => {
            const secretMessage = document.getElementById('secret-message');
            if (secretMessage && window.innerWidth <= 768) {
                secretMessage.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 1200); // Wait for animation to complete
        
        // Create explosion of hearts
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.innerHTML = '💜';
                heart.style.position = 'fixed';
                heart.style.left = secretBox.getBoundingClientRect().left + secretBox.offsetWidth / 2 + 'px';
                heart.style.top = secretBox.getBoundingClientRect().top + secretBox.offsetHeight / 2 + 'px';
                heart.style.fontSize = '30px';
                heart.style.pointerEvents = 'none';
                heart.style.zIndex = '1000';
                heart.style.transition = 'all 2s ease-out';
                
                document.body.appendChild(heart);
                
                const angle = (i / 20) * Math.PI * 2;
                const distance = 200;
                
                setTimeout(() => {
                    heart.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
                    heart.style.opacity = '0';
                }, 50);
                
                setTimeout(() => heart.remove(), 2000);
            }, i * 50);
        }
    } else {
        secretLock.innerHTML = '🔒';
        
        // Track secret message closed
        if (window.trackButtonClick) {
            window.trackButtonClick('🔒 Secret Message (Closed)');
        }
    }
});

// Promise cards interaction
document.querySelectorAll('.promise-card').forEach(card => {
    card.addEventListener('click', () => {
        // Create floating text
        const text = card.querySelector('p').textContent;
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.position = 'fixed';
        floatingText.style.left = card.getBoundingClientRect().left + card.offsetWidth / 2 + 'px';
        floatingText.style.top = card.getBoundingClientRect().top + 'px';
        floatingText.style.color = '#ba94ff';
        floatingText.style.fontSize = '20px';
        floatingText.style.fontWeight = '500';
        floatingText.style.pointerEvents = 'none';
        floatingText.style.zIndex = '1000';
        floatingText.style.transition = 'all 2s ease-out';
        floatingText.style.whiteSpace = 'nowrap';
        floatingText.style.transform = 'translateX(-50%)';
        
        document.body.appendChild(floatingText);
        
        setTimeout(() => {
            floatingText.style.transform = 'translateX(-50%) translateY(-100px)';
            floatingText.style.opacity = '0';
        }, 50);
        
        setTimeout(() => floatingText.remove(), 2000);
    });
});

// Countdown timer - REMOVED (elements don't exist in HTML)

// Tomorrow's locked message
const lockedBox = document.getElementById('locked-box');
const tomorrowDateEl = document.getElementById('tomorrow-date');
const lockedContent = document.getElementById('locked-content');

function checkLockedMessage() {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Display tomorrow's date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    tomorrowDateEl.textContent = tomorrow.toLocaleDateString('ar-EG', options);
    
    // Check if it's past midnight (tomorrow arrived)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For demo: unlock if current hour is past a certain time
    // In production, you'd check against actual date
    if (now.getHours() >= 0) { // Always unlocked for demo
        // Check localStorage to see if already unlocked today
        const lastUnlock = localStorage.getItem('lastUnlockDate');
        const todayStr = today.toDateString();
        
        if (lastUnlock !== todayStr) {
            // New day - can unlock
            setTimeout(() => {
                lockedBox.classList.add('unlocked');
                lockedBox.querySelector('.lock-icon').textContent = '🔓';
                lockedBox.querySelector('.lock-text').textContent = 'رسالة اليوم';
                localStorage.setItem('lastUnlockDate', todayStr);
            }, 1000);
        } else if (lastUnlock === todayStr) {
            // Already unlocked today
            lockedBox.classList.add('unlocked');
            lockedBox.querySelector('.lock-icon').textContent = '🔓';
            lockedBox.querySelector('.lock-text').textContent = 'رسالة اليوم';
        }
    }
}

checkLockedMessage();

// Highlight current day in timeline
function highlightCurrentDay() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    document.querySelectorAll('.timeline-card').forEach(card => {
        const cardDate = card.getAttribute('data-date');
        if (cardDate === todayStr) {
            card.classList.add('current-day');
        }
    });
}

highlightCurrentDay();

// Mobile sensor support for water waves - Enhanced iBeer style
let tiltX = 0;
let tiltY = 0;
let smoothTiltX = 0;
let smoothTiltY = 0;
let sensorActive = false;

if (window.DeviceOrientationEvent) {
    // Add multiple event listeners for better compatibility
    const handleOrientation = (event) => {
        sensorActive = true;
        
        // Get device tilt - handle different browser implementations
        tiltX = event.gamma !== null ? event.gamma : 0; // Left to right tilt (-90 to 90)
        tiltY = event.beta !== null ? event.beta : 0;   // Front to back tilt (-180 to 180)
        
        // Smooth the tilt values for more natural movement
        smoothTiltX += (tiltX - smoothTiltX) * 0.1;
        smoothTiltY += (tiltY - smoothTiltY) * 0.1;
        
        // Apply realistic tilt to water surface
        const waves = document.querySelectorAll('.water-wave');
        waves.forEach((wave, index) => {
            const intensity = (index + 1) * 1.5;
            const offsetX = smoothTiltX * intensity;
            const offsetY = smoothTiltY * 0.5;
            wave.style.transform = `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${smoothTiltX * 0.5}deg)`;
        });
        
        // Tilt the entire water container for realistic effect
        if (waterFill && waterFill.classList.contains('active')) {
            const rotateY = smoothTiltX * 0.8;
            const rotateX = -smoothTiltY * 0.4;
            const translateX = smoothTiltX * 2;
            
            waterFill.style.transform = `
                perspective(1000px) 
                rotateY(${rotateY}deg) 
                rotateX(${rotateX}deg)
                translateX(${translateX}px)
            `;
            
            // Add water slosh effect
            waterFill.style.transformOrigin = `${50 - smoothTiltX * 0.5}% 100%`;
        }
    };
    
    // Try both event types for maximum compatibility
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    
    // Check if sensors are working after 3 seconds
    setTimeout(() => {
        if (!sensorActive) {
            console.warn('Sensors not responding. Check browser permissions.');
        }
    }, 3000);
} else {
    console.error('DeviceOrientation not supported');
}

// Animation loop for smooth water movement
function updateWaterTilt() {
    if (waterFill && waterFill.classList.contains('active')) {
        // Continue smooth interpolation
        smoothTiltX += (tiltX - smoothTiltX) * 0.05;
        smoothTiltY += (tiltY - smoothTiltY) * 0.05;
    }
    requestAnimationFrame(updateWaterTilt);
}

updateWaterTilt();

// Request permission for iOS 13+ and Android devices
function requestMotionPermission() {
    // For iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    console.log('Motion sensors enabled');
                }
            })
            .catch(err => {
                console.error('Permission error:', err);
            });
    }
}

// Request permission when user interacts
document.addEventListener('click', requestMotionPermission, { once: true });

// Add shooting stars
function createShootingStar() {
    const star = document.createElement('div');
    star.innerHTML = '🌹';
    star.style.position = 'fixed';
    star.style.fontSize = '15px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 50 + '%';
    star.style.pointerEvents = 'none';
    star.style.zIndex = '0';
    star.style.transition = 'all 3s ease-out';
    star.style.opacity = '0.6';
    
    document.body.appendChild(star);
    
    setTimeout(() => {
        star.style.transform = 'translate(-200px, 200px) rotate(360deg)';
        star.style.opacity = '0';
    }, 100);
    
    setTimeout(() => star.remove(), 3000);
}

// Create shooting roses periodically
setInterval(createShootingStar, 8000);
