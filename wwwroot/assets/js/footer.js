/* -------------------------------------------------------------
 * FILE: assets/js/footer.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Back-to-top scroll trigger and scroll behaviors
 * ------------------------------------------------------------- */

window.initFooter = () => {
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    if (!scrollTopBtn) return;

    const handleFooterScroll = () => {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    };

    handleFooterScroll();
    window.addEventListener('scroll', handleFooterScroll);

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Subdirectory path resolution for footer links
    const footer = document.querySelector('.custom-footer');
    if (footer) {
        const isHomePage = window.location.pathname.endsWith('index.html') || 
                           window.location.pathname === '/' || 
                           window.location.pathname.endsWith('/') ||
                           (!window.location.pathname.includes('.html'));
                           
        if (!isHomePage) {
            const footerLinks = footer.querySelectorAll('a[href^="#"]');
            const prefix = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            footerLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && href !== '#') {
                    link.setAttribute('href', prefix + href);
                }
            });
        }

        const isSubdir = window.location.pathname.includes('/pages/');
        if (isSubdir) {
            const docLinks = footer.querySelectorAll('a:not([href^="http"]):not([href^="tel"]):not([href^="mailto"]):not([href^="javascript"])');
            docLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('../')) {
                    if (href !== 'contact.html' && href !== 'customer-profile.html') {
                        link.setAttribute('href', '../' + href);
                    }
                }
            });
        }
    }
};
