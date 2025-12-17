// ======================================================
// RECURRENCES MANAGER
// ======================================================

const Recurrences = {
    
    list() {
        const user = Auth.current();
        return user ? (user.recurrences || []) : [];
    },
    
    add(data) {
        const user = Auth.current();
        if (!user) return { success: false, message: 'Usuário não autenticado' };
        
        if (!user.recurrences) user.recurrences = [];
        
        const recurrence = {
            id: Date.now().toString(36),
            description: data.description,
            type: data.type,
            category: data.category,
            amount: parseFloat(data.amount),
            frequency: data.frequency || 'monthly',
            day: data.day || 1,
            active: true,
            nextExecution: this.calculateNextExecution(data.frequency || 'monthly', data.day || 1),
            created: new Date().toISOString()
        };
        
        user.recurrences.push(recurrence);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return { success: true };
    },
    
    remove(id) {
        const user = Auth.current();
        if (!user || !user.recurrences) return false;
        
        user.recurrences = user.recurrences.filter(r => r.id !== id);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return true;
    },
    
    toggle(id) {
        const user = Auth.current();
        if (!user || !user.recurrences) return false;
        
        const recurrence = user.recurrences.find(r => r.id === id);
        if (recurrence) {
            recurrence.active = !recurrence.active;
            Storage.saveUserData(Storage.getCurrentUser(), user);
            return true;
        }
        return false;
    },
    
    calculateNextExecution(frequency, day) {
        const today = new Date();
        const next = new Date();
        
        switch(frequency) {
            case 'daily':
                next.setDate(today.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(today.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(today.getMonth() + 1);
                next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
                break;
            case 'yearly':
                next.setFullYear(today.getFullYear() + 1);
                break;
        }
        
        return next.toISOString().slice(0, 10);
    },
    
    checkAndExecute() {
        const user = Auth.current();
        if (!user || !user.recurrences) return;
        
        const today = new Date().toISOString().slice(0, 10);
        const activeRecurrences = user.recurrences.filter(r => r.active && r.nextExecution <= today);
        
        activeRecurrences.forEach(rec => {
            Transactions.add({
                description: rec.description,
                type: rec.type,
                category: rec.category,
                amount: rec.amount,
                date: today,
                notes: 'Transação recorrente automática'
            });
            
            rec.nextExecution = this.calculateNextExecution(rec.frequency, rec.day);
        });
        
        if (activeRecurrences.length > 0) {
            Storage.saveUserData(Storage.getCurrentUser(), user);
        }
    }
};

