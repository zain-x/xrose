import * as THREE from 'three';
import { getRandomDailyMessage } from './messages.js';

// Create 3D Message Box
const container = document.getElementById('messagebox-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// Responsive size
function getBoxSize() {
    return Math.min(window.innerWidth * 0.9, 400);
}

let size = getBoxSize();
renderer.setSize(size, size);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0xBA94FF, 1, 100);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xD8BFD8, 0.8, 100);
pointLight2.position.set(-5, -5, 5);
scene.add(pointLight2);

// Create Box
const boxGroup = new THREE.Group();

// Box body
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
const boxMaterial = new THREE.MeshPhongMaterial({
    color: 0x9370DB,
    shininess: 100,
    transparent: true,
    opacity: 0.9
});
const box = new THREE.Mesh(boxGeometry, boxMaterial);
boxGroup.add(box);

// Box lid
const lidGeometry = new THREE.BoxGeometry(2.2, 0.3, 2.2);
const lidMaterial = new THREE.MeshPhongMaterial({
    color: 0xBA94FF,
    shininess: 100
});
const lid = new THREE.Mesh(lidGeometry, lidMaterial);
lid.position.y = 1.15;
boxGroup.add(lid);

// Ribbon
const ribbonGeometry = new THREE.BoxGeometry(0.2, 2.5, 2.3);
const ribbonMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFD700,
    shininess: 80
});
const ribbon1 = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
boxGroup.add(ribbon1);

const ribbon2 = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
ribbon2.rotation.y = Math.PI / 2;
boxGroup.add(ribbon2);

// Bow on top
const bowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const bow = new THREE.Mesh(bowGeometry, ribbonMaterial);
bow.position.y = 1.5;
boxGroup.add(bow);

// Add sparkles around box
const sparklesGeometry = new THREE.BufferGeometry();
const sparklesCount = 50;
const sparklesPositions = new Float32Array(sparklesCount * 3);

for (let i = 0; i < sparklesCount * 3; i += 3) {
    const radius = 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    sparklesPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
    sparklesPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    sparklesPositions[i + 2] = radius * Math.cos(phi);
}

sparklesGeometry.setAttribute('position', new THREE.BufferAttribute(sparklesPositions, 3));

const sparklesMaterial = new THREE.PointsMaterial({
    color: 0xFFD700,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const sparkles = new THREE.Points(sparklesGeometry, sparklesMaterial);
boxGroup.add(sparkles);

scene.add(boxGroup);
camera.position.z = 6;

// Animation state
let isOpening = false;
let isOpen = false;
let targetLidY = 1.15;
let targetLidRotation = 0;

// Mouse/Touch interaction for 360° rotation
let mouseX = 0;
let mouseY = 0;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationX = 0;
let rotationY = 0;
let velocityX = 0;
let velocityY = 0;
let lastTapTime = 0;
let hasMoved = false;

// Mouse events for rotation
container.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
    velocityX = 0;
    velocityY = 0;
    container.style.cursor = 'grabbing';
});

container.addEventListener('mousemove', (event) => {
    if (!isDragging) return;
    
    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;
    
    velocityX = deltaX * 0.01;
    velocityY = deltaY * 0.01;
    
    rotationY += velocityX;
    rotationX -= velocityY;
    
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

container.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.style.cursor = 'grab';
});

// Touch events for rotation
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

container.addEventListener('touchstart', (event) => {
    isDragging = true;
    touchMoved = false;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    previousMouseX = touchStartX;
    previousMouseY = touchStartY;
    velocityX = 0;
    velocityY = 0;
}, { passive: true });

container.addEventListener('touchmove', (event) => {
    if (!isDragging) return;
    
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    
    const deltaX = touchX - previousMouseX;
    const deltaY = touchY - previousMouseY;
    
    // If moved more than 5px, consider it a drag
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        touchMoved = true;
    }
    
    velocityX = deltaX * 0.01;
    velocityY = deltaY * 0.01;
    
    rotationY += velocityX;
    rotationX -= velocityY;
    
    previousMouseX = touchX;
    previousMouseY = touchY;
}, { passive: true });

