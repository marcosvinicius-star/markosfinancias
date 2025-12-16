// ======================================================
// APP INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const app = document.getElementById("app-wrapper");
    const loginWrapper = document.getElementById("login-wrapper");

    // Verificar se já está logado
    const checkAuth = () => {
        const current = Auth.current();
        if (current) {
            if (loginWrapper) {
                loginWrapper.style.display = "none";
                loginWrapper.setAttribute("aria-hidden", "true");
            }
            if (app) {
                app.style.display = "flex";
                app.setAttribute("aria-hidden", "false");
            }
            if (typeof UI !== 'undefined' && UI.loadUser) {
                UI.loadUser();
            }
            
            // Verificar e executar recorrências diariamente
            if (typeof Recurrences !== 'undefined' && Recurrences.checkAndExecute) {
                Recurrences.checkAndExecute();
            }
            
            // Verificar alertas
            if (typeof Alerts !== 'undefined' && Alerts.checkAlerts) {
                const triggeredAlerts = Alerts.checkAlerts();
                if (triggeredAlerts.length > 0 && typeof UI !== 'undefined' && UI.showToast) {
                    triggeredAlerts.forEach(alert => {
                        UI.showToast('info', alert.title + (alert.message ? ': ' + alert.message : ''));
                    });
                }
            }
            
            // Verificar modo economia e backup automático
            setTimeout(() => {
                if (typeof AdvancedFeatures !== 'undefined') {
                    if (AdvancedFeatures.checkEconomyMode) AdvancedFeatures.checkEconomyMode();
                    if (AdvancedFeatures.checkAutoBackup) AdvancedFeatures.checkAutoBackup();
                }
            }, 3000);
        }
    };
    
    checkAuth();

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const userInput = document.getElementById("login-name");
            const passInput = document.getElementById("login-pass");
            const submitBtn = document.getElementById("login-submit-btn");

            if (!userInput || !passInput) {
                console.error('Campos de login não encontrados');
                return;
            }

            const user = userInput.value.trim();
            const pass = passInput.value.trim();

            // Validações
            if (!user || user.length < 3) {
                alert('Nome de usuário deve ter pelo menos 3 caracteres');
                userInput.focus();
                return;
            }

            if (!pass || pass.length < 4) {
                alert('Senha deve ter pelo menos 4 caracteres');
                passInput.focus();
                return;
            }

            // Loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Entrando...';
            }

            try {
                // Tentar login
                let result = Auth.login(user, pass);

                if (!result || !result.success) {
                    // Se não existir, criar conta
                    const reg = Auth.register(user, pass);
                    if (!reg || !reg.success) {
                        alert(reg?.message || 'Erro ao criar conta. Tente novamente.');
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = '<span>Entrar</span>';
                        }
                        return;
                    }

                    alert('Conta criada com sucesso! Fazendo login...');
                    // Login automático após registro
                    result = Auth.login(user, pass);
                }

                if (result && result.success) {
                    // Esconder login, mostrar app
                    if (loginWrapper) {
                        loginWrapper.style.display = "none";
                        loginWrapper.setAttribute("aria-hidden", "true");
                    }
                    if (app) {
                        app.style.display = "flex";
                        app.setAttribute("aria-hidden", "false");
                    }

                    // Carregar interface do usuário
                    setTimeout(() => {
                        if (typeof UI !== 'undefined' && UI.loadUser) {
                            UI.loadUser();
                        }
                        if (typeof UI !== 'undefined' && UI.showToast) {
                            UI.showToast('success', `Bem-vindo, ${user}!`);
                        }
                    }, 100);
                } else {
                    alert(result?.message || 'Erro ao fazer login');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>Entrar</span>';
                    }
                }
            } catch (error) {
                console.error('Erro no login:', error);
                alert('Erro ao fazer login: ' + (error.message || 'Erro desconhecido'));
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Entrar</span>';
                }
            }
        });
    }

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            Auth.logout();
            location.reload();
        };
    }
});
