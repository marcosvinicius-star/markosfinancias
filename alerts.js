// ======================================================
// ALERTS MANAGER
// ======================================================

const Alerts = {
    
    list() {
        const user = Auth.current();
        return user ? (user.alerts || []) : [];
    },
    
    add(data) {
        const user = Auth.current();
        if (!user) return { success: false, message: 'Usuário não autenticado' };
        
        if (!user.alerts) user.alerts = [];
        
        const alert = {
            id: Date.now().toString(36),
            title: data.title,
            message: data.message || '',
            condition: data.condition,
            threshold: parseFloat(data.threshold) || 0,
            active: true,
            created: new Date().toISOString()
        };
        
        user.alerts.push(alert);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return { success: true };
    },
    
    remove(id) {
        const user = Auth.current();
        if (!user || !user.alerts) return false;
        
        user.alerts = user.alerts.filter(a => a.id !== id);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return true;
    },
    
    toggle(id) {
        const user = Auth.current();
        if (!user || !user.alerts) return false;
        
        const alert = user.alerts.find(a => a.id === id);
        if (alert) {
            alert.active = !alert.active;
            Storage.saveUserData(Storage.getCurrentUser(), user);
            return true;
        }
        return false;
    },
    
    checkAlerts() {
        const user = Auth.current();
        if (!user || !user.alerts) return [];
        
        const triggeredAlerts = [];
        const activeAlerts = user.alerts.filter(a => a.active);
        const month = new Date().toISOString().slice(0, 7);
        const summary = Reports.monthSummary(month);
        
        activeAlerts.forEach(alert => {
            let triggered = false;
            
            switch(alert.condition) {
                case 'budget_exceeded':
                    const budget = Budget.getMonthly();
                    triggered = summary.gastos > budget;
                    break;
                case 'low_balance':
                    triggered = summary.saldo < alert.threshold;
                    break;
                case 'high_expense':
                    triggered = summary.gastos > alert.threshold;
                    break;
            }
            
            if (triggered) {
                triggeredAlerts.push(alert);
            }
        });
        
        return triggeredAlerts;
    }
};


