console.time('components.js loaded');

function loadComponent(elementId, componentPath) {
    console.time('fetch ' + componentPath);
    fetch(componentPath)
        .then(response => {
            console.timeEnd('fetch ' + componentPath);
            console.log(componentPath + ' status:', response.status);
            return response.text();
        })
        .then(data => {
            console.time('inject ' + elementId);
            document.getElementById(elementId).innerHTML = data;
            console.timeEnd('inject ' + elementId);
        })
        .catch(error => console.error('Error loading component:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired at:', performance.now().toFixed(0) + 'ms');
    loadComponent('header-component', '/components/header.html');
    loadComponent('footer-component', '/components/footer.html');
});

console.timeEnd('components.js loaded');