container.addEventListener('touchend', (event) => {
    const wasDragging = isDragging;
    const didMove = touchMoved;
    
    isDragging = false;
    touchMoved = false;
    
    // Double tap to open (only if didn't drag)
    if (wasDragging && !didMove) {
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - lastTapTime;
        
        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap detected
            handleOpen(event);
            lastTapTime = 0; // Reset
        } else {
            // First tap
            lastTapTime = currentTime;
        }
    }
}, { passive: false });

// Click to open box (desktop only) - only if not dragging
let clickStartTime = 0;
container.addEventListener('mousedown', (event) => {
    clickStartTime = Date.now();
});

container.addEventListener('click', (event) => {
    const clickDuration = Date.now() - clickStartTime;
    // Only open if it was a quick click (not a drag)
    if (clickDuration < 200 && Math.abs(velocityX) < 0.1 && Math.abs(velocityY) < 0.1) {
        handleOpen(event);
    }
});

// Click/Touch to open box
function handleOpen(event) {
    event.preventDefault();
    
    if (isOpening) return;
    
    isOpening = true;
    isOpen = !isOpen;
    
    if (isOpen) {
        // Open animation
        targetLidY = 2.5;
        targetLidRotation = -Math.PI / 4;
        
        // Show message
        setTimeout(() => {
            showMessage();
            isOpening = false;
        }, 1000);
        
        // Create particle explosion
        createParticleExplosion();
    } else {
        // Close animation
        targetLidY = 1.15;
        targetLidRotation = 0;
        
        setTimeout(() => {
            hideMessage();
            isOpening = false;
        }, 800);
    }
}

// Show message above box
function showMessage() {
    const messageDisplay = document.getElementById('message-display');
    const message = getRandomDailyMessage();
    
    messageDisplay.innerHTML = `
        <div class="message-content">
            <p class="message-text">${message}</p>
        </div>
    `;
    
    messageDisplay.classList.add('show');
    
    // Track every message opened with content
    if (window.trackButtonClick) {
        window.trackButtonClick(`💌 Message: ${message}`);
    }
}

// Hide message
function hideMessage() {
    const messageDisplay = document.getElementById('message-display');
    messageDisplay.classList.remove('show');
}

// Particle explosion
function createParticleExplosion() {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.innerHTML = ['💜', '💕', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)];
            particle.style.position = 'fixed';
            particle.style.left = container.getBoundingClientRect().left + container.offsetWidth / 2 + 'px';
            particle.style.top = container.getBoundingClientRect().top + container.offsetHeight / 2 + 'px';
            particle.style.fontSize = '20px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.transition = 'all 2s ease-out';
            particle.style.opacity = '1';
            
            document.body.appendChild(particle);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = Math.random() * 150 + 100;
            
            setTimeout(() => {
                particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 360}deg) scale(0)`;
                particle.style.opacity = '0';
            }, 50);
            
            setTimeout(() => particle.remove(), 2000);
        }, i * 30);
    }
}

// Animation loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    
    // Smooth lid animation
    lid.position.y += (targetLidY - lid.position.y) * 0.1;
    lid.rotation.x += (targetLidRotation - lid.rotation.x) * 0.1;
    
    // Apply user rotation
    boxGroup.rotation.y = rotationY;
    boxGroup.rotation.x = rotationX;
    
    // Add inertia when not dragging
    if (!isDragging) {
        velocityX *= 0.95;
        velocityY *= 0.95;
        rotationY += velocityX;
        rotationX += velocityY;
    }
    
    // Floating animation
    boxGroup.position.y = Math.sin(time) * 0.1;
    
    // Rotate sparkles
    sparkles.rotation.y += 0.01;
    
    // Pulse lights
    pointLight1.intensity = 1 + Math.sin(time * 2) * 0.2;
    pointLight2.intensity = 0.8 + Math.cos(time * 2) * 0.2;
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    const newSize = getBoxSize();
    renderer.setSize(newSize, newSize);
    size = newSize;
});
