import * as THREE from 'three';

// Breathing Exercise with Three.js
let breatheScene, breatheCamera, breatheRenderer;
let breatheSphere, breatheParticles, breatheRing;
let isBreathing = false;
let breathePhase = 'inhale'; // inhale, hold, exhale
let breatheProgress = 0;
let breatheContainer;
let lastTime = 0;

// Inline breathing exercise
let inlineBreathingActive = false;
let inlineAnimationOnly = false; // Animation without timer
let breatheCycleCount = 0; // Count breathing cycles
const MAX_CYCLES = 3; // Only 3 cycles

export function initBreathingExercise() {
    breatheContainer = document.getElementById('breathe-container');
    
    if (!breatheContainer) {
        console.error('Breathe container not found');
        return;
    }
    
    // Scene setup
    breatheScene = new THREE.Scene();
    breatheCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    breatheCamera.position.z = 5;
    
    breatheRenderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    
    const size = Math.min(window.innerWidth * 0.8, 400);
    breatheRenderer.setSize(size, size);
    breatheRenderer.setPixelRatio(window.devicePixelRatio);
    
    // Find the breathe-content div and append canvas there
    const breatheContent = breatheContainer.querySelector('.breathe-content');
    if (breatheContent) {
        // Insert canvas before the instructions
        const instructions = breatheContent.querySelector('.breathe-instructions');
        if (instructions) {
            breatheContent.insertBefore(breatheRenderer.domElement, instructions);
        } else {
            breatheContent.appendChild(breatheRenderer.domElement);
        }
    } else {
        breatheContainer.appendChild(breatheRenderer.domElement);
    }
    
    // Main breathing heart - small and centered
    const heartShape = new THREE.Shape();
    
    // Create heart shape with point at bottom (correct orientation)
    heartShape.moveTo(0, -0.5);
    heartShape.bezierCurveTo(0, -0.3, -0.5, 0, -0.5, 0);
    heartShape.bezierCurveTo(-1.1, 0, -1.1, -0.7, -1.1, -0.7);
    heartShape.bezierCurveTo(-1.1, -1.1, -0.8, -1.54, 0, -1.9);
    heartShape.bezierCurveTo(0.8, -1.54, 1.1, -1.1, 1.1, -0.7);
    heartShape.bezierCurveTo(1.1, -0.7, 1.1, 0, 0.5, 0);
    heartShape.bezierCurveTo(0.2, 0, 0, -0.3, 0, -0.5);
    
    const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.05,
        bevelThickness: 0.05
    };
    
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    
    // Center the geometry at origin
    heartGeometry.center();
    
    const heartMaterial = new THREE.MeshPhongMaterial({
        color: 0xFF1493,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
        emissive: 0xFF69B4,
        emissiveIntensity: 0.6
    });
    breatheSphere = new THREE.Mesh(heartGeometry, heartMaterial);
    
    // Small scale, perfectly centered at (0, 0, 0)
    breatheSphere.scale.set(0.5, 0.5, 0.5);
    breatheSphere.position.set(0, 0, 0);
    
    breatheScene.add(breatheSphere);
    
    // Outer ring around heart - much bigger
    const ringGeometry = new THREE.TorusGeometry(2.5, 0.06, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xD8BFD8,
        transparent: true,
        opacity: 0.8,
        emissive: 0xBA94FF,
        emissiveIntensity: 0.6
    });
    breatheRing = new THREE.Mesh(ringGeometry, ringMaterial);
    breatheScene.add(breatheRing);
    
    // Particles around sphere
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const radius = 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xFFD700,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    breatheParticles = new THREE.Points(particlesGeometry, particlesMaterial);
    breatheScene.add(breatheParticles);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    breatheScene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xBA94FF, 2, 50);
    pointLight1.position.set(5, 5, 5);
    breatheScene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xD8BFD8, 1.5, 50);
    pointLight2.position.set(-5, -5, 5);
    breatheScene.add(pointLight2);
    
    // Start animation
    animateBreathing();
}

