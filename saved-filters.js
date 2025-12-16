// ======================================================
// SAVED FILTERS MANAGER
// ======================================================

const SavedFilters = {
    
    list() {
        const user = Auth.current();
        return user ? (user.savedFilters || []) : [];
    },
    
    add(data) {
        const user = Auth.current();
        if (!user) return { success: false, message: 'Usuário não autenticado' };
        
        if (!user.savedFilters) user.savedFilters = [];
        
        const filter = {
            id: Date.now().toString(36),
            name: data.name,
            filters: data.filters,
            created: new Date().toISOString()
        };
        
        user.savedFilters.push(filter);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return { success: true };
    },
    
    remove(id) {
        const user = Auth.current();
        if (!user || !user.savedFilters) return false;
        
        user.savedFilters = user.savedFilters.filter(f => f.id !== id);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return true;
    },
    
    apply(id) {
        const user = Auth.current();
        if (!user || !user.savedFilters) return null;
        
        const filter = user.savedFilters.find(f => f.id === id);
        return filter ? filter.filters : null;
    }
};
