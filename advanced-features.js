// ======================================================
// ADVANCED FEATURES MANAGER
// ======================================================

const AdvancedFeatures = {
    
    getCategoryGoals() {
        const user = Auth.current();
        return user ? (user.categoryGoals || []) : [];
    },
    
    addCategoryGoal(category, target) {
        const user = Auth.current();
        if (!user) return { success: false, message: 'Usuário não autenticado' };
        
        if (!user.categoryGoals) user.categoryGoals = [];
        
        // Verificar se já existe meta para esta categoria
        if (user.categoryGoals.some(g => g.category === category)) {
            return { success: false, message: 'Já existe uma meta para esta categoria' };
        }
        
        const goal = {
            id: Date.now().toString(36),
            category: category,
            target: parseFloat(target),
            created: new Date().toISOString()
        };
        
        user.categoryGoals.push(goal);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return { success: true };
    },
    
    updateCategoryGoalProgress() {
        // Atualizar progresso das metas por categoria
        // Implementação adicional pode ser feita aqui
    },
    
    analyzePatterns() {
        const transactions = Transactions.list();
        const patterns = [];
        
        // Análise básica de padrões
        const gastosPorCategoria = {};
        transactions.filter(t => t.type === 'gasto').forEach(t => {
            gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + t.amount;
        });
        
        const categoriaMaiorGasto = Object.entries(gastosPorCategoria)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (categoriaMaiorGasto) {
            patterns.push({
                icon: '📊',
                title: 'Maior gasto',
                description: `${categoriaMaiorGasto[0]}: ${categoriaMaiorGasto[1].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            });
        }
        
        return { patterns };
    },
    
    generateComparativeReport(month1, month2) {
        const summary1 = Reports.monthSummary(month1);
        const summary2 = Reports.monthSummary(month2);
        
        const date1 = new Date(month1 + '-01');
        const date2 = new Date(month2 + '-01');
        
        return {
            month1: {
                name: date1.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                summary: summary1
            },
            month2: {
                name: date2.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                summary: summary2
            },
            differences: {
                gastos: {
                    value: summary2.gastos - summary1.gastos,
                    percent: summary1.gastos > 0 ? ((summary2.gastos - summary1.gastos) / summary1.gastos * 100).toFixed(1) : 0
                },
                receitas: {
                    value: summary2.receitas - summary1.receitas,
                    percent: summary1.receitas > 0 ? ((summary2.receitas - summary1.receitas) / summary1.receitas * 100).toFixed(1) : 0
                },
                saldo: summary2.saldo - summary1.saldo
            }
        };
    },
    
    enableEconomyMode() {
        const user = Auth.current();
        if (!user) return;
        
        if (!user.settings) user.settings = {};
        user.settings.economyMode = true;
        user.settings.economyModeEnabledAt = new Date().toISOString();
        Storage.saveUserData(Storage.getCurrentUser(), user);
        
        if (typeof UI !== 'undefined') {
            UI.showToast('success', 'Modo economia ativado!');
        }
    },
    
    disableEconomyMode() {
        const user = Auth.current();
        if (!user) return;
        
        if (!user.settings) user.settings = {};
        user.settings.economyMode = false;
        Storage.saveUserData(Storage.getCurrentUser(), user);
        
        if (typeof UI !== 'undefined') {
            UI.showToast('info', 'Modo economia desativado');
        }
    },
    
    checkEconomyMode() {
        const user = Auth.current();
        if (!user || !user.settings?.economyMode) return;
        
        const month = new Date().toISOString().slice(0, 7);
        const summary = Reports.monthSummary(month);
        const budget = Budget.getMonthly();
        
        if (budget > 0 && summary.gastos > budget * 0.8) {
            if (typeof UI !== 'undefined') {
                UI.showToast('warning', '⚠️ Atenção: Você está próximo do limite do orçamento!');
            }
        }
    },
    
    setupAutoBackup(intervalDays) {
        const user = Auth.current();
        if (!user) return;
        
        if (!user.settings) user.settings = {};
        user.settings.autoBackup = true;
        user.settings.autoBackupInterval = intervalDays;
        Storage.saveUserData(Storage.getCurrentUser(), user);
        
        if (typeof UI !== 'undefined') {
            UI.showToast('success', `Backup automático configurado para a cada ${intervalDays} dias`);
        }
    },
    
    checkAutoBackup() {
        const user = Auth.current();
        if (!user || !user.settings?.autoBackup) return;
        
        const lastBackup = user.settings.lastBackup ? new Date(user.settings.lastBackup) : null;
        const interval = user.settings.autoBackupInterval || 7;
        const now = new Date();
        
        if (!lastBackup || (now - lastBackup) / (1000 * 60 * 60 * 24) >= interval) {
            // Fazer backup
            if (typeof UI !== 'undefined') {
                UI.backupData();
            }
            
            if (!user.settings) user.settings = {};
            user.settings.lastBackup = now.toISOString();
            Storage.saveUserData(Storage.getCurrentUser(), user);
        }
    },
    
    exportToExcel() {
        // Implementação básica de exportação
        const transactions = Transactions.list();
        if (transactions.length === 0) {
            if (typeof UI !== 'undefined') {
                UI.showToast('error', 'Nenhuma transação para exportar');
            }
            return;
        }
        
        // Usar exportação CSV como fallback
        if (typeof UI !== 'undefined') {
            UI.exportCSV();
        }
    }
};
