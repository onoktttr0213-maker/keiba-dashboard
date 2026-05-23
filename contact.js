// Contact Form JavaScript
// Form validation and mailto link generation

// DOM Elements
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const subjectInput = document.getElementById('subject');
const messageInput = document.getElementById('message');

// Form submission handler
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    // Validate form
    if (!validateForm(name, email, subject, message)) {
        return;
    }

    // Generate mailto link
    const mailtoLink = generateMailtoLink(name, email, subject, message);

    // Open mailto link
    window.location.href = mailtoLink;

    // Show success message
    showStatus('メールアプリを起動しました', 'success');

    // Reset form after a delay
    setTimeout(() => {
        contactForm.reset();
        hideStatus();
    }, 3000);
});

// Validate form
function validateForm(name, email, subject, message) {
    // Check if all fields are filled
    if (!name || !email || !subject || !message) {
        showStatus('すべての項目を入力してください', 'error');
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showStatus('有効なメールアドレスを入力してください', 'error');
        return false;
    }

    return true;
}

// Generate mailto link
function generateMailtoLink(name, email, subject, message) {
    const recipientEmail = 'your-email@example.com'; // Replace with actual email
    const body = `お名前: ${name}\nメールアドレス: ${email}\n\nメッセージ:\n${message}`;

    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return mailtoLink;
}

// Show status message
function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = `mt-4 text-sm text-center ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    formStatus.classList.remove('hidden');
}

// Hide status message
function hideStatus() {
    formStatus.classList.add('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    nameInput.focus();

    // Fade in content
    const section = document.querySelector('section');
    if (section) {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    }
});