function animateBreathing() {
    if (!isBreathing && !inlineBreathingActive && !inlineAnimationOnly) return;
    
    requestAnimationFrame(animateBreathing);
    
    // Calculate delta time for accurate timing
    const currentTime = performance.now();
    if (lastTime === 0) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Breathing cycle timing (in seconds)
    const inhaleTime = 4;
    const holdTime = 7;
    const exhaleTime = 8;
    const totalCycle = inhaleTime + holdTime + exhaleTime;
    
    // Update progress only if actually breathing (not just animation)
    if (inlineBreathingActive || isBreathing) {
        breatheProgress += deltaTime;
        
        if (breatheProgress >= totalCycle) {
            breatheProgress = 0;
            breatheCycleCount++;
            
            // Check if completed max cycles
            if (breatheCycleCount >= MAX_CYCLES && inlineBreathingActive) {
                finishInlineBreathing();
                return;
            }
        }
    }
    
    // Determine phase
    let scale = 1;
    let ringScale = 1;
    let particleRadius = 3;
    let phaseText = '';
    let phaseColor = 0xBA94FF;
    
    if (inlineAnimationOnly) {
        // Just gentle idle animation when not started
        const idleTime = currentTime / 1000;
        scale = 1 + Math.sin(idleTime * 0.5) * 0.2;
        ringScale = 1 + Math.sin(idleTime * 0.5) * 0.1;
        particleRadius = 3 + Math.sin(idleTime * 0.5) * 0.3;
        phaseColor = 0xBA94FF;
    } else if (breatheProgress < inhaleTime) {
        // Inhale phase (0-4 seconds)
        breathePhase = 'inhale';
        const progress = breatheProgress / inhaleTime;
        scale = 1 + progress * 0.8; // Grow from 1 to 1.8
        ringScale = 1 + progress * 0.5;
        particleRadius = 3 + progress * 1;
        phaseText = 'شهيق';
        phaseColor = 0x90EE90;
    } else if (breatheProgress < inhaleTime + holdTime) {
        // Hold phase (4-11 seconds)
        breathePhase = 'hold';
        scale = 1.8; // Stay large
        ringScale = 1.5;
        particleRadius = 4;
        phaseText = 'احبسي';
        phaseColor = 0xFFD700;
    } else {
        // Exhale phase (11-19 seconds)
        breathePhase = 'exhale';
        const progress = (breatheProgress - inhaleTime - holdTime) / exhaleTime;
        scale = 1.8 - progress * 0.8; // Shrink from 1.8 to 1
        ringScale = 1.5 - progress * 0.5;
        particleRadius = 4 - progress * 1;
        phaseText = 'زفير';
        phaseColor = 0x87CEEB;
    }
    
    // Apply transformations
    breatheSphere.scale.set(scale, scale, scale);
    breatheRing.scale.set(ringScale, ringScale, 1);
    
    // Update sphere color based on phase
    breatheSphere.material.emissive.setHex(phaseColor);
    breatheRing.material.emissive.setHex(phaseColor);
    
    // Animate particles
    const positions = breatheParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        const length = Math.sqrt(x * x + y * y + z * z);
        const targetRadius = particleRadius;
        
        positions[i] = (x / length) * targetRadius;
        positions[i + 1] = (y / length) * targetRadius;
        positions[i + 2] = (z / length) * targetRadius;
    }
    breatheParticles.geometry.attributes.position.needsUpdate = true;
    
    // Rotate elements
    breatheSphere.rotation.y += 0.004;
    breatheRing.rotation.x += 0.003;
    breatheRing.rotation.y += 0.004;
    breatheRing.rotation.z += 0.002;
    breatheParticles.rotation.y -= 0.003;
    
    // Update text only if actually breathing (not just animation)
    if (inlineBreathingActive || isBreathing) {
        const phaseElements = [
            document.getElementById('breathe-phase'),
            document.getElementById('breathe-inline-phase')
        ];
        const timerElements = [
            document.getElementById('breathe-timer'),
            document.getElementById('breathe-inline-timer')
        ];
        const cycleNumberEl = document.getElementById('breathe-cycle-number');
        
        phaseElements.forEach(el => {
            if (el) {
                el.textContent = phaseText;
                el.style.color = `#${phaseColor.toString(16).padStart(6, '0')}`;
            }
        });
        
        // Update cycle counter
        if (cycleNumberEl) {
            cycleNumberEl.textContent = breatheCycleCount + 1;
        }
        
        // Calculate remaining time for current phase
        let remaining;
        if (breathePhase === 'inhale') {
            remaining = Math.ceil(inhaleTime - breatheProgress);
        } else if (breathePhase === 'hold') {
            remaining = Math.ceil((inhaleTime + holdTime) - breatheProgress);
        } else {
            remaining = Math.ceil(totalCycle - breatheProgress);
        }
        
        timerElements.forEach(el => {
            if (el) {
                el.textContent = remaining;
            }
        });
    }
    
    breatheRenderer.render(breatheScene, breatheCamera);
}

