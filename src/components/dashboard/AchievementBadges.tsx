import React, { useState } from 'react';
import { Achievement, AchievementCategory, GameId, ScoreRecord } from '../../types/arcade';
import { achievementsEngine } from '../../services/achievements';
import {
  Trophy,
  Crown,
  Zap,
  Footprints,
  Compass,
  Layers,
  Sparkles,
  Target,
  Crosshair,
  Gamepad2,
  Flame,
  Award,
  Lock,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface AchievementBadgesProps {
  highScores: Record<GameId, number>;
  history: ScoreRecord[];
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  highScores,
  history,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

  // Compute live achievements from engine
  const achievements = achievementsEngine.getAchievements(highScores, history);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  // Filter achievements
  const filteredAchievements = achievements.filter((ach) => {
    if (statusFilter === 'unlocked' && !ach.isUnlocked) return false;
    if (statusFilter === 'locked' && ach.isUnlocked) return false;
    if (selectedCategory !== 'all' && ach.category !== selectedCategory) return false;
    return true;
  });

  const renderBadgeIcon = (iconName: string, isUnlocked: boolean, accentColor: string) => {
    const props = { className: 'w-5 h-5 transition-transform group-hover:scale-110' };
    let iconElement = <Award {...props} />;

    switch (iconName) {
      case 'Trophy':
        iconElement = <Trophy {...props} />;
        break;
      case 'Zap':
        iconElement = <Zap {...props} />;
        break;
      case 'Footprints':
        iconElement = <Footprints {...props} />;
        break;
      case 'Crown':
        iconElement = <Crown {...props} />;
        break;
      case 'Compass':
        iconElement = <Compass {...props} />;
        break;
      case 'Layers':
        iconElement = <Layers {...props} />;
        break;
      case 'Sparkles':
        iconElement = <Sparkles {...props} />;
        break;
      case 'Target':
        iconElement = <Target {...props} />;
        break;
      case 'Crosshair':
        iconElement = <Crosshair {...props} />;
        break;
      case 'Gamepad2':
        iconElement = <Gamepad2 {...props} />;
        break;
      case 'Flame':
        iconElement = <Flame {...props} />;
        break;
      default:
        iconElement = <Award {...props} />;
    }

    return (
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 relative ${
          isUnlocked
            ? 'shadow-md group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-600'
        }`}
        style={
          isUnlocked
            ? {
                backgroundColor: `${accentColor}1c`,
                borderColor: accentColor,
                color: accentColor,
                boxShadow: `0 0 12px ${accentColor}33`,
              }
            : undefined
        }
      >
        {isUnlocked ? (
          iconElement
        ) : (
          <div className="relative">
            <span className="opacity-40">{iconElement}</span>
            <Lock className="w-3 h-3 text-slate-500 absolute -bottom-1 -right-1" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-800/80">
      {/* Section Header with Overall Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-retro text-white tracking-wide flex items-center gap-2">
              <span>ARCADE ACHIEVEMENTS & MILESTONES</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono">
                {unlockedCount} / {totalCount} BADGES
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Track career milestones, endurance runs, and game mastery medals.
          </p>
        </div>

        {/* Retro Progress Meter */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 min-w-[200px]">
          <div className="flex items-center justify-between text-[10px] font-retro text-slate-400 mb-1.5">
            <span>COMPLETION:</span>
            <span className="text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Status Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 border border-slate-800/80 rounded-lg">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded text-[10px] font-retro transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-cyan-300 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL [{achievements.length}]
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unlocked')}
            className={`px-2.5 py-1 rounded text-[10px] font-retro transition cursor-pointer ${
              statusFilter === 'unlocked'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UNLOCKED [{unlockedCount}]
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('locked')}
            className={`px-2.5 py-1 rounded text-[10px] font-retro transition cursor-pointer ${
              statusFilter === 'locked'
                ? 'bg-slate-800 text-slate-300 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LOCKED [{totalCount - unlockedCount}]
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'ALL CATEGORIES' },
            { id: 'milestone', label: 'MILESTONES' },
            { id: 'score', label: 'SCORE CLUBS' },
            { id: 'endurance', label: 'ENDURANCE' },
            { id: 'mastery', label: 'MASTERY' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-md border transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAchievements.map((ach) => {
          const isUnlocked = ach.isUnlocked;

          return (
            <div
              key={ach.id}
              id={`badge-${ach.id}`}
              onClick={() => setSelectedBadge(ach)}
              className={`group relative rounded-xl border p-3.5 transition-all duration-200 cursor-pointer flex items-start gap-3 overflow-hidden ${
                isUnlocked
                  ? 'bg-slate-950/90 hover:-translate-y-0.5 hover:shadow-lg'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-75 hover:opacity-100'
              }`}
              style={{
                borderColor: isUnlocked ? `${ach.accentColor}55` : undefined,
                boxShadow: isUnlocked ? `0 0 15px ${ach.accentColor}11` : undefined,
              }}
            >
              {/* Subtle accent sheen */}
              {isUnlocked && (
                <div
                  className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-xl pointer-events-none rounded-full"
                  style={{ backgroundColor: ach.accentColor }}
                />
              )}

              {/* Badge Icon */}
              {renderBadgeIcon(ach.iconName, isUnlocked, ach.accentColor)}

              {/* Badge Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4
                    className={`text-xs font-retro tracking-wide truncate ${
                      isUnlocked ? 'text-white' : 'text-slate-400'
                    }`}
                    style={
                      isUnlocked
                        ? { textShadow: `0 0 8px ${ach.accentColor}44` }
                        : undefined
                    }
                  >
                    {ach.title}
                  </h4>

                  {isUnlocked ? (
                    <span
                      className="text-[8px] font-retro px-1.5 py-0.5 rounded border uppercase shrink-0"
                      style={{
                        borderColor: `${ach.accentColor}66`,
                        color: ach.accentColor,
                        backgroundColor: `${ach.accentColor}15`,
                      }}
                    >
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 shrink-0">
                      LOCKED
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-2 line-clamp-2">
                  {ach.description}
                </p>

                {/* Status or Progress Bar */}
                {isUnlocked ? (
                  <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Earned {ach.unlockedAt || 'Recently'}</span>
                  </div>
                ) : ach.progress ? (
                  <div className="w-full">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1">
                      <span>PROGRESS:</span>
                      <span>
                        {ach.progress.current} / {ach.progress.max} {ach.progress.unit}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-600 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (ach.progress.current / ach.progress.max) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="py-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
          No badges match the selected status or category filters.
        </div>
      )}

      {/* Selected Badge Details Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="relative w-full max-w-sm bg-slate-950 border-2 rounded-2xl p-6 shadow-2xl overflow-hidden"
            style={{ borderColor: selectedBadge.isUnlocked ? selectedBadge.accentColor : '#334155' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: selectedBadge.accentColor }}
            />

            <div className="flex flex-col items-center text-center">
              {/* Big Badge Emblem */}
              <div
                className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center mb-4 shadow-lg"
                style={{
                  borderColor: selectedBadge.accentColor,
                  backgroundColor: `${selectedBadge.accentColor}20`,
                  color: selectedBadge.accentColor,
                  boxShadow: `0 0 20px ${selectedBadge.accentColor}44`,
                }}
              >
                {renderBadgeIcon(selectedBadge.iconName, selectedBadge.isUnlocked, selectedBadge.accentColor)}
              </div>

              <span
                className="text-[9px] font-retro uppercase px-2 py-0.5 rounded-full border mb-2"
                style={{
                  borderColor: `${selectedBadge.accentColor}66`,
                  color: selectedBadge.accentColor,
                  backgroundColor: `${selectedBadge.accentColor}15`,
                }}
              >
                {selectedBadge.category} BADGE
              </span>

              <h3 className="text-base font-retro text-white mb-2">
                {selectedBadge.title}
              </h3>

              <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                {selectedBadge.description}
              </p>

              {/* Unlock Info / Progress Box */}
              <div className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-5 font-mono text-xs">
                {selectedBadge.isUnlocked ? (
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-retro text-[10px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>STATUS: UNLOCKED ({selectedBadge.unlockedAt || 'Active'})</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 font-retro text-[10px] mb-2">
                      <Lock className="w-3.5 h-3.5" />
                      <span>STATUS: IN PROGRESS</span>
                    </div>
                    {selectedBadge.progress && (
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Progress:</span>
                          <span className="text-cyan-400 font-bold">
                            {selectedBadge.progress.current} / {selectedBadge.progress.max}{' '}
                            {selectedBadge.progress.unit}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (selectedBadge.progress.current / selectedBadge.progress.max) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-retro text-xs rounded-lg transition cursor-pointer"
              >
                CLOSE INTEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
