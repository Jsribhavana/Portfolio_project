// Safe Storage Wrappers to prevent crashes under file:// protocol or disabled cookies/storage
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn(`localStorage read failed for key "${key}":`, e);
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`localStorage write failed for key "${key}":`, e);
        }
    }
};

const safeSessionStorage = {
    getItem(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (e) {
            console.warn(`sessionStorage read failed for key "${key}":`, e);
            return null;
        }
    },
    setItem(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (e) {
            console.warn(`sessionStorage write failed for key "${key}":`, e);
        }
    },
    removeItem(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (e) {
            console.warn(`sessionStorage remove failed for key "${key}":`, e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Manager
    initTheme();

    // 2. Navigation / Active Page Session Tracker
    trackSession();

    // 3. Navbar Active Indicator
    highlightNavbar();

    // 4. Contact Form Cache and Validation (only runs on contact.html)
    if (document.getElementById('contactForm')) {
        initContactForm();
    }

    // 5. Skills Grid Filter (only runs on skills.html/about.html)
    if (document.querySelector('.skills-filter-btn')) {
        initSkillsFilter();
    }
});

/**
 * Theme Management (Persistent Dark/Light Mode using localStorage)
 */
function initTheme() {
    const desktopBtn = document.getElementById('themeToggle');
    const mobileBtn = document.getElementById('themeToggleMobile');
    
    // Read theme from safe storage or default to dark
    const currentTheme = safeStorage.getItem('theme') || 'dark';

    // Set initial theme attributes
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    updateThemeIcons(currentTheme);

    const toggleThemeAction = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        safeStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
    };

    if (desktopBtn) {
        desktopBtn.addEventListener('click', toggleThemeAction);
    }
    if (mobileBtn) {
        mobileBtn.addEventListener('click', toggleThemeAction);
    }
}

function updateThemeIcons(theme) {
    const desktopIcon = document.querySelector('#themeToggle i');
    const mobileIcon = document.querySelector('#themeToggleMobile i');
    
    const iconClass = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    
    if (desktopIcon) desktopIcon.className = iconClass;
    if (mobileIcon) mobileIcon.className = iconClass;
}

/**
 * Active Page Tracking (sessionStorage)
 */
function trackSession() {
    let visitedPages = [];
    try {
        const stored = safeSessionStorage.getItem('visitedPages');
        visitedPages = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn('Failed to parse visited pages:', e);
    }
    
    const currentPage = getCurrentPageName();

    // Prevent duplicate entries consecutively
    if (visitedPages.length === 0 || visitedPages[visitedPages.length - 1] !== currentPage) {
        visitedPages.push(currentPage);
        safeSessionStorage.setItem('visitedPages', JSON.stringify(visitedPages));
    }

    // Create session tracking UI overlay dynamically
    createSessionTrackerUI(visitedPages);
}

function getCurrentPageName() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    if (page === '' || page === 'index.html') return 'Home';
    if (page === 'about.html') return 'About Me';
    if (page === 'skills.html') return 'Skills';
    if (page === 'projects.html') return 'Projects';
    if (page === 'experience.html') return 'Experience';
    if (page === 'contact.html') return 'Contact';
    return page;
}

function createSessionTrackerUI(visitedPages) {
    // Check if tracker already exists
    if (document.getElementById('sessionTracker')) return;

    const tracker = document.createElement('div');
    tracker.id = 'sessionTracker';
    tracker.className = 'tracker-status animate-fade-in d-none d-md-flex';
    tracker.setAttribute('title', 'Your browsing history this session');

    // Content: Show count and list paths on hover/click
    const visitCount = visitedPages.length;
    tracker.innerHTML = `
        <i class="bi bi-compass"></i>
        <span>Session Steps: <strong>${visitCount}</strong></span>
    `;

    // Tooltip list
    const historyList = visitedPages.join(' → ');
    tracker.setAttribute('data-bs-toggle', 'tooltip');
    tracker.setAttribute('data-bs-placement', 'top');
    tracker.setAttribute('data-bs-html', 'true');
    tracker.setAttribute('title', `<strong>Navigation Path:</strong><br>${historyList}`);

    document.body.appendChild(tracker);

    // Initialize Bootstrap Tooltip
    if (window.bootstrap) {
        new bootstrap.Tooltip(tracker);
    }
}

