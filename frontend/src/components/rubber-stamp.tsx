/** Decorative ink; the adjacent status text remains the accessible source of truth. */
export function RubberStamp({ date, animate = false }: { date?: string | null; animate?: boolean }) {
  return (
    <span className="rubber-stamp" data-animate={animate || undefined} aria-hidden="true">
      <span className="stamp-caption">A PROMISE KEPT</span>
      <strong>USED ♡</strong>
      {date ? <time dateTime={date}>{new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
      })}</time> : <span className="stamp-caption">เก็บไว้ในความทรงจำ</span>}
    </span>
  );
}
