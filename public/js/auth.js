// Toggle between login and register form
function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.toggle('form-hidden');
    registerForm.classList.toggle('form-hidden');
    
    hideMessages();
}

// Hide all error and success messages
function hideMessages() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

// Show error message
function showError(formType, message) {
    const errorEl = document.getElementById(formType + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Show success message
function showSuccess(message) {
    const successEl = document.getElementById('registerSuccess');
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
}

// ==========================================
// HANDLE LOGIN
// ==========================================
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Asumsi struktur response: { status: 'success', data: { token: '...', user: { role: 'admin', ... } } }
            // Atau jika token ada di dalam data.data:
            const userData = result.data;

            // 1. Simpan Token secara terpisah sebagai STRING
            localStorage.setItem('token', userData.token);
            
            // 2. Simpan Data User sebagai JSON String (Tanpa menyertakan token lagi di dalamnya agar bersih)
            const profile = {
                id: userData.id,
                username: userData.username,
                role: userData.role,
                email: userData.email
            };
            localStorage.setItem('user', JSON.stringify(profile));
            
            // 3. Redirect berdasarkan Role
            if (profile.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            
        } else {
            showError('login', result.message || 'Login failed');
        }
    } catch (error) {
        showError('login', 'Network Error: ' + error.message);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// ==========================================
// HANDLE REGISTER
// ==========================================
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const full_name = document.getElementById('registerFullName').value;
    const password = document.getElementById('registerPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    
    try {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, full_name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('✓ Account created successfully! Please login.');
            
            // Reset form
            document.getElementById('registerForm').reset();
            
            setTimeout(() => {
                toggleAuthForm();
            }, 2000);
        } else {
            showError('register', data.message || 'Registration failed');
        }
    } catch (error) {
        showError('register', 'Network Error: ' + error.message);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Sign Up';
    }
}

// ==========================================
// AUTO-REDIRECT IF LOGGED IN
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            // Cek path saat ini agar tidak terjadi infinite loop redirect
            const path = window.location.pathname;
            
            if (path.includes('index.html') || path === '/') {
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (e) {
            localStorage.clear(); // Hapus jika data corrupt
        }
    }
});