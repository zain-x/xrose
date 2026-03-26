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

// Mouse/Touch interaction
let mouseX = 0;
let mouseY = 0;

function handleMove(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;
}

// Mouse events
container.addEventListener('mousemove', (event) => {
    handleMove(event.clientX, event.clientY);
});

// Touch events
container.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (event.touches.length > 0) {
        handleMove(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: false });

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
        
        // Track box opened
        if (window.trackButtonClick) {
            window.trackButtonClick('💌 Message Box (Opened)');
        }
        
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

container.addEventListener('click', handleOpen);
container.addEventListener('touchstart', handleOpen, { passive: false });

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
    
    // Rotate box slightly with mouse/touch
    boxGroup.rotation.y += (mouseX * 0.5 - boxGroup.rotation.y) * 0.05;
    boxGroup.rotation.x += (-mouseY * 0.3 - boxGroup.rotation.x) * 0.05;
    
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
