// ======================================================
// AUTH MANAGER
// ======================================================

const Auth = {
    useAPI: false, // Começar com localStorage, tentar API se disponível
    _user: null,
    _provider: 'local', // 'local' | 'firebase'

    _defaultUserData(username, email = '') {
        return {
            profile: {
                name: username,
                email: email || "",
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
    },

    _toEmail(usernameOrEmail) {
        const v = String(usernameOrEmail || '').trim();
        if (v.includes('@')) return v;
        // Email “fake” só para autenticação Firebase; você pode trocar por email real se quiser.
        return `${v}@financeflow.local`;
    },

    async bootstrap() {
        // Tenta restaurar sessão Firebase; se não configurado, usa localStorage.
        this._user = null;
        this._provider = 'local';

        if (window.FirebaseClient && FirebaseClient.isConfigured() && FirebaseClient.init()) {
            const auth = FirebaseClient.auth();
            const db = FirebaseClient.db();
            if (!auth || !db) return null;

            this._provider = 'firebase';

            // Espera o estado de autenticação carregar
            const fbUser = await new Promise((resolve) => {
                const unsub = auth.onAuthStateChanged((u) => {
                    try { unsub(); } catch (e) {}
                    resolve(u || null);
                });
                setTimeout(() => resolve(auth.currentUser || null), 2000);
            });

            if (!fbUser) return null;

            const uid = fbUser.uid;
            const docRef = db.collection('users').doc(uid);
            const snap = await docRef.get();
            let data;
            if (!snap.exists) {
                const username = (fbUser.email || 'usuario').split('@')[0];
                data = this._defaultUserData(username, fbUser.email || '');
                await docRef.set(data, { merge: true });
            } else {
                data = snap.data();
            }

            // Cache local para o app continuar funcionando igual
            Storage.saveUserData(uid, data);
            Storage.setCurrentUser(uid, true);
            this._user = data;
            return data;
        }

        // LocalStorage
        const username = Storage.getCurrentUser();
        if (username) {
            const userData = Storage.getUserData(username);
            if (userData) {
                this._user = userData;
                return userData;
            }
        }
        return null;
    },

    async register(username, password) {
        // Firebase
        if (window.FirebaseClient && FirebaseClient.isConfigured() && FirebaseClient.init()) {
            const auth = FirebaseClient.auth();
            const db = FirebaseClient.db();
            if (!auth || !db) return { success: false, message: "Firebase não disponível" };

            const email = this._toEmail(username);
            try {
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                const uid = cred.user.uid;
                const data = this._defaultUserData(username, email);
                await db.collection('users').doc(uid).set(data, { merge: true });

                Storage.saveUserData(uid, data);
                Storage.setCurrentUser(uid, true);
                this._user = data;
                this._provider = 'firebase';
                return { success: true };
            } catch (e) {
                const msg = e?.message || 'Erro ao registrar no Firebase';
                return { success: false, message: msg };
            }
        }

        // Usar localStorage diretamente
        const users = Storage.getUsers();

        if (users[username]) {
            return { success: false, message: "Usuário já existe" };
        }

        users[username] = { password, ...this._defaultUserData(username, "") };

        Storage.saveUsers(users);
        return { success: true };
    },

    async login(username, password, options = {}) {
        // Firebase
        if (window.FirebaseClient && FirebaseClient.isConfigured() && FirebaseClient.init()) {
            const auth = FirebaseClient.auth();
            const db = FirebaseClient.db();
            if (!auth || !db) return { success: false, message: "Firebase não disponível" };

            const email = this._toEmail(username);
            try {
                const cred = await auth.signInWithEmailAndPassword(email, password);
                const uid = cred.user.uid;
                const docRef = db.collection('users').doc(uid);
                const snap = await docRef.get();
                let data = snap.exists ? snap.data() : this._defaultUserData(username, email);
                // Atualiza lastLogin
                data.profile = data.profile || {};
                data.profile.lastLogin = new Date().toISOString();
                data.profile.email = data.profile.email || email;
                await docRef.set(data, { merge: true });

                Storage.saveUserData(uid, data);
                Storage.setCurrentUser(uid, options.persist !== false);
                this._user = data;
                this._provider = 'firebase';
                return { success: true, user: data };
            } catch (e) {
                const msg = e?.message || 'Erro ao entrar no Firebase';
                return { success: false, message: msg };
            }
        }

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
        this._user = users[username];
        this._provider = 'local';

        return { success: true, user: users[username] };
    },

    async sendPasswordReset(usernameOrEmail) {
        // Firebase: envio de e-mail de redefinição
        if (window.FirebaseClient && FirebaseClient.isConfigured() && FirebaseClient.init()) {
            const auth = FirebaseClient.auth();
            if (!auth) return { success: false, message: "Firebase não disponível" };
            const email = this._toEmail(usernameOrEmail);
            try {
                await auth.sendPasswordResetEmail(email);
                return { success: true };
            } catch (e) {
                return { success: false, message: e?.message || 'Não foi possível enviar o e-mail' };
            }
        }
        return { success: false, message: "Redefinição por e-mail disponível apenas com Firebase" };
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

    async logout() {
        // Firebase signOut
        if (window.FirebaseClient && FirebaseClient.isConfigured() && FirebaseClient.init()) {
            const auth = FirebaseClient.auth();
            try { await auth.signOut(); } catch (e) {}
        }
        Storage.clearCurrentUser();
        localStorage.removeItem('current_user_data');
        this._user = null;
    },

    current() {
        // Mantém compatibilidade: o app inteiro usa Auth.current() síncrono
        if (this._user) return this._user;
        const id = Storage.getCurrentUser();
        if (!id) return null;
        const data = Storage.getUserData(id);
        this._user = data || null;
        return this._user;
    }
};
