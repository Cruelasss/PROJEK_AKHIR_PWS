// Get token from localStorage
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }
    return token;
}

// Get user from localStorage
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Load API keys
async function loadApiKeys() {
    try {
        const response = await fetch('/api/auth/api-keys', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayApiKeys(data.data);
        } else {
            console.error('Failed to load API keys:', data.message);
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

// Display API keys
function displayApiKeys(keys) {
    const activeKeysList = document.getElementById('apiKeysList');
    const archivedKeysList = document.getElementById('archivedKeysList');
    const archivedSection = document.getElementById('archivedKeysSection');
    const toggleBtn = document.getElementById('toggleArchivedBtn');
    
    const activeKeys = keys.filter(k => k.is_active);
    const archivedKeys = keys.filter(k => !k.is_active);
    
    if (!activeKeys || activeKeys.length === 0) {
        activeKeysList.innerHTML = '<div class="no-keys-message">No active API keys yet. Create one to get started!</div>';
    } else {
        activeKeysList.innerHTML = activeKeys.map(key => `
            <div class="api-key-item">
                <div class="api-key-name"><i class="fas fa-key"></i> ${key.name}</div>
                <div class="api-key-value"><code>${key.api_key}</code></div>
                <div class="api-key-actions">
                    <button class="copy-btn" onclick="copyToClipboard('${key.api_key}')">Copy</button>
                    <button class="revoke-btn" onclick="revokeApiKey(${key.id})">Revoke</button>
                </div>
            </div>
        `).join('');
    }
    
    if (archivedKeys && archivedKeys.length > 0) {
        toggleBtn.style.display = 'block';
        archivedKeysList.innerHTML = archivedKeys.map(key => `
            <div class="api-key-item archived">
                <div class="api-key-name">${key.name}</div>
                <div class="api-key-value">${key.api_key}</div>
                <div class="api-key-actions">
                    <button class="copy-btn" onclick="copyToClipboard('${key.api_key}')">Copy</button>
                    <button class="restore-btn" onclick="restoreApiKey(${key.id})">Restore</button>
                    <button class="delete-btn" onclick="permanentDeleteApiKey(${key.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } else {
        toggleBtn.style.display = 'none';
        archivedSection.classList.remove('show');
    }

    updateApiKeySelector(activeKeys);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Copied to clipboard!');
    });
}

function updateApiKeySelector(keys) {
    const selector = document.getElementById('apiKeySelect');
    if (!selector) return;
    while (selector.options.length > 1) {
        selector.remove(1);
    }
    if (keys && keys.length > 0) {
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key.api_key;
            option.textContent = `${key.name} (${key.api_key.substring(0, 8)}...)`;
            selector.appendChild(option);
        });
        selector.value = keys[0].api_key;
    }
}

async function revokeApiKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
        const response = await fetch(`/api/auth/api-keys/${keyId}/revoke`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (response.ok) {
            showSuccess(data.message);
            loadApiKeys();
        } else {
            showError('test', data.message || 'Failed to revoke key');
        }
    } catch (error) {
        showError('test', 'Error: ' + error.message);
    }
}

function toggleArchivedKeys() {
    const section = document.getElementById('archivedKeysSection');
    const btn = document.getElementById('toggleArchivedBtn');
    section.classList.toggle('show');
    btn.textContent = section.classList.contains('show') ? '🔒 Hide Archived Keys' : '📦 Show Archived Keys';
}

async function restoreApiKey(keyId) {
    try {
        const response = await fetch(`/api/auth/api-keys/${keyId}/restore`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (response.ok) {
            showSuccess(data.message);
            loadApiKeys();
        }
    } catch (error) {
        showError('test', error.message);
    }
}

async function permanentDeleteApiKey(keyId) {
    if (!confirm('⚠️ Permanently delete?')) return;
    try {
        const response = await fetch(`/api/auth/api-keys/${keyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (response.ok) {
            showSuccess('Deleted');
            loadApiKeys();
        }
    } catch (error) {
        showError('test', error.message);
    }
}

function openCreateKeyModal() {
    document.getElementById('createKeyModal').classList.add('active');
    document.getElementById('keyName').focus();
}

function closeCreateKeyModal() {
    document.getElementById('createKeyModal').classList.remove('active');
}

async function submitCreateKey() {
    const keyName = document.getElementById('keyName').value;
    if (!keyName.trim()) return;
    try {
        const response = await fetch('/api/auth/api-keys', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: keyName })
        });
        if (response.ok) {
            showSuccess('Created!');
            closeCreateKeyModal();
            loadApiKeys();
        }
    } catch (error) {
        showError('test', error.message);
    }
}

// --- BAGIAN UPDATE ENDPOINT DENGAN DROPDOWN ---
function updateEndpoint() {
    const endpoint = document.getElementById('endpointSelect').value;
    const dynamicParams = document.getElementById('dynamicParams');
    const endpointInfo = document.getElementById('endpointInfo');
    const sendBtn = document.getElementById('sendBtn');

    dynamicParams.innerHTML = '';
    if (!endpoint) {
        endpointInfo.style.display = 'none';
        sendBtn.disabled = true;
        return;
    }
    sendBtn.disabled = false;

    // Daftar opsi untuk dropdown indikator
    const indicatorOptions = [
        { value: 'inflation', label: 'Inflation' },
        { value: 'gdpGrowth', label: 'GDP Growth' },
        { value: 'unemployment', label: 'Unemployment' },
        { value: 'interestRate', label: 'Interest Rate' },
        { value: 'tradeBalance', label: 'Trade Balance' }
    ];

    const endpointConfigs = {
        'currencies/latest': {
            info: 'GET /api/currencies/latest - Get latest currency exchange rates',
            params: [
                { name: 'from', type: 'text', placeholder: 'e.g., USD' },
                { name: 'to', type: 'text', placeholder: 'e.g., IDR' }
            ]
        },
        'currencies/history': {
            info: 'GET /api/currencies/history - Get historical rates',
            params: [
                { name: 'base', type: 'text', placeholder: 'e.g., USD' },
                { name: 'days', type: 'number', placeholder: '1-365' }
            ]
        },
        'currencies/supported': { info: 'GET /api/currencies/supported', params: [] },
        'indicators/latest': { 
            info: 'GET /api/indicators/latest', 
            params: [{ name: 'country', type: 'text', placeholder: 'ID, US' }] 
        },
        'indicators/search': { 
            info: 'GET /api/indicators/search', 
            params: [
                { name: 'country', type: 'text', placeholder: 'ID' }, 
                { name: 'type', type: 'select', options: indicatorOptions } // Ubah jadi SELECT
            ] 
        },
        'indicators/countries': { info: 'GET /api/indicators/countries', params: [] }
    };

    const config = endpointConfigs[endpoint];
    if (config) {
        endpointInfo.textContent = config.info;
        endpointInfo.style.display = 'block';
        
        dynamicParams.innerHTML = config.params.map((param, idx) => {
            if (param.type === 'select') {
                return `
                    <div class="form-group">
                        <label>${param.name}</label>
                        <select id="param-${idx}" class="param-input">
                            ${param.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                        </select>
                    </div>
                `;
            } else {
                return `
                    <div class="form-group">
                        <label>${param.name}</label>
                        <input type="${param.type}" id="param-${idx}" placeholder="${param.placeholder}" class="param-input">
                    </div>
                `;
            }
        }).join('');
    }
}

function getQueryParams() {
    const endpoint = document.getElementById('endpointSelect').value;
    const params = new URLSearchParams();
    const endpointConfigs = {
        'currencies/latest': ['from', 'to'],
        'currencies/history': ['from', 'to', 'days'],
        'indicators/latest': ['country'],
        'indicators/search': ['country', 'type'],
    };
    const paramNames = endpointConfigs[endpoint] || [];
    paramNames.forEach((name, idx) => {
        const input = document.getElementById(`param-${idx}`);
        if (input && input.value) params.append(name, input.value);
    });
    return params.toString();
}

async function sendRequest() {
    const endpoint = document.getElementById('endpointSelect').value;
    const apiKey = getSelectedApiKey();
    if (!apiKey || !endpoint) return;

    try {
        const queryParams = getQueryParams();
        const url = `/api/${endpoint}${queryParams ? '?' + queryParams : ''}`;
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.textContent = 'Sending...';

        const response = await fetch(url, { headers: { 'X-API-Key': apiKey } });
        const data = await response.json();
        window.lastResponse = data;
        document.getElementById('responseControls').style.display = 'flex';
        displayResponse(data, response.ok, endpoint);
        if (response.ok) showSuccess('Success!');
    } catch (error) {
        showError('test', error.message);
    } finally {
        document.getElementById('sendBtn').textContent = 'Send Request';
    }
}

function displayResponse(data, isSuccess, endpoint) {
    if (isSuccess) {
        displayAutoFormat(data, endpoint);
    } else {
        displayErrorResponse(data.message || 'Unknown error');
    }
    displayJsonFormat(data);
}

function displayAutoFormat(data, endpoint) {
    const autoDiv = document.getElementById('responseAuto');
    const tableDiv = document.getElementById('responseTable');
    let html = '';

    if (endpoint.includes('currencies')) {
        html = formatCurrencyResponse(data);
    } else if (endpoint.includes('indicators')) {
        html = formatIndicatorsResponse(data);
    } else {
        html = formatJsonDisplay(data);
    }
    autoDiv.innerHTML = html;
    if (tableDiv) tableDiv.innerHTML = html;
}

function formatIndicatorsResponse(data) {
    console.log('Data indikator diterima:', data);
    const indicators = Array.isArray(data) ? data : (data.data || []);

    if (indicators.length === 0) {
        return '<div class="no-data" style="padding: 20px; text-align: center; color: #64748b;">No indicator data found for this search.</div>';
    }

    let html = `
        <div style="overflow-x:auto; padding: 10px;">
            <table class="response-table modern" style="width: 100%; border-spacing: 0 15px;">
                <thead>
                    <tr style="font-size: 1.1rem;">
                        <th style="padding: 15px;">Indikator</th>
                        <th style="padding: 15px;">Nilai</th>
                        <th style="padding: 15px;">Tanggal</th>
                        <th style="padding: 15px; text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>`;

    indicators.forEach(ind => {
        html += `
            <tr style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-radius: 15px; background: white;">
                <td style="padding: 20px; border-radius: 15px 0 0 15px;">
                    <div style="font-weight: 700; color: #1e293b;">${ind.indicator_name || ind.name || 'N/A'}</div>
                    <div style="font-size: 0.85rem; color: #64748b;">${ind.country || ind.country_name || ''}</div>
                </td>
                <td style="padding: 20px;">
                    <strong style="color: #3b82f6; font-size: 1.4rem;">
                        ${formatNumber(ind.value || ind.latest_value)}<small style="font-size: 0.8rem; margin-left: 2px;">${ind.unit || '%'}</small>
                    </strong>
                </td>
                <td style="padding: 20px;">
                    <span style="color: #64748b; font-weight: 500;">${ind.date || '-'}</span>
                </td>
                <td style="padding: 20px; text-align: center; border-radius: 0 15px 15px 0;">
                    <span class="status-pill" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">
                        ● Aktif
                    </span>
                </td>
            </tr>`;
    });

    html += '</tbody></table></div>';
    return html;
}

function formatCurrencyResponse(data) {
    let rates = [];
    if (data.rate && data.target) {
        rates.push({
            from: data.base || 'USD',
            to: data.target,
            rate: data.rate,
            date: data.timestamp || new Date().toISOString().split('T')[0]
        });
    } else if (data.historicalData) {
        const dates = Object.keys(data.historicalData);
        dates.forEach(date => {
            Object.entries(data.historicalData[date]).forEach(([currency, val]) => {
                rates.push({ from: data.base || 'USD', to: currency, rate: val, date: date });
            });
        });
    } else if (data.rates) {
        const source = Array.isArray(data.rates) ? data.rates : Object.entries(data.rates);
        source.forEach(item => {
            if (Array.isArray(item)) { 
                rates.push({ from: data.base || 'USD', to: item[0], rate: item[1], date: data.date });
            } else { 
                rates.push(item);
            }
        });
    }

    if (rates.length === 0) return formatJsonDisplay(data);

    let html = `
        <div style="overflow-x:auto; padding: 10px;">
            <table class="response-table modern" style="width: 100%; border-spacing: 0 15px;">
                <thead>
                    <tr style="font-size: 1.1rem;">
                        <th style="padding: 15px;">Mata Uang</th>
                        <th style="padding: 15px;">Nilai Tukar</th>
                        <th style="padding: 15px;">Tanggal</th>
                        <th style="padding: 15px; text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>`;

    rates.forEach(r => {
        html += `
            <tr style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-radius: 15px; background: white;">
                <td style="padding: 25px 20px; border-radius: 15px 0 0 15px;">
                    <span class="badge-base" style="font-size: 1.2rem; padding: 8px 16px;">${r.from || 'USD'}</span> 
                    <i class="fas fa-arrow-right" style="margin: 0 20px; color: #3b82f6; font-size: 1.4rem;"></i> 
                    <span class="badge-to" style="font-size: 1.2rem; padding: 8px 16px;">${r.to}</span>
                </td>
                <td style="padding: 25px 20px;">
                    <strong style="color: #2e7d32; font-size: 1.6rem;">${formatNumber(r.rate)}</strong>
                </td>
                <td style="padding: 25px 20px;">
                    <span style="color: #64748b;">${r.date || '-'}</span>
                </td>
                <td style="padding: 25px 20px; text-align: center; border-radius: 0 15px 15px 0;">
                    <span class="status-pill" style="background: #e8f5e9; color: #2e7d32; padding: 6px 15px; border-radius: 20px;">● Berhasil</span>
                </td>
            </tr>`;
    });
    html += '</tbody></table></div>';
    return html;
}

function formatJsonDisplay(data) {
    const json = JSON.stringify(data, null, 2);
    const highlighted = json
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                cls = (/:$/.test(match)) ? 'key' : 'string';
            } else if (/true|false/.test(match)) cls = 'boolean';
            else if (/null/.test(match)) cls = 'null';
            return `<span style="color: ${getHighlightColor(cls)}">${match}</span>`;
        });
    return `<pre class="json-pre" style="background: #1e293b; color: #f8fafc; padding: 1.5rem; border-radius: 12px; overflow: auto;">${highlighted}</pre>`;
}

