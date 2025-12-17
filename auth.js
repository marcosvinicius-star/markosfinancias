// ======================================================
// AUTH MANAGER
// ======================================================

const Auth = {
    useAPI: false, // Começar com localStorage, tentar API se disponível

    register(username, password) {
        // Usar localStorage diretamente
        const users = Storage.getUsers();

        if (users[username]) {
            return { success: false, message: "Usuário já existe" };
        }

        users[username] = {
            password,
            profile: {
                name: username,
                email: "",
                created: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            },
            transactions: [],
            categories: {
                gastos: ["Alimentação", "Transporte", "Moradia", "Saúde"],
                receitas: ["Salário", "Freelance", "Investimentos"]
            },
            goals: [],
            budgets: [],
            notifications: [],
            recurrences: [],
            tags: [],
            accounts: [{ id: 'default', name: 'Conta Principal', balance: 0, type: 'checking', color: '#3b82f6' }],
            alerts: [],
            savedFilters: [],
            settings: {
                currency: "BRL",
                theme: "light",
                dateFormat: "DD/MM/YYYY",
                language: "pt-BR",
                monthlyBudget: 2000,
                savingsGoal: 500
            }
        };

        Storage.saveUsers(users);
        return { success: true };
    },

    login(username, password, options = {}) {
        // Usar localStorage diretamente
        const users = Storage.getUsers();

        if (!users[username]) {
            return { success: false, message: "Usuário não existe" };
        }

        if (users[username].password !== password) {
            return { success: false, message: "Senha incorreta" };
        }

        users[username].profile.lastLogin = new Date().toISOString();
        Storage.saveUsers(users);
        Storage.setCurrentUser(username, options.persist !== false);

        return { success: true, user: users[username] };
    },

    resetPassword(username, newPassword) {
        const users = Storage.getUsers();
        if (!users[username]) {
            return { success: false, message: "Usuário não existe" };
        }
        if (!newPassword || String(newPassword).trim().length < 4) {
            return { success: false, message: "Senha deve ter pelo menos 4 caracteres" };
        }
        users[username].password = String(newPassword).trim();
        Storage.saveUsers(users);
        return { success: true };
    },

    logout() {
        if (window.API && this.useAPI) {
            try {
                API.setToken(null);
            } catch (e) {
                // Ignorar erro se API não disponível
            }
        }
        Storage.clearCurrentUser();
        localStorage.removeItem('current_user_data');
    },

    current() {
        // Tentar usar API primeiro (se disponível e configurada)
        if (window.API && this.useAPI && API.getToken()) {
            // Se API estiver disponível, pode retornar dados da API
            // Por enquanto, sempre usar localStorage
        }

        // Usar localStorage
        const username = Storage.getCurrentUser();
        if (username) {
            const userData = Storage.getUserData(username);
            if (userData) {
                return userData;
            }
        }

        return null;
    }
};
