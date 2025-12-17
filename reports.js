// ======================================================
// REPORTS MANAGER
// ======================================================

const Reports = {
    
    monthSummary(month) {
        const transactions = Transactions.list({ month });
        
        const gastos = transactions
            .filter(t => t.type === 'gasto')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const receitas = transactions
            .filter(t => t.type === 'receita')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            gastos,
            receitas,
            saldo: receitas - gastos
        };
    }
};


