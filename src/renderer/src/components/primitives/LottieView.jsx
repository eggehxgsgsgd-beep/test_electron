// LottieView.jsx — 一次性 Lottie 播放器 + 完成时的彩带覆盖层
import React from 'react';
import lottie from 'lottie-web';
const { useState, useRef, useEffect } = React

// Confetti is ~600 KB — lazy-load only when the first pomodoro finishes.
// Confetti is ~600 KB — lazy-load only when the first pomodoro finishes.
let confettiLottieDataPromise = null;
const loadConfettiData = () => {
  if (!confettiLottieDataPromise) {
    confettiLottieDataPromise = import('@/assets/lottie/confetti.json').then((m) => m.default);
  }
  return confettiLottieDataPromise;
};

function LottieView({ data, loop = false, autoplay = true, onComplete, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      animationData: data,
    });
    if (onComplete) anim.addEventListener('complete', onComplete);
    return () => anim.destroy();
  }, [data, loop, autoplay]);

  return <div ref={containerRef} style={{ pointerEvents: 'none', ...style }} />;
}

function ConfettiOverlay() {
  // Lazy-loads the heavy confetti JSON the first time it's needed. While the
  // fetch is in flight the overlay renders nothing — confetti is purely
  // decorative, so a brief delay before it appears is acceptable.
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadConfettiData().then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, []);
  if (!data) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 25,  // above the dim overlay (20) so confetti renders in front
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <LottieView data={data} autoplay loop={false}
        style={{ width: 480, height: 480 }} />
    </div>
  );
}

export { LottieView, ConfettiOverlay };
