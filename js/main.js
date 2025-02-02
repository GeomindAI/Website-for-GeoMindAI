document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.text-slide');
    let currentSlide = 0;

    function showSlide(index) {
        // First fade out current slide
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.classList.add('fade-out');
        });

        // Wait for fade out to complete before showing new slide
        setTimeout(() => {
            slides.forEach(slide => {
                slide.classList.remove('fade-out');
            });
            
            // Add active class to new slide
            slides[index].classList.add('active');
        }, 800); // Match this with the fade-out transition time
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Show first slide
    showSlide(0);

    // Change slides every 5 seconds
    setInterval(nextSlide, 5000);

    // Slow down video playback
    const video = document.querySelector('.background-video');
    video.playbackRate = 0.67; // This will make a 10s video play for ~15s
}); 