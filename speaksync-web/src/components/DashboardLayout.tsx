'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScripts } from '@/contexts/ScriptContext';
import {
  DocumentTextIcon,
  HomeIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { NavItem } from '@/types';

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
  { name: 'Scripts', href: '/dashboard/scripts', icon: DocumentTextIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { syncStatus } = useScripts();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">SpeakSync</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>

          {/* Sync Status */}
          <div className="px-4 py-4 border-t">
            <div className="flex items-center text-xs text-gray-500">
              {syncStatus.isOnline ? (
                <>
                  <CloudArrowUpIcon className="h-4 w-4 mr-2 text-green-500" />
                  <span>Synced</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>Offline</span>
                </>
              )}
              {syncStatus.pendingChanges > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {syncStatus.pendingChanges} pending
                </span>
              )}
            </div>
            {syncStatus.lastSyncAt && (
              <div className="text-xs text-gray-400 mt-1">
                Last sync: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="px-4 py-4 border-t">
            <div className="flex items-center mb-3">
              <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
