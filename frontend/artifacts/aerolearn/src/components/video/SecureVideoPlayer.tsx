import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { customFetch } from '@workspace/api-client-react';

// ─── Props ──────────────────────────────────────────────
interface SecureVideoPlayerProps {
  src: string;
  lessonId: string;
  lessonTitle: string;
  courseThumbnail?: string;
  initialPosition?: number;
  onComplete?: () => void;
  onProgressUpdate?: (watchPercent: number) => void;
  nextLesson?: { id: string; title: string };
}

// ─── Helpers ────────────────────────────────────────────
function fmt(t: number): string {
  if (!isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const REPORT_INTERVAL = 30;

const CORNERS: { bottom?: string; top?: string; left?: string; right?: string }[] = [
  { bottom: '12%', right: '3%' },
  { bottom: '12%', left: '3%' },
  { top: '12%', right: '3%' },
  { top: '12%', left: '3%' },
];

// ─── Component ──────────────────────────────────────────
export default function SecureVideoPlayer({
  src,
  lessonId,
  lessonTitle,
  courseThumbnail,
  initialPosition,
  onComplete,
  onProgressUpdate,
  nextLesson,
}: SecureVideoPlayerProps) {
  const { user } = useAuth();

  // ── Refs ──────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const lastReportTime = useRef(0);
  const hasStarted = useRef(false);
  const seekingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const lastTimeRef = useRef(0);          // previous timeupdate position
  const actualWatchedRef = useRef(0);     // accumulated genuine watch seconds

  // ── State ─────────────────────────────────────
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [clickAnim, setClickAnim] = useState<'play' | 'pause' | null>(null);
  const [seekTooltip, setSeekTooltip] = useState<{ x: number; time: number } | null>(null);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [watermarkCorner, setWatermarkCorner] = useState(0);
  const [resumeBadge, setResumeBadge] = useState<string | null>(null);

  // ── Set video src via ref (never in DOM) ──────
  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.src = src;
    }
  }, [src]);

  // ── Resume from position ──────────────────────
  useEffect(() => {
    if (videoRef.current && initialPosition && initialPosition > 30) {
      const onCanPlay = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = initialPosition;
          setResumeBadge(`Resumed from ${fmt(initialPosition)}`);
          setTimeout(() => setResumeBadge(null), 3000);
        }
      };
      videoRef.current.addEventListener('canplay', onCanPlay, { once: true });
    }
  }, [initialPosition]);

  // ── Watermark shift every 45s ─────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setWatermarkCorner((c) => (c + 1) % 4);
    }, 45000);
    return () => clearInterval(iv);
  }, []);

  // ── Block keyboard shortcuts ──────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (
        (ctrl && e.key === 's') ||
        (ctrl && e.shiftKey && e.key === 'S') ||
        (ctrl && e.key === 'u') ||
        (ctrl && e.key === 'j') ||
        (ctrl && e.shiftKey && e.key === 'I') ||
        (ctrl && e.shiftKey && e.key === 'J') ||
        (ctrl && e.shiftKey && e.key === 'C') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, []);

  // ── Player keyboard shortcuts ─────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const v = videoRef.current;
      if (!v) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
        case 'ArrowLeft':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case 'l':
        case 'ArrowRight':
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts((s) => !s);
          break;
        case 'Escape':
          setShowShortcuts(false);
          break;
        case ',':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 0.04);
          break;
        case '.':
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 0.04);
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            v.currentTime = (v.duration || 0) * (parseInt(e.key) / 10);
          }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, playing]);

  // ── Controls auto-hide ────────────────────────
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      setControlsVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [playing]);

  // ── Fullscreen change listener ────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Progress tracking ─────────────────────────
  const reportProgress = useCallback(
    async (watchPercent: number, pos: number, completed: boolean) => {
      try {
        await customFetch('/api/video/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_id: lessonId,
            watch_percent: watchPercent,
            current_position: Math.round(pos),
            completed,
            watched_seconds: Math.round(actualWatchedRef.current),
            video_duration: Math.round(videoRef.current?.duration || 0),
          }),
        });
      } catch {
        /* swallow – non-critical */
      }
    },
    [lessonId],
  );

  // ── Video event handlers ──────────────────────
  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    // buffered
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
    // Accumulate actual watch time — cap delta at 2s to reject seeks
    const delta = v.currentTime - lastTimeRef.current;
    if (delta > 0 && delta <= 2) {
      actualWatchedRef.current += delta;
    }
    lastTimeRef.current = v.currentTime;
    // throttled progress report
    if (v.duration && v.currentTime - lastReportTime.current >= REPORT_INTERVAL) {
      lastReportTime.current = v.currentTime;
      const pct = Math.round((v.currentTime / v.duration) * 100);
      reportProgress(pct, v.currentTime, pct >= 90);
      // Report REAL watched pct to parent (for Complete & Continue gating)
      const realPct = v.duration > 0 ? Math.round((actualWatchedRef.current / v.duration) * 100) : 0;
      onProgressUpdate?.(realPct);
    }
  }, [reportProgress, onProgressUpdate]);

  const onEnded = useCallback(async () => {
    setPlaying(false);
    const v = videoRef.current;
    const dur = v?.duration || 0;
    await reportProgress(100, dur, true);
    // Calculate real watched percentage
    const realPct = dur > 0 ? Math.round((actualWatchedRef.current / dur) * 100) : 0;
    onProgressUpdate?.(realPct);
    // Only show completion overlay if genuinely watched >= 90%
    if (realPct >= 90) {
      setShowCompleted(true);
      onComplete?.();
    }
  }, [reportProgress, onComplete, onProgressUpdate]);

  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }, []);

  // ── Actions ───────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      if (!hasStarted.current) {
        hasStarted.current = true;
        setShowStartOverlay(false);
      }
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const changeVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val > 0 && v.muted) { v.muted = false; setMuted(false); }
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => {
      const next = (i + 1) % SPEEDS.length;
      if (videoRef.current) videoRef.current.playbackRate = SPEEDS[next];
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const seek = useCallback((frac: number) => {
    const v = videoRef.current;
    if (v && v.duration) v.currentTime = frac * v.duration;
  }, []);

  const retry = useCallback(() => {
    setHasError(false);
    const v = videoRef.current;
    if (v && src) {
      v.src = src;
      v.load();
    }
  }, [src]);

  // ── Click-to-play animation ───────────────────
  const flashClick = useCallback(
    (kind: 'play' | 'pause') => {
      setClickAnim(kind);
      setTimeout(() => setClickAnim(null), 400);
    },
    [],
  );

  const handleSurfaceClick = useCallback(() => {
    const wasPaused = videoRef.current?.paused;
    togglePlay();
    flashClick(wasPaused ? 'play' : 'pause');
  }, [togglePlay, flashClick]);

  const handleSurfaceDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  // ── Seek bar mouse ────────────────────────────
  const seekBarRef = useRef<HTMLDivElement>(null);

  const getSeekFrac = (e: React.MouseEvent) => {
    if (!seekBarRef.current) return 0;
    const rect = seekBarRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const onSeekBarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    seekingRef.current = true;
    const frac = getSeekFrac(e);
    seek(frac);
    const v = videoRef.current;
    const wasPlaying = v && !v.paused;
    if (wasPlaying) v?.pause();

    const onMove = (me: MouseEvent) => {
      if (!seekBarRef.current) return;
      const rect = seekBarRef.current.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
      seek(f);
    };
    const onUp = () => {
      seekingRef.current = false;
      if (wasPlaying) v?.play();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Touch gestures ────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const elapsed = Date.now() - start.t;
    const v = videoRef.current;
    touchStartRef.current = null;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && elapsed < 500) {
      // Swipe horizontal
      if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + (dx > 0 ? 10 : -10)));
      return;
    }
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) && elapsed < 500) {
      // Swipe vertical
      changeVolume(Math.max(0, Math.min(1, volume + (dy < 0 ? 0.1 : -0.1))));
      return;
    }

    // Tap / double-tap
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && elapsed < 300) {
      const now = Date.now();
      const lastTap = lastTapRef.current;
      if (now - lastTap.time < 350) {
        // Double tap
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const relX = t.clientX - rect.left;
          const third = rect.width / 3;
          if (relX < third) {
            if (v) v.currentTime = Math.max(0, v.currentTime - 10);
          } else if (relX > 2 * third) {
            if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          } else {
            toggleFullscreen();
          }
        }
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: t.clientX };
        // Single tap after delay
        setTimeout(() => {
          if (lastTapRef.current.time === now) {
            handleSurfaceClick();
          }
        }, 360);
      }
    }
  };

  // ── Volume icon helper ────────────────────────
  const volLevel = muted || volume === 0 ? 0 : volume < 0.3 ? 1 : volume < 0.7 ? 2 : 3;

  // ── Seek tooltip hover ────────────────────────
  const onSeekBarHover = (e: React.MouseEvent) => {
    const frac = getSeekFrac(e);
    setSeekTooltip({ x: e.nativeEvent.offsetX, time: frac * duration });
  };

  // ── Inline SVG Icons ──────────────────────────
  const PlayIcon = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M6 3.5l14 8.5-14 8.5z" />
    </svg>
  );
  const PauseIcon = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="5" y="3" width="5" height="18" rx="1" />
      <rect x="14" y="3" width="5" height="18" rx="1" />
    </svg>
  );
  const SkipBackIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 19a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0-7.5 7.5" />
      <polyline points="8 2 4 6.5 8.5 10" />
      <text x="9" y="15.5" fill="currentColor" stroke="none" fontSize="7" fontFamily="monospace" textAnchor="middle">10</text>
    </svg>
  );
  const SkipForwardIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 19a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 7.5 7.5" />
      <polyline points="16 2 20 6.5 15.5 10" />
      <text x="15" y="15.5" fill="currentColor" stroke="none" fontSize="7" fontFamily="monospace" textAnchor="middle">10</text>
    </svg>
  );
  const FullscreenInIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
      <polyline points="21 3 14 10" /><polyline points="3 21 10 14" />
    </svg>
  );
  const FullscreenOutIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );

  const VolumeIcon = () => {
    if (volLevel === 0) return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity={0.7} />
        <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity={0.7} />
        {volLevel >= 1 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
        {volLevel >= 2 && <path d="M18.07 5.93a9 9 0 0 1 0 12.14" />}
        {volLevel >= 3 && <path d="M20.6 3.4a13 13 0 0 1 0 17.2" />}
      </svg>
    );
  };

  // ── Spinner SVG ───────────────────────────────
  const Spinner = () => (
    <svg width={48} height={48} viewBox="0 0 48 48" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="24" cy="24" r="20" fill="none" stroke="#C9A84C" strokeWidth={3} strokeDasharray="95 35" strokeLinecap="round" />
    </svg>
  );

  // ── Checkmark SVG ─────────────────────────────
  const CheckmarkAnim = () => (
    <svg width={64} height={64} viewBox="0 0 64 64" fill="none" style={{ animation: 'draw-check 0.6s ease forwards' }}>
      <circle cx="32" cy="32" r="30" stroke="#C9A84C" strokeWidth={3} fill="none" style={{ strokeDasharray: 189, strokeDashoffset: 189, animation: 'draw-circle 0.4s ease forwards' }} />
      <polyline points="20,34 28,42 44,24" stroke="#C9A84C" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'draw-line 0.3s 0.4s ease forwards' }} />
    </svg>
  );

  // ── Render ────────────────────────────────────
  const playedFrac = duration > 0 ? currentTime / duration : 0;
  const buffFrac = duration > 0 ? buffered / duration : 0;

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes flash-icon { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes draw-circle { to { stroke-dashoffset: 0; } }
        @keyframes draw-line { to { stroke-dashoffset: 0; } }
        @keyframes draw-check { to { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(8px); } }
      `}</style>

      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={showControls}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: controlsVisible ? 'default' : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* ── Video element ── */}
        <video
          ref={videoRef}
          controls={false}
          controlsList="nodownload noremoteplayback nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />

        {/* ── Transparent overlay (z-5) ── */}
        <div
          onClick={handleSurfaceClick}
          onDoubleClick={handleSurfaceDoubleClick}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
          }}
        />

        {/* ── Dynamic watermark ── */}
        <div
          style={{
            position: 'absolute',
            ...CORNERS[watermarkCorner],
            color: 'rgba(255,255,255,0.12)',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
            transition: 'all 1s ease',
          }}
        >
          {user?.email}
        </div>

        {/* ── Click animation flash ── */}
        {clickAnim && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 15,
              pointerEvents: 'none',
              animation: 'flash-icon 0.4s ease forwards',
            }}
          >
            {clickAnim === 'play' ? (
              <PlayIcon size={48} color="rgba(255,255,255,0.7)" />
            ) : (
              <PauseIcon size={48} color="rgba(255,255,255,0.7)" />
            )}
          </div>
        )}

        {/* ── Resume badge ── */}
        {resumeBadge && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 25,
              background: 'rgba(0,0,0,0.75)',
              color: '#C9A84C',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '6px 12px',
              borderRadius: '6px',
              animation: 'slideDown 0.5s 2.5s ease forwards',
            }}
          >
            {resumeBadge}
          </div>
        )}

        {/* ── Buffering spinner ── */}
        {isBuffering && !hasError && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 14, pointerEvents: 'none' }}>
            <Spinner />
          </div>
        )}

        {/* ── Error state ── */}
        {hasError && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth={2}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>Unable to load video. Please refresh the page.</p>
            <button onClick={retry} style={{ marginTop: '16px', background: 'rgba(201,168,76,0.2)', border: '1px solid #C9A84C', color: '#C9A84C', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
              Retry
            </button>
          </div>
        )}

        {/* ── Start overlay ── */}
        {showStartOverlay && (
          <div
            onClick={() => { togglePlay(); }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 25,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: courseThumbnail ? `linear-gradient(rgba(4,13,26,0.7),rgba(4,13,26,0.85)), url(${courseThumbnail}) center/cover` : '#040D1A',
              cursor: 'pointer',
              transition: 'opacity 0.4s ease',
            }}
          >
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', color: '#fff', marginBottom: '24px', textAlign: 'center', padding: '0 24px', maxWidth: '500px' }}>{lessonTitle}</p>
            {/* Big play button */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)', border: '1.5px solid rgba(201,168,76,0.4)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={(e) => { const s = e.currentTarget.style; s.transform = 'scale(1.08)'; s.borderColor = 'rgba(201,168,76,0.8)'; s.background = 'rgba(201,168,76,0.25)'; }}
              onMouseLeave={(e) => { const s = e.currentTarget.style; s.transform = 'scale(1)'; s.borderColor = 'rgba(201,168,76,0.4)'; s.background = 'rgba(201,168,76,0.15)'; }}
            >
              <PlayIcon size={28} color="#C9A84C" />
            </div>
            {duration > 0 && (
              <p style={{ position: 'absolute', bottom: '16px', right: '20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{fmt(duration)}</p>
            )}
          </div>
        )}

        {/* ── Completion overlay ── */}
        {showCompleted && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,13,26,0.9)', animation: 'fadeIn 0.4s ease' }}>
            <CheckmarkAnim />
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#C9A84C', marginTop: '20px' }}>Lesson Complete</p>
            {nextLesson && (
              <button
                onClick={() => { /* handled by parent */ }}
                style={{
                  marginTop: '20px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
                  color: '#C9A84C', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                Next Lesson →
              </button>
            )}
          </div>
        )}

        {/* ── Big center play button (shown when paused, not during start overlay) ── */}
        {!playing && !showStartOverlay && !showCompleted && !isBuffering && !hasError && (
          <div
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 20, cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(201,168,76,0.15)', border: '1.5px solid rgba(201,168,76,0.4)',
                backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { const s = e.currentTarget.style; s.transform = 'scale(1.08)'; s.borderColor = 'rgba(201,168,76,0.8)'; s.background = 'rgba(201,168,76,0.25)'; }}
              onMouseLeave={(e) => { const s = e.currentTarget.style; s.transform = 'scale(1)'; s.borderColor = 'rgba(201,168,76,0.4)'; s.background = 'rgba(201,168,76,0.15)'; }}
            >
              <PlayIcon size={28} color="#C9A84C" />
            </div>
          </div>
        )}

        {/* ── Bottom controls bar ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '48px 16px 14px',
            zIndex: 20,
            opacity: controlsVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: controlsVisible ? 'auto' : 'none',
          }}
        >
          {/* Row 1: Seek bar */}
          <div
            ref={seekBarRef}
            onMouseDown={onSeekBarMouseDown}
            onMouseMove={onSeekBarHover}
            onMouseLeave={() => setSeekTooltip(null)}
            style={{
              position: 'relative',
              width: '100%',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: '8px',
            }}
            className="group/seek"
          >
            {/* Tooltip */}
            {seekTooltip && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: `${seekTooltip.x}px`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.85)',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {fmt(seekTooltip.time)}
              </div>
            )}
            <div style={{ position: 'relative', width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', transition: 'height 0.2s ease', overflow: 'visible' }}>
              {/* Buffered */}
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${buffFrac * 100}%`, background: 'rgba(255,255,255,0.35)', borderRadius: '2px' }} />
              {/* Played */}
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${playedFrac * 100}%`, background: '#C9A84C', borderRadius: '2px' }} />
              {/* Thumb */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${playedFrac * 100}%`,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#C9A84C',
                  transform: 'translate(-50%,-50%) scale(0)',
                  transition: 'transform 0.2s ease',
                }}
                className="group-hover/seek:!scale-100"
              />
            </div>
          </div>

          {/* Row 2: Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Play/Pause */}
              <button onClick={togglePlay} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', transition: 'color 0.2s, transform 0.15s', borderRadius: '4px', minWidth: '44px', minHeight: '44px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>

              {/* Skip back 10 */}
              <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', transition: 'color 0.2s', borderRadius: '4px', minWidth: '44px', minHeight: '44px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
              >
                <SkipBackIcon />
              </button>

              {/* Skip forward 10 */}
              <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', transition: 'color 0.2s', borderRadius: '4px', minWidth: '44px', minHeight: '44px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
              >
                <SkipForwardIcon />
              </button>

              {/* Volume */}
              <div
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={() => setShowVolSlider(true)}
                onMouseLeave={() => setShowVolSlider(false)}
              >
                <button onClick={toggleMute} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', transition: 'color 0.2s', borderRadius: '4px', minWidth: '44px', minHeight: '44px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
                >
                  <VolumeIcon />
                </button>
                {showVolSlider && (
                  <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', position: 'relative', cursor: 'pointer', marginLeft: '4px' }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      changeVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                    }}
                  >
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(muted ? 0 : volume) * 100}%`, background: '#C9A84C', borderRadius: '3px' }} />
                  </div>
                )}
              </div>

              {/* Time */}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Speed */}
              <button onClick={cycleSpeed} style={{
                background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)',
                color: '#fff', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s', minHeight: '30px',
              }}
                onMouseEnter={(e) => { const s = e.currentTarget.style; s.background = 'rgba(201,168,76,0.2)'; s.borderColor = '#C9A84C'; s.color = '#C9A84C'; }}
                onMouseLeave={(e) => { const s = e.currentTarget.style; s.background = 'rgba(255,255,255,0.1)'; s.borderColor = 'rgba(255,255,255,0.2)'; s.color = '#fff'; }}
              >
                {SPEEDS[speedIdx]}×
              </button>

              {/* HD badge */}
              <span style={{
                background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(14,165,233,0.4)',
                color: '#0EA5E9', fontSize: '12px', padding: '3px 8px', borderRadius: '4px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                HD
              </span>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', transition: 'color 0.2s', borderRadius: '4px', minWidth: '44px', minHeight: '44px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
              >
                {isFullscreen ? <FullscreenOutIcon /> : <FullscreenInIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Keyboard shortcuts modal ── */}
        {showShortcuts && (
          <div
            onClick={() => setShowShortcuts(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(4,13,26,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '24px 28px',
                maxWidth: '360px',
                width: '90%',
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
              }}
            >
              <p style={{ fontSize: '14px', fontFamily: 'Cinzel, serif', color: '#C9A84C', marginBottom: '16px' }}>Keyboard Shortcuts</p>
              {[
                ['Space / K', 'Play / Pause'],
                ['J / ←', 'Skip back 10s'],
                ['L / →', 'Skip forward 10s'],
                ['M', 'Mute / Unmute'],
                ['↑ / ↓', 'Volume ±10%'],
                ['F', 'Fullscreen'],
                ['0-9', 'Seek to 0%-90%'],
                [', / .', 'Frame step'],
                ['?', 'Show / hide this'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#C9A84C' }}>{key}</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</span>
                </div>
              ))}
              <p style={{ marginTop: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Press ? or Esc to close</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
