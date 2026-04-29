import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
    const [currentUserId, setCurrentUserId] = useState(
        () => Number(localStorage.getItem('currentUserId')) || 1
    );
    const [users, setUsers] = useState([]);

    // ✅ أضف هذا
    const [displayCurrency, setDisplayCurrency] = useState('SAR');

    useEffect(() => {
        localStorage.setItem('currentUserId', currentUserId);
    }, [currentUserId]);

    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
            const data = await res.json();
            setUsers(data.users);
        }
        fetchUsers();
    }, []);

    return (
        <UserContext.Provider value={{
            currentUserId,
            setCurrentUserId,
            users,
            displayCurrency,        // ✅ مهم
            setDisplayCurrency      // ✅ مهم
        }}>
            {children}
        </UserContext.Provider>
    );
}