import { getRandomMoodMessage } from './messages.js';
import { startInlineBreathing, stopInlineBreathing, beginInlineBreathing } from './breathe.js';

// Mood Tracker
const moodOptions = document.querySelectorAll('.mood-option');
const moodResponse = document.getElementById('mood-response');

if (moodOptions && moodOptions.length > 0) {
    moodOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const mood = option.getAttribute('data-mood');
            
            // Remove previous selection
            moodOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Select current
            option.classList.add('selected');
            
            // Show random response for this mood
            const message = getRandomMoodMessage(mood);
            if (moodResponse) {
                moodResponse.textContent = message;
                moodResponse.classList.add('show');
            }
            
            // Track mood selection
            if (window.trackButtonClick) {
                window.trackButtonClick(`💭 Mood Selected: ${mood}`);
            }
            
            // Show breathing exercise if tired or sad
            if (mood === 'تعبانة' || mood === 'زعلانة') {
                setTimeout(() => {
                    startInlineBreathing();
                }, 1000);
            } else {
                stopInlineBreathing();
            }
            
            // Create mood particles
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    const emojiEl = option.querySelector('.mood-emoji');
                    if (emojiEl) {
                        particle.innerHTML = emojiEl.textContent;
                    }
                    particle.style.position = 'fixed';
                    particle.style.left = option.getBoundingClientRect().left + option.offsetWidth / 2 + 'px';
                    particle.style.top = option.getBoundingClientRect().top + option.offsetHeight / 2 + 'px';
                    particle.style.fontSize = '20px';
                    particle.style.pointerEvents = 'none';
                    particle.style.zIndex = '1000';
                    particle.style.transition = 'all 2s ease-out';
                    particle.style.opacity = '1';
                    
                    document.body.appendChild(particle);
                    
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 100 + 50;
                    
                    setTimeout(() => {
                        particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
                        particle.style.opacity = '0';
                    }, 50);
                    
                    setTimeout(() => particle.remove(), 2000);
                }, i * 50);
            }
        });
    });
}

// Start breathing exercise button
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-breathe-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            beginInlineBreathing();
        });
    }
});
