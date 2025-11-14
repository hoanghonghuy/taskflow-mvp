'use client'

import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import MainContent from './components/layout/MainContent';
import TaskDetail from './components/task/TaskDetail';
import Chatbot from './components/chatbot/Chatbot';
import { useTaskManager } from './hooks/useTaskManager';
import FeatureBar from './components/layout/FeatureBar';
import SearchModal from './components/search/SearchModal';
import CalendarView from './components/calendar/CalendarView';
import PomodoroView from './components/pomodoro/PomodoroView';
import MatrixView from './components/matrix/MatrixView';
import HabitView from './components/habit/HabitView';
import CountdownView from './components/countdown/CountdownView';
import SettingsView from './components/settings/SettingsView';
import { useSettings } from './hooks/useSettings';
import DailyBriefingModal from './components/briefing/DailyBriefingModal';
import { ToastContainer } from './components/ui/Toast';
import ConfirmationModal from './components/ui/ConfirmationModal';
import DashboardView from './components/dashboard/DashboardView';
import { useGemini } from './hooks/useGemini';
import { useUser } from './hooks/useUser';
import LoginView from './components/auth/LoginView';
import LandingPage from './components/landing/LandingPage';
import ShareListModal from './components/collaboration/ShareListModal';
import AchievementsView from './components/achievements/AchievementsView';
import BoardView from './components/board/BoardView';
import TaskForm from './components/task/TaskForm';
import RegisterView from './components/auth/RegisterView';
import ProfileView from './components/profile/ProfileView';
import { MenuIcon } from './constants';
import BottomNavBar from './components/layout/BottomNavBar';


const AppContent: React.FC = () => {
    const { state } = useTaskManager();
    const { theme } = useSettings();
    const { isAvailable: isGeminiAvailable } = useGemini();
    const [isChatbotOpen, setChatbotOpen] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [isBriefingOpen, setBriefingOpen] = useState(false);
    const [shareListModal, setShareListModal] = useState<{ isOpen: boolean; listId: string | null }>({ isOpen: false, listId: null });
    const [taskForm, setTaskForm] = useState<{ isOpen: boolean; defaultValues?: { listId?: string; columnId?: string; } }>({ isOpen: false });

    const handleOpenTaskForm = (defaultValues?: { listId?: string; columnId?: string; }) => {
        setTaskForm({ isOpen: true, defaultValues });
    };

    const handleCloseTaskForm = () => {
        setTaskForm({ isOpen: false });
    };
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSidebarOpen(window.innerWidth > 768);
        }
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }
        const body = document.body;
        body.classList.remove('light', 'dark');
        body.classList.add(theme);
    }, [theme]);

    const renderView = () => {
        switch(state.view) {
            case 'dashboard':
                return <DashboardView onBriefingToggle={() => setBriefingOpen(true)} />;
            case 'list':
                return <MainContent onSearchToggle={() => setSearchOpen(true)} onBriefingToggle={() => setBriefingOpen(true)} onOpenTaskForm={handleOpenTaskForm} />;
            case 'board':
                return <BoardView onOpenTaskForm={handleOpenTaskForm} />;
            case 'calendar':
                return <CalendarView />;
            case 'pomodoro':
                return <PomodoroView />;
            case 'matrix':
                return <MatrixView />;
            case 'habit':
                return <HabitView />;
            case 'countdown':
                return <CountdownView />;
            case 'settings':
                return <SettingsView />;
            case 'achievements':
                return <AchievementsView />;
            // FIX: Add case for 'profile' view to render the ProfileView component.
            case 'profile':
                return <ProfileView />;
            default:
                 return <DashboardView onBriefingToggle={() => setBriefingOpen(true)} />;
        }
    }

    const listToShare = state.lists.find(l => l.id === shareListModal.listId);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {!isGeminiAvailable && (
                <div className="bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 text-center text-xs py-1 fixed top-0 w-full z-50">
                    Gemini API key not found. AI features are disabled.
                </div>
            )}
            <FeatureBar 
                onSidebarToggle={() => setSidebarOpen(prev => !prev)}
            />
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setSidebarOpen(false)}
                onChatbotToggle={() => {
                    setChatbotOpen(prev => !prev);
                    setSidebarOpen(false);
                }}
                onShareList={(listId) => setShareListModal({ isOpen: true, listId })}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden relative">
                 <header className="md:hidden flex-shrink-0 p-4 border-b border-border flex items-center justify-between z-10 bg-card/80 backdrop-blur-lg">
                    <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><rect width="256" height="256" fill="none"></rect><path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm45.15,122.34-8.6-14.9a4,4,0,0,0-6.92,0l-22.1,38.28a4,4,0,0,1-3.46,2H92a4,4,0,0,1-3.46-6l25.56-44.28a4,4,0,0,0-3.46-6H65.75a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,6l-25.56,44.28a4,4,0,0,0,3.46,6h22.54a4,4,0,0,1,3.46-2l22.1-38.28a4,4,0,0,0-3.46-6H134.25a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,2l8.6,14.9a4,4,0,0,1-3.46,6H173.15a4,4,0,0,1,0,8h-3.46a4,4,0,0,1-3.46-2Z"></path></svg>
                        <h1 className="font-bold text-lg">TaskFlow</h1>
                    </div>
                    <div></div>{/* Placeholder for centering title */}
                </header>

                <div className="flex-1 flex overflow-hidden">
                     <div className="flex-1 flex min-w-0">
                        {renderView()}
                    </div>
                    <div className={`
                        fixed inset-0 z-20 md:relative md:z-auto md:inset-auto transition-transform duration-300 ease-in-out bg-card md:bg-transparent
                        ${state.selectedTaskId ? 'translate-x-0' : 'translate-x-full'}
                    `}>
                        {state.selectedTaskId && <TaskDetail taskId={state.selectedTaskId} />}
                    </div>
                </div>
            </div>

            <BottomNavBar />

            {isChatbotOpen && <Chatbot onClose={() => setChatbotOpen(false)} />}
            {isSearchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
            {isBriefingOpen && <DailyBriefingModal onClose={() => setBriefingOpen(false)} />}
            {taskForm.isOpen && <TaskForm onClose={handleCloseTaskForm} defaultValues={taskForm.defaultValues} />}
            {shareListModal.isOpen && listToShare && (
                <ShareListModal 
                    list={listToShare} 
                    onClose={() => setShareListModal({ isOpen: false, listId: null })} 
                />
            )}
            <ToastContainer />
            <ConfirmationModal />
        </div>
    );
};

const App: React.FC = () => {
    const { isAuthenticated } = useUser();
    const [isLaunched, setIsLaunched] = useState(() => sessionStorage.getItem('appLaunched') === 'true');
    const [authView, setAuthView] = useState<'login' | 'register'>('login');

    const handleLaunch = () => {
        sessionStorage.setItem('appLaunched', 'true');
        setIsLaunched(true);
    };

    if (!isLaunched) {
        return <LandingPage onLaunch={handleLaunch} />;
    }
    
    if (!isAuthenticated) {
        switch (authView) {
            case 'register':
                return <RegisterView onSwitchToLogin={() => setAuthView('login')} />;
            default:
                return <LoginView onSwitchToRegister={() => setAuthView('register')} />;
        }
    }

    return <AppContent />;
};

export default App;
export { AppContent as TaskflowShell };
