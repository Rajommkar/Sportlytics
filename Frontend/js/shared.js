// === Sportlytics Shared Utilities ===
const API_URL = 'http://127.0.0.1:5000/api';

const SPORT_OPTIONS = [
    { value: 'football', label: 'Football', icon: 'sports_soccer' },
    { value: 'basketball', label: 'Basketball', icon: 'sports_basketball' },
    { value: 'cricket', label: 'Cricket', icon: 'sports_cricket' },
    { value: 'running', label: 'Running', icon: 'directions_run' },
    { value: 'tennis', label: 'Tennis', icon: 'sports_tennis' },
    { value: 'badminton', label: 'Badminton', icon: 'sports_tennis' },
    { value: 'swimming', label: 'Swimming', icon: 'pool' },
    { value: 'cycling', label: 'Cycling', icon: 'pedal_bike' },
    { value: 'volleyball', label: 'Volleyball', icon: 'sports_volleyball' },
    { value: 'other', label: 'Other', icon: 'fitness_center' }
];

const SPORT_COLORS = {
    football: '#4edea3', basketball: '#f97316', cricket: '#3b82f6',
    running: '#eab308', tennis: '#a855f7', badminton: '#ec4899',
    swimming: '#06b6d4', cycling: '#84cc16', volleyball: '#f43f5e', other: '#6b7280'
};

function getToken() { return localStorage.getItem('sportlytics_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('sportlytics_user')); } catch { return null; } }

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size:1.2rem;">${icons[type]}</span><span style="flex:1;font-size:0.9rem;">${message}</span><button onclick="this.parentElement.remove()" style="background:none;color:#909097;font-size:1.2rem;cursor:pointer;border:none;">×</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function initParticles(count = 20) {
    const pc = document.getElementById('particles');
    if (!pc) return;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 8 + 6) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.width = (Math.random() * 3 + 1) + 'px';
        p.style.height = p.style.width;
        pc.appendChild(p);
    }
}

function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return observer;
}

function hideLoader() {
    const loader = document.getElementById('loadingScreen');
    if (loader) loader.classList.add('hidden');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
}

function logout() {
    localStorage.removeItem('sportlytics_token');
    localStorage.removeItem('sportlytics_user');
    window.location.href = 'index.html';
}

// Check JWT expiry
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch { return true; }
}

function requireAuth() {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
        logout();
        return false;
    }
    return true;
}
