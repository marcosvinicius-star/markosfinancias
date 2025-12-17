// ======================================================
// INSIGHTS MANAGER
// ======================================================

const Insights = {
    
    render() {
        const container = document.getElementById('insights-container');
        const list = document.getElementById('insights-list');
        
        if (!container || !list) return;
        
        const insights = this.generateInsights();
        
        if (insights.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        list.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-description">${insight.description}</div>
                </div>
            </div>
        `).join('');
    },
    
    generateInsights() {
        const insights = [];
        const month = new Date().toISOString().slice(0, 7);
        const summary = Reports.monthSummary(month);
        const budget = Budget.getMonthly();
        
        // Insight sobre orçamento
        if (budget > 0) {
            const percent = (summary.gastos / budget * 100);
            if (percent > 80) {
                insights.push({
                    icon: '⚠️',
                    title: 'Orçamento próximo do limite',
                    description: `Você já utilizou ${percent.toFixed(1)}% do seu orçamento mensal`
                });
            }
        }
        
        // Insight sobre saldo
        if (summary.saldo < 0) {
            insights.push({
                icon: '🔴',
                title: 'Saldo negativo',
                description: `Seu saldo está negativo em ${Math.abs(summary.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            });
        }
        
        return insights;
    }
};

