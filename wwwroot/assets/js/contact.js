// contact.js
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            // Check form validity using Bootstrap 5's checkValidity method
            if (!contactForm.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                contactForm.classList.add('was-validated');
                return;
            }
            
            // Client validation passes
            const submitBtn = contactForm.querySelector('.btn-form-submit');
            if (submitBtn) {
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang gửi...`;
                
                // Disable the button on the next event tick (10ms delay)
                // This ensures the browser starts the form POST submission before the button becomes disabled.
                setTimeout(() => {
                    submitBtn.disabled = true;
                }, 10);
            }
        });
    }
});
