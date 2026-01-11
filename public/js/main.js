const endpoints = {
    'latest-rates': '/api/currencies/latest?from=IDR&to=USD',
    'historical-rates': '/api/currencies/history?from=IDR&to=USD&days=30',
    'supported-currencies': '/api/currencies/supported',
    'latest-indicators': '/api/indicators/latest?country=ID',
    'search-indicators': '/api/indicators/search?country=ID&type=inflation',
    'supported-countries': '/api/indicators/countries'
};

const defaultParams = {
    'latest-rates': '?from=IDR&to=USD',
    'historical-rates': '?from=IDR&to=USD&days=30',
    'latest-indicators': '?country=ID',
    'search-indicators': '?country=ID&type=inflation'
};

function updateEndpoint() {
    const select = document.getElementById('endpointSelect');
    const paramsInput = document.getElementById('paramsInput');
    
    if (select.value && defaultParams[select.value]) {
        paramsInput.value = defaultParams[select.value];
    }
}

function sendRequest() {
    const select = document.getElementById('endpointSelect');
    const paramsInput = document.getElementById('paramsInput');
    const responseOutput = document.getElementById('responseOutput');
    
    if (!select.value) {
        responseOutput.textContent = 'Please select an endpoint first';
        return;
    }
    
    let url = endpoints[select.value];
    
    // Replace default params if custom params provided
    if (paramsInput.value) {
        const basePath = url.split('?')[0];
        url = basePath + paramsInput.value;
    }
    
    responseOutput.textContent = 'Loading...';
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            responseOutput.textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
            responseOutput.textContent = `Error: ${err.message}`;
        });
}

function loadDocs() {
    const docsContent = document.getElementById('docs-content');
    docsContent.textContent = 'Loading documentation...';
    
    fetch('/docs')
        .then(res => res.json())
        .then(data => {
            docsContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        })
        .catch(err => {
            docsContent.textContent = `Error loading docs: ${err.message}`;
        });
}

function scrollTo(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Load docs on page load
document.addEventListener('DOMContentLoaded', loadDocs);
