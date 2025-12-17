// ======================================================
// TAGS MANAGER
// ======================================================

const Tags = {
    
    list() {
        const user = Auth.current();
        return user ? (user.tags || []) : [];
    },
    
    add(name, color) {
        const user = Auth.current();
        if (!user) return { success: false, message: 'Usuário não autenticado' };
        
        if (!user.tags) user.tags = [];
        
        // Verificar se já existe
        if (user.tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            return { success: false, message: 'Etiqueta já existe' };
        }
        
        const tag = {
            id: Date.now().toString(36),
            name: name.trim(),
            color: color || '#3b82f6',
            created: new Date().toISOString()
        };
        
        user.tags.push(tag);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return { success: true };
    },
    
    remove(id) {
        const user = Auth.current();
        if (!user || !user.tags) return false;
        
        user.tags = user.tags.filter(t => t.id !== id);
        Storage.saveUserData(Storage.getCurrentUser(), user);
        return true;
    }
};

