import * as THREE from 'three';

// Rose 3D Portrait with image and flowing hair
let portraitScene, portraitCamera, portraitRenderer;
let portraitPlane, glowRing, stars;
let mouseX = 0, mouseY = 0;
let autoRotate = true;
let time = 0;

export function initRosePortrait() {
    const container = document.getElementById('rose-portrait-container');
    
    if (!container) {
        console.error('Rose portrait container not found');
        return;
    }
    
    // Scene setup
    portraitScene = new THREE.Scene();
    // Transparent background for overlay effect
    
    // Camera
    portraitCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    portraitCamera.position.z = 6;
    
    // Renderer
    portraitRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    
    // Calculate size based on container width (90% of viewport, max 900px)
    const containerWidth = Math.min(window.innerWidth * 0.9, 900);
    portraitRenderer.setSize(containerWidth, containerWidth);
    portraitRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    container.appendChild(portraitRenderer.domElement);
    
    // Add stars in background (removed for cleaner background effect)
    // createStarField();
    
    // Load and create portrait with image
    const textureLoader = new THREE.TextureLoader();
    
    // Use local Rose image
    const imageUrl = './rose.png';
    
    textureLoader.load(
        imageUrl,
        (texture) => {
            createPixelSpritePortrait(texture);
        },
        undefined,
        (error) => {
            console.log('Image loading failed:', error);
            createPortraitWithPlaceholder();
        }
    );
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    portraitScene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    keyLight.position.set(3, 3, 5);
    portraitScene.add(keyLight);
    
    const fillLight = new THREE.PointLight(0xBA94FF, 0.5, 20);
    fillLight.position.set(-3, 2, 3);
    portraitScene.add(fillLight);
    
    const rimLight = new THREE.PointLight(0xFFD700, 0.4, 20);
    rimLight.position.set(0, 2, -3);
    portraitScene.add(rimLight);
    
    // Mouse interaction
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('mouseenter', () => autoRotate = false);
    container.addEventListener('mouseleave', () => autoRotate = true);
    
    // Start animation
    animatePortrait();
}

