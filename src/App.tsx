import { useState, useEffect } from 'react';
import {
  GameModule,
  ThemeId,
  GameId,
  ScoreRecord,
  PlayerProfile,
  CabinetCustomizationState,
} from './types/arcade';
import { storageService } from './services/storage';
import { soundManager } from './services/audio';
import { cabinetService } from './services/cabinetStyles';
import { Navbar } from './components/common/Navbar';
import { ArcadeLauncher } from './components/dashboard/ArcadeLauncher';
import { ArcadeCabinet } from './components/cabinet/ArcadeCabinet';
import { AchievementToast } from './components/common/AchievementToast';
import { PlayerProfileModal } from './components/profile/PlayerProfileModal';
import { CabinetCustomizerModal } from './components/cabinet/CabinetCustomizerModal';
import { SettingsModal, SettingsTab } from './components/settings/SettingsModal';
import { achievementsEngine } from './services/achievements';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameModule | null>(null);
  const [theme, setTheme] = useState<ThemeId>(() => storageService.getTheme());
  const [scanlines, setScanlines] = useState<boolean>(() => storageService.getScanlines());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storageService.getSoundEnabled());
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState<boolean>(() =>
    storageService.getAmbientSoundEnabled()
  );
  const [highScores, setHighScores] = useState<Record<GameId, number>>(() =>
    storageService.getHighScores()
  );
  const [history, setHistory] = useState<ScoreRecord[]>(() => storageService.getHistory());
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() =>
    storageService.getPlayerProfile()
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [cabinetConfig, setCabinetConfig] = useState<CabinetCustomizationState>(() =>
    cabinetService.getCabinetCustomization()
  );
  const [isCabinetCustomizerOpen, setIsCabinetCustomizerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('cabinet');

  // Sync sound manager with sound state
  useEffect(() => {
    soundManager.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Sync sound manager with ambient sound state
  useEffect(() => {
    soundManager.setAmbientSoundEnabled(ambientSoundEnabled);
  }, [ambientSoundEnabled]);

  // Activate ambient arcade noise (cabinet hums, coin jingles) when user is on dashboard
  useEffect(() => {
    const isDashboard = activeGame === null;
    soundManager.setDashboardMode(isDashboard);
    return () => {
      soundManager.setDashboardMode(false);
    };
  }, [activeGame]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    storageService.setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.play('select');
  };

  const handleToggleAmbientSound = () => {
    const next = !ambientSoundEnabled;
    setAmbientSoundEnabled(next);
    storageService.setAmbientSoundEnabled(next);
    soundManager.setAmbientSoundEnabled(next);
    if (next) soundManager.play('coin');
  };

  const handleToggleScanlines = () => {
    const next = !scanlines;
    setScanlines(next);
    storageService.setScanlines(next);
    soundManager.play('select');
  };

  const handleThemeChange = (newTheme: ThemeId) => {
    setTheme(newTheme);
    storageService.setTheme(newTheme);
    soundManager.play('select');
  };

  const handleLaunchGame = (game: GameModule) => {
    soundManager.play('start');
    setActiveGame(game);
    // Refresh high scores from storage
    setHighScores(storageService.getHighScores());
  };

  const handleExitCabinet = () => {
    setActiveGame(null);
    // Refresh high scores & history
    setHighScores(storageService.getHighScores());
    setHistory(storageService.getHistory());
  };

  const handleClearHistory = () => {
    if (window.confirm('Reset all high scores, achievements, and gameplay history records?')) {
      storageService.clearHistory();
      achievementsEngine.resetAchievements();
      setHighScores(storageService.getHighScores());
      setHistory([]);
      soundManager.play('hit');
    }
  };

  const handleScrollToLeaderboards = () => {
    const el = document.getElementById('hall-of-fame-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveProfile = (updatedProfile: PlayerProfile) => {
    setPlayerProfile(updatedProfile);
    storageService.savePlayerProfile(updatedProfile);
  };

  const handleSaveCabinetConfig = (newConfig: CabinetCustomizationState) => {
    setCabinetConfig(newConfig);
    cabinetService.saveCabinetCustomization(newConfig);
  };

  const handleOpenSettings = (tab: SettingsTab = 'cabinet') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Theme container classes
  let themeWrapperClass = 'bg-slate-950 text-slate-100';
  if (theme === 'cyberpunk') {
    themeWrapperClass = 'bg-[#0b0817] text-slate-100';
  } else if (theme === 'crt') {
    themeWrapperClass = 'bg-[#040d07] text-emerald-100 font-crt';
  } else if (theme === 'minimalist') {
    themeWrapperClass = 'bg-[#090b10] text-zinc-100';
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${themeWrapperClass}`}>
      {/* Global Retro Achievement Toast Notification */}
      <AchievementToast />

      {/* Player Profile & 8-Bit Custom Avatar Modal */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={playerProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Standalone Physical Cabinet Customizer & Vinyl Workshop Modal */}
      <CabinetCustomizerModal
        isOpen={isCabinetCustomizerOpen}
        onClose={() => setIsCabinetCustomizerOpen(false)}
        currentConfig={cabinetConfig}
        onSaveConfig={handleSaveCabinetConfig}
        soundEnabled={soundEnabled}
      />

      {/* Arcade System Settings Modal with Cabinet Customizer Panel */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        currentCabinetConfig={cabinetConfig}
        onSaveCabinetConfig={handleSaveCabinetConfig}
        theme={theme}
        onThemeChange={handleThemeChange}
        scanlines={scanlines}
        onToggleScanlines={handleToggleScanlines}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        ambientSoundEnabled={ambientSoundEnabled}
        onToggleAmbient={handleToggleAmbientSound}
        onClearData={handleClearHistory}
      />

      {/* If playing in Arcade Cabinet, show cabinet view */}
      {activeGame ? (
        <ArcadeCabinet
          game={activeGame}
          onExit={handleExitCabinet}
          scanlines={scanlines}
          onToggleScanlines={handleToggleScanlines}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          cabinetConfig={cabinetConfig}
          onOpenCabinetCustomizer={() => handleOpenSettings('cabinet')}
          onOpenSettings={() => handleOpenSettings('cabinet')}
        />
      ) : (
        /* Otherwise show Launcher Dashboard with Hub Navbar */
        <>
          <Navbar
            theme={theme}
            onThemeChange={handleThemeChange}
            scanlines={scanlines}
            onToggleScanlines={handleToggleScanlines}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            ambientEnabled={ambientSoundEnabled}
            onToggleAmbient={handleToggleAmbientSound}
            onOpenLeaderboards={handleScrollToLeaderboards}
            profile={playerProfile}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenCabinetCustomizer={() => handleOpenSettings('cabinet')}
            onOpenSettings={() => handleOpenSettings('cabinet')}
          />

          <main className="flex-1">
            <ArcadeLauncher
              highScores={highScores}
              history={history}
              onLaunchGame={handleLaunchGame}
              onClearHistory={handleClearHistory}
              profile={playerProfile}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
              onOpenCabinetCustomizer={() => handleOpenSettings('cabinet')}
              onOpenSettings={() => handleOpenSettings('cabinet')}
            />
          </main>

          <footer className="w-full relative mt-16 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-8 px-6 text-xs font-mono text-slate-400 overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left Branding & Live Status */}
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 font-retro text-[10px] shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SYSTEM ONLINE</span>
                </div>
                <div>
                  <span className="font-retro text-[11px] text-white tracking-wider">ARCADE<span className="text-cyan-400">JS</span></span>
                  <span className="text-slate-500 ml-2">// MODULAR RETRO PLATFORM v1.0</span>
                </div>
              </div>

              {/* Center / Right Tech Spec Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 shadow-sm hover:border-cyan-500/40 transition">
                  LOCALSTORAGE PERSISTED
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 shadow-sm hover:border-cyan-500/40 transition">
                  PROCEDURAL 8-BIT AUDIO
                </span>
              </div>

            </div>

            {/* Bottom Sub-bar / Copyright */}
            <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-600 gap-2">
              <div>BUILT FOR RETRO GAMING ENTHUSIASTS © {new Date().getFullYear()}</div>
              <div className="text-slate-500 font-retro tracking-widest">INSERT COIN TO START</div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}