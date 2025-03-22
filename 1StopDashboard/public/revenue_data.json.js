// Security guard for JSON data
// This file detects and blocks unauthorized access attempts

(function() {
  // Check if this file is being accessed directly
  if (document.referrer === '' || 
      !document.referrer.includes(window.location.hostname)) {
    
    // Direct access detected, redirect to the main page
    window.location.href = './index.html';
    
    // For extra security, clear the page content
    document.documentElement.innerHTML = 
      '<html><head><title>Access Denied</title></head>' +
      '<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">' +
      '<h1>Access Denied</h1>' +
      '<p>Direct access to data files is not permitted.</p>' +
      '<p><a href="./index.html">Return to Dashboard</a></p>' +
      '</body></html>';
  }
})();