function createPixelSpritePortrait(texture) {
    // Sample the image to create pixel particles
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resolution = 100;
    canvas.width = resolution;
    canvas.height = resolution;
    
    // Draw image to canvas
    const img = texture.image;
    ctx.drawImage(img, 0, 0, resolution, resolution);
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const pixels = imageData.data;
    
    // Create particles from pixels
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    const velocities = [];
    const originalPositions = [];
    
    const scale = 5; // Spread of particles
    
    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const index = (y * resolution + x) * 4;
            const r = pixels[index] / 255;
            const g = pixels[index + 1] / 255;
            const b = pixels[index + 2] / 255;
            const a = pixels[index + 3] / 255;
            
            // Skip fully transparent pixels
            if (a < 0.05) continue;
            
            // Position (centered)
            const px = (x / resolution - 0.5) * scale;
            const py = -(y / resolution - 0.5) * scale;
            const pz = 0;
            
            positions.push(px, py, pz);
            originalPositions.push(px, py, pz);
            colors.push(r, g, b);
            
            // Size based on brightness
            const brightness = (r + g + b) / 3;
            sizes.push(0.04 + brightness * 0.03);
            
            // Velocity for hair on the right side (flowing effect)
            const normalizedX = x / resolution; // 0 to 1
            const isRightEdge = normalizedX > 0.65; // Right 35% of image
            const isHairRegion = y < resolution * 0.65; // Upper 65%
            
            if (isRightEdge && isHairRegion) {
                // Calculate gradient strength - stronger towards the edge
                const edgeGradient = (normalizedX - 0.65) / 0.35; // 0 at 65%, 1 at 100%
                const flowStrength = edgeGradient * edgeGradient; // Quadratic for smoother transition
                
                // Hair particles flow to the right continuously
                const randomOffset = Math.random(); // Random start offset for train effect
                velocities.push(
                    (0.004 + Math.random() * 0.006) * flowStrength, // x velocity (stronger at edge)
                    (Math.random() - 0.5) * 0.005 * flowStrength, // y velocity
                    (Math.random() - 0.5) * 0.003 * flowStrength, // z velocity
                    randomOffset // Store random offset for staggered animation
                );
            } else {
                velocities.push(0, 0, 0, 0);
            }
        }
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(velocities), 4));
    particleGeometry.setAttribute('originalPosition', new THREE.BufferAttribute(new Float32Array(originalPositions), 3));
    
    // Shader with flowing hair effect
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
            attribute float size;
            attribute vec4 velocity;
            attribute vec3 originalPosition;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform float uPixelRatio;
            
            void main() {
                vColor = color;
                
                vec3 pos = position;
                
                // Gentle wave effect on entire portrait
                float wave = sin(originalPosition.x * 2.0 + uTime * 0.5) * 0.03;
                wave += cos(originalPosition.y * 2.0 + uTime * 0.4) * 0.03;
                pos.z += wave;
                
                // Subtle breathing
                float breathe = sin(uTime * 0.4) * 0.015;
                pos *= 1.0 + breathe;
                
                // Hair flowing effect - particles with velocity move like a train
                if (length(velocity.xyz) > 0.0) {
                    // Use velocity.w as random offset for staggered start
                    float randomOffset = velocity.w;
                    
                    // Create continuous loop with offset (train effect)
                    float loopDuration = 4.0; // 4 seconds per cycle
                    float animTime = mod(uTime + randomOffset * loopDuration, loopDuration);
                    
                    // Move particles
                    pos += velocity.xyz * animTime;
                    
                    // Calculate distance traveled
                    float flowDistance = length(pos.xy - originalPosition.xy);
                    
                    // Fade in at start, fade out at end (train effect)
                    float fadeIn = smoothstep(0.0, 0.3, animTime / loopDuration);
                    float fadeOut = 1.0 - smoothstep(0.6, 1.0, animTime / loopDuration);
                    vAlpha = fadeIn * fadeOut;
                } else {
                    vAlpha = 1.0;
                }
                
                // Additional edge fading
                float edgeDist = max(abs(originalPosition.x), abs(originalPosition.y)) / 2.5;
                vAlpha *= 1.0 - smoothstep(0.8, 1.0, edgeDist);
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                // Size attenuation
                gl_PointSize = size * uPixelRatio * 400.0 / -mvPosition.z;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                // Circular particle shape
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                if (dist > 0.5) discard;
                
                // Soft edges with glow
                float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * vAlpha;
                
                // Add subtle glow
                vec3 glow = vColor * (1.0 - dist * 1.5) * 0.3;
                vec3 finalColor = vColor + glow;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });
    
    portraitPlane = new THREE.Points(particleGeometry, particleMaterial);
    portraitScene.add(portraitPlane);
}