/**
 * Highlights active page link in the header navigation
 */
function highlightNavbar() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === page || (page === '' && href === 'index.html')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

/**
 * Skills Grid Interactive Filtering
 */
function initSkillsFilter() {
    const filterButtons = document.querySelectorAll('.skills-filter-btn');
    const skillCards = document.querySelectorAll('.skill-card-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from other buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to current
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');

            skillCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-skill-category') === category) {
                    card.style.display = 'block';
                    // Trigger a micro-animation fade in
                    card.classList.add('animate-fade-in');
                    setTimeout(() => card.classList.remove('animate-fade-in'), 800);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Contact Form State Cache and Input Validation
 */
function initContactForm() {
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('formName');
    const emailInput = document.getElementById('formEmail');
    const subjectInput = document.getElementById('formSubject');
    const messageInput = document.getElementById('formMessage');

    // 1. Auto-recovery from sessionStorage
    let cache = null;
    try {
        const stored = safeSessionStorage.getItem('contactFormCache');
        cache = stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.warn('Failed to parse contact form cache:', e);
    }
    
    if (cache) {
        if (cache.name && nameInput) nameInput.value = cache.name;
        if (cache.email && emailInput) emailInput.value = cache.email;
        if (cache.subject && subjectInput) subjectInput.value = cache.subject;
        if (cache.message && messageInput) messageInput.value = cache.message;
    }

    // 2. Real-time updates to sessionStorage cache
    const saveCache = () => {
        const formData = {
            name: nameInput.value,
            email: emailInput.value,
            subject: subjectInput.value,
            message: messageInput.value
        };
        safeSessionStorage.setItem('contactFormCache', JSON.stringify(formData));
    };

    [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
        if (input) {
            input.addEventListener('input', saveCache);
        }
    });

    // 3. Validation and submission handling
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        
        // Custom check name
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Please enter your name');
            isValid = false;
        } else {
            clearError(nameInput);
        }

        // Custom check email
        if (!emailInput.value.trim()) {
            showError(emailInput, 'Please enter your email address');
            isValid = false;
        } else if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        // Custom check subject
        if (!subjectInput.value.trim()) {
            showError(subjectInput, 'Please enter a subject');
            isValid = false;
        } else {
            clearError(subjectInput);
        }

        // Custom check message
        if (!messageInput.value.trim()) {
            showError(messageInput, 'Please enter your message');
            isValid = false;
        } else {
            clearError(messageInput);
        }

        if (isValid) {
            // Success! Clear cache and form
            safeSessionStorage.removeItem('contactFormCache');
            
            // Show custom Success Toast/Alert
            showSuccessAlert();
            form.reset();
        }
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

function showError(inputElement, message) {
    const formGroup = inputElement.parentElement;
    let feedback = formGroup.querySelector('.invalid-feedback');
    
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback d-block';
        formGroup.appendChild(feedback);
    }
    
    feedback.innerText = message;
    inputElement.classList.add('is-invalid');
}

function clearError(inputElement) {
    const formGroup = inputElement.parentElement;
    const feedback = formGroup.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
    inputElement.classList.remove('is-invalid');
}

function showSuccessAlert() {
    // Dynamic generation of Bootstrap Toast/Modal for a premium success response
    const alertDiv = document.createElement('div');
    alertDiv.className = 'position-fixed bottom-0 start-50 translate-middle-x p-3';
    alertDiv.style.zIndex = '1100';
    alertDiv.innerHTML = `
        <div class="toast align-items-center text-white bg-success border-0 show animate-fade-in" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex text-white">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi bi-check-circle-fill fs-5"></i>
                    Message sent successfully! Thank you for connecting, Sri Bhavana will get back to you shortly.
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 6000);

    // Hook standard dismiss close button
    const closeBtn = alertDiv.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        alertDiv.remove();
    });
}
