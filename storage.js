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
        // Prioriza sessão (não persistente), depois persistente
        return (
            sessionStorage.getItem('financeflow_current_user') ||
            localStorage.getItem('financeflow_current_user') ||
            null
        );
    },
    
    setCurrentUser(username, persist = true) {
        // persist=true  -> localStorage (manter conectado)
        // persist=false -> sessionStorage (expira ao fechar aba/navegador)
        if (persist) {
            sessionStorage.removeItem('financeflow_current_user');
            localStorage.setItem('financeflow_current_user', username);
        } else {
            localStorage.removeItem('financeflow_current_user');
            sessionStorage.setItem('financeflow_current_user', username);
        }
    },
    
    clearCurrentUser() {
        localStorage.removeItem('financeflow_current_user');
        sessionStorage.removeItem('financeflow_current_user');
    },

    getLastUsername() {
        return localStorage.getItem('financeflow_last_username') || '';
    },

    setLastUsername(username) {
        localStorage.setItem('financeflow_last_username', username);
    },

    clearLastUsername() {
        localStorage.removeItem('financeflow_last_username');
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