function createPortraitWithImage(texture) {
    // Create circular portrait plane with image
    const geometry = new THREE.CircleGeometry(2, 64);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uGlow: { value: new THREE.Color(0xFFB6C1) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float uTime;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Subtle wave effect
                vec3 pos = position;
                pos.z += sin(position.x * 2.0 + uTime) * 0.05;
                pos.z += cos(position.y * 2.0 + uTime) * 0.05;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform vec3 uGlow;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vec4 texColor = texture2D(uTexture, vUv);
                
                // Add rim glow
                float dist = length(vUv - 0.5);
                float rim = smoothstep(0.5, 0.45, dist);
                vec3 glowColor = uGlow * (1.0 - rim) * 0.3;
                
                // Subtle color enhancement
                texColor.rgb += glowColor;
                texColor.rgb += sin(uTime) * 0.02;
                
                // Circular mask
                float alpha = smoothstep(0.5, 0.48, dist);
                texColor.a *= alpha;
                
                gl_FragColor = texColor;
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    portraitPlane = new THREE.Mesh(geometry, material);
    portraitScene.add(portraitPlane);
    
    // Create flowing hair
    createFlowingHair();
    
    // Add glow ring
    createGlowRing();
}

function createPortraitWithPlaceholder() {
    // Fallback: Create a gradient circle
    const geometry = new THREE.CircleGeometry(2, 64);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(0xFFB6C1) },
            uColor2: { value: new THREE.Color(0xFFE4E1) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float uTime;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                vec3 pos = position;
                pos.z += sin(position.x * 2.0 + uTime) * 0.05;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            varying vec2 vUv;
            
            void main() {
                vec2 center = vec2(0.5, 0.5);
                float dist = length(vUv - center);
                
                vec3 color = mix(uColor1, uColor2, vUv.y);
                color += sin(uTime) * 0.05;
                
                float alpha = smoothstep(0.5, 0.48, dist);
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    portraitPlane = new THREE.Mesh(geometry, material);
    portraitScene.add(portraitPlane);
    
    createGlowRing();
}

function createGlowRing() {
    // Removed - no circle needed
}

function createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 50;
        positions[i + 1] = (Math.random() - 0.5) * 50;
        positions[i + 2] = (Math.random() - 0.5) * 30 - 10;
        
        // Mix of white and colored stars
        if (Math.random() < 0.8) {
            colors[i] = 1.0;
            colors[i + 1] = 1.0;
            colors[i + 2] = 1.0;
        } else {
            colors[i] = 1.0;
            colors[i + 1] = 0.84;
            colors[i + 2] = 0.5;
        }
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    
    stars = new THREE.Points(starsGeometry, starsMaterial);
    portraitScene.add(stars);
}

function onMouseMove(event) {
    const rect = event.target.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onTouchMove(event) {
    if (event.touches.length > 0) {
        const rect = event.target.getBoundingClientRect();
        mouseX = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    }
}

function animatePortrait() {
    requestAnimationFrame(animatePortrait);
    
    time += 0.016;
    
    // Update portrait plane (pixel sprite)
    if (portraitPlane) {
        // Update shader time
        if (portraitPlane.material.uniforms && portraitPlane.material.uniforms.uTime) {
            portraitPlane.material.uniforms.uTime.value = time;
        }
        
        // Rotation based on mouse or auto
        if (autoRotate) {
            portraitPlane.rotation.y = Math.sin(time * 0.2) * 0.1;
            portraitPlane.rotation.x = Math.cos(time * 0.15) * 0.05;
        } else {
            portraitPlane.rotation.y += (mouseX * 0.3 - portraitPlane.rotation.y) * 0.05;
            portraitPlane.rotation.x += (mouseY * 0.2 - portraitPlane.rotation.x) * 0.05;
        }
        
        // Subtle floating
        portraitPlane.position.y = Math.sin(time * 0.4) * 0.1;
        portraitPlane.position.x = Math.cos(time * 0.3) * 0.05;
    }
    
    // Twinkle stars
    if (stars) {
        stars.rotation.y = time * 0.01;
        stars.rotation.x = time * 0.005;
        
        // Animate star sizes for twinkling
        const positions = stars.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] += Math.sin(time + i) * 0.001;
        }
        stars.geometry.attributes.position.needsUpdate = true;
    }
    
    portraitRenderer.render(portraitScene, portraitCamera);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (portraitRenderer) {
        const container = document.getElementById('rose-portrait-container');
        if (container) {
            const containerWidth = Math.min(window.innerWidth * 0.9, 900);
            portraitRenderer.setSize(containerWidth, containerWidth);
        }
    }
});

// Handle scroll to move portrait down to half page
let lastScrollY = 0;
window.addEventListener('scroll', () => {
    const container = document.getElementById('rose-portrait-container');
    if (!container) return;
    
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Calculate halfway point of the entire page
    const halfPageScroll = (documentHeight - windowHeight) / 2;
    
    // Move portrait down much slower (30% of scroll speed for parallax effect)
    const translateY = Math.min(scrollY * 0.3, halfPageScroll);
    
    // Apply transform
    container.style.transform = `translate(-50%, ${translateY}px)`;
    
    lastScrollY = scrollY;
}, { passive: true });
