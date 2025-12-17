// ======================================================
// ACCOUNTS MANAGER
// ======================================================

const Accounts = {
    
    list() {
        const user = Auth.current();
        return user ? (user.accounts || [{ id: 'default', name: 'Conta Principal', balance: 0, type: 'checking', color: '#3b82f6' }]) : [];
    },
    
    add(data) {
        const user = Auth.current();
        if (!user) return { success: false, message: 'Usuário não autenticado' };
        
        if (!user.accounts) user.accounts = [{ id: 'default', name: 'Conta Principal', balance: 0, type: 'checking', color: '#3b82f6' }];
        
        const account = {
            id: Date.now().toString(36),
            name: data.name,
            type: data.type,
            balance: parseFloat(data.balance) || 0,
            color: data.color || '#3b82f6',
            created: new Date().toISOString()
        };
        
        user.accounts.push(account);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return { success: true };
    },
    
    remove(id) {
        const user = Auth.current();
        if (!user || !user.accounts) return false;
        
        if (id === 'default') return false; // Não pode remover conta padrão
        
        user.accounts = user.accounts.filter(a => a.id !== id);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return true;
    },
    
    getBalance(id) {
        const user = Auth.current();
        if (!user || !user.accounts) return 0;
        
        const account = user.accounts.find(a => a.id === id);
        if (!account) return 0;
        
        let balance = account.balance || 0;
        
        // Calcular saldo baseado em transações
        const transactions = Transactions.list();
        transactions.forEach(t => {
            if (t.type === 'receita') {
                balance += t.amount;
            } else {
                balance -= t.amount;
            }
        });
        
        return balance;
    }
};


