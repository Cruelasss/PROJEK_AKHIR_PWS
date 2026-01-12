/* =========================
   Global Variables
========================= */
let apiChart = null;

/* =========================
   Helper Token Aman
========================= */
function getAuthToken() {
    let token = localStorage.getItem('token');
    if (token && token.startsWith('{')) {
        try {
            token = JSON.parse(token).token || token;
        } catch (e) {}
    }
    return token;
}

/* =========================
   Cek Akses Admin (Client)
========================= */
function checkAdminAccess() {
    const userJson = localStorage.getItem('user');
    const token = getAuthToken();

    if (!token || !userJson) {
        window.location.href = 'index.html';
        return false;
    }

    try {
        const userData = JSON.parse(userJson);
        const user = userData.data ? userData.data : userData;

        if (user.role !== 'admin') {
            alert("Akses ditolak! Anda bukan admin.");
            window.location.href = 'dashboard.html';
            return false;
        }

        const nameEl = document.getElementById('adminName');
        if (nameEl) {
            nameEl.innerHTML = `<i class="fas fa-user-shield"></i> Welcome, ${user.username}`;
        }

        return true;
    } catch (err) {
        window.location.href = 'index.html';
        return false;
    }
}

/* =========================
   Fungsi Grafik (Chart.js)
========================= */
function updateChart(stats) {
    const ctx = document.getElementById('apiKeyChart').getContext('2d');
    
    const data = {
        labels: ['Active Keys', 'Revoked Keys'],
        datasets: [{
            data: [stats.activeKeys || 0, stats.revokedKeys || 0],
            backgroundColor: ['#4ade80', '#f87171'],
            borderColor: '#1e293b',
            borderWidth: 3,
            hoverOffset: 15
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 20,
                        font: { size: 14, family: 'Plus Jakarta Sans' }
                    }
                }
            }
        }
    };

    if (apiChart) {
        apiChart.destroy();
    }
    apiChart = new Chart(ctx, config);
}

/* =========================
   Load Dashboard Admin
========================= */
async function loadAdminDashboard() {
    if (!checkAdminAccess()) return;

    const token = getAuthToken();

    try {
        const response = await fetch('/api/admin/dashboard-stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            renderStats(result.stats);
            renderUsers(result.users);
            renderKeys(result.keys);
            // Update Grafik dengan data terbaru
            updateChart(result.stats);
        } else {
            if (response.status === 401 || response.status === 403) {
                handleLogout();
            }
        }
    } catch (err) {
        console.error(err);
    }
}

/* =========================
   Render Statistik
========================= */
function renderStats(stats) {
    if (!stats) return;
    document.getElementById('statTotalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('statActiveKeys').textContent = stats.activeKeys || 0;
    document.getElementById('statRevokedKeys').textContent = stats.revokedKeys || 0;
}

/* =========================
   Render Users
========================= */
function renderUsers(users) {
    const table = document.getElementById('adminUserTable');
    if (!table) return;

    if (!Array.isArray(users) || users.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No users found</td></tr>`;
        return;
    }

    table.innerHTML = users.map(u => `
        <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
            <td><code>${u.total_keys || 0} Keys</code></td>
            <td>
                <button class="btn-action btn-ban" onclick="handleBanUser(${u.id})">
                    <i class="fas fa-ban"></i> Ban
                </button>
            </td>
        </tr>
    `).join('');
}

/* =========================
   Render API Keys
========================= */
function renderKeys(keys) {
    const table = document.getElementById('adminKeyTable');
    if (!table) return;

    if (!Array.isArray(keys) || keys.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No API keys found</td></tr>`;
        return;
    }

    table.innerHTML = keys.map(k => `
        <tr>
            <td>${k.owner || 'Unknown'}</td>
            <td><code>${k.api_key.substring(0, 15)}...</code></td>
            <td>
                <span class="status-pill ${k.is_active ? 'status-active' : 'status-revoked'}">
                    ${k.is_active ? 'Active' : 'Revoked'}
                </span>
            </td>
            <td>${new Date(k.created_at).toLocaleDateString('id-ID')}</td>
            <td>
                <button class="btn-action" onclick="toggleKeyStatus(${k.id})">
                    <i class="fas ${k.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    ${k.is_active ? 'Revoke' : 'Restore'}
                </button>
            </td>
        </tr>
    `).join('');
}

/* =========================
   Toggle & Ban (CRUD)
========================= */
async function toggleKeyStatus(id) {
    const token = getAuthToken();
    if (!confirm("Ubah status API Key ini?")) return;

    try {
        const response = await fetch(`/api/admin/api-keys/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) loadAdminDashboard();
    } catch (err) { console.error(err); }
}

async function handleBanUser(id) {
    const token = getAuthToken();
    if (!confirm("Yakin ingin BAN user ini?")) return;
    try {
        const response = await fetch(`/api/admin/users/${id}/ban`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            alert('User berhasil diban');
            loadAdminDashboard();
        }
    } catch (err) { console.error(err); }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);