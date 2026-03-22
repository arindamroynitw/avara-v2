export function RiaAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-[#E94560] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="text-white font-semibold"
        style={{ fontSize: size * 0.4 }}
      >
        R
      </span>
    </div>
  );
}
