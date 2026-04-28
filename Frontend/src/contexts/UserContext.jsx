import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
    const [currentUserId, setCurrentUserId] = useState(1);
    const [users, setUsers] = useState([]);

    // ✅ أضف هذا
    const [displayCurrency, setDisplayCurrency] = useState('SAR');

    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch('http://localhost:5000/api/users');
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