// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const hourHand = document.querySelector('.hand.hour');
    const minuteHand = document.querySelector('.hand.minute');
    const secondHand = document.querySelector('.hand.second');
    const pulley = document.querySelector('.pulley');
    const innerPulley = document.querySelector('.innerpulley');
    const dateDay = document.querySelector('.date.day');
    const dateMonth = document.querySelector('.date.month');
    const dateYear = document.querySelector('.date.year');
    const ampmEl = document.querySelector('.ampm');
    const preloader = document.getElementById('preloader');
    const musicBtn = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');
    const audio = document.getElementById('bg-audio');

    // Web Audio API for tick sound
    let audioContext = null;
    let lastSecond = -1;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function playTickSound() {
        try {
            const ctx = initAudio();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Clock tick sound - short high频率
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    function playChimeSound() {
        try {
            const ctx = initAudio();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Hour chime - deeper tone
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    // Collect image URLs to preload (images in DOM + known background)
    function collectImageUrls() {
        const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src);
        // add background images referenced in CSS that won't appear as <img>
        imgs.push(new URL('assets/backCover.png', location.href).href);
        return Array.from(new Set(imgs));
    }

    // Preload images
    function preloadImages(urls) {
        return Promise.all(urls.map(url => new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve({url, status: 'ok'});
            img.onerror = () => resolve({url, status: 'error'});
            img.src = url;
        })));
    }

    // Wait for audio to be ready (canplaythrough) or timeout
    function preloadAudio(el, timeout = 8000) {
        if (!el) return Promise.resolve({status: 'no-audio'});
        return new Promise(resolve => {
            let done = false;
            function finish(status) {
                if (done) return; done = true; resolve({status});
            }
            const onCan = () => finish('ok');
            const onErr = () => finish('error');
            el.addEventListener('canplaythrough', onCan, {once:true});
            el.addEventListener('error', onErr, {once:true});
            // timeout fallback
            setTimeout(() => finish('timeout'), timeout);
            // trigger load if not already
            if (el.load) try { el.load(); } catch(e){/* ignore */}
        });
    }

    async function waitForAssets() {
        const images = collectImageUrls();
        const imgResults = preloadImages(images);
        const audioResult = preloadAudio(audio);
        const results = await Promise.all([imgResults, audioResult]);
        return results;
    }

    // Handle audio playback on tab visibility changes
    function setupAudioVisiblityHandler() {
        if (!audio) return;
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is not visible - pause audio
                audio.pause();
            } else {
                // Tab is visible again - resume audio
                audio.play().catch(() => {
                    // Autoplay may be blocked, user will need to interact
                });
            }
        });
    }

    // Start audio on user interaction for browsers that block autoplay
    function enableAudioOnInteraction() {
        if (!audio) return;
        
        function playAudio() {
            audio.muted = false; // Unmute after user interaction
            audio.play().catch(() => {
                console.log('Audio play failed');
            });
            // Remove listeners after first interaction
            document.removeEventListener('click', playAudio);
            document.removeEventListener('keydown', playAudio);
        }
        
        document.addEventListener('click', playAudio);
        document.addEventListener('keydown', playAudio);
    }

    // Clock update logic (keeps running via requestAnimationFrame)
    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        const secondDegrees = ((seconds + milliseconds / 1000) / 60) * 360;
        const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
        const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

        if (secondHand) secondHand.style.transform = `rotate(${secondDegrees}deg)`;
        if (minuteHand) minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
        if (hourHand) hourHand.style.transform = `rotate(${hourDegrees}deg)`;
        
        // Rotate pulley with second hand
        if (pulley) pulley.style.transform = `translate(-50%,-50%) rotate(${secondDegrees}deg)`;
        if (innerPulley) innerPulley.style.transform = `translate(-50%,-50%) rotate(${secondDegrees * 2}deg)`;

        // Play tick sound every second
        if (seconds !== lastSecond) {
            lastSecond = seconds;
            // Tick sound removed - now using background audio
        }

        if (dateDay) dateDay.textContent = String(now.getDate()).padStart(2, '0');
        if (dateMonth) dateMonth.textContent = String(now.getMonth() + 1).padStart(2, '0');
        if (dateYear) dateYear.textContent = now.getFullYear();

        if (ampmEl) ampmEl.textContent = (hours >= 12) ? 'PM' : 'AM';
    }

    function animateClock() {
        updateClock();
        requestAnimationFrame(animateClock);
    }

    // Toggle music playback (user gesture required on many browsers)
    function toggleMusic() {
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch(()=>{});
            musicBtn.setAttribute('aria-pressed','true');
            musicIcon.textContent = '⏸';
            musicBtn.setAttribute('aria-label','Pause background music');
        } else {
            audio.pause();
            musicBtn.setAttribute('aria-pressed','false');
            musicIcon.textContent = '▶';
            musicBtn.setAttribute('aria-label','Play background music');
        }
    }

    // Initialize interactivity after assets ready
    async function init() {
        await waitForAssets();
        // hide preloader
        if (preloader) preloader.style.display = 'none';
        // Setup audio handlers
        setupAudioVisiblityHandler();
        enableAudioOnInteraction();
        // start clock
        animateClock();
    }

    // attach music toggle
    if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

    // Initialize audio on first user interaction
    document.addEventListener('click', function initAudioOnClick() {
        initAudio();
        document.removeEventListener('click', initAudioOnClick);
    }, { once: true });

    // Start initialization (don't block DOMContentLoaded)
    init();
});


