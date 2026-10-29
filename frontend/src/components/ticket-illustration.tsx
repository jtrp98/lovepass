import { couponCategories, resolveCategory } from "@/lib/coupon-categories";

/** Shared SVG files inherit the ticket's ink and paper accent. */
export function TicketIllustration({ category }: { category?: string | null }) {
  return (
    <svg className="pocket-drawing" viewBox="0 0 120 110" fill="none" aria-hidden="true" focusable="false">
      <use href={`${couponCategories[resolveCategory(category)].icon}#drawing`} />
    </svg>
  );
}
