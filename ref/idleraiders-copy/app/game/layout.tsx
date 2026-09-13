'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAudio, useAuth } from '@/context';
import GameHeader from '@/components/GameHeader';
import BottomNavigation from '@/components/BottomNavigation';
import ActiveMissionBar from '@/components/ActiveMissionBar';
import RegistrationModal from '@/components/modals/Registration';
import BannedModal from '@/components/modals/Banned';
import GAME_UI_IMAGES from '@/features/images/GameImages';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { PageLoader, type PageType } from '@/components/ui/PageLoader';

// Map pathname to PageLoader page type
function getPageTypeFromPath(pathname: string): PageType {
  const segment = pathname.split('/')[2] || ''
  const pageMap: Record<string, PageType> = {
    '': 'world',
    'world': 'world',
    'packs': 'packs',
    'inventory': 'inventory',
    'marketplace': 'marketplace',
    'leaderboard': 'leaderboard',
    'profile': 'profile',
    'guild': 'guild',
    'trader': 'trader',
    'training': 'training',
    'wallet': 'wallet',
    'explore': 'explore',
    'crafting': 'crafting',
  }
  return pageMap[segment] ?? 'default'
}

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { initMusic } = useAudio();
  const { logout } = useAuth();
  const { status, user, isLoading } = useAuthCheck();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showBannedModal, setShowBannedModal] = useState(false);
  
  // Get the page type based on current pathname for dynamic loading messages
  const pageType = getPageTypeFromPath(pathname);

  // Handle auth status changes
  useEffect(() => {
    if (isLoading) return;

    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'banned') {
      // Banned takes priority — block everything else
      setShowBannedModal(true);
      setShowRegistrationModal(false);
    } else if (status === 'unregistered') {
      // Show registration modal instead of redirecting
      setShowRegistrationModal(true);
      setShowBannedModal(false);
    } else if (status === 'registered') {
      setShowRegistrationModal(false);
      setShowBannedModal(false);
    }
  }, [status, isLoading, router]);

  useEffect(() => {
    initMusic('/assets/audio/idleraiders_music.wav');
  }, [initMusic]);

  const handleRegistrationComplete = useCallback(() => {
    setShowRegistrationModal(false);
    // Force a re-check of auth status
    window.location.reload();
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const bgDarkFantasy = GAME_UI_IMAGES.background;

  // Show loading state while checking auth - use page-specific loader
  if (isLoading) {
    return <PageLoader page={pageType} />;
  }

  // If unauthenticated, show redirecting (useEffect will handle actual redirect)
  if (status === 'unauthenticated') {
    return <PageLoader page="auth" message="Redirecting to login..." />;
  }

  return (
    <div
      className="min-h-screen bg-background bg-cover bg-center bg-fixed flex flex-col"
      style={{ backgroundImage: `url(${bgDarkFantasy})` }}
    >
      <div className="min-h-screen bg-background/80 backdrop-blur-[1px] flex flex-col">
        <GameHeader />
        <main className="mx-auto max-w-3xl w-full flex-1">
          <ActiveMissionBar />
          <div className="px-4 pb-4">{children}</div>
        </main>
        <BottomNavigation />
      </div>

      {/* Registration Modal - shown for unregistered users */}
      <RegistrationModal
        open={showRegistrationModal}
        username={user?.username || ''}
        referredBy={user?.referredBy}
        onRegistrationComplete={handleRegistrationComplete}
        onLogout={handleLogout}
      />

      {/* Banned Modal - shown for banned accounts; blocks all gameplay */}
      <BannedModal
        open={showBannedModal}
        username={user?.username || ''}
        banReason={user?.banReason}
        bannedAt={user?.bannedAt}
        onLogout={handleLogout}
      />
    </div>
  );
}
