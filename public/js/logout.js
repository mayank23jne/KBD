// /public/js/logout.js
class LogoutManager {
    static clearAllStorage() {
        // Clear ALL storage
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('✅ All storage cleared on logout');
    }

    static handleLogout() {
        // Clear storage immediately
        this.clearAllStorage();
        
        // Redirect to login
        window.location.href = '/logout';
    }
}

// Export for use
window.LogoutManager = LogoutManager;
