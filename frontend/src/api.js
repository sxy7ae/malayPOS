const TOKEN_KEY = 'malaypos_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

//satu pintu untuk semua panggilan ke backend.
export async function api(path, { method = 'GET', body } = {}) {
    const token = getToken();
    const res = await fetch(`/api${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null; //DELETE sukses: tidak ada isi

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // Token kedaluwarsa atau tidak valid: paksa login ulang.
        if (res.status === 401 && path !== '/auth/login') {
            setToken(null);
            localStorage.removeItem('malaypos_user');
            window.location.href = '/login';
        }
        throw new Error(data.message || 'Terjadi Kesalahan');
    }
    return data;
}
