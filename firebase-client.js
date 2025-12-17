// ======================================================
// FIREBASE CLIENT WRAPPER (Compat)
// ======================================================

(function () {
  const FirebaseClient = {
    _initialized: false,

    isConfigured() {
      const cfg = window.FIREBASE_CONFIG;
      return !!(cfg && typeof cfg === 'object' && cfg.apiKey && cfg.projectId);
    },

    init() {
      if (this._initialized) return true;
      if (!this.isConfigured()) return false;
      if (!window.firebase) {
        console.warn('Firebase SDK não carregado');
        return false;
      }
      try {
        if (firebase.apps && firebase.apps.length === 0) {
          firebase.initializeApp(window.FIREBASE_CONFIG);
        }
        this._initialized = true;
        return true;
      } catch (e) {
        console.error('Erro ao inicializar Firebase:', e);
        return false;
      }
    },

    auth() {
      if (!this.init()) return null;
      return firebase.auth();
    },

    db() {
      if (!this.init()) return null;
      return firebase.firestore();
    },

    uid() {
      const a = this.auth();
      return a && a.currentUser ? a.currentUser.uid : null;
    }
  };

  window.FirebaseClient = FirebaseClient;
})();
