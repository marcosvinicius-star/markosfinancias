// ======================================================
// API MANAGER (Placeholder - usa localStorage por padrão)
// ======================================================

const API = {
    token: null,
    
    setToken(token) {
        this.token = token;
    },
    
    getToken() {
        return this.token || localStorage.getItem('api_token');
    },
    
    async login(username, password) {
        // Implementação da API - por enquanto retorna erro para usar localStorage
        throw new Error('API não disponível');
    },
    
    async verify() {
        // Implementação da API
        throw new Error('API não disponível');
    }
};
