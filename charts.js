// ======================================================
// CHARTS MANAGER
// ======================================================

const Charts = {
    
    update(month) {
        const transactions = Transactions.list({ month });
        
        // Gráfico Gastos vs Receitas
        this.updateGastosChart(transactions);
        
        // Gráfico por Categoria
        this.updateCategoriasChart(transactions);
        
        // Gráfico de Evolução
        this.updateEvolucaoChart();
    },
    
    updateGastosChart(transactions) {
        const gastos = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0);
        const receitas = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
        
        const ctx = document.getElementById('chart-gastos');
        if (!ctx) return;
        
        // Destruir gráfico anterior se existir
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Gastos', 'Receitas'],
                datasets: [{
                    label: 'Valor (R$)',
                    data: [gastos, receitas],
                    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                    borderColor: ['#ef4444', '#10b981'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                }
            }
        });
    },
    
    updateCategoriasChart(transactions) {
        const gastos = transactions.filter(t => t.type === 'gasto');
        const categorias = {};
        
        gastos.forEach(t => {
            categorias[t.category] = (categorias[t.category] || 0) + t.amount;
        });
        
        const labels = Object.keys(categorias);
        const data = Object.values(categorias);
        
        const ctx = document.getElementById('chart-categorias');
        if (!ctx) return;
        
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        if (labels.length === 0) {
            ctx.chart = null;
            return;
        }
        
        ctx.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
                        '#10b981', '#3b82f6', '#06b6d4', '#eab308'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },
    
    updateEvolucaoChart() {
        const months = [];
        const gastos = [];
        const receitas = [];
        
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().slice(0, 7);
            const summary = Reports.monthSummary(month);
            
            months.push(date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
            gastos.push(summary.gastos);
            receitas.push(summary.receitas);
        }
        
        const ctx = document.getElementById('chart-evolucao');
        if (!ctx) return;
        
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Gastos',
                        data: gastos,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Receitas',
                        data: receitas,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                }
            }
        });
    }
};
