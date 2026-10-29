/**
 * @fileoverview Staff Authentication Context for Publishing Control Plane
 * Manages active user session, development test identities, and authorization roles.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StaffUser } from '@ttcsirt/publishing-api';
import { DEV_IDENTITIES } from '@ttcsirt/publishing-api/auth/dev-identities.ts';
import { PublishingApiClient } from '../utils/api-client.ts';

interface AuthContextType {
  currentUser: StaffUser | null;
  isLoading: boolean;
  devAuthEnabled: boolean;
  isDevMode: boolean;
  login: (identityKey: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (key: string) => Promise<void>;
  availableUsers: typeof DEV_IDENTITIES;
  isAuthor: boolean;
  isReviewer: boolean;
  isApprover: boolean;
  isAdmin: boolean;
  isReader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [devAuthEnabled, setDevAuthEnabled] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Check existing session on mount
  useEffect(() => {
    let mounted = true;
    PublishingApiClient.getAuthStatus()
      .then((status) => {
        if (!mounted) return;
        setDevAuthEnabled(status.devAuthEnabled);
        setIsDevMode(status.environment === 'development-test');
        if (status.isAuthenticated && status.user) {
          setCurrentUser(status.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentUser(null);
        setDevAuthEnabled(false);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (identityKey: string) => {
    setIsLoading(true);
    try {
      const outcome = await PublishingApiClient.devLogin(identityKey);
      setCurrentUser(outcome.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await PublishingApiClient.logout();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUser = useCallback(
    async (key: string) => {
      await login(key);
    },
    [login],
  );

  const isAuthor = currentUser ? currentUser.roles.includes('author') || currentUser.roles.includes('admin') : false;
  const isReviewer = currentUser ? currentUser.roles.includes('reviewer') || currentUser.roles.includes('admin') : false;
  const isApprover = currentUser ? currentUser.roles.includes('approver') || currentUser.roles.includes('admin') : false;
  const isAdmin = currentUser ? currentUser.roles.includes('admin') : false;
  const isReader = currentUser ? currentUser.roles.includes('reader') || currentUser.roles.includes('admin') : false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        devAuthEnabled,
        isDevMode,
        login,
        logout,
        switchUser,
        availableUsers: DEV_IDENTITIES,
        isAuthor,
        isReviewer,
        isApprover,
        isAdmin,
        isReader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useStaffAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within an AuthProvider');
  }
  return context;
}
