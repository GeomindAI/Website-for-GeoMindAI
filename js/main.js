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

    showSlide(0);
    setInterval(nextSlide, 5000);

    // Mobile menu initialization
    if (window.innerWidth <= 768) {
        const header = document.querySelector('.main-header');
        const nav = document.querySelector('.header-right');
        
        const hamburger = document.createElement('button');
        hamburger.className = 'mobile-menu-btn';
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        header.insertBefore(hamburger, nav);

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('active');
            hamburger.innerHTML = nav.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });

        document.addEventListener('click', (e) => {
            if (!header.contains(e.target)) {
                nav.classList.remove('active');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
});




// Add to existing DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        initializeMobileMenu();
    }
});
