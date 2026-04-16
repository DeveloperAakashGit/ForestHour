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
    const musicBtn = document.getElementById('music-toggle'); // Old toggle if still present
    const musicIcon = document.getElementById('music-icon');
    const mainMusicBtn = document.getElementById('main-audio-toggle');
    const mainMusicIcon = document.getElementById('main-audio-icon');
    const audio = document.getElementById('bg-audio');
    const startBtn = document.getElementById('start-btn');
    const preloaderText = document.querySelector('.pl-msg');
    const dayToggleBtn = document.getElementById('day-toggle-btn');
    const dayBtnLabel = document.getElementById('day-btn-label');
    const daycWrap = document.getElementById('dayc-wrap');
    const daynameDisplay = document.getElementById('dayname-display');
    let showingDayName = false;
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // Web Audio API for tick sound
    let audioContext = null;
    let lastSecond = -1;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function playTickSound(isTock = false) {
        try {
            const ctx = initAudio();
            if (ctx.state === 'suspended') return;

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Tick/Tock sound
            const freq = isTock ? 600 : 800;
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq/2, ctx.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // Silently fail if audio context is blocked
        }
    }

    // playChimeSound — reserved for future hour-chime feature

    function collectImageUrls() {
        const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src);
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
            setTimeout(() => finish('timeout'), timeout);
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

    function createFireflies() {
        const container = document.getElementById('pl-particles');
        if (!container) return;
        const positions = [
            {x:'8%',y:'65%'},{x:'18%',y:'40%'},{x:'28%',y:'72%'},{x:'38%',y:'55%'},
            {x:'50%',y:'35%'},{x:'60%',y:'68%'},{x:'72%',y:'45%'},{x:'82%',y:'60%'},
            {x:'90%',y:'30%'},{x:'14%',y:'82%'},{x:'44%',y:'80%'},{x:'66%',y:'78%'}
        ];
        positions.forEach((p, i) => {
            const el = document.createElement('div');
            el.className = 'pl-ff';
            el.style.left = p.x;
            el.style.top  = p.y;
            el.style.setProperty('--fd',  (2.2 + Math.random() * 1.8).toFixed(1) + 's');
            el.style.setProperty('--fdel', (Math.random() * 2).toFixed(1) + 's');
            container.appendChild(el);
        });
    }

    // Cycle status messages during loading
    function cycleStatusMessages() {
        const statusEl = document.getElementById('pl-status');
        if (!statusEl) return;
        const msgs = [
            'Awakening the forest…',
            'Listening to the leaves…',
            'Counting the heartbeats of time…',
            'The canopy stirs…',
            'Almost there…'
        ];
        let idx = 0;
        return setInterval(() => {
            idx = (idx + 1) % msgs.length;
            statusEl.style.opacity = '0';
            setTimeout(() => {
                statusEl.textContent = msgs[idx];
                statusEl.style.opacity = '';
            }, 400);
        }, 2800);
    }

    function startExperience() {
        initAudio();
        if (audio) {
            audio.play().then(() => {
                updateAudioButtons(true);
            }).catch(err => console.log('Audio play failed:', err));
        }
        createSparkles(20);
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                preloader.style.display = 'none';
                preloader.style.pointerEvents = 'none';
            }, 900);
        }
    }

    function createSparkles(count) {
        const container = document.createElement('div');
        container.className = 'sparkles';
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.animationDelay = Math.random() * 5 + 's';
            container.appendChild(sparkle);
        }
    }

    function updateAudioButtons(isPlaying) {
        const icon = isPlaying ? '⏸' : '▶';
        if (mainMusicIcon) mainMusicIcon.textContent = icon;
        if (musicIcon) musicIcon.textContent = icon;
    }

    function setupAudioVisiblityHandler() {
        if (!audio) return;
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                audio.pause();
            } else {
                if (mainMusicIcon && mainMusicIcon.textContent === '⏸') {
                    audio.play().catch(() => {});
                }
            }
        });
    }



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
            const isTock = seconds % 2 === 0;
            playTickSound(isTock);
            lastSecond = seconds;
        }

        // Only update date display if NOT showing day name
        if (!showingDayName) {
            if (dateDay)   dateDay.textContent   = String(now.getDate()).padStart(2, '0');
            if (dateMonth) dateMonth.textContent = String(now.getMonth() + 1).padStart(2, '0');
            if (dateYear)  dateYear.textContent  = now.getFullYear();
        }

        if (ampmEl) ampmEl.textContent = (hours >= 12) ? 'PM' : 'AM';
    }

    function animateClock() {
        updateClock();
        requestAnimationFrame(animateClock);
    }

    function toggleMusic() {
        if (!audio) return;
        if (audio.paused) {
            audio.play().then(() => updateAudioButtons(true)).catch(()=>{});
        } else {
            audio.pause();
            updateAudioButtons(false);
        }
    }

    // Initialize interactivity after assets ready
    async function init() {
        await waitForAssets();
        createFireflies();
        const statusInterval = cycleStatusMessages();

        if (startBtn) {
            setTimeout(() => {
                startBtn.style.display = 'flex';
                startBtn.addEventListener('click', () => {
                    clearInterval(statusInterval);
                    startExperience();
                });
            }, 7000);
        }

        setupAudioVisiblityHandler();
        animateClock();
    }

    if (mainMusicBtn) mainMusicBtn.addEventListener('click', toggleMusic);
    if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

    function toggleDayName() {
        if (!daynameDisplay || !dayBtnLabel) return; // null-guard
        showingDayName = !showingDayName;
        const dayName = DAY_NAMES[new Date().getDay()];

        if (showingDayName) {
            daynameDisplay.textContent = dayName;
            daynameDisplay.style.display = 'block';
            document.querySelectorAll('#dayc-wrap .date, #dayc-wrap .date-sep').forEach(el => el.style.opacity = '0');
            dayBtnLabel.textContent = 'Show Date';
        } else {
            daynameDisplay.style.display = 'none';
            document.querySelectorAll('#dayc-wrap .date, #dayc-wrap .date-sep').forEach(el => el.style.opacity = '');
            dayBtnLabel.textContent = 'Day Name';
        }
    }
    if (dayToggleBtn) dayToggleBtn.addEventListener('click', toggleDayName);

    init();
});


