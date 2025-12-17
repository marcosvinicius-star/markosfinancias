// ======================================================
// CATEGORY MANAGER
// ======================================================

const Categories = {

    list(type) {
        const user = Auth.current();
        if (!user || !user.categories) return [];
        return user.categories[type] || [];
    },

    add(type, name) {
        const user = Auth.current();
        if (!user) return false;

        if (!user.categories) {
            user.categories = {
                gastos: [],
                receitas: []
            };
        }

        if (!user.categories[type]) {
            user.categories[type] = [];
        }

        if (!user.categories[type].includes(name)) {
            user.categories[type].push(name);
            Storage.saveUserData(Storage.getCurrentUser(), user);
            return true;
        }

        return false;
    },

    remove(type, name) {
        const user = Auth.current();
        if (!user || !user.categories || !user.categories[type]) return false;

        const index = user.categories[type].indexOf(name);
        if (index > -1) {
            user.categories[type].splice(index, 1);
            Storage.saveUserData(Storage.getCurrentUser(), user);
            return true;
        }

        return false;
    }
};
