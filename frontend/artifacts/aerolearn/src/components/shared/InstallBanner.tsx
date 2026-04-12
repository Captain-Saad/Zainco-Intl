import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [location] = useLocation();

  // Hide on lesson pages (distraction during learning)
  const isLessonPage = location.includes("/lesson/");

  useEffect(() => {
    // Don't show on desktop
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if previously dismissed
    if (localStorage.getItem("install_dismissed") === "true") return;

    // Detect iOS
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iosDevice);

    if (iosDevice) {
      // iOS — show after delay (no beforeinstallprompt on iOS)
      const timer = setTimeout(() => setShow(true), 8000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setShow(true), 8000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    } else {
      localStorage.setItem("install_dismissed", "true");
      setShow(false);
    }
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    localStorage.setItem("install_dismissed", "true");
    setShow(false);
  };

  // Never render on lesson pages or when hidden
  if (isLessonPage) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100]"
          style={{
            background: "#071428",
            borderTop: "1px solid rgba(201,168,76,0.3)",
            padding: "1rem 1.25rem",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            {/* App Icon */}
            <img
              src="/images/logo.png"
              alt="AeroLearn"
              className="w-12 h-12 rounded-[10px] border-[0.5px] border-[#C9A84C]/30 shrink-0 object-contain bg-[#040D1A]"
            />

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#F0F4F8] leading-snug">
                Install AeroLearn
              </p>
              {isIOS ? (
                <p className="text-[12px] text-[#8BA3C1] leading-snug mt-0.5">
                  Tap{" "}
                  <svg className="inline w-3.5 h-3.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#8BA3C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>{" "}
                  Share then "Add to Home Screen"
                </p>
              ) : (
                <p className="text-[12px] text-[#8BA3C1] leading-snug mt-0.5">
                  Add to home screen for quick access
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="text-[12px] text-[#4A6380] px-3 py-1.5 rounded-md border-[0.5px] border-white/10 hover:border-white/25 hover:text-white/70 transition-all bg-transparent"
              >
                {isIOS ? "Got it" : "Later"}
              </button>
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="text-[12px] font-medium text-[#040D1A] bg-[#C9A84C] px-4 py-1.5 rounded-md border-none hover:bg-[#E8C97A] transition-all"
                >
                  Install
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
