/**
 * ROADS-ON Logistics & Customs
 * Main JavaScript Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Frosted Header on Scroll
    const header = document.querySelector('.main-header');
    const handleScroll = () => {
        if (window.scrollY > 30) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 2. Mobile Drawer Navigation
    const mobileToggle = document.getElementById('mobileNavToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileBackdrop = document.getElementById('mobileNavBackdrop');
    const mobileClose = document.getElementById('mobileDrawerClose');
    const mobileLinks = document.querySelectorAll('.mobile-drawer-link');

    const openDrawer = () => {
        mobileDrawer.classList.add('active');
        mobileBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        mobileDrawer.classList.remove('active');
        mobileBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
    if (mobileClose) mobileClose.addEventListener('click', closeDrawer);
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeDrawer);
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // 3. Smooth Anchor Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#' && document.querySelector(targetId)) {
                e.preventDefault();
                const targetElem = document.querySelector(targetId);
                const headerHeight = header ? header.offsetHeight : 80;
                const elementPosition = targetElem.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - (headerHeight + 20);

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Gallery Lightbox Modal
    const galleryItems = document.querySelectorAll('.gallery-mosaic-item');
    const lightboxModal = document.getElementById('imageLightboxModal');
    const lightboxImg = document.getElementById('lightboxActiveImg');
    const lightboxCaption = document.getElementById('lightboxCaptionText');
    const lightboxClose = document.getElementById('lightboxCloseBtn');

    if (lightboxModal && lightboxImg) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('.gallery-img');
                const caption = item.querySelector('.gallery-caption-title');
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt || 'Roads-on Galeri Görseli';
                    if (lightboxCaption) {
                        lightboxCaption.textContent = caption ? caption.textContent : img.alt;
                    }
                    lightboxModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        const closeLightbox = () => {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    // 5. Language Switcher Simple Toggle
    const langItems = document.querySelectorAll('.lang-item');
    langItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            langItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});

/* ==========================================================================
   CHATBOT LOGIC
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
    const chatbotCloseBtn = document.getElementById('chatbotCloseBtn');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatOptBtns = document.querySelectorAll('.chat-opt-btn');

    if (!chatbotToggleBtn) return;

    chatbotToggleBtn.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
    });

    chatbotCloseBtn.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    const botResponses = {
        'why_us': [
            "Roads-on olarak sadece taşıyıcı değil, aynı zamanda çözüm ortağınızız. Operasyonel mükemmellik ve şeffaflık ilkemizdir.",
            "Güçlü küresel ağımız, deneyimli ekibimiz ve proaktif risk yönetimimiz sayesinde yükünüz her zaman güvendedir."
        ],
        'process': [
            "Süreçlerimiz şöyledir: Planlama -> Teklif -> Operasyon (Taşıma/Gümrük) -> Anlık Takip -> Sorunsuz Teslimat.",
            "Öncelikle rotanızı analiz edip en uygun çözümü sunuyoruz. Onayınızla süreci başlatıp, her adımda sizi şeffaf bir şekilde bilgilendiriyoruz."
        ],
        'quote': [
            "Teklif almak için bizimle doğrudan iletişime geçebilirsiniz: <a href='tel:+905384009066'>+90 (538) 400 90 66</a> numaralı telefondan bize ulaşabilirsiniz.",
            "Lütfen navlun ve operasyon teklifleri için <a href='tel:+905384009066'>+90 (538) 400 90 66</a> numarasını arayarak fiyatlandırma departmanımızla görüşün."
        ]
    };

    chatOptBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const text = btn.textContent;
            
            // Add user message
            addChatMessage(text, 'user-msg');
            
            // Remove options for a brief moment to simulate typing/processing
            const optionsContainer = document.getElementById('chatbotOptions');
            optionsContainer.style.display = 'none';

            // Randomly select response
            const responses = botResponses[type];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            setTimeout(() => {
                addChatMessage(randomResponse, 'bot-msg');
                optionsContainer.style.display = 'flex';
                scrollToBottom();
            }, 600);
            
            scrollToBottom();
        });
    });

    function addChatMessage(html, className) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${className}`;
        msgDiv.innerHTML = html;
        chatbotMessages.appendChild(msgDiv);
    }

    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
});
