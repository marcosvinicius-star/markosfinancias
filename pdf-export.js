// ======================================================
// PDF EXPORT MANAGER
// ======================================================

const PDFExport = {
    
    generateReport(data, month, filters) {
        // Criar HTML para impressão
        const printWindow = window.open('', '_blank');
        const monthName = new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório FinanceFlow - ${monthName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .summary { display: flex; gap: 20px; margin: 20px 0; }
                    .summary-item { flex: 1; padding: 15px; background: #f9fafb; border-radius: 8px; }
                </style>
            </head>
            <body>
                <h1>Relatório FinanceFlow</h1>
                <h2>${monthName}</h2>
                
                <div class="summary">
                    <div class="summary-item">
                        <strong>Gastos:</strong> R$ ${data.summary.gastos.toFixed(2).replace('.', ',')}
                    </div>
                    <div class="summary-item">
                        <strong>Receitas:</strong> R$ ${data.summary.receitas.toFixed(2).replace('.', ',')}
                    </div>
                    <div class="summary-item">
                        <strong>Saldo:</strong> R$ ${data.summary.saldo.toFixed(2).replace('.', ',')}
                    </div>
                </div>
                
                <h3>Transações</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.transactions.map(t => `
                            <tr>
                                <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td>${t.type === 'gasto' ? 'Gasto' : 'Receita'}</td>
                                <td>${t.category}</td>
                                <td>${t.description}</td>
                                <td>R$ ${t.amount.toFixed(2).replace('.', ',')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
};
