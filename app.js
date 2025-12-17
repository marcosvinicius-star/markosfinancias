// ======================================================
// APP INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const forgotForm = document.getElementById("forgot-form");
    const app = document.getElementById("app-wrapper");
    const loginWrapper = document.getElementById("login-wrapper");

    // Opções do login
    const userInput = document.getElementById("login-name");
    const passInput = document.getElementById("login-pass");
    const submitBtn = document.getElementById("login-submit-btn");
    const togglePasswordBtn = document.getElementById("toggle-password-btn");
    const registerBtn = document.getElementById("register-btn");
    const forgotPasswordBtn = document.getElementById("forgot-password-btn");
    const backToLoginBtn = document.getElementById("back-to-login-btn");
    const forgotUsername = document.getElementById("forgot-username");
    const forgotNewPass = document.getElementById("forgot-new-pass");
    const forgotConfirmPass = document.getElementById("forgot-confirm-pass");

    const showForgot = () => {
        if (loginForm) loginForm.style.display = "none";
        if (forgotForm) forgotForm.style.display = "block";
        // Preencher com o usuário digitado, se existir
        if (forgotUsername && userInput && userInput.value.trim()) {
            forgotUsername.value = userInput.value.trim();
        }
        setTimeout(() => {
            (forgotUsername || forgotNewPass)?.focus?.();
        }, 0);
    };

    const showLogin = () => {
        if (forgotForm) forgotForm.style.display = "none";
        if (loginForm) loginForm.style.display = "block";
        setTimeout(() => {
            userInput?.focus?.();
        }, 0);
    };

    // Mostrar/ocultar senha
    if (togglePasswordBtn && passInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPass = passInput.getAttribute('type') === 'password';
            passInput.setAttribute('type', isPass ? 'text' : 'password');
            togglePasswordBtn.textContent = isPass ? '🙈' : '👁';
        });
    }

    // Registrar (criar conta explicitamente)
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            if (!userInput || !passInput) return;
            const user = userInput.value.trim();
            const pass = passInput.value.trim();

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

            const reg = Auth.register(user, pass);
            if (!reg || !reg.success) {
                alert(reg?.message || 'Erro ao registrar.');
                return;
            }

            // Após registrar, faz login normal (persistente)
            const result = Auth.login(user, pass, { persist: true });
            if (result?.success) {
                if (loginWrapper) {
                    loginWrapper.style.display = "none";
                    loginWrapper.setAttribute("aria-hidden", "true");
                }
                if (app) {
                    app.style.display = "flex";
                    app.setAttribute("aria-hidden", "false");
                }
                setTimeout(() => {
                    if (typeof UI !== 'undefined' && UI.loadUser) UI.loadUser();
                }, 100);
            }
        });
    }

    // Abrir tela separada: Esqueci minha senha
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', showForgot);
    }

    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', showLogin);
    }

    // Submeter redefinição de senha
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = (forgotUsername?.value || '').trim();
            const p1 = (forgotNewPass?.value || '').trim();
            const p2 = (forgotConfirmPass?.value || '').trim();

            if (!u || u.length < 3) {
                alert('Informe um usuário válido.');
                forgotUsername?.focus?.();
                return;
            }
            if (!p1 || p1.length < 4) {
                alert('A nova senha deve ter pelo menos 4 caracteres.');
                forgotNewPass?.focus?.();
                return;
            }
            if (p1 !== p2) {
                alert('As senhas não conferem.');
                forgotConfirmPass?.focus?.();
                return;
            }

            const res = Auth.resetPassword(u, p1);
            if (res?.success) {
                alert('Senha redefinida! Faça login com a nova senha.');
                // Pré-preenche no login
                if (userInput) userInput.value = u;
                if (passInput) passInput.value = '';
                if (forgotNewPass) forgotNewPass.value = '';
                if (forgotConfirmPass) forgotConfirmPass.value = '';
                showLogin();
            } else {
                alert(res?.message || 'Não foi possível redefinir a senha.');
            }
        });
    }

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
                const result = Auth.login(user, pass, { persist: true });

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
