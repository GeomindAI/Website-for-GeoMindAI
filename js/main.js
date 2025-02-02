document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.text-slide');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => {
            slide.style.opacity = '0';
            slide.style.transition = 'opacity 1s ease-in-out';
        });
        
        slides[index].style.opacity = '1';
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Show first slide
    showSlide(0);

    // Change slides every 5 seconds
    setInterval(nextSlide, 5000);
}); 