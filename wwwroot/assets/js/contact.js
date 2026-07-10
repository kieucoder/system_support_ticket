// contact.js
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            // Check form validity using Bootstrap 5's checkValidity method
            if (!contactForm.checkValidity()) {
                event.stopPropagation();
                contactForm.classList.add('was-validated');
                return;
            }
            
            contactForm.classList.remove('was-validated');
            
            // Simulate API request and show success toast
            const submitBtn = contactForm.querySelector('.btn-form-submit');
            const originalBtnContent = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang gửi...`;
            
            setTimeout(() => {
                // Reset form
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
                
                // Show success toast
                showToast('Gửi liên hệ thành công! Đội ngũ hỗ trợ sẽ liên hệ lại với bạn trong giây lát.');
            }, 1200);
        });
    }
    
    function showToast(message) {
        let toast = document.getElementById('contactSuccessToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'contactSuccessToast';
            toast.className = 'contact-toast';
            toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span class="toast-text"></span>`;
            document.body.appendChild(toast);
        }
        
        toast.querySelector('.toast-text').innerText = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
});
