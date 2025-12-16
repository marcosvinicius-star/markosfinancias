// ======================================================
// STORAGE MANAGER
// ======================================================

const Storage = {
    
    getUsers() {
        const data = localStorage.getItem('financeflow_users');
        return data ? JSON.parse(data) : {};
    },
    
    saveUsers(users) {
        try {
            localStorage.setItem('financeflow_users', JSON.stringify(users));
        } catch (e) {
            console.error('Erro ao salvar usuários:', e);
        }
    },
    
    getCurrentUser() {
        return localStorage.getItem('financeflow_current_user') || null;
    },
    
    setCurrentUser(username) {
        localStorage.setItem('financeflow_current_user', username);
    },
    
    clearCurrentUser() {
        localStorage.removeItem('financeflow_current_user');
    },
    
    getUserData(username) {
        try {
            const users = this.getUsers();
            return users[username] || null;
        } catch (e) {
            console.error('Erro ao obter dados do usuário:', e);
            return null;
        }
    },
    
    saveUserData(username, userData) {
        try {
            const users = this.getUsers();
            users[username] = userData;
            this.saveUsers(users);
        } catch (e) {
            console.error('Erro ao salvar dados do usuário:', e);
        }
    }
};
