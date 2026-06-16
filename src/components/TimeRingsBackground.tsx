import { motion } from 'framer-motion';

/**
 * 时间环背景 —— 签名元素。
 * 不是通用的极光色块，而是同心圆环缓慢旋转，像机芯齿轮，
 * 呼应「定时」这个产品内核。环上点缀刻度，强化时钟隐喻。
 *
 * 同时叠加一层柔和渐变，让深浅两套主题都有氛围。
 */
export function TimeRingsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 渐变底 */}
      <div
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background:
            'radial-gradient(120% 90% at 15% 10%, var(--bg-1) 0%, transparent 50%),' +
            'radial-gradient(120% 100% at 85% 20%, var(--bg-2) 0%, transparent 55%),' +
            'radial-gradient(140% 120% at 50% 110%, var(--bg-3) 0%, transparent 50%),' +
            'var(--bg-0)',
        }}
      />

      {/* 同心时间环 —— 右上偏置，露出半边 */}
      <div className="absolute -right-40 -top-40 h-[640px] w-[640px]">
        <motion.div
          className="absolute inset-0 animate-spin-slow"
          style={{ willChange: 'transform' }}
        >
          <Rings />
        </motion.div>
      </div>

      {/* 左下偏置的一组小环，反向旋转，构成层级 */}
      <div className="absolute -bottom-32 -left-24 h-[420px] w-[420px] opacity-70">
        <motion.div
          className="absolute inset-0 animate-spin-slower"
          style={{ willChange: 'transform' }}
        >
          <Rings dense />
        </motion.div>
      </div>

      {/* 顶部一抹强调色高光，制造玻璃后的"光" */}
      <div
        className="absolute left-1/2 top-[-10%] h-[40%] w-[60%] -translate-x-1/2 blur-3xl opacity-50"
        style={{
          background:
            'radial-gradient(closest-side, rgb(var(--accent) / 0.45), transparent)',
        }}
      />
    </div>
  );
}

/** 一组同心圆环 + 刻度 */
function Rings({ dense = false }: { dense?: boolean }) {
  const rings = dense
    ? [0.3, 0.5, 0.68, 0.85, 1]
    : [0.4, 0.6, 0.78, 0.92, 1];

  return (
    <svg viewBox="0 0 600 600" className="h-full w-full">
      <defs>
        <radialGradient id="ringFade" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor="rgb(var(--ring-stroke))"
            stopOpacity="0"
          />
          <stop
            offset="70%"
            stopColor="rgb(var(--ring-stroke))"
            stopOpacity="0.5"
          />
          <stop
            offset="100%"
            stopColor="rgb(var(--ring-stroke))"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      {rings.map((r, i) => (
        <circle
          key={i}
          cx="300"
          cy="300"
          r={r * 290}
          fill="none"
          stroke="rgb(var(--ring-stroke))"
          strokeOpacity={0.1 + i * 0.04}
          strokeWidth={dense ? 1 : 1.5}
        />
      ))}

      {/* 12 个刻度，像表盘 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const outer = 282;
        const inner = i % 3 === 0 ? 262 : 272;
        const x1 = 300 + Math.cos(angle) * outer;
        const y1 = 300 + Math.sin(angle) * outer;
        const x2 = 300 + Math.cos(angle) * inner;
        const y2 = 300 + Math.sin(angle) * inner;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgb(var(--ring-stroke))"
            strokeOpacity={i % 3 === 0 ? 0.35 : 0.18}
            strokeWidth={i % 3 === 0 ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}

      {/* 外圈柔光 */}
      <circle cx="300" cy="300" r="290" fill="url(#ringFade)" opacity="0.6" />
    </svg>
  );
}