export function startBreathing() {
    if (!breatheContainer) return;
    
    isBreathing = true;
    breatheProgress = 0;
    lastTime = 0;
    breatheContainer.style.display = 'flex';
    
    // Track breathing exercise start
    if (window.trackButtonClick) {
        window.trackButtonClick('🧘 Breathing Exercise (Started)');
    }
    
    animateBreathing();
}

export function stopBreathing() {
    isBreathing = false;
    if (breatheContainer) {
        breatheContainer.style.display = 'none';
    }
    
    // Track breathing exercise stop
    if (window.trackButtonClick) {
        window.trackButtonClick('🧘 Breathing Exercise (Closed)');
    }
}

// Inline breathing exercise (shown below mood)
export function startInlineBreathing() {
    const inlineContainer = document.getElementById('breathe-inline-container');
    const exerciseDiv = document.getElementById('breathe-inline-exercise');
    const displayDiv = document.getElementById('breathe-inline-display');
    
    if (!inlineContainer || !exerciseDiv) return;
    
    // Show the container with animation only (no timer yet)
    inlineContainer.style.display = 'block';
    exerciseDiv.style.display = 'flex';
    
    // Hide timer display until started
    if (displayDiv) {
        displayDiv.style.display = 'none';
    }
    
    // Move canvas to inline container if not already there
    const inlineCanvas = document.getElementById('breathe-inline-canvas');
    if (inlineCanvas && breatheRenderer && !inlineCanvas.contains(breatheRenderer.domElement)) {
        inlineCanvas.appendChild(breatheRenderer.domElement);
        
        // Resize for mobile-friendly display
        const size = Math.min(window.innerWidth - 40, 280);
        breatheRenderer.setSize(size, size);
    }
    
    // Start idle animation only
    inlineAnimationOnly = true;
    lastTime = 0;
    animateBreathing();
    
    // Scroll to breathing exercise smoothly
    setTimeout(() => {
        inlineContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

export function stopInlineBreathing() {
    const inlineContainer = document.getElementById('breathe-inline-container');
    const displayDiv = document.getElementById('breathe-inline-display');
    const startBtn = document.getElementById('start-breathe-btn');
    const completionMsg = document.getElementById('breathe-completion-message');
    
    if (inlineContainer) {
        inlineContainer.style.display = 'none';
    }
    
    // Reset to initial state
    if (displayDiv) {
        displayDiv.style.display = 'none';
    }
    if (completionMsg) {
        completionMsg.style.display = 'none';
    }
    if (startBtn) {
        startBtn.style.display = 'block';
        startBtn.textContent = 'يلا نبلش';
    }
    
    inlineBreathingActive = false;
    inlineAnimationOnly = false;
    breatheCycleCount = 0;
}

// Start the actual breathing animation with timer
export function beginInlineBreathing() {
    const displayDiv = document.getElementById('breathe-inline-display');
    const startBtn = document.getElementById('start-breathe-btn');
    const completionMsg = document.getElementById('breathe-completion-message');
    
    if (!displayDiv) return;
    
    // Hide start button and completion message, show timer display
    if (startBtn) {
        startBtn.style.display = 'none';
    }
    if (completionMsg) {
        completionMsg.style.display = 'none';
    }
    displayDiv.style.display = 'flex';
    
    // Switch from idle animation to actual breathing
    inlineAnimationOnly = false;
    inlineBreathingActive = true;
    breatheProgress = 0;
    breatheCycleCount = 0;
    lastTime = 0;
    
    // Track inline breathing start
    if (window.trackButtonClick) {
        window.trackButtonClick('🧘 Inline Breathing Exercise (Started from Mood)');
    }
}

// Finish breathing exercise after 3 cycles
function finishInlineBreathing() {
    const displayDiv = document.getElementById('breathe-inline-display');
    const startBtn = document.getElementById('start-breathe-btn');
    const completionMsg = document.getElementById('breathe-completion-message');
    
    // Stop active breathing
    inlineBreathingActive = false;
    inlineAnimationOnly = true; // Back to idle animation
    
    // Hide timer, show completion message and restart button
    if (displayDiv) {
        displayDiv.style.display = 'none';
    }
    if (completionMsg) {
        completionMsg.style.display = 'block';
    }
    if (startBtn) {
        startBtn.textContent = 'إعادة التمرين';
        startBtn.style.display = 'block';
    }
    
    // Track completion
    if (window.trackButtonClick) {
        window.trackButtonClick('🧘 Breathing Exercise (Completed 3 cycles)');
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (breatheRenderer) {
        const size = Math.min(window.innerWidth * 0.8, 400);
        breatheRenderer.setSize(size, size);
    }
});
