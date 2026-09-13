'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const cardFlipSrc: string | null = '/assets/audio/card_flip.wav';

interface AudioContextValue {
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  toggleMusic: () => void;
  setMusicVolume: (vol: number) => void;
  toggleSfx: () => void;
  setSfxVolume: (vol: number) => void;
  initMusic: (src: string) => void;
  playCardFlip: () => void;
}

const AudioCtx = createContext<AudioContextValue | undefined>(undefined);

export const useAudio = (): AudioContextValue => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider');
  return ctx;
};

// Static ref for imperative access outside React tree (e.g. setTimeout callbacks)
let _playCardFlip: (() => void) | null = null;
export const playCardFlipStatic = (): void => _playCardFlip?.();

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider = ({ children }: AudioProviderProps) => {
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(0.5);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [sfxVolume, setSfxVolumeState] = useState(0.5);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      const audio = musicRef.current;
      if (audio) {
        if (next) {
          audio.volume = musicVolume;
          audio.play().catch(() => { });
        } else {
          audio.pause();
        }
      }
      return next;
    });
  }, [musicVolume]);

  const setMusicVolume = useCallback((vol: number) => {
    setMusicVolumeState(vol);
    if (musicRef.current) musicRef.current.volume = vol;
  }, []);

  const toggleSfx = useCallback(() => setSfxEnabled((p) => !p), []);
  const setSfxVolume = useCallback((vol: number) => setSfxVolumeState(vol), []);

  const initMusic = useCallback(
    (src: string) => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = '';
      }
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = musicVolume;
      musicRef.current = audio;
      if (musicEnabled) {
        audio.play().catch(() => { });
      }
    },
    [musicVolume, musicEnabled]
  );

  const playCardFlip = useCallback(() => {
    if (!sfxEnabled || !cardFlipSrc) return;
    const audio = new Audio(cardFlipSrc);
    audio.volume = sfxVolume;
    audio.playbackRate = 1;
    audio.play().catch(() => { });
  }, [sfxEnabled, sfxVolume]);

  // Keep static ref in sync
  useEffect(() => {
    _playCardFlip = playCardFlip;
    return () => {
      _playCardFlip = null;
    };
  }, [playCardFlip]);

  return (
    <AudioCtx.Provider
      value={{
        musicEnabled,
        musicVolume,
        sfxEnabled,
        sfxVolume,
        toggleMusic,
        setMusicVolume,
        toggleSfx,
        setSfxVolume,
        initMusic,
        playCardFlip,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};
