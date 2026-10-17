"use client";

import { useState } from "react";

const CSS = ".intro-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;pointer-events:none;overflow:hidden}\n.intro-overlay>div{position:absolute;top:0;right:0;bottom:0;left:0;will-change:transform}\n.intro-red{background:#D23412;animation:intro-up 900ms cubic-bezier(.76,0,.24,1) 1000ms forwards}\n.intro-white{background:#ffffff;animation:intro-up 900ms cubic-bezier(.76,0,.24,1) 500ms forwards}\n@keyframes intro-up{from{transform:translateY(0)}to{transform:translateY(-101%)}}\n@media (prefers-reduced-motion:reduce){.intro-overlay{display:none}}";

export default function IntroAnimation() {
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <div className="intro-overlay" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="intro-red" onAnimationEnd={() => setDone(true)} />
      <div className="intro-white" />
    </div>
  );
}
