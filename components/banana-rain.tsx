import type { CSSProperties } from "react";

const bananaDrops = [
  { delay: "-1s", duration: "18s", left: "4%", rotate: "-18deg", size: "26px" },
  { delay: "-9s", duration: "24s", left: "10%", rotate: "16deg", size: "18px" },
  { delay: "-4s", duration: "20s", left: "17%", rotate: "34deg", size: "22px" },
  { delay: "-13s", duration: "26s", left: "25%", rotate: "-28deg", size: "16px" },
  { delay: "-6s", duration: "21s", left: "32%", rotate: "12deg", size: "24px" },
  { delay: "-16s", duration: "28s", left: "40%", rotate: "-8deg", size: "17px" },
  { delay: "-3s", duration: "19s", left: "48%", rotate: "26deg", size: "21px" },
  { delay: "-11s", duration: "25s", left: "57%", rotate: "-34deg", size: "19px" },
  { delay: "-7s", duration: "22s", left: "65%", rotate: "10deg", size: "25px" },
  { delay: "-18s", duration: "30s", left: "73%", rotate: "-20deg", size: "16px" },
  { delay: "-5s", duration: "20s", left: "81%", rotate: "38deg", size: "23px" },
  { delay: "-14s", duration: "27s", left: "91%", rotate: "-12deg", size: "18px" },
  { delay: "-20s", duration: "32s", left: "96%", rotate: "24deg", size: "14px" }
];

export function BananaRain() {
  return (
    <div aria-hidden className="banana-rain">
      {bananaDrops.map((drop, index) => (
        <span
          className="banana-rain-drop"
          key={`${drop.left}-${index}`}
          style={
            {
              "--banana-delay": drop.delay,
              "--banana-duration": drop.duration,
              "--banana-left": drop.left,
              "--banana-rotate": drop.rotate,
              "--banana-size": drop.size
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
