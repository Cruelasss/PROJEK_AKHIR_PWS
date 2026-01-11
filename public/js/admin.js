// 1. Cek keamanan role admin (Client-side protection)
function checkAdminAccess() {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Cek keberadaan token
    if (!token || !userJson) {
        console.warn("Akses ditolak: Token atau data user tidak ada di localStorage.");
        window.location.href = 'index.html'; 
        return false;
    }

    try {
        const userData = JSON.parse(userJson);
        // Terkadang data user dibungkus dalam properti 'data' (sesuai respon login kamu)
        const user = userData.data ? userData.data : userData;

        if (user.role !== 'admin') {
            alert("Akses Ditolak! Anda bukan admin.");
            window.location.href = 'dashboard.html';
            return false;
        }

        const nameEl = document.getElementById('adminName');
        if (nameEl) nameEl.innerHTML = `<i class="fas fa-user-shield"></i> Welcome, ${user.username}`;
        
        return true;
    } catch (e) {
        console.error("Error parsing user data:", e);
        window.location.href = 'index.html';
        return false;
    }
}

// 2. Fungsi utama untuk load data
async function loadAdminDashboard() {
    if (!checkAdminAccess()) return;
    
    // Ambil token mentah
    let token = localStorage.getItem('token');

    // Jika token tersimpan sebagai object JSON (pernah kejadian di beberapa dev), ambil stringnya
    if (token && token.startsWith('{')) {
        try {
            const tokenObj = JSON.parse(token);
            token = tokenObj.token || token;
        } catch(e) {}
    }

    try {
        const response = await fetch('/api/admin/dashboard-stats', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`, // PENTING: Bearer[spasi]Token
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();

        if (response.ok) {
            // Pastikan mapping data sesuai dengan res.json backend kamu
            renderStats(result.stats);
            renderUsers(result.users);
            renderKeys(result.keys);
        } else {
            console.error("API Error:", result.message || result.error);
            alert("Error loading admin data: " + (result.error || result.message || "Unknown error"));
            // Jika token expired atau salah, arahkan ke login
            if (response.status === 401 || response.status === 403) {
                alert("Sesi habis atau akses ditolak. Silakan login ulang.");
                handleLogout();
            }
        }
    } catch (err) {
        console.error("Network Error:", err);
    }
}

// --- Fungsi Render tetap sama, pastikan ID di HTML cocok ---
function renderStats(stats) {
    if (!stats) return;
    document.getElementById('statTotalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('statActiveKeys').textContent = stats.activeKeys || 0;
    document.getElementById('statRevokedKeys').textContent = stats.revokedKeys || 0;
}

function renderUsers(users) {
    const table = document.getElementById('adminUserTable');
    if (!table) return;
    if (!users || users.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center">No users found</td></tr>';
        return;
    }
    table.innerHTML = users.map(u => `
        <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td>${u.total_keys || 0} Keys</td>
            <td>
                <button onclick="handleBanUser(${u.id})" class="btn-action btn-ban" style="color:#ff4d4d">
                    <i class="fas fa-ban"></i> Ban
                </button>
            </td>
        </tr>
    `).join('');
}

function renderKeys(keys) {
    const table = document.getElementById('adminKeyTable');
    if (!table) return;
    if (!keys || keys.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center">No API keys found</td></tr>';
        return;
    }
    table.innerHTML = keys.map(k => `
        <tr>
            <td>${k.owner || 'Unknown'}</td>
            <td><code>${k.api_key ? k.api_key.substring(0, 15) : 'N/A'}...</code></td>
            <td>
                <span class="status-pill ${k.is_active ? 'status-active' : 'status-revoked'}">
                    ${k.is_active ? 'Active' : 'Revoked'}
                </span>
            </td>
            <td>${new Date(k.created_at).toLocaleDateString()}</td>
            <td>
                <button onclick="toggleKeyStatus(${k.id})" class="btn-action">
                    <i class="fas ${k.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    ${k.is_active ? 'Revoke' : 'Restore'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function toggleKeyStatus(id) {
    const token = localStorage.getItem('token');
    if (!confirm("Ubah status API Key ini?")) return;

    try {
        const response = await fetch(`/api/admin/api-keys/${id}/toggle`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            loadAdminDashboard();
        } else {
            const res = await response.json();
            alert("Gagal: " + (res.error || res.message));
        }
    } catch (err) {
        alert("Terjadi kesalahan jaringan.");
    }
}

function handleBanUser(id) {
    alert("Fitur Ban User (ID: " + id + ") segera hadir.");
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);