function displayJsonFormat(data) {
    const el = document.getElementById('responseJson');
    if(el) el.innerHTML = formatJsonDisplay(data);
}

function displayErrorResponse(message) {
    const el = document.getElementById('responseAuto');
    if(el) el.innerHTML = `<div class="error-box" style="padding: 20px; background: #fef2f2; border: 1px solid #fee2e2; color: #b91c1c; border-radius: 12px;">❌ Error: ${message}</div>`;
}

function getHighlightColor(cls) {
    const colors = { 'key': '#9cdcfe', 'string': '#ce9178', 'number': '#b5cea8', 'boolean': '#569cd6', 'null': '#6a9955' };
    return colors[cls] || '#fff';
}

function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return parseFloat(num).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

function switchResponseView(view) {
    document.querySelectorAll('.view-toggle').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`[data-view="${view}"]`);
    if(targetBtn) targetBtn.classList.add('active');
    
    document.querySelectorAll('.response-content').forEach(el => el.classList.remove('active'));
    const targetEl = document.getElementById('response' + view.charAt(0).toUpperCase() + view.slice(1));
    if(targetEl) targetEl.classList.add('active');
}

function copyResponseToClipboard() {
    if (!window.lastResponse) return;
    navigator.clipboard.writeText(JSON.stringify(window.lastResponse, null, 2)).then(() => showSuccess('Copied!'));
}

function getSelectedApiKey() {
    const selector = document.getElementById('apiKeySelect');
    return selector ? selector.value : '';
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => errorEl.style.display = 'none', 5000);
    }
}

function showSuccess(message) {
    const successEl = document.getElementById('testSuccess');
    if (successEl) {
        successEl.textContent = '✓ ' + message;
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 5000);
    }
}

function handleLogout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = '/';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    const userInfo = document.getElementById('userInfo');
    if (user && userInfo) userInfo.textContent = `Welcome, ${user.username}!`;
    loadApiKeys();
});