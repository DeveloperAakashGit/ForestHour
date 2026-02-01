// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    
    const hourHand = document.querySelector('.hand.hour');
    const minuteHand = document.querySelector('.hand.minute');
    const secondHand = document.querySelector('.hand.second');
    const dateDay = document.querySelector('.date.day');
    const dateMonth = document.querySelector('.date.month');
    const dateYear = document.querySelector('.date.year');

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
        
        if (dateDay) dateDay.textContent = String(now.getDate()).padStart(2, '0');
        if (dateMonth) dateMonth.textContent = String(now.getMonth() + 1).padStart(2, '0');
        if (dateYear) dateYear.textContent = now.getFullYear();
    }

    function animateClock() {
        updateClock();
        requestAnimationFrame(animateClock);
    }

    updateClock();
    animateClock();
});


