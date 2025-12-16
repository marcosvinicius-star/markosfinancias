// ======================================================
// UI MANAGER
// ======================================================

const UI = {

    loadUser() {
        const user = Auth.current();
        if (!user) {
            console.error('Usuário não encontrado');
            return;
        }

        const userNameEl = document.getElementById("usuario-logado");
        const userInitialEl = document.getElementById("usuario-inicial");
        
        if (userNameEl) {
            userNameEl.textContent = user.profile.name;
            userNameEl.setAttribute("aria-label", `Usuário: ${user.profile.name}`);
        }
        if (userInitialEl) {
            userInitialEl.textContent = user.profile.name.charAt(0).toUpperCase();
            userInitialEl.setAttribute("aria-label", `Inicial de ${user.profile.name}`);
        }

        // Aplicar tema salvo
        const savedTheme = user.settings?.theme || 'light';
        this.applyTheme(savedTheme);
        
        // Aplicar personalizações
        if (user.settings) {
            this.applyCustomTheme(user.settings);
        }

        this.updateCategories();
        this.updateDashboard();
        this.loadNavigation();
        
        // Inicializar funcionalidades após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            this.initMobileMenu();
            this.initKeyboardShortcuts();
            this.initGlobalSearch();
            this.initThemeToggle();
            
            // Inicializar onboarding se necessário
            if (typeof Onboarding !== 'undefined') {
                Onboarding.init();
            }
        }, 100);
    },

    updateCategories() {
        const user = Auth.current();
        if (!user || !user.categories) return;
        
        const select = document.getElementById("category");
        if (!select) return;

        select.innerHTML = `<option value="">Selecione...</option>`;

        const gastos = user.categories.gastos || [];
        const receitas = user.categories.receitas || [];
        
        [...gastos, ...receitas].forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            select.appendChild(opt);
        });
    },

    updateDashboard() {
        const month = new Date().toISOString().slice(0, 7);
        const summary = Reports.monthSummary(month);
        const prevMonth = this.getPreviousMonth(month);
        const prevSummary = Reports.monthSummary(prevMonth);

        // Atualizar valores
        document.getElementById("gastos-mes").textContent = this.format(summary.gastos);
        document.getElementById("receitas-mes").textContent = this.format(summary.receitas);
        document.getElementById("saldo-mes").textContent = this.format(summary.saldo);

        // Atualizar card de saldo
        const saldoCard = document.getElementById("saldo-card");
        if (saldoCard) {
            saldoCard.className = "stat-card";
            if (summary.saldo >= 0) {
                saldoCard.classList.add("success");
            } else {
                saldoCard.classList.add("danger");
            }
        }

        // Tendências
        const gastosDiff = summary.gastos - prevSummary.gastos;
        const receitasDiff = summary.receitas - prevSummary.receitas;
        const gastosPercent = prevSummary.gastos > 0 ? ((gastosDiff / prevSummary.gastos) * 100).toFixed(1) : 0;
        const receitasPercent = prevSummary.receitas > 0 ? ((receitasDiff / prevSummary.receitas) * 100).toFixed(1) : 0;

        const gastosTrend = document.getElementById("gastos-trend");
        const receitasTrend = document.getElementById("receitas-trend");
        const saldoInfo = document.getElementById("saldo-info");

        if (gastosTrend) {
            gastosTrend.innerHTML = 
                gastosDiff >= 0 ? 
                `<span style="color: #ef4444;">↗ +${this.format(Math.abs(gastosDiff))} (${Math.abs(gastosPercent)}%)</span>` :
                `<span style="color: var(--success-blue);">↙ -${this.format(Math.abs(gastosDiff))} (${Math.abs(gastosPercent)}%)</span>`;
        }

        if (receitasTrend) {
            receitasTrend.innerHTML = 
                receitasDiff >= 0 ? 
                `<span style="color: var(--success-blue);">↗ +${this.format(Math.abs(receitasDiff))} (${Math.abs(receitasPercent)}%)</span>` :
                `<span style="color: #ef4444;">↙ -${this.format(Math.abs(receitasDiff))} (${Math.abs(receitasPercent)}%)</span>`;
        }

        // Info do saldo
        if (saldoInfo) {
            const budget = Budget.getMonthly();
            const percent = budget > 0 ? (summary.gastos / budget * 100).toFixed(1) : 0;
            saldoInfo.innerHTML = 
                budget > 0 ? `${percent}% do orçamento utilizado` : 'Configure um orçamento';
        }

        // Estatísticas adicionais
        const transactions = Transactions.list({ month });
        const totalTransacoes = transactions.length;
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();
        const mediaDiaria = currentDay > 0 ? (summary.gastos / currentDay) : 0;
        
        // Estatísticas avançadas
        const gastosCount = transactions.filter(t => t.type === 'gasto').length;
        const receitasCount = transactions.filter(t => t.type === 'receita').length;
        const maiorGasto = transactions.filter(t => t.type === 'gasto')
            .sort((a, b) => b.amount - a.amount)[0];
        const maiorReceita = transactions.filter(t => t.type === 'receita')
            .sort((a, b) => b.amount - a.amount)[0];
        const projecaoMensal = currentDay > 0 ? (summary.gastos / currentDay) * daysInMonth : 0;

        const totalTransacoesEl = document.getElementById("total-transacoes");
        const mediaDiariaEl = document.getElementById("media-diaria");
        
        if (totalTransacoesEl) {
            totalTransacoesEl.textContent = totalTransacoes;
        }
        if (mediaDiariaEl) {
            mediaDiariaEl.textContent = this.format(mediaDiaria);
        }
        
        // Atualizar card de estatísticas com mais informações
        const statsContent = document.getElementById("stats-content");
        if (statsContent) {
            statsContent.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <span style="font-size: 13px;">Total de transações:</span>
                        <strong style="font-family: 'JetBrains Mono', monospace;">${totalTransacoes}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <span style="font-size: 13px;">Média diária:</span>
                        <strong style="font-family: 'JetBrains Mono', monospace;">${this.format(mediaDiaria)}</strong>
                    </div>
                    ${maiorGasto ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); border-left: 3px solid var(--error);">
                            <span style="font-size: 13px;">Maior gasto:</span>
                            <strong style="font-family: 'JetBrains Mono', monospace; color: var(--error);">${this.format(maiorGasto.amount)}</strong>
                        </div>
                    ` : ''}
                    ${maiorReceita ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); border-left: 3px solid var(--success);">
                            <span style="font-size: 13px;">Maior receita:</span>
                            <strong style="font-family: 'JetBrains Mono', monospace; color: var(--success);">${this.format(maiorReceita.amount)}</strong>
                        </div>
                    ` : ''}
                    ${currentDay > 5 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <span style="font-size: 13px;">Projeção mensal:</span>
                            <strong style="font-family: 'JetBrains Mono', monospace; color: ${projecaoMensal > (Budget.getMonthly() || 0) ? 'var(--error)' : 'var(--text-primary)'};">${this.format(projecaoMensal)}</strong>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Gráficos
        Charts.update(month);

        // Últimas transações
        this.loadDashboardTransacoes();
        
        // Insights automáticos
        if (typeof Insights !== 'undefined') {
            Insights.render();
        }
        
        // Análise de padrões
        if (typeof AdvancedFeatures !== 'undefined') {
            this.renderPatterns();
        }
        
        // Atualizar progresso de metas por categoria
        if (typeof AdvancedFeatures !== 'undefined') {
            AdvancedFeatures.updateCategoryGoalProgress();
        }
    },

    renderPatterns() {
        const container = document.getElementById('insights-container');
        if (!container) return;
        
        const analysis = AdvancedFeatures.analyzePatterns();
        if (!analysis.patterns || analysis.patterns.length === 0) return;
        
        // Adicionar padrões aos insights existentes
        const insightsList = document.getElementById('insights-list');
        if (!insightsList) return;
        
        analysis.patterns.forEach(pattern => {
            const patternEl = document.createElement('div');
            patternEl.className = 'insight-item';
            patternEl.innerHTML = `
                <div class="insight-icon">${pattern.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${pattern.title}</div>
                    <div class="insight-description">${pattern.description}</div>
                </div>
            `;
            insightsList.appendChild(patternEl);
        });
    },

    getPreviousMonth(month) {
        const date = new Date(month + '-01');
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().slice(0, 7);
    },

    loadDashboardTransacoes() {
        // Usar requestAnimationFrame para melhor performance
        requestAnimationFrame(() => {
            const list = Transactions.list().slice(0, 5);
            const container = document.getElementById("dashboard-transacoes");

            if (!container) return;

            if (list.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 40px 20px;">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">Nenhuma transação recente</div>
                        <div class="empty-state-text">Adicione sua primeira transação para começar</div>
                    </div>
                `;
                return;
            }

            // Usar DocumentFragment para melhor performance
            const fragment = document.createDocumentFragment();
            list.forEach(t => {
                const div = document.createElement('div');
                div.className = `transaction-item ${t.type}`;
                div.onclick = () => this.editTransacao(t.id);
                div.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-icon">${this.getCategoryIcon(t.category)}</div>
                        <div>
                            <h4 class="transaction-details">${this.escapeHtml(t.description)}</h4>
                            <div class="transaction-meta">
                                <span class="badge ${t.type === 'gasto' ? 'badge-danger' : 'badge-success'}">${t.type === 'gasto' ? 'Gasto' : 'Receita'}</span>
                                <span>${this.escapeHtml(t.category)}</span>
                                <span>•</span>
                                <span>${new Date(t.date).toLocaleDateString("pt-BR")}</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount">${t.type === 'gasto' ? '-' : '+'}${this.format(t.amount)}</div>
                `;
                fragment.appendChild(div);
            });
            
            container.innerHTML = '';
            container.appendChild(fragment);
        });
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getCategoryIcon(category) {
        const icons = {
            'Alimentação': '🍔', 'Transporte': '🚗', 'Moradia': '🏠', 'Saúde': '💊',
            'Salário': '💰', 'Freelance': '💼', 'Investimentos': '📈',
            'Lazer': '🎮', 'Educação': '📚', 'Compras': '🛒', 'Outros': '📌'
        };
        return icons[category] || '💵';
    },

    loadNavigation() {
        const pageTitles = {
            dashboard: 'Dashboard',
            transacoes: 'Transações',
            categorias: 'Categorias',
            orcamento: 'Orçamento',
            metas: 'Metas',
            relatorios: 'Relatórios',
            recorrencias: 'Recorrências',
            contas: 'Contas',
            etiquetas: 'Etiquetas',
            alertas: 'Alertas',
            historico: 'Histórico',
            configuracoes: 'Configurações'
        };

        document.querySelectorAll(".nav-item").forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                
                document.querySelectorAll(".nav-item")
                    .forEach(i => {
                        i.classList.remove("active");
                        i.removeAttribute("aria-current");
                    });

                item.classList.add("active");
                item.setAttribute("aria-current", "page");

                const page = item.getAttribute("data-page");
                if (page) {
                    // Atualizar título da página
                    const titleEl = document.getElementById("current-page-title");
                    if (titleEl && pageTitles[page]) {
                        titleEl.textContent = pageTitles[page];
                    }
                    this.showPage(page);
                }
            };
        });
    },

    showPage(id) {
        document.querySelectorAll(".page").forEach(p => {
            p.classList.remove("visible");
            p.setAttribute("aria-hidden", "true");
        });

        const page = document.getElementById("page-" + id);
        if (page) {
            page.classList.add("visible");
            page.setAttribute("aria-hidden", "false");
            
            // Renderizar conteúdo específico da página se estiver vazia ou apenas com header
            const header = page.querySelector('.page-header');
            const contentAfterHeader = header ? header.nextElementSibling : null;
            const hasContent = contentAfterHeader && contentAfterHeader.tagName !== 'SCRIPT';
            
            // Se não tiver conteúdo (apenas header + comentário), renderizar
            if (!hasContent) {
                this.renderPage(id);
            }
            
            // Atualizar dados quando necessário
            if (id === "dashboard") {
                this.updateDashboard();
            }
        }
    },

    renderPage(id) {
        const page = document.getElementById("page-" + id);
        if (!page) return;

        switch(id) {
            case "transacoes":
                this.renderTransacoes();
                break;
            case "categorias":
                this.renderCategorias();
                break;
            case "orcamento":
                this.renderOrcamento();
                break;
            case "metas":
                this.renderMetas();
                break;
            case "relatorios":
                this.renderRelatorios();
                break;
            case "recorrencias":
                this.renderRecorrencias();
                break;
            case "contas":
                this.renderContas();
                break;
            case "etiquetas":
                this.renderEtiquetas();
                break;
            case "alertas":
                this.renderAlertas();
                break;
            case "historico":
                this.renderHistorico();
                break;
            case "configuracoes":
                this.renderConfiguracoes();
                break;
        }
    },

    renderTransacoes() {
        const page = document.getElementById("page-transacoes");
        page.innerHTML = `
            <h2>Transações</h2>
            
            <div class="card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 0;">✨ Nova Transação</h3>
                    <kbd style="background: var(--gray-light); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-family: monospace; border: 1px solid var(--gray);">
                        Ctrl + N
                    </kbd>
                </div>
                <form id="form-transacao">
                    <div class="form-grid">
                        <div>
                            <label>Tipo</label>
                            <select id="trans-type" class="form-input" required>
                                <option value="gasto">Gasto</option>
                                <option value="receita">Receita</option>
                            </select>
                        </div>
                        <div>
                            <label>Categoria</label>
                            <select id="trans-category" class="form-input" required>
                                <option value="">Selecione...</option>
                            </select>
                        </div>
                        <div>
                            <label>Descrição</label>
                            <input type="text" id="trans-description" class="form-input" required>
                        </div>
                        <div style="grid-column: span 2;">
                            <label>Valor (R$)</label>
                            <input type="number" id="trans-amount" class="form-input input-number" step="0.01" min="0.01" placeholder="0,00" required style="width: 100%;">
                        </div>
                        <div>
                            <label>Data</label>
                            <input type="date" id="trans-date" class="form-input" required>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label>Notas (opcional)</label>
                            <textarea id="trans-notes" class="form-input" rows="3" placeholder="Adicione observações sobre esta transação..."></textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary">Adicionar Transação</button>
                </form>
            </div>

            <div class="transaction-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                    <h3 class="chart-title" style="margin-bottom: 0;">Suas Transações</h3>
                    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                        <button class="btn-action" onclick="UI.exportCSV()" title="Exportar CSV">📥</button>
                        <button class="btn-action" onclick="if(typeof AdvancedFeatures !== 'undefined') AdvancedFeatures.exportToExcel(); else UI.showToast('error', 'Funcionalidade não disponível');" title="Exportar Excel">📊</button>
                        <button class="btn-action" onclick="UI.clearFilters()" title="Limpar filtros">🔄</button>
                        <button class="btn-action" onclick="UI.showSavedFilters()" title="Filtros salvos">⭐</button>
                        <button class="btn-action" onclick="UI.saveCurrentFilter()" title="Salvar filtro atual">💾</button>
                        <span id="transaction-count" class="badge badge-success" style="display: inline-flex; align-items: center; padding: 8px 16px;">0 transações</span>
                    </div>
                </div>
                <div class="form-grid" style="margin-bottom: 24px;">
                    <input type="text" id="filter-search" class="form-input" placeholder="Buscar por descrição ou categoria..." autocomplete="off">
                    <select id="filter-type" class="form-input">
                        <option value="">Todos os tipos</option>
                        <option value="gasto">Gasto</option>
                        <option value="receita">Receita</option>
                    </select>
                    <select id="filter-category" class="form-input">
                        <option value="">Todas categorias</option>
                    </select>
                    <input type="month" id="filter-month" class="form-input" title="Filtrar por mês">
                </div>
                <div id="saved-filters-list" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;"></div>

                <div id="transacoes-list" class="transaction-list"></div>
            </div>
        `;

        // Preencher categorias
        this.updateCategorySelect("trans-category");
        this.updateCategorySelect("filter-category");
        
        // Data padrão
        document.getElementById("trans-date").value = new Date().toISOString().slice(0, 10);
        document.getElementById("filter-month").value = new Date().toISOString().slice(0, 7);

        // Event listeners
        document.getElementById("trans-type").addEventListener("change", (e) => {
            this.updateCategorySelect("trans-category", e.target.value);
        });

        document.getElementById("form-transacao").addEventListener("submit", (e) => {
            e.preventDefault();
            this.addTransacao();
        });

        // Filtros em tempo real
        document.getElementById("filter-search").addEventListener("input", () => {
            this.applyFilters();
        });
        document.getElementById("filter-type").addEventListener("change", () => {
            this.applyFilters();
        });
        document.getElementById("filter-category").addEventListener("change", () => {
            this.applyFilters();
        });
        document.getElementById("filter-month").addEventListener("change", () => {
            this.applyFilters();
        });

        // Atalhos de teclado globais
        document.addEventListener("keydown", (e) => {
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
            
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === "k" || e.key === "K") {
                    if (!isInput) {
                        e.preventDefault();
                        document.getElementById("filter-search")?.focus();
                    }
                }
                if (e.key === "n" || e.key === "N") {
                    if (!isInput) {
                        e.preventDefault();
                        document.getElementById("trans-description")?.focus();
                    }
                }
            }
            if (e.key === "Escape") {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
            }
        });

        this.loadTransacoes();
    },

    renderCategorias() {
        const page = document.getElementById("page-categorias");
        const user = Auth.current();
        
        page.innerHTML = `
            <h2>Categorias</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;">
                <div class="card">
                    <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 700;">Categorias de Gastos</h3>
                    <form id="form-categoria-gasto" style="margin-bottom: 24px;">
                        <div style="display: flex; gap: 12px; align-items: stretch;">
                            <input 
                                type="text" 
                                id="cat-gasto-name" 
                                class="form-input" 
                                placeholder="Digite o nome da categoria" 
                                required 
                                style="flex: 1; min-height: 52px; font-size: 17px; padding: 16px 20px; font-weight: 500;"
                            >
                            <button 
                                type="submit" 
                                class="btn-primary" 
                                style="white-space: nowrap; min-height: 52px; padding: 16px 28px; font-size: 16px; font-weight: 600; border-radius: var(--radius-lg);"
                            >
                                Adicionar
                            </button>
                        </div>
                    </form>
                    <ul id="list-gastos" class="category-list"></ul>
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 700;">Categorias de Receitas</h3>
                    <form id="form-categoria-receita" style="margin-bottom: 24px;">
                        <div style="display: flex; gap: 12px; align-items: stretch;">
                            <input 
                                type="text" 
                                id="cat-receita-name" 
                                class="form-input" 
                                placeholder="Digite o nome da categoria" 
                                required 
                                style="flex: 1; min-height: 52px; font-size: 17px; padding: 16px 20px; font-weight: 500;"
                            >
                            <button 
                                type="submit" 
                                class="btn-primary" 
                                style="white-space: nowrap; min-height: 52px; padding: 16px 28px; font-size: 16px; font-weight: 600; border-radius: var(--radius-lg);"
                            >
                                Adicionar
                            </button>
                        </div>
                    </form>
                    <ul id="list-receitas" class="category-list"></ul>
                </div>
            </div>
        `;

        document.getElementById("form-categoria-gasto").addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("cat-gasto-name").value.trim();
            if (name) {
                Categories.add("gastos", name);
                document.getElementById("cat-gasto-name").value = "";
                this.loadCategorias();
                this.updateCategories();
            }
        });

        document.getElementById("form-categoria-receita").addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("cat-receita-name").value.trim();
            if (name) {
                Categories.add("receitas", name);
                document.getElementById("cat-receita-name").value = "";
                this.loadCategorias();
                this.updateCategories();
            }
        });

        this.loadCategorias();
    },

    renderOrcamento() {
        const page = document.getElementById("page-orcamento");
        const budget = Budget.getMonthly();
        
        page.innerHTML = `
            <h2>Orçamento</h2>
            
            <div class="card" style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">Orçamento Mensal</h3>
                <form id="form-orcamento">
                    <div style="display: flex; gap: 16px; align-items: flex-end;">
                        <div style="flex: 2;">
                            <label>Valor do orçamento mensal (R$)</label>
                            <input type="number" id="budget-value" class="form-input input-number" step="0.01" value="${budget}" placeholder="0,00" required style="width: 100%;">
                        </div>
                        <div style="flex: 0 0 auto;">
                            <button type="submit" class="btn-primary" style="min-height: 56px; padding: 18px 32px; font-size: 16px;">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 15px;">Resumo do Mês</h3>
                <div id="orcamento-summary"></div>
            </div>
        `;

        document.getElementById("form-orcamento").addEventListener("submit", (e) => {
            e.preventDefault();
            const value = parseFloat(document.getElementById("budget-value").value);
            Budget.setMonthly(value);
            this.showToast('success', 'Orçamento atualizado com sucesso!');
            this.updateOrcamentoSummary();
        });

        this.updateOrcamentoSummary();
    },

    renderMetas() {
        const page = document.getElementById("page-metas");
        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Metas</h1></header>';
        
        const user = Auth.current();
        const categories = user ? [...user.categories.gastos, ...user.categories.receitas] : [];
        const categoryGoals = typeof AdvancedFeatures !== 'undefined' ? AdvancedFeatures.getCategoryGoals() : [];
        
        page.innerHTML = headerHTML + `
            <div class="dashboard-grid">
                <div class="transaction-card">
                    <h3 class="chart-title">Nova Meta</h3>
                    <form id="form-meta">
                        <div class="form-grid" style="margin-bottom: 20px;">
                            <div>
                                <label>Descrição</label>
                                <input type="text" id="meta-description" class="form-input" required>
                            </div>
                            <div style="grid-column: span 1;">
                                <label>Valor (R$)</label>
                                <input type="number" id="meta-value" class="form-input input-number" step="0.01" min="0.01" placeholder="0,00" required style="width: 100%;">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Adicionar Meta</button>
                    </form>
                </div>

                <div class="transaction-card">
                    <h3 class="chart-title">Minhas Metas</h3>
                    <div id="metas-list"></div>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <h3 class="chart-title">Metas por Categoria</h3>
                <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">
                    Defina limites de gastos para categorias específicas.
                </p>
                <form id="form-category-goal" style="margin-bottom: 20px;">
                    <div class="form-grid">
                        <div>
                            <label>Categoria</label>
                            <select id="category-goal-category" class="form-input" required>
                                <option value="">Selecione uma categoria</option>
                                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                        <div style="grid-column: span 2;">
                            <label>Limite Mensal (R$)</label>
                            <input type="number" id="category-goal-target" class="form-input input-number" step="0.01" min="0.01" placeholder="0,00" required style="width: 100%;">
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button type="submit" class="btn-primary" style="width: 100%;">Adicionar Meta</button>
                        </div>
                    </div>
                </form>
                <div id="category-goals-list"></div>
            </div>
        `;

        document.getElementById("form-meta").addEventListener("submit", (e) => {
            e.preventDefault();
            const description = document.getElementById("meta-description").value.trim();
            const value = parseFloat(document.getElementById("meta-value").value);
            
            Goals.add({ description, target: value });
            document.getElementById("meta-description").value = "";
            document.getElementById("meta-value").value = "";
            this.loadMetas();
        });

        // Formulário de meta por categoria
        const categoryGoalForm = document.getElementById("form-category-goal");
        if (categoryGoalForm) {
            categoryGoalForm.addEventListener("submit", (e) => {
                e.preventDefault();
                if (typeof AdvancedFeatures === 'undefined') {
                    this.showToast('error', 'Funcionalidade não disponível');
                    return;
                }
                
                const category = document.getElementById("category-goal-category").value;
                const target = parseFloat(document.getElementById("category-goal-target").value);
                
                if (!category || !target) {
                    this.showToast('error', 'Preencha todos os campos');
                    return;
                }
                
                const result = AdvancedFeatures.addCategoryGoal(category, target);
                if (result.success) {
                    this.showToast('success', 'Meta por categoria adicionada!');
                    document.getElementById("form-category-goal").reset();
                    this.loadCategoryGoals();
                }
            });
        }

        this.loadMetas();
        this.loadCategoryGoals();
    },

    loadCategoryGoals() {
        const container = document.getElementById("category-goals-list");
        if (!container || typeof AdvancedFeatures === 'undefined') return;

        const goals = AdvancedFeatures.getCategoryGoals();
        if (goals.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-title">Nenhuma meta por categoria</div><div class="empty-state-text">Adicione limites de gastos para categorias específicas</div></div>';
            return;
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthTransactions = Transactions.list({ month: currentMonth });

        container.innerHTML = goals.map(goal => {
            const categoryTransactions = monthTransactions.filter(
                t => t.category === goal.category && t.type === 'gasto'
            );
            const current = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            const percent = goal.target > 0 ? (current / goal.target * 100) : 0;
            const remaining = goal.target - current;

            return `
                <div class="category-goal-item">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong>${goal.category}</strong>
                            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">
                                ${this.format(current)} / ${this.format(goal.target)}
                            </span>
                        </div>
                        <div class="category-goal-progress">
                            <div class="category-goal-progress-bar" style="width: ${Math.min(percent, 100)}%; background: ${percent > 100 ? 'var(--error)' : 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)'};"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                            <span>${percent.toFixed(1)}% utilizado</span>
                            <span>${remaining >= 0 ? `Restam ${this.format(remaining)}` : `Ultrapassado em ${this.format(Math.abs(remaining))}`}</span>
                        </div>
                    </div>
                    <button onclick="
                        const user = Auth.current();
                        if (user && user.categoryGoals) {
                            user.categoryGoals = user.categoryGoals.filter(g => g.id !== '${goal.id}');
                            Storage.saveUserData(Storage.getCurrentUser(), user);
                            UI.loadCategoryGoals();
                            UI.showToast('success', 'Meta removida');
                        }
                    " class="btn-action danger" style="margin-left: 12px;">🗑️</button>
                </div>
            `;
        }).join('');
    },

    renderRelatorios() {
        const page = document.getElementById("page-relatorios");
        if (!page) return;
        
        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Relatórios</h1></header>';
        
        const user = Auth.current();
        const categories = user ? [...user.categories.gastos, ...user.categories.receitas] : [];
        
        page.innerHTML = headerHTML + `
            <div class="transaction-card" style="margin-bottom: 24px;">
                <h3 class="chart-title">Filtros Avançados</h3>
                <div class="form-grid" style="margin-bottom: 16px;">
                    <div>
                        <label>Período</label>
                        <input type="month" id="report-month" class="form-input" value="${new Date().toISOString().slice(0, 7)}">
                    </div>
                    <div>
                        <label>Tipo</label>
                        <select id="report-type" class="form-input">
                            <option value="">Todos</option>
                            <option value="gasto">Apenas Gastos</option>
                            <option value="receita">Apenas Receitas</option>
                        </select>
                    </div>
                    <div>
                        <label>Categoria</label>
                        <select id="report-category" class="form-input">
                            <option value="">Todas</option>
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div style="grid-column: span 1;">
                        <label>Valor Mínimo (R$)</label>
                        <input type="number" id="report-min-value" class="form-input input-number" step="0.01" min="0" placeholder="0,00" style="width: 100%;">
                    </div>
                    <div style="grid-column: span 1;">
                        <label>Valor Máximo (R$)</label>
                        <input type="number" id="report-max-value" class="form-input input-number" step="0.01" min="0" placeholder="Sem limite" style="width: 100%;">
                    </div>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button class="btn-primary" onclick="UI.updateRelatorio()" style="white-space: nowrap;">📊 Gerar Relatório</button>
                    <button class="btn-secondary" onclick="UI.exportPDF()" style="white-space: nowrap;">📄 Exportar PDF</button>
                    <button class="btn-secondary" onclick="UI.clearReportFilters()" style="white-space: nowrap;">🔄 Limpar Filtros</button>
                </div>
            </div>

            <div id="relatorio-content"></div>
        `;

        // Event listeners para filtros em tempo real
        document.getElementById("report-month").addEventListener("change", () => this.updateRelatorio());
        document.getElementById("report-type").addEventListener("change", () => this.updateRelatorio());
        document.getElementById("report-category").addEventListener("change", () => this.updateRelatorio());
        document.getElementById("report-min-value").addEventListener("input", () => this.updateRelatorio());
        document.getElementById("report-max-value").addEventListener("input", () => this.updateRelatorio());

        this.updateRelatorio();
    },

    showComparativeReport() {
        const month1 = document.getElementById("compare-month1")?.value;
        const month2 = document.getElementById("compare-month2")?.value;
        
        if (!month1 || !month2) {
            this.showToast('error', 'Selecione ambos os meses para comparar');
            return;
        }
        
        if (month1 === month2) {
            this.showToast('error', 'Selecione meses diferentes para comparar');
            return;
        }
        
        const comparison = AdvancedFeatures.generateComparativeReport(month1, month2);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="margin: 0;">📊 Comparação de Períodos</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn-action">✕</button>
                </div>
                
                <div class="dashboard-grid" style="margin-bottom: 24px;">
                    <div class="stat-card">
                        <div class="stat-label">${comparison.month1.name}</div>
                        <div class="stat-value" style="font-size: 20px;">Gastos: ${this.format(comparison.month1.summary.gastos)}</div>
                        <div class="stat-trend">Receitas: ${this.format(comparison.month1.summary.receitas)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">${comparison.month2.name}</div>
                        <div class="stat-value" style="font-size: 20px;">Gastos: ${this.format(comparison.month2.summary.gastos)}</div>
                        <div class="stat-trend">Receitas: ${this.format(comparison.month2.summary.receitas)}</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3 style="margin-bottom: 16px;">Diferenças</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <strong>Gastos:</strong> 
                            <span style="color: ${comparison.differences.gastos.value >= 0 ? 'var(--error)' : 'var(--success)'};">
                                ${comparison.differences.gastos.value >= 0 ? '+' : ''}${this.format(comparison.differences.gastos.value)} 
                                (${comparison.differences.gastos.percent >= 0 ? '+' : ''}${comparison.differences.gastos.percent}%)
                            </span>
                        </div>
                        <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <strong>Receitas:</strong> 
                            <span style="color: ${comparison.differences.receitas.value >= 0 ? 'var(--success)' : 'var(--error)'};">
                                ${comparison.differences.receitas.value >= 0 ? '+' : ''}${this.format(comparison.differences.receitas.value)} 
                                (${comparison.differences.receitas.percent >= 0 ? '+' : ''}${comparison.differences.receitas.percent}%)
                            </span>
                        </div>
                        <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <strong>Saldo:</strong> 
                            <span style="color: ${comparison.differences.saldo >= 0 ? 'var(--success)' : 'var(--error)'};">
                                ${comparison.differences.saldo >= 0 ? '+' : ''}${this.format(comparison.differences.saldo)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    clearReportFilters() {
        document.getElementById("report-month").value = new Date().toISOString().slice(0, 7);
        document.getElementById("report-type").value = "";
        document.getElementById("report-category").value = "";
        document.getElementById("report-min-value").value = "";
        document.getElementById("report-max-value").value = "";
        this.updateRelatorio();
        this.showToast('info', 'Filtros limpos');
    },

    exportPDF() {
        const month = document.getElementById("report-month")?.value || new Date().toISOString().slice(0, 7);
        const typeFilter = document.getElementById("report-type")?.value || "";
        const categoryFilter = document.getElementById("report-category")?.value || "";
        const minValue = parseFloat(document.getElementById("report-min-value")?.value) || 0;
        const maxValue = parseFloat(document.getElementById("report-max-value")?.value) || Infinity;
        
        // Aplicar mesmos filtros do relatório
        let transactions = Transactions.list({ month });
        if (typeFilter) transactions = transactions.filter(t => t.type === typeFilter);
        if (categoryFilter) transactions = transactions.filter(t => t.category === categoryFilter);
        if (minValue > 0) transactions = transactions.filter(t => t.amount >= minValue);
        if (maxValue !== Infinity) transactions = transactions.filter(t => t.amount <= maxValue);
        
        transactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const summary = {
            gastos: transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0),
            receitas: transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0),
            saldo: 0
        };
        summary.saldo = summary.receitas - summary.gastos;

        // Gastos e receitas por categoria
        const gastosPorCategoria = {};
        const receitasPorCategoria = {};
        
        transactions.filter(t => t.type === 'gasto').forEach(t => {
            gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + t.amount;
        });
        
        transactions.filter(t => t.type === 'receita').forEach(t => {
            receitasPorCategoria[t.category] = (receitasPorCategoria[t.category] || 0) + t.amount;
        });

        const filters = {
            type: typeFilter || undefined,
            category: categoryFilter || undefined,
            minValue: minValue > 0 ? minValue : undefined,
            maxValue: maxValue !== Infinity ? maxValue : undefined
        };
        
        PDFExport.generateReport({
            summary,
            transactions,
            gastosPorCategoria,
            receitasPorCategoria
        }, month, filters);
    },

    // Métodos auxiliares
    addTransacao() {
        const type = document.getElementById("trans-type").value;
        const category = document.getElementById("trans-category").value;
        const description = document.getElementById("trans-description").value.trim();
        const amountInput = document.getElementById("trans-amount");
        const amount = parseFloat(amountInput.value);
        const date = document.getElementById("trans-date").value;
        const notes = document.getElementById("trans-notes")?.value.trim() || '';

        // Validações melhoradas
        if (!description || description.length < 2) {
            this.showToast('error', 'Descrição deve ter pelo menos 2 caracteres');
            document.getElementById("trans-description").focus();
            return;
        }

        if (!category) {
            this.showToast('error', 'Selecione uma categoria');
            document.getElementById("trans-category").focus();
            return;
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            this.showToast('error', 'Valor deve ser maior que zero');
            amountInput.focus();
            amountInput.style.borderColor = 'var(--error)';
            setTimeout(() => {
                amountInput.style.borderColor = '';
            }, 2000);
            return;
        }

        if (!date) {
            this.showToast('error', 'Selecione uma data');
            document.getElementById("trans-date").focus();
            return;
        }

        // Validar data futura (opcional - pode ser desabilitado se necessário)
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
            const confirm = window.confirm('A data selecionada é futura. Deseja continuar?');
            if (!confirm) {
                document.getElementById("trans-date").focus();
                return;
            }
        }

        const result = Transactions.add({ type, category, description, amount, date, notes });
        
        if (!result || !result.success) {
            this.showToast('error', result?.message || 'Erro ao adicionar transação');
            return;
        }
        
        // Recarregar dados do usuário após adicionar transação
        const currentUser = Storage.getCurrentUser();
        if (currentUser) {
            const userData = Storage.getUserData(currentUser);
            if (userData) {
                // Garantir que os dados estejam atualizados
                Storage.saveUserData(currentUser, userData);
            }
        }
        
        // Limpar formulário
        document.getElementById("form-transacao").reset();
        document.getElementById("trans-date").value = new Date().toISOString().slice(0, 10);
        if (document.getElementById("trans-notes")) document.getElementById("trans-notes").value = "";
        document.getElementById("trans-type").value = "gasto";
        this.updateCategorySelect("trans-category", "gasto");
        
        // Atualizar tudo
        this.loadTransacoes();
        this.updateDashboard();
        this.updateCategories();
        
        // Feedback visual melhorado
        const emoji = type === 'receita' ? '💰' : '💸';
        this.showToast('success', `${emoji} ${type === 'receita' ? 'Receita' : 'Gasto'} de ${this.format(amount)} adicionado!`);
        
        // Animação no formulário
        const form = document.getElementById("form-transacao");
        if (form) {
            form.style.transform = "scale(0.98)";
            form.style.opacity = "0.9";
            setTimeout(() => {
                form.style.transform = "scale(1)";
                form.style.opacity = "1";
            }, 150);
        }
        
        // Scroll suave para a lista de transações
        setTimeout(() => {
            const transacoesList = document.getElementById("transacoes-list");
            if (transacoesList) {
                transacoesList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 300);
    },

    loadTransacoes(filters = {}) {
        // Usar requestAnimationFrame para melhor performance
        requestAnimationFrame(() => {
            const list = Transactions.list(filters);
            const container = document.getElementById("transacoes-list");
            const countEl = document.getElementById("transaction-count");
            
            if (!container) return;

            // Atualizar contador
            if (countEl) {
                countEl.textContent = `${list.length} ${list.length === 1 ? 'transação' : 'transações'}`;
            }

            if (list.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 60px 20px;">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">Nenhuma transação encontrada</div>
                        <div class="empty-state-text">Tente ajustar os filtros ou adicione uma nova transação</div>
                    </div>
                `;
                return;
            }

            // Usar DocumentFragment para melhor performance em listas grandes
            const fragment = document.createDocumentFragment();
            list.forEach((t, index) => {
                const isToday = new Date(t.date).toDateString() === new Date().toDateString();
                const isRecent = (new Date() - new Date(t.date)) < 3 * 24 * 60 * 60 * 1000; // 3 dias
                
                const div = document.createElement('div');
                div.className = `transaction-item ${t.type}`;
                div.setAttribute('data-id', t.id);
                div.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 12px; border-radius: var(--radius-sm); animation: slideInUp 0.3s ease ${index * 0.03}s both; ${isRecent ? 'border-left-width: 5px;' : ''}`;
                
                div.innerHTML = `
                    <div style="flex: 1; cursor: pointer;" onclick="UI.editTransacao('${t.id}')">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <span style="font-size: 32px; transition: transform 0.3s; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${this.getCategoryIcon(t.category)}</span>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                    <strong style="font-size: 17px; display: block;">${this.escapeHtml(t.description)}</strong>
                                    ${isToday ? '<span class="badge badge-info" style="padding: 2px 8px; font-size: 10px;">HOJE</span>' : ''}
                                </div>
                                <div style="font-size: 13px; color: var(--text-soft); display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                    <span class="badge ${t.type === 'gasto' ? 'badge-danger' : 'badge-success'}">${t.type === 'gasto' ? 'Gasto' : 'Receita'}</span>
                                    <span>${this.escapeHtml(t.category)}</span>
                                    <span>•</span>
                                    <span>${new Date(t.date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                ${t.notes ? `<div style="font-size: 12px; color: var(--text-tertiary); margin-top: 6px; font-style: italic; padding-left: 8px; border-left: 2px solid var(--border);">📝 ${this.escapeHtml(t.notes)}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; align-items: center; gap: 15px;">
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: 800; color: ${t.type === 'gasto' ? '#ef4444' : '#10b981'}; line-height: 1.2;">
                                ${t.type === 'gasto' ? '-' : '+'}${this.format(t.amount)}
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button onclick="event.stopPropagation(); Transactions.duplicate('${t.id}'); UI.loadTransacoes(); UI.updateDashboard(); UI.showToast('success', 'Transação duplicada!');" 
                                    class="btn-icon" 
                                    title="Duplicar transação"
                                    style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; width: 38px; height: 38px; font-size: 16px;">
                                📋
                            </button>
                            <button onclick="event.stopPropagation(); UI.editTransacao('${t.id}')" 
                                    class="btn-icon" 
                                    title="Editar transação"
                                    style="background: rgba(59, 130, 246, 0.1); color: var(--primary); width: 38px; height: 38px; font-size: 16px;">
                                ✏️
                            </button>
                            <button onclick="event.stopPropagation(); UI.removeTransacao('${t.id}')" 
                                    class="btn-icon" 
                                    title="Remover transação"
                                    style="background: rgba(239, 68, 68, 0.1); color: var(--danger); width: 38px; height: 38px; font-size: 16px;">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
                
                fragment.appendChild(div);
            });
            
            container.innerHTML = '';
            container.appendChild(fragment);
        });
    },

    removeTransacao(id) {
        const transaction = Transactions.getById(id);
        if (!transaction) return;

        // Modal de confirmação customizado
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;" onclick="event.stopPropagation()">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 64px; margin-bottom: 15px;">⚠️</div>
                    <h2 style="margin: 0 0 10px 0; font-size: 22px;">Confirmar exclusão</h2>
                    <p style="color: var(--text-soft); margin: 0;">
                        Deseja realmente remover a transação<br>
                        <strong>"${transaction.description}"</strong>?
                    </p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                            class="btn-secondary" style="flex: 1; padding: 12px;">Cancelar</button>
                    <button type="button" onclick="
                        Transactions.remove('${id}');
                        UI.loadTransacoes();
                        UI.updateDashboard();
                        UI.showToast('success', 'Transação removida');
                        this.closest('.modal-overlay').remove();
                    " class="btn-remove" style="flex: 1; padding: 12px;">Remover</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    applyFilters() {
        const filters = {
            search: document.getElementById("filter-search")?.value.trim() || "",
            type: document.getElementById("filter-type")?.value || undefined,
            category: document.getElementById("filter-category")?.value || undefined,
            month: document.getElementById("filter-month")?.value || undefined
        };
        this.loadTransacoes(filters);
    },

    clearFilters() {
        const filterSearch = document.getElementById("filter-search");
        const filterType = document.getElementById("filter-type");
        const filterCategory = document.getElementById("filter-category");
        const filterMonth = document.getElementById("filter-month");

        if (filterSearch) filterSearch.value = "";
        if (filterType) filterType.value = "";
        if (filterCategory) filterCategory.value = "";
        if (filterMonth) filterMonth.value = new Date().toISOString().slice(0, 7);

        this.applyFilters();
        this.showToast('info', 'Filtros limpos');
    },

    editTransacao(id) {
        const transaction = Transactions.getById(id);
        if (!transaction) return;

        this.showEditModal(transaction);
    },

    showEditModal(transaction) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; font-size: 24px;">✏️ Editar Transação</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn-icon" style="font-size: 24px;">✕</button>
                </div>
                <form id="edit-form">
                    <input type="hidden" id="edit-id" value="${transaction.id}">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label>Tipo</label>
                            <select id="edit-type" class="form-input" required>
                                <option value="gasto" ${transaction.type === 'gasto' ? 'selected' : ''}>Gasto</option>
                                <option value="receita" ${transaction.type === 'receita' ? 'selected' : ''}>Receita</option>
                            </select>
                        </div>
                        <div>
                            <label>Categoria</label>
                            <select id="edit-category" class="form-input" required>
                                <option value="">Selecione...</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <label>Descrição</label>
                            <input type="text" id="edit-description" class="form-input" value="${transaction.description}" required>
                        </div>
                        <div>
                            <label>Valor (R$)</label>
                            <input type="number" id="edit-amount" class="form-input input-number" step="0.01" min="0.01" value="${transaction.amount}" required style="width: 100%;">
                        </div>
                        <div>
                            <label>Data</label>
                            <input type="date" id="edit-date" class="form-input" value="${transaction.date}" required>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label>Notas</label>
                            <textarea id="edit-notes" class="form-input" rows="3" placeholder="Observações sobre esta transação...">${transaction.notes || ''}</textarea>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                                class="btn-secondary" style="padding: 12px 24px;">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Preencher categorias
        this.updateCategorySelect("edit-category", transaction.type);
        document.getElementById("edit-category").value = transaction.category;

        // Event listeners
        document.getElementById("edit-type").addEventListener("change", (e) => {
            this.updateCategorySelect("edit-category", e.target.value);
        });

        document.getElementById("edit-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-id").value;
            const type = document.getElementById("edit-type").value;
            const category = document.getElementById("edit-category").value;
            const description = document.getElementById("edit-description").value.trim();
            const amount = parseFloat(document.getElementById("edit-amount").value);
            const date = document.getElementById("edit-date").value;
            const notes = document.getElementById("edit-notes")?.value.trim() || '';

            if (!description || !amount || !category) {
                this.showToast('error', 'Preencha todos os campos');
                return;
            }

            Transactions.update(id, { type, category, description, amount, date, notes });
            modal.remove();
            this.loadTransacoes();
            this.updateDashboard();
            this.showToast('success', 'Transação atualizada com sucesso!');
        });

        // Fechar ao clicar fora
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    updateCategorySelect(selectId, type) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione...</option>';

        const user = Auth.current();
        if (!user) return;

        let categories = [];
        if (type) {
            categories = user.categories[type] || [];
        } else if (selectId.includes("trans")) {
            const transType = document.getElementById("trans-type")?.value || "gasto";
            categories = user.categories[transType] || [];
        } else {
            categories = [...user.categories.gastos, ...user.categories.receitas];
        }

        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            if (cat === currentValue) opt.selected = true;
            select.appendChild(opt);
        });
    },

    loadCategorias() {
        const user = Auth.current();
        if (!user) return;

        const gastosList = document.getElementById("list-gastos");
        const receitasList = document.getElementById("list-receitas");

        if (gastosList) {
            gastosList.innerHTML = user.categories.gastos.map(cat => `
                <li style="
                    padding: 14px 16px; 
                    border-bottom: 1px solid var(--border); 
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: background 0.2s;
                " onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                    <span style="font-weight: 500;">${cat}</span>
                    <button 
                        onclick="Categories.remove('gastos', '${cat}'); UI.loadCategorias(); UI.updateCategories(); UI.showToast('success', 'Categoria removida');" 
                        class="btn-action danger" 
                        style="width: 32px; height: 32px; font-size: 14px;"
                        title="Remover categoria"
                    >🗑️</button>
                </li>
            `).join("");
        }

        if (receitasList) {
            receitasList.innerHTML = user.categories.receitas.map(cat => `
                <li style="
                    padding: 14px 16px; 
                    border-bottom: 1px solid var(--border); 
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: background 0.2s;
                " onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                    <span style="font-weight: 500;">${cat}</span>
                    <button 
                        onclick="Categories.remove('receitas', '${cat}'); UI.loadCategorias(); UI.updateCategories(); UI.showToast('success', 'Categoria removida');" 
                        class="btn-action danger" 
                        style="width: 32px; height: 32px; font-size: 14px;"
                        title="Remover categoria"
                    >🗑️</button>
                </li>
            `).join("");
        }
    },

    updateOrcamentoSummary() {
        const month = new Date().toISOString().slice(0, 7);
        const summary = Budget.summary(month);
        const container = document.getElementById("orcamento-summary");

        if (!container) return;

        const percent = summary.budget > 0 ? summary.percent : 0;
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div>
                    <h4>Orçamento</h4>
                    <div class="value">${this.format(summary.budget || 0)}</div>
                </div>
                <div>
                    <h4>Gasto</h4>
                    <div class="value" style="color: ${summary.spent > summary.budget ? '#ef4444' : '#10b981'}">
                        ${this.format(summary.spent || 0)}
                    </div>
                </div>
                <div>
                    <h4>Restante</h4>
                    <div class="value" style="color: ${summary.remaining < 0 ? '#ef4444' : '#10b981'}">
                        ${this.format(summary.remaining || 0)}
                    </div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <div style="background: #f0f2f4; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="background: ${percent > 100 ? '#ef4444' : '#3b82f6'}; height: 100%; width: ${Math.min(percent, 100)}%; transition: width 0.3s;"></div>
                </div>
                <div style="text-align: center; margin-top: 10px; color: var(--text-soft);">
                    ${percent.toFixed(1)}% do orçamento utilizado
                </div>
            </div>
        `;
    },

    loadMetas() {
        const goals = Goals.list();
        const container = document.getElementById("metas-list");

        if (!container) return;

        if (!goals || goals.length === 0) {
            container.innerHTML = "<p style='text-align: center; color: var(--text-soft); padding: 20px;'>Nenhuma meta cadastrada</p>";
            return;
        }

        container.innerHTML = goals.map(g => {
            const percent = g.target > 0 ? (g.current / g.target) * 100 : 0;
            const remaining = g.target - (g.current || 0);
            const isNearGoal = percent >= 80 && percent < 100;
            const isReached = percent >= 100;

            // Verificar se meta foi alcançada recentemente
            if (isReached && !g.reachedDate) {
                g.reachedDate = new Date().toISOString();
                Storage.saveUserData(Storage.getCurrentUser(), Auth.current());
                this.showToast('success', `🎉 Meta "${g.description}" alcançada!`);
            }

            return `
                <div class="transaction-item ${isReached ? 'success' : isNearGoal ? 'warning' : ''}" style="margin-bottom: 16px; cursor: default; ${isReached ? 'border-color: var(--success);' : ''}">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div>
                                <strong style="font-size: 18px; color: var(--text-primary);">${g.description || 'Sem descrição'}</strong>
                                ${isReached ? '<span class="badge badge-success" style="margin-left: 8px;">✅ Alcançada!</span>' : ''}
                                ${isNearGoal ? '<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning); border-color: var(--warning); margin-left: 8px;">Quase lá!</span>' : ''}
                            </div>
                            <span style="font-family: "JetBrains Mono", monospace; font-size: 16px; color: var(--text-secondary);">${this.format(g.current || 0)} / ${this.format(g.target || 0)}</span>
                        </div>
                        <div style="background: var(--bg-tertiary); height: 16px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border); margin-bottom: 8px; position: relative;">
                            <div style="background: ${isReached ? 'linear-gradient(90deg, var(--success) 0%, #059669 100%)' : 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)'}; height: 100%; width: ${Math.min(percent, 100)}%; transition: width 0.5s; box-shadow: ${isReached ? '0 0 20px rgba(16, 185, 129, 0.5)' : '0 0 15px rgba(99, 102, 241, 0.3)'};"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">${percent.toFixed(1)}% concluído</span>
                                ${!isReached ? `<span style="font-size: 12px; color: var(--text-tertiary); margin-left: 12px;">Faltam ${this.format(Math.max(0, remaining))}</span>` : ''}
                            </div>
                            <div style="display: flex; gap: 8px;">
                                ${!isReached ? `<button onclick="UI.addToGoal('${g.id}')" class="btn-action" title="Adicionar valor">+</button>` : ''}
                                <button onclick="Goals.remove('${g.id}'); UI.loadMetas();" class="btn-action danger">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    updateRelatorio() {
        const month = document.getElementById("report-month")?.value || new Date().toISOString().slice(0, 7);
        const typeFilter = document.getElementById("report-type")?.value || "";
        const categoryFilter = document.getElementById("report-category")?.value || "";
        const minValue = parseFloat(document.getElementById("report-min-value")?.value) || 0;
        const maxValue = parseFloat(document.getElementById("report-max-value")?.value) || Infinity;
        
        // Filtrar transações
        let transactions = Transactions.list({ month });
        
        if (typeFilter) {
            transactions = transactions.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter) {
            transactions = transactions.filter(t => t.category === categoryFilter);
        }
        
        if (minValue > 0) {
            transactions = transactions.filter(t => t.amount >= minValue);
        }
        
        if (maxValue !== Infinity) {
            transactions = transactions.filter(t => t.amount <= maxValue);
        }
        
        // Calcular resumo baseado nos filtros
        const summary = {
            gastos: transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0),
            receitas: transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0),
            saldo: 0
        };
        summary.saldo = summary.receitas - summary.gastos;
        
        const gastosPorCategoria = {};
        const receitasPorCategoria = {};

        transactions.forEach(t => {
            if (t.type === "gasto") {
                gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + t.amount;
            } else {
                receitasPorCategoria[t.category] = (receitasPorCategoria[t.category] || 0) + t.amount;
            }
        });

        const container = document.getElementById("relatorio-content");
        if (!container) return;

        const totalTransacoes = transactions.length;
        const mediaTransacao = totalTransacoes > 0 ? (summary.gastos + summary.receitas) / totalTransacoes : 0;

        container.innerHTML = `
            <div class="dashboard-grid" style="margin-bottom: 24px;">
                <div class="stat-card danger">
                    <div class="stat-label">Total de Gastos</div>
                    <div class="stat-value" style="color: var(--error);">${this.format(summary.gastos)}</div>
                    <div class="stat-trend">${transactions.filter(t => t.type === 'gasto').length} transação(ões)</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">Total de Receitas</div>
                    <div class="stat-value" style="color: var(--success);">${this.format(summary.receitas)}</div>
                    <div class="stat-trend">${transactions.filter(t => t.type === 'receita').length} transação(ões)</div>
                </div>
                <div class="stat-card ${summary.saldo >= 0 ? 'success' : 'danger'}">
                    <div class="stat-label">Saldo</div>
                    <div class="stat-value" style="color: ${summary.saldo >= 0 ? 'var(--success)' : 'var(--error)'};">${this.format(summary.saldo)}</div>
                    <div class="stat-trend">${totalTransacoes} transação(ões) no total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Média por Transação</div>
                    <div class="stat-value">${this.format(mediaTransacao)}</div>
                    <div class="stat-trend">Baseado nos filtros aplicados</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="card">
                    <h3 style="margin-bottom: 15px;">Gastos por Categoria</h3>
                    ${Object.keys(gastosPorCategoria).length === 0 ? 
                        '<p style="text-align: center; color: var(--text-soft);">Nenhum gasto registrado</p>' :
                        Object.entries(gastosPorCategoria)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, val]) => `
                                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e5e5e5;">
                                    <span>${cat}</span>
                                    <strong>${this.format(val)}</strong>
                                </div>
                            `).join("")
                    }
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 15px;">Receitas por Categoria</h3>
                    ${Object.keys(receitasPorCategoria).length === 0 ? 
                        '<p style="text-align: center; color: var(--text-soft);">Nenhuma receita registrada</p>' :
                        Object.entries(receitasPorCategoria)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, val]) => `
                                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e5e5e5;">
                                    <span>${cat}</span>
                                    <strong>${this.format(val)}</strong>
                                </div>
                            `).join("")
                    }
                </div>
            </div>
        `;
    },

    format(n) {
        return n.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    },

    // Exportar dados
    exportData() {
        const user = Auth.current();
        if (!user) return;

        const data = {
            profile: user.profile,
            transactions: user.transactions,
            categories: user.categories,
            goals: user.goals,
            budgets: user.budgets,
            settings: user.settings,
            exportDate: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeflow-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('success', 'Dados exportados com sucesso!');
    },

    // Exportar CSV
    exportCSV() {
        const transactions = Transactions.list();
        if (transactions.length === 0) {
            this.showToast('error', 'Nenhuma transação para exportar');
            return;
        }

        const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.type === 'gasto' ? 'Gasto' : 'Receita',
            t.category,
            t.description,
            t.amount.toFixed(2).replace('.', ','),
            t.status || 'pago'
        ]);

        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('success', 'CSV exportado com sucesso!');
    },

    // ======================================================
    // BUSCA GLOBAL
    // ======================================================

    initGlobalSearch() {
        const modal = document.getElementById("global-search-modal");
        const input = document.getElementById("global-search-input");
        const trigger = document.getElementById("global-search-trigger");

        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.openGlobalSearch();
            });
        }

        if (input) {
            input.addEventListener("input", (e) => {
                this.performGlobalSearch(e.target.value);
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    this.closeGlobalSearch();
                }
            });
        }

        // Fechar ao clicar no backdrop
        const backdrop = modal?.querySelector('.global-search-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeGlobalSearch();
            });
        }
    },

    openGlobalSearch() {
        const modal = document.getElementById("global-search-modal");
        const input = document.getElementById("global-search-input");
        
        if (modal && input) {
            modal.setAttribute("aria-hidden", "false");
            modal.style.display = "flex";
            setTimeout(() => {
                input.focus();
                input.select();
            }, 150);
        }
    },

    closeGlobalSearch() {
        const modal = document.getElementById("global-search-modal");
        const input = document.getElementById("global-search-input");
        
        if (modal) {
            modal.setAttribute("aria-hidden", "true");
            modal.style.display = "none";
            if (input) {
                input.value = "";
                this.performGlobalSearch("");
            }
        }
    },

    performGlobalSearch(query) {
        const resultsContainer = document.getElementById("global-search-results");
        if (!resultsContainer) return;

        if (!query.trim()) {
            resultsContainer.innerHTML = "";
            return;
        }

        const searchTerm = query.toLowerCase();
        const results = [];

        // Buscar transações
        Transactions.list().forEach(t => {
            if (t.description.toLowerCase().includes(searchTerm) ||
                t.category.toLowerCase().includes(searchTerm)) {
                results.push({
                    type: 'transaction',
                    title: t.description,
                    meta: `${t.category} • ${new Date(t.date).toLocaleDateString('pt-BR')} • ${this.format(t.amount)}`,
                    data: t
                });
            }
        });

        // Buscar categorias
        const user = Auth.current();
        if (user) {
            [...(user.categories?.gastos || []), ...(user.categories?.receitas || [])].forEach(cat => {
                if (cat.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'category',
                        title: cat,
                        meta: 'Categoria',
                        data: cat
                    });
                }
            });

            // Buscar metas
            (user.goals || []).forEach(goal => {
                if (goal.description?.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'goal',
                        title: goal.description,
                        meta: `Meta • ${this.format(goal.current)} / ${this.format(goal.target)}`,
                        data: goal
                    });
                }
            });
        }

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item"><div class="search-result-title">Nenhum resultado encontrado</div></div>';
            return;
        }

        resultsContainer.innerHTML = results.slice(0, 10).map(r => `
            <div class="search-result-item" onclick="UI.handleSearchResult('${r.type}', '${r.data.id || r.data}')">
                <div class="search-result-title">${r.title}</div>
                <div class="search-result-meta">${r.meta}</div>
            </div>
        `).join('');
    },

    handleSearchResult(type, id) {
        this.closeGlobalSearch();
        
        switch(type) {
            case 'transaction':
                this.showPage('transacoes');
                setTimeout(() => {
                    const item = document.querySelector(`[data-id="${id}"]`);
                    if (item) {
                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        item.style.background = 'rgba(99, 102, 241, 0.1)';
                        setTimeout(() => item.style.background = '', 2000);
                    }
                }, 300);
                break;
            case 'category':
                this.showPage('categorias');
                break;
            case 'goal':
                this.showPage('metas');
                break;
        }
    },

    // ======================================================
    // TEMA ESCURO/CLARO
    // ======================================================

    initMobileMenu() {
        const menuToggle = document.getElementById("menu-toggle");
        const sidebar = document.getElementById("sidebar");
        const sidebarClose = document.getElementById("sidebar-close");
        const sidebarOverlay = document.getElementById("sidebar-overlay");
        
        if (!sidebar) return;
        
        // Função para verificar se está em mobile
        const isMobile = () => window.innerWidth <= 768;
        
        const updateSidebarState = () => {
            if (isMobile()) {
                // Mobile: sidebar oculta por padrão
                sidebar.setAttribute("aria-hidden", "true");
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove("active");
                }
            } else {
                // Desktop: sidebar sempre visível
                sidebar.setAttribute("aria-hidden", "false");
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove("active");
                    sidebarOverlay.style.display = "none";
                    sidebarOverlay.style.pointerEvents = "none";
                }
                document.body.style.overflow = "";
            }
        };
        
        const openMenu = () => {
            if (!isMobile()) return;
            sidebar.setAttribute("aria-hidden", "false");
            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "true");
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.add("active");
            }
            document.body.style.overflow = "hidden";
        };
        
        const closeMenu = () => {
            if (!isMobile()) return;
            sidebar.setAttribute("aria-hidden", "true");
            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "false");
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove("active");
            }
            document.body.style.overflow = "";
        };
        
        // Inicializar estado
        updateSidebarState();
        
        // Event listeners
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (sidebar.getAttribute("aria-hidden") === "true") {
                    openMenu();
                } else {
                    closeMenu();
                }
            });
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                closeMenu();
            });
        }
        
        // Fechar menu quando clicar em um item de navegação em mobile
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (isMobile()) {
                    setTimeout(() => closeMenu(), 100);
                }
            });
        });
        
        // Atualizar ao redimensionar
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateSidebarState();
            }, 250);
        });
    },

    initThemeToggle() {
        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
            
            // Atualizar ícone baseado no tema atual
            const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
            toggle.textContent = currentTheme === "dark" ? "☀️" : "🌙";
        }
    },

    toggleTheme() {
        const user = Auth.current();
        if (!user) return;

        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "light" ? "dark" : "light";

        this.applyTheme(newTheme);

        if (!user.settings) user.settings = {};
        user.settings.theme = newTheme;
        Storage.saveUserData(Storage.getCurrentUser(), user);

        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
        }
    },

    applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.textContent = theme === "dark" ? "☀️" : "🌙";
        }
    },

    // ======================================================
    // ATALHOS DE TECLADO
    // ======================================================

    initKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Ctrl+K ou Cmd+K para busca
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                this.openGlobalSearch();
                return;
            }

            // Ctrl+/ para ajuda
            if ((e.ctrlKey || e.metaKey) && e.key === "/") {
                e.preventDefault();
                this.showKeyboardShortcuts();
                return;
            }

            // Escape para fechar modais
            if (e.key === "Escape") {
                const modal = document.querySelector(".modal-overlay:not([style*='display: none'])");
                if (modal) modal.remove();
                
                const searchModal = document.getElementById("global-search-modal");
                if (searchModal && searchModal.getAttribute("aria-hidden") === "false") {
                    this.closeGlobalSearch();
                }
                return;
            }

            // Navegação rápida (1-7)
            if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= "1" && e.key <= "9") {
                const pages = ["dashboard", "transacoes", "categorias", "orcamento", "metas", "relatorios", "recorrencias", "contas", "configuracoes"];
                const index = parseInt(e.key) - 1;
                if (pages[index]) {
                    const navItem = document.querySelector(`.nav-item[data-page="${pages[index]}"]`);
                    if (navItem && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
                        navItem.click();
                    }
                }
            }
        });
    },

    showKeyboardShortcuts() {
        const modal = document.createElement("div");
        modal.className = "shortcuts-modal";
        modal.innerHTML = `
            <div class="shortcuts-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="margin: 0;">Atalhos de Teclado</h2>
                    <button onclick="this.closest('.shortcuts-modal').remove()" class="btn-action">✕</button>
                </div>
                <div class="shortcut-item">
                    <span>Buscar global</span>
                    <span class="shortcut-key">Ctrl+K</span>
                </div>
                <div class="shortcut-item">
                    <span>Mostrar ajuda</span>
                    <span class="shortcut-key">Ctrl+/</span>
                </div>
                <div class="shortcut-item">
                    <span>Fechar modais</span>
                    <span class="shortcut-key">Esc</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Dashboard</span>
                    <span class="shortcut-key">1</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Transações</span>
                    <span class="shortcut-key">2</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Categorias</span>
                    <span class="shortcut-key">3</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Orçamento</span>
                    <span class="shortcut-key">4</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Metas</span>
                    <span class="shortcut-key">5</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Relatórios</span>
                    <span class="shortcut-key">6</span>
                </div>
                <div class="shortcut-item">
                    <span>Ir para Configurações</span>
                    <span class="shortcut-key">9</span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    // Notificações toast
    showToast(type, message) {
        let container = document.getElementById('toast-container') || document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span style="font-size: 20px;">${icons[type] || '•'}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInRight .3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ======================================================
    // NOVAS FUNCIONALIDADES - Páginas Adicionais
    // ======================================================

    renderRecorrencias() {
        const page = document.getElementById("page-recorrencias");
        if (!page) return;

        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Recorrências</h1></header>';

        page.innerHTML = headerHTML + `
            <div class="dashboard-grid">
                <div class="card">
                    <h3 class="chart-title">Nova Recorrência</h3>
                    <form id="form-recorrencia">
                        <div class="form-grid">
                            <div>
                                <label>Descrição</label>
                                <input type="text" id="rec-description" class="form-input" required>
                            </div>
                            <div>
                                <label>Tipo</label>
                                <select id="rec-type" class="form-input" required>
                                    <option value="gasto">Gasto</option>
                                    <option value="receita">Receita</option>
                                </select>
                            </div>
                            <div>
                                <label>Categoria</label>
                                <select id="rec-category" class="form-input" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div style="grid-column: span 2;">
                                <label>Valor (R$)</label>
                                <input type="number" id="rec-amount" class="form-input input-number" step="0.01" min="0.01" placeholder="0,00" required style="width: 100%;">
                            </div>
                            <div>
                                <label>Frequência</label>
                                <select id="rec-frequency" class="form-input" required>
                                    <option value="daily">Diária</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly" selected>Mensal</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                            <div>
                                <label>Dia do Mês</label>
                                <input type="number" id="rec-day" class="form-input" min="1" max="31" value="1" style="font-size: 16px; padding: 14px 18px; min-height: 48px;">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Criar Recorrência</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="chart-title">Recorrências Ativas</h3>
                    <div id="recorrencias-list"></div>
                </div>
            </div>
        `;

        this.updateCategorySelect("rec-category");
        this.loadRecorrencias();

        document.getElementById("form-recorrencia").addEventListener("submit", (e) => {
            e.preventDefault();
            const result = Recurrences.add({
                description: document.getElementById("rec-description").value.trim(),
                type: document.getElementById("rec-type").value,
                category: document.getElementById("rec-category").value,
                amount: parseFloat(document.getElementById("rec-amount").value),
                frequency: document.getElementById("rec-frequency").value,
                day: parseInt(document.getElementById("rec-day").value) || null
            });

            if (result.success) {
                this.showToast('success', 'Recorrência criada com sucesso!');
                document.getElementById("form-recorrencia").reset();
                this.loadRecorrencias();
            }
        });
    },

    loadRecorrencias() {
        const container = document.getElementById("recorrencias-list");
        if (!container) return;

        const recurrences = Recurrences.list();
        if (recurrences.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔄</div><div class="empty-state-title">Nenhuma recorrência</div><div class="empty-state-text">Crie recorrências para automatizar suas transações</div></div>';
            return;
        }

        container.innerHTML = recurrences.map(r => `
            <div class="transaction-item" style="margin-bottom: 12px;">
                <div class="transaction-info">
                    <div>
                        <h4 class="transaction-details">${r.description}</h4>
                        <div class="transaction-meta">
                            <span class="badge ${r.type === 'gasto' ? 'badge-danger' : 'badge-success'}">${r.type === 'gasto' ? 'Gasto' : 'Receita'}</span>
                            <span>${r.category}</span>
                            <span>•</span>
                            <span>${this.getFrequencyLabel(r.frequency)}</span>
                            <span>•</span>
                            <span>Próxima: ${new Date(r.nextExecution).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="stat-value" style="font-size: 18px;">${this.format(r.amount)}</div>
                    <div class="transaction-actions">
                        <button onclick="Recurrences.toggle('${r.id}'); UI.loadRecorrencias();" class="btn-action" title="${r.active ? 'Desativar' : 'Ativar'}">${r.active ? '⏸️' : '▶️'}</button>
                        <button onclick="Recurrences.remove('${r.id}'); UI.loadRecorrencias();" class="btn-action danger">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    getFrequencyLabel(frequency) {
        const labels = {
            daily: 'Diária',
            weekly: 'Semanal',
            monthly: 'Mensal',
            yearly: 'Anual'
        };
        return labels[frequency] || frequency;
    },

    renderContas() {
        const page = document.getElementById("page-contas");
        if (!page) return;

        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Contas e Carteiras</h1></header>';

        page.innerHTML = headerHTML + `
            <div class="dashboard-grid">
                <div class="card">
                    <h3 class="chart-title">Nova Conta</h3>
                    <form id="form-conta">
                        <div class="form-grid">
                            <div>
                                <label>Nome</label>
                                <input type="text" id="acc-name" class="form-input" required>
                            </div>
                            <div>
                                <label>Tipo</label>
                                <select id="acc-type" class="form-input" required>
                                    <option value="checking">Conta Corrente</option>
                                    <option value="savings">Poupança</option>
                                    <option value="credit">Cartão de Crédito</option>
                                    <option value="cash">Dinheiro</option>
                                    <option value="investment">Investimento</option>
                                </select>
                            </div>
                            <div style="grid-column: span 2;">
                                <label>Saldo Inicial (R$)</label>
                                <input type="number" id="acc-balance" class="form-input input-number" step="0.01" value="0" placeholder="0,00" style="width: 100%;">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Criar Conta</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="chart-title">Suas Contas</h3>
                    <div id="contas-list"></div>
                </div>
            </div>
        `;

        this.loadContas();

        document.getElementById("form-conta").addEventListener("submit", (e) => {
            e.preventDefault();
            const result = Accounts.add({
                name: document.getElementById("acc-name").value.trim(),
                type: document.getElementById("acc-type").value,
                balance: parseFloat(document.getElementById("acc-balance").value) || 0
            });

            if (result.success) {
                this.showToast('success', 'Conta criada com sucesso!');
                document.getElementById("form-conta").reset();
                this.loadContas();
            }
        });
    },

    loadContas() {
        const container = document.getElementById("contas-list");
        if (!container) return;

        const accounts = Accounts.list();
        container.innerHTML = accounts.map(acc => {
            const balance = Accounts.getBalance(acc.id);
            return `
                <div class="stat-card" style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${acc.name}</div>
                            <div style="font-size: 13px; color: var(--text-secondary); text-transform: capitalize;">${acc.type}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="stat-value" style="font-size: 24px;">${this.format(balance)}</div>
                            ${acc.id !== 'default' ? `<button onclick="Accounts.remove('${acc.id}'); UI.loadContas();" class="btn-action danger" style="margin-top: 8px;">🗑️</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEtiquetas() {
        const page = document.getElementById("page-etiquetas");
        if (!page) return;

        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Etiquetas</h1></header>';

        page.innerHTML = headerHTML + `
            <div class="dashboard-grid">
                <div class="card">
                    <h3 class="chart-title">Nova Etiqueta</h3>
                    <form id="form-etiqueta">
                        <div class="form-grid">
                            <div>
                                <label>Nome</label>
                                <input type="text" id="tag-name" class="form-input" required>
                            </div>
                            <div>
                                <label>Cor</label>
                                <input type="color" id="tag-color" class="form-input" value="#3b82f6">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Criar Etiqueta</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="chart-title">Etiquetas Disponíveis</h3>
                    <div id="etiquetas-list" style="display: flex; flex-wrap: wrap; gap: 12px;"></div>
                </div>
            </div>
        `;

        this.loadEtiquetas();

        document.getElementById("form-etiqueta").addEventListener("submit", (e) => {
            e.preventDefault();
            const result = Tags.add(
                document.getElementById("tag-name").value.trim(),
                document.getElementById("tag-color").value
            );

            if (result.success) {
                this.showToast('success', 'Etiqueta criada com sucesso!');
                document.getElementById("form-etiqueta").reset();
                document.getElementById("tag-color").value = '#3b82f6';
                this.loadEtiquetas();
            } else {
                this.showToast('error', result.message || 'Erro ao criar etiqueta');
            }
        });
    },

    loadEtiquetas() {
        const container = document.getElementById("etiquetas-list");
        if (!container) return;

        const tags = Tags.list();
        if (tags.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏷️</div><div class="empty-state-title">Nenhuma etiqueta</div></div>';
            return;
        }

        container.innerHTML = tags.map(tag => `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: ${tag.color}20; border: 2px solid ${tag.color}; border-radius: var(--radius-full);">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${tag.color};"></div>
                <span style="font-weight: 600; color: var(--text-primary);">${tag.name}</span>
                <button onclick="Tags.remove('${tag.id}'); UI.loadEtiquetas();" class="btn-action danger" style="width: 24px; height: 24px; font-size: 12px; padding: 0;">✕</button>
            </div>
        `).join('');
    },

    renderAlertas() {
        const page = document.getElementById("page-alertas");
        if (!page) return;

        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Alertas e Lembretes</h1></header>';

        page.innerHTML = headerHTML + `
            <div class="dashboard-grid">
                <div class="card">
                    <h3 class="chart-title">Novo Alerta</h3>
                    <form id="form-alerta">
                        <div class="form-grid">
                            <div>
                                <label>Título</label>
                                <input type="text" id="alert-title" class="form-input" required>
                            </div>
                            <div>
                                <label>Tipo</label>
                                <select id="alert-condition" class="form-input" required>
                                    <option value="budget_exceeded">Orçamento Ultrapassado</option>
                                    <option value="low_balance">Saldo Baixo</option>
                                    <option value="high_expense">Gasto Alto</option>
                                </select>
                            </div>
                            <div style="grid-column: span 2;">
                                <label>Valor Limite (R$ - se aplicável)</label>
                                <input type="number" id="alert-threshold" class="form-input input-number" step="0.01" min="0.01" placeholder="0,00" style="width: 100%;">
                            </div>
                            <div>
                                <label>Mensagem</label>
                                <input type="text" id="alert-message" class="form-input" placeholder="Mensagem opcional">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Criar Alerta</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="chart-title">Alertas Ativos</h3>
                    <div id="alertas-list"></div>
                </div>
            </div>
        `;

        this.loadAlertas();

        document.getElementById("form-alerta").addEventListener("submit", (e) => {
            e.preventDefault();
            const result = Alerts.add({
                title: document.getElementById("alert-title").value.trim(),
                message: document.getElementById("alert-message").value.trim(),
                condition: document.getElementById("alert-condition").value,
                threshold: parseFloat(document.getElementById("alert-threshold").value) || 0
            });

            if (result.success) {
                this.showToast('success', 'Alerta criado com sucesso!');
                document.getElementById("form-alerta").reset();
                this.loadAlertas();
            }
        });
    },

    loadAlertas() {
        const container = document.getElementById("alertas-list");
        if (!container) return;

        const alerts = Alerts.list();
        if (alerts.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-title">Nenhum alerta</div></div>';
            return;
        }

        const conditionLabels = {
            budget_exceeded: 'Orçamento Ultrapassado',
            low_balance: 'Saldo Baixo',
            high_expense: 'Gasto Alto'
        };

        container.innerHTML = alerts.map(alert => `
            <div class="transaction-item" style="margin-bottom: 12px;">
                <div class="transaction-info">
                    <div>
                        <h4 class="transaction-details">${alert.title}</h4>
                        <div class="transaction-meta">
                            <span class="badge badge-success">${conditionLabels[alert.condition] || alert.condition}</span>
                            ${alert.threshold > 0 ? `<span>Limite: ${this.format(alert.threshold)}</span>` : ''}
                            ${alert.message ? `<span>• ${alert.message}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="transaction-actions">
                    <button onclick="Alerts.toggle('${alert.id}'); UI.loadAlertas();" class="btn-action" title="${alert.active ? 'Desativar' : 'Ativar'}">${alert.active ? '🔔' : '🔕'}</button>
                    <button onclick="Alerts.remove('${alert.id}'); UI.loadAlertas();" class="btn-action danger">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    renderHistorico() {
        const page = document.getElementById("page-historico");
        if (!page) return;

        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Histórico de Atividades</h1></header>';

        const transactions = Transactions.list().sort((a, b) => new Date(b.date) - new Date(a.date));
        const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

        page.innerHTML = headerHTML + `
            <div class="card">
                <div id="historico-content">
                    ${months.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-title">Nenhuma transação</div></div>' : months.map(month => {
                        const monthTrans = transactions.filter(t => t.date.startsWith(month));
                        const monthDate = new Date(month + '-01');
                        return `
                            <div style="margin-bottom: 32px;">
                                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">
                                    ${monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div class="transaction-list">
                                    ${monthTrans.map(t => `
                                        <div class="transaction-item">
                                            <div class="transaction-info">
                                                <div>
                                                    <h4 class="transaction-details">${t.description}</h4>
                                                    <div class="transaction-meta">
                                                        <span class="badge ${t.type === 'gasto' ? 'badge-danger' : 'badge-success'}">${t.type === 'gasto' ? 'Gasto' : 'Receita'}</span>
                                                        <span>${t.category}</span>
                                                        <span>•</span>
                                                        <span>${new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="transaction-amount">${t.type === 'gasto' ? '-' : '+'}${this.format(t.amount)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderConfiguracoes() {
        const page = document.getElementById("page-configuracoes");
        if (!page) return;

        const user = Auth.current();
        const settings = user.settings || {};

        const header = page.querySelector('.page-header');
        const headerHTML = header ? header.outerHTML : '<header class="page-header"><h1 class="section-title">Configurações</h1></header>';

        const primaryColors = [
            { name: 'Azul', value: '#6366f1' },
            { name: 'Roxo', value: '#8b5cf6' },
            { name: 'Verde', value: '#10b981' },
            { name: 'Vermelho', value: '#ef4444' },
            { name: 'Laranja', value: '#f59e0b' },
            { name: 'Rosa', value: '#ec4899' },
            { name: 'Ciano', value: '#06b6d4' },
            { name: 'Amarelo', value: '#eab308' }
        ];

        page.innerHTML = headerHTML + `
            <div class="dashboard-grid">
                <div class="card">
                    <h3 class="chart-title">Aparência</h3>
                    <form id="form-appearance">
                        <div class="form-grid">
                            <div>
                                <label>Cor Primária</label>
                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px;">
                                    ${primaryColors.map(color => `
                                        <button 
                                            type="button"
                                            class="color-picker-btn ${settings.primaryColor === color.value ? 'active' : ''}"
                                            data-color="${color.value}"
                                            style="
                                                width: 100%;
                                                height: 40px;
                                                background: ${color.value};
                                                border: 2px solid ${settings.primaryColor === color.value ? '#000' : 'transparent'};
                                                border-radius: var(--radius-md);
                                                cursor: pointer;
                                                transition: all 0.2s;
                                            "
                                            title="${color.name}"
                                            onclick="UI.selectPrimaryColor('${color.value}')"
                                        ></button>
                                    `).join('')}
                                </div>
                                <input type="hidden" id="setting-primaryColor" value="${settings.primaryColor || '#6366f1'}">
                            </div>
                            <div>
                                <label>Modo de Exibição</label>
                                <select id="setting-displayMode" class="form-input">
                                    <option value="comfortable" ${settings.displayMode === 'comfortable' ? 'selected' : ''}>Confortável</option>
                                    <option value="compact" ${settings.displayMode === 'compact' ? 'selected' : ''}>Compacto</option>
                                </select>
                            </div>
                            <div>
                                <label>Tamanho da Fonte</label>
                                <select id="setting-fontSize" class="form-input">
                                    <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Pequeno</option>
                                    <option value="medium" ${settings.fontSize === 'medium' || !settings.fontSize ? 'selected' : ''}>Médio</option>
                                    <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Grande</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Salvar Aparência</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="chart-title">Preferências</h3>
                    <form id="form-settings">
                        <div class="form-grid">
                            <div>
                                <label>Moeda</label>
                                <select id="setting-currency" class="form-input">
                                    <option value="BRL" ${settings.currency === 'BRL' ? 'selected' : ''}>R$ Real (BRL)</option>
                                    <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>$ Dólar (USD)</option>
                                    <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>€ Euro (EUR)</option>
                                </select>
                            </div>
                            <div>
                                <label>Formato de Data</label>
                                <select id="setting-dateFormat" class="form-input">
                                    <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/AAAA</option>
                                    <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/AAAA</option>
                                    <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>AAAA-MM-DD</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Salvar Configurações</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="chart-title">Dados</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button onclick="UI.exportData()" class="btn-secondary">📥 Exportar Dados (JSON)</button>
                        <button onclick="AdvancedFeatures.exportToExcel()" class="btn-secondary">📊 Exportar Excel</button>
                        <button onclick="UI.backupData()" class="btn-secondary">💾 Criar Backup</button>
                        <button onclick="UI.importData()" class="btn-secondary">📤 Importar Dados</button>
                    </div>
                </div>

                <div class="card">
                    <h3 class="chart-title">Modo Economia</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">
                        Receba alertas inteligentes quando seus gastos estiverem acima do normal.
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <button id="enable-economy-btn" class="btn-secondary" style="flex: 1;">✅ Ativar</button>
                        <button id="disable-economy-btn" class="btn-secondary" style="flex: 1;">❌ Desativar</button>
                    </div>
                    <div id="economy-status" style="margin-top: 12px; padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 12px; color: var(--text-secondary);"></div>
                </div>

                <div class="card">
                    <h3 class="chart-title">Backup Automático</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 13px;">
                        Configure backups automáticos dos seus dados.
                    </p>
                    <div class="form-grid" style="margin-bottom: 12px;">
                        <div>
                            <label>Intervalo (dias)</label>
                            <input type="number" id="backup-interval" class="form-input" value="7" min="1" max="30" style="font-size: 16px; padding: 14px 18px; min-height: 48px;">
                        </div>
                    </div>
                    <button id="setup-backup-btn" class="btn-secondary" style="width: 100%;">⚙️ Configurar Backup Automático</button>
                    <div id="backup-status" style="margin-top: 12px; padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 12px; color: var(--text-secondary);"></div>
                </div>

                <div class="card">
                    <h3 class="chart-title">Onboarding</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">
                        Revise o tour guiado para conhecer todas as funcionalidades do FinanceFlow.
                    </p>
                    <button id="restart-onboarding-btn" class="btn-secondary">🔄 Refazer Tour</button>
                </div>
            </div>
        `;

        document.getElementById("form-appearance").addEventListener("submit", (e) => {
            e.preventDefault();
            const user = Auth.current();
            if (!user.settings) user.settings = {};
            
            user.settings.primaryColor = document.getElementById("setting-primaryColor").value;
            user.settings.displayMode = document.getElementById("setting-displayMode").value;
            user.settings.fontSize = document.getElementById("setting-fontSize").value;
            
            Storage.saveUserData(Storage.getCurrentUser(), user);
            this.applyCustomTheme(user.settings);
            this.showToast('success', 'Aparência atualizada com sucesso!');
        });

        document.getElementById("form-settings").addEventListener("submit", (e) => {
            e.preventDefault();
            const user = Auth.current();
            if (!user.settings) user.settings = {};
            
            user.settings.currency = document.getElementById("setting-currency").value;
            user.settings.dateFormat = document.getElementById("setting-dateFormat").value;
            
            Storage.saveUserData(Storage.getCurrentUser(), user);
            this.showToast('success', 'Configurações salvas com sucesso!');
        });

        // Botão de refazer tour
        const restartBtn = document.getElementById("restart-onboarding-btn");
        if (restartBtn) {
            restartBtn.addEventListener("click", () => {
                if (typeof Onboarding !== 'undefined' && Onboarding.start) {
                    // Resetar status de onboarding
                    const user = Auth.current();
                    if (user && user.settings) {
                        user.settings.onboardingCompleted = false;
                        Storage.saveUserData(Storage.getCurrentUser(), user);
                    }
                    Onboarding.start();
                    this.showToast('info', 'Tour reiniciado!');
                } else {
                    this.showToast('error', 'Sistema de onboarding não disponível');
                }
            });
        }

        // Modo Economia
        const enableEconomyBtn = document.getElementById("enable-economy-btn");
        const disableEconomyBtn = document.getElementById("disable-economy-btn");
        const economyStatus = document.getElementById("economy-status");
        
        if (enableEconomyBtn) {
            enableEconomyBtn.addEventListener("click", () => {
                if (typeof AdvancedFeatures !== 'undefined') {
                    AdvancedFeatures.enableEconomyMode();
                    this.updateEconomyStatus();
                }
            });
        }
        
        if (disableEconomyBtn) {
            disableEconomyBtn.addEventListener("click", () => {
                if (typeof AdvancedFeatures !== 'undefined') {
                    AdvancedFeatures.disableEconomyMode();
                    this.updateEconomyStatus();
                }
            });
        }
        
        this.updateEconomyStatus();

        // Backup Automático
        const setupBackupBtn = document.getElementById("setup-backup-btn");
        const backupStatus = document.getElementById("backup-status");
        
        if (setupBackupBtn) {
            setupBackupBtn.addEventListener("click", () => {
                const interval = parseInt(document.getElementById("backup-interval")?.value) || 7;
                if (typeof AdvancedFeatures !== 'undefined') {
                    AdvancedFeatures.setupAutoBackup(interval);
                    this.updateBackupStatus();
                }
            });
        }
        
        this.updateBackupStatus();
    },

    updateEconomyStatus() {
        const statusEl = document.getElementById("economy-status");
        if (!statusEl) return;
        
        const user = Auth.current();
        const isEnabled = user?.settings?.economyMode || false;
        
        if (isEnabled) {
            const enabledAt = user.settings.economyModeEnabledAt 
                ? new Date(user.settings.economyModeEnabledAt).toLocaleDateString('pt-BR')
                : 'recentemente';
            statusEl.innerHTML = `✅ Ativo desde ${enabledAt}`;
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.innerHTML = '❌ Desativado';
            statusEl.style.color = 'var(--text-secondary)';
        }
    },

    updateBackupStatus() {
        const statusEl = document.getElementById("backup-status");
        if (!statusEl) return;
        
        const user = Auth.current();
        const isEnabled = user?.settings?.autoBackup || false;
        
        if (isEnabled) {
            const interval = user.settings.autoBackupInterval || 7;
            const lastBackup = user.settings.lastBackup 
                ? new Date(user.settings.lastBackup).toLocaleDateString('pt-BR')
                : 'Nunca';
            statusEl.innerHTML = `✅ Ativo (a cada ${interval} dias)<br>Último backup: ${lastBackup}`;
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.innerHTML = '❌ Não configurado';
            statusEl.style.color = 'var(--text-secondary)';
        }
    },

    selectPrimaryColor(color) {
        document.getElementById("setting-primaryColor").value = color;
        document.querySelectorAll('.color-picker-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.borderColor = 'transparent';
            if (btn.getAttribute('data-color') === color) {
                btn.classList.add('active');
                btn.style.borderColor = '#000';
            }
        });
        
        // Preview imediato
        const user = Auth.current();
        if (user && !user.settings) user.settings = {};
        if (user) user.settings.primaryColor = color;
        this.applyCustomTheme(user.settings);
    },

    applyCustomTheme(settings) {
        if (!settings) return;
        
        const root = document.documentElement;
        
        // Aplicar cor primária
        if (settings.primaryColor) {
            root.style.setProperty('--primary', settings.primaryColor);
            // Calcular cor escura e clara
            const darkColor = this.darkenColor(settings.primaryColor, 20);
            const lightColor = this.lightenColor(settings.primaryColor, 20);
            root.style.setProperty('--primary-dark', darkColor);
            root.style.setProperty('--primary-light', lightColor);
        }
        
        // Aplicar modo de exibição
        if (settings.displayMode === 'compact') {
            document.body.classList.add('display-compact');
        } else {
            document.body.classList.remove('display-compact');
        }
        
        // Aplicar tamanho da fonte
        if (settings.fontSize) {
            root.setAttribute('data-font-size', settings.fontSize);
        }
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) - amt));
        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) - amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    backupData() {
        const user = Auth.current();
        if (!user) return;

        const dataStr = JSON.stringify(user, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('success', 'Backup criado com sucesso!');
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const currentUsername = Storage.getCurrentUser();
                    Storage.saveUserData(currentUsername, data);
                    this.showToast('success', 'Dados importados com sucesso!');
                    setTimeout(() => location.reload(), 1000);
                } catch (error) {
                    this.showToast('error', 'Erro ao importar dados');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },


    // ======================================================
    // FILTROS SALVOS
    // ======================================================

    saveCurrentFilter() {
        const name = prompt("Nome para este filtro:");
        if (!name || !name.trim()) return;

        const filters = {
            search: document.getElementById("filter-search")?.value || "",
            type: document.getElementById("filter-type")?.value || "",
            category: document.getElementById("filter-category")?.value || "",
            month: document.getElementById("filter-month")?.value || ""
        };

        const result = SavedFilters.add({ name: name.trim(), filters });
        if (result.success) {
            this.showToast('success', 'Filtro salvo com sucesso!');
            this.loadSavedFilters();
        }
    },

    loadSavedFilters() {
        const container = document.getElementById("saved-filters-list");
        if (!container) return;

        const savedFilters = SavedFilters.list();
        if (savedFilters.length === 0) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = savedFilters.map(f => `
            <button 
                class="badge badge-success" 
                onclick="UI.applySavedFilter('${f.id}')"
                style="cursor: pointer; padding: 6px 12px;"
                title="${f.name}"
            >
                ${f.name} ✕
            </button>
        `).join('');
    },

    applySavedFilter(id) {
        const filters = SavedFilters.apply(id);
        if (!filters) return;

        if (document.getElementById("filter-search")) document.getElementById("filter-search").value = filters.search || "";
        if (document.getElementById("filter-type")) document.getElementById("filter-type").value = filters.type || "";
        if (document.getElementById("filter-category")) document.getElementById("filter-category").value = filters.category || "";
        if (document.getElementById("filter-month")) document.getElementById("filter-month").value = filters.month || "";

        this.applyFilters();
        this.showToast('info', 'Filtro aplicado!');
    },

    showSavedFilters() {
        const savedFilters = SavedFilters.list();
        if (savedFilters.length === 0) {
            this.showToast('info', 'Nenhum filtro salvo');
            return;
        }

        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2>Filtros Salvos</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn-action">✕</button>
                </div>
                <div>
                    ${savedFilters.map(f => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
                            <div>
                                <div style="font-weight: 600;">${f.name}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">
                                    ${f.filters.type || 'Todos tipos'} • ${f.filters.category || 'Todas categorias'}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="UI.applySavedFilter('${f.id}'); this.closest('.modal-overlay').remove();" class="btn-action">✓</button>
                                <button onclick="SavedFilters.remove('${f.id}'); UI.showSavedFilters();" class="btn-action danger">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    // ======================================================
    // METAS MELHORADAS
    // ======================================================

    addToGoal(goalId) {
        const amountStr = prompt("Quanto deseja adicionar a esta meta?");
        if (!amountStr || amountStr.trim() === '') return;
        
        const amount = parseFloat(amountStr.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
            this.showToast('error', 'Valor inválido');
            return;
        }

        const user = Auth.current();
        if (!user) return;

        const goal = user.goals.find(g => g.id === goalId);
        if (!goal) {
            this.showToast('error', 'Meta não encontrada');
            return;
        }

        goal.current = (goal.current || 0) + amount;
        Storage.saveUserData(Storage.getCurrentUser(), user);
        this.loadMetas();
        this.updateDashboard();
        this.showToast('success', `${this.format(amount)} adicionado à meta "${goal.description}"!`);
    }
};
