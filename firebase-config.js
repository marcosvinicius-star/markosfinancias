// ======================================================
// FIREBASE CONFIG (Frontend)
// ======================================================
// Cole aqui o objeto de configuração do Firebase (Web App)
// Firebase Console > Project settings > Your apps > Firebase SDK snippet
//
// Exemplo:
// window.FIREBASE_CONFIG = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

// ======================================================
// CONFIG APLICADA (Projeto: financeflow-eda21)
// ======================================================
// IMPORTANTE: o Firebase Web exige a apiKey. Pegue no Firebase Console:
// Project settings > Your apps (Web) > Firebase SDK snippet (Config)
//
// Você pode preencher só a apiKey + appId (+ messagingSenderId) e manter o resto.

window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  // OBRIGATÓRIO (cole do Firebase Console)
  apiKey: "",

  // Derivados do projectId
  authDomain: "financeflow-eda21.firebaseapp.com",
  projectId: "financeflow-eda21",
  storageBucket: "financeflow-eda21.appspot.com",

  // Recomendado (cole do Firebase Console)
  messagingSenderId: "",
  appId: ""
};
