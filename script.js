// Configuration
const TELEGRAM_BOT_TOKEN = '8550768148:AAGDaCfpYl5_Yvgg6en3updGDDyF7c9Hm-k';
const TELEGRAM_GROUP_ID = '@BartjonDesign'; // Group identifier
const PORTFOLIO_FOLDER = 'Prortfolio Album';

let currentOrderType = null;
let currentMethod = 'IDEA';
let previewImageFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadPortfolioImages();
});

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function applyTheme(theme) {
    const body = document.body;
    if (theme === 'light') {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
}

// Copy to Clipboard
function copyToClipboard(text, event) {
    event.preventDefault();
    navigator.clipboard.writeText(text).then(() => {
        showStatus(`Copied: ${text}`, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showStatus('Failed to copy', 'error');
    });
}

// Navigation
function navigate(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load Portfolio Images
async function loadPortfolioImages() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8dadc;">Loading portfolio...</p>';
    
    try {
        // Fetch directory listing
        const response = await fetch(`/${PORTFOLIO_FOLDER}/`);
        const html = await response.text();
        
        // Parse HTML to extract image files
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        const imageFiles = [];
        
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('..')) {
                const fileName = href.split('/').pop();
                const ext = fileName.split('.').pop().toLowerCase();
                if (imageExtensions.includes(ext)) {
                    imageFiles.push(fileName);
                }
            }
        });
        
        if (imageFiles.length === 0) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8dadc;">No images found in portfolio folder.</p>';
            return;
        }
        
        // Display images
        gallery.innerHTML = '';
        imageFiles.forEach(fileName => {
            const imagePath = `${PORTFOLIO_FOLDER}/${fileName}`;
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = fileName;
            img.onclick = () => enlargeImage(imagePath);
            
            // Remove broken/missing images
            img.onerror = () => {
                console.warn(`Image failed to load: ${imagePath}`);
                img.remove();
            };
            
            gallery.appendChild(img);
        });
    } catch (error) {
        console.error('Error loading portfolio:', error);
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e94560;">Error loading portfolio images. Make sure the server is running.</p>';
    }
}

// Enlarge Image
function enlargeImage(imagePath) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    lightboxImg.src = imagePath;
    lightbox.classList.add('active');
}

// Close Lightbox
function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// Select Order Type
function selectOrderType(type) {
    currentOrderType = type;
    
    // Update button states
    const buttons = document.querySelectorAll('.order-btn');
    buttons.forEach(btn => {
        if (btn.dataset.type === type) {
            btn.style.background = 'rgba(233, 69, 96, 0.3)';
            btn.style.borderColor = '#e94560';
        } else {
            btn.style.background = 'rgba(233, 69, 96, 0.1)';
            btn.style.borderColor = '#e94560';
        }
    });
}

// Select Method (IDEA MATN or RASM)
function selectMethod(method) {
    currentMethod = method;
    
    // Update toggle buttons
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide form sections
    const ideaSection = document.getElementById('ideaSection');
    const rasmSection = document.getElementById('rasmSection');
    
    if (method === 'IDEA') {
        ideaSection.classList.add('active');
        rasmSection.classList.remove('active');
        document.getElementById('ideaText').focus();
    } else {
        ideaSection.classList.remove('active');
        rasmSection.classList.add('active');
        document.getElementById('rasmFile').focus();
    }
}

// Handle Image Preview
function handleImagePreview(input) {
    if (input.files && input.files[0]) {
        previewImageFile = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Submit Order
async function submitOrder() {
    // Validate
    if (!currentOrderType) {
        showStatus('Please select a design type (BANNER, AVATARKA, or PREVYU)', 'error');
        return;
    }
    
    const telegramHandle = document.getElementById('telegramHandle').value.trim();
    if (!telegramHandle) {
        showStatus('Please enter your Telegram username', 'error');
        return;
    }
    
    // Clean up telegram handle
    const cleanHandle = telegramHandle.startsWith('@') ? telegramHandle.slice(1) : telegramHandle;
    
    let success = false;
    
    if (currentMethod === 'IDEA') {
        const ideaText = document.getElementById('ideaText').value.trim();
        if (!ideaText) {
            showStatus('Please describe your design idea', 'error');
            return;
        }
        success = await sendIdeaToTelegram(currentOrderType, ideaText, cleanHandle);
    } else {
        if (!previewImageFile) {
            showStatus('Please upload an image', 'error');
            return;
        }
        success = await sendImageToTelegram(currentOrderType, previewImageFile, cleanHandle);
    }
    
    if (success) {
        // Clear form
        document.getElementById('orderForm').reset();
        document.getElementById('imagePreview').classList.add('hidden');
        previewImageFile = null;
        showStatus('Order sent successfully! We will contact you on Telegram soon.', 'success');
        
        // Reset form after 3 seconds
        setTimeout(() => {
            document.getElementById('orderForm').style.display = 'none';
            setTimeout(() => {
                document.getElementById('orderForm').style.display = 'block';
            }, 100);
        }, 2000);
    }
}

// Send Idea Text to Telegram
async function sendIdeaToTelegram(designType, idea, telegramHandle) {
    const message = `🎯 Yangi Buyirtma

📋 Dizayn Turi: ${designType}
🔧 Usul: IDEA
💡 Ideasi: ${idea}
👤 Telegram: @${telegramHandle}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_GROUP_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        
        if (data.ok) {
            console.log('Message sent successfully');
            return true;
        } else {
            console.error('Telegram error:', data);
            showStatus(`Error: ${data.description || 'Failed to send message'}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Fallback: Try using a CORS proxy or alternative method
        return await sendViaCorsProxy(designType, idea, telegramHandle);
    }
}

// Send Image to Telegram
async function sendImageToTelegram(designType, imageFile, telegramHandle) {
    const message = `🎯 Yangi Buyirtma

📋 Dizayn Turi: ${designType}
🔧 Usul: RASM
👤 Telegram: @${telegramHandle}`;

    try {
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_GROUP_ID);
        formData.append('photo', imageFile);
        formData.append('caption', message);
        formData.append('parse_mode', 'HTML');

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.ok) {
            console.log('Photo sent successfully');
            return true;
        } else {
            console.error('Telegram error:', data);
            showStatus(`Error: ${data.description || 'Failed to send photo'}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error sending photo:', error);
        
        // Fallback: Send message only without photo
        showStatus('Note: Photo upload failed due to CORS. Sending message only.', 'error');
        return await sendIdeaToTelegram(designType, `[IMAGE UPLOAD] ${message}`, telegramHandle);
    }
}

// CORS Proxy Fallback
async function sendViaCorsProxy(designType, idea, telegramHandle) {
    const message = `🎯 Yangi Buyirtma

📋 Dizayn Turi: ${designType}
🔧 Usul: IDEA
💡 Ideasi: ${idea}
👤 Telegram: @${telegramHandle}`;

    const corsProxies = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
    ];

    for (let proxy of corsProxies) {
        try {
            const url = proxy + encodeURIComponent(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_GROUP_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            if (response.ok) {
                console.log('Message sent via CORS proxy');
                return true;
            }
        } catch (error) {
            console.log('CORS proxy failed:', error);
        }
    }

    showStatus('Unable to reach Telegram. Please try again later.', 'error');
    return false;
}

// Show Status Message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusEl.className = 'status-message';
    }, 5000);
}