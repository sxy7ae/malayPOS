import { createContext, useContext, useState } from 'react';
import { api, setToken, getToken } from './api.js';

const AuthContext = createContext(null);
const USER_KEY = 'malaypos_user';

export function AuthProvider({ children }) {
    // Fungsi di useState dijalankan sekali saat pertama render:
    // pulihkan user dari localStorage kalau token masih ada.
    const [user, setUser] = useState(() => {
        try {
            return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
        } catch {
          return null;
        }
    });

    async function login(username, password) {
        const data = await api('/auth/login', {
            method: 'POST',
            body: { username, password },
        });
        setToken(data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);