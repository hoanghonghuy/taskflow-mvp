'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface UserState {
    user: User | null;
    allUsers: User[];
    isAuthenticated: boolean;
    login: (email: string, password: string) => void;
    register: (name: string, email: string, password: string) => void;
    logout: () => void;
    updateUser: (updatedData: Partial<User>) => void;
}

const MOCK_USER: User = {
    id: 'user-001',
    name: 'Alex Ryder',
    email: 'alex.ryder@example.com',
    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Ryder`,
};

const MOCK_USERS: User[] = [
    MOCK_USER,
    { id: 'user-002', name: 'Jane Doe', email: 'jane.doe@example.com', avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Jane%20Doe` },
    { id: 'user-003', name: 'John Smith', email: 'john.smith@example.com', avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=John%20Smith` },
    { id: 'user-004', name: 'Emily White', email: 'emily.white@example.com', avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Emily%20White` },
];


const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const isAuthenticated = !!user;

    useEffect(() => {
        // Check for saved user session on initial load
        try {
            const savedUser = localStorage.getItem('taskflowUser');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Failed to load user from localStorage', error);
            localStorage.removeItem('taskflowUser');
        }
    }, []);

    const login = (email: string, password: string) => {
        // Mock login - in a real app, you'd call an API
        console.log(`Attempting login with email: ${email}`);
        setUser(MOCK_USER);
        localStorage.setItem('taskflowUser', JSON.stringify(MOCK_USER));
    };

    const register = (name: string, email: string, password: string) => {
        // Mock register - logs info and then logs in the user
        console.log('Mock registration:', { name, email, password });
        login(email, password);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('taskflowUser');
    };

    const updateUser = (updatedData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            localStorage.setItem('taskflowUser', JSON.stringify(updatedUser));
        }
    };

    return (
        <UserContext.Provider value={{ user, allUsers: MOCK_USERS, isAuthenticated, login, register, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserState => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
