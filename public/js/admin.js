/* =========================
    Global Variables
========================= */
let apiChart = null;
let growthChart = null; // Variabel baru untuk Line Chart
let allUsersData = []; // Cache untuk Search & Filter

/* =========================
    Helper Token Aman (Tetap)
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
    Cek Akses Admin (Tetap)
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
    UX: Skeleton Loading (Baru)
========================= */
function showSkeletons(targetId, rows = 5) {
    const table = document.getElementById(targetId);
    if (!table) return;
    
    const skeletonRow = `
        <tr>
            <td><div class="skeleton" style="width: 80%"></div></td>
            <td><div class="skeleton" style="width: 90%"></div></td>
            <td><div class="skeleton" style="width: 60%"></div></td>
            <td><div class="skeleton" style="width: 40%"></div></td>
            <td><div class="skeleton" style="width: 70%"></div></td>
        </tr>`;
    
    table.innerHTML = Array(rows).fill(skeletonRow).join('');
}

/* =========================
    Fungsi Grafik Distribusi (Doughnut - Tetap)
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

    if (apiChart) apiChart.destroy();
    apiChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } } }
        }
    });
}

/* =========================
    Fungsi Grafik Tren (Line Chart - Baru)
========================= */
function updateGrowthChart(growthData) {
    const canvas = document.getElementById('userGrowthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const labels = growthData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });
    const counts = growthData.map(d => d.count);

    if (growthChart) growthChart.destroy();
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Users',
                data: counts,
                borderColor: '#22d3ee',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#22d3ee',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

/* =========================
    Load Dashboard Admin (Updated)
========================= */
async function loadAdminDashboard() {
    if (!checkAdminAccess()) return;

    showSkeletons('adminUserTable', 5);
    showSkeletons('adminKeyTable', 3);

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
            allUsersData = result.users || [];
            
            renderStats(result.stats);
            renderUsers(allUsersData);
            renderKeys(result.keys);
            
            // Render Kedua Grafik
            updateChart(result.stats);
            updateGrowthChart(result.growth || []);
        } else {
            if (response.status === 401 || response.status === 403) handleLogout();
        }
    } catch (err) {
        console.error(err);
    }
}

/* =========================
    UX: Search, Filter & Export (Baru)
========================= */
/* =========================
   UX: Search & Filter
========================= */
function filterUsers() {
    // Ambil keyword pencarian
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    // Ambil value dari dropdown (All Roles / admin / user)
    const roleValue = document.getElementById('roleFilter').value;

    console.log("Filtering for role:", roleValue); // Debugging

    const filtered = allUsersData.filter(u => {
        // Cek apakah username atau email mengandung kata kunci
        const matchesSearch = u.username.toLowerCase().includes(searchTerm) || 
                              u.email.toLowerCase().includes(searchTerm);
        
        // Cek apakah role sesuai
        // u.role harus berisi string 'admin' atau 'user' sesuai database
        const matchesRole = roleValue === 'all' || u.role === roleValue;

        return matchesSearch && matchesRole;
    });

    // Panggil fungsi render dengan data yang sudah disaring
    renderUsers(filtered);
}

function exportUsersToCSV() {
    if (allUsersData.length === 0) return alert("Tidak ada data");
    const headers = ["Username", "Email", "Join Date", "Total Keys"];
    const rows = allUsersData.map(u => [u.username, u.email, new Date(u.created_at).toLocaleDateString('id-ID'), u.total_keys || 0]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "ecometric_report.csv";
    link.click();
}

/* =========================
    Render Functions (Tetap)
========================= */
function renderStats(stats) {
    if (!stats) return;
    document.getElementById('statTotalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('statActiveKeys').textContent = stats.activeKeys || 0;
    document.getElementById('statRevokedKeys').textContent = stats.revokedKeys || 0;
}

function renderUsers(users) {
    const table = document.getElementById('adminUserTable');
    if (!table) return;
    if (users.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No users found</td></tr>`;
        return;
    }
    table.innerHTML = users.map(u => `
        <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.email}</td>
            <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
            <td><code>${u.total_keys || 0} Keys</code></td>
            <td><button class="btn-action btn-ban" onclick="handleBanUser(${u.id})"><i class="fas fa-ban"></i> Ban</button></td>
        </tr>
    `).join('');
}

function renderKeys(keys) {
    const table = document.getElementById('adminKeyTable');
    if (!table) return;
    if (keys.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No API keys found</td></tr>`;
        return;
    }
    table.innerHTML = keys.map(k => `
        <tr>
            <td>${k.owner || 'Unknown'}</td>
            <td><code>${k.api_key.substring(0, 15)}...</code></td>
            <td><span class="status-pill ${k.is_active ? 'status-active' : 'status-revoked'}">${k.is_active ? 'Active' : 'Revoked'}</span></td>
            <td>${new Date(k.created_at).toLocaleDateString('id-ID')}</td>
            <td><button class="btn-action" onclick="toggleKeyStatus(${k.id})"><i class="fas ${k.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i> Toggle</button></td>
        </tr>
    `).join('');
}

/* =========================
    Toggle & Ban (Tetap)
========================= */
async function toggleKeyStatus(id) {
    const token = getAuthToken();
    if (!confirm("Ubah status API Key ini?")) return;
    try {
        const response = await fetch(`/api/admin/api-keys/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) { alert('User berhasil diban'); loadAdminDashboard(); }
    } catch (err) { console.error(err); }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);