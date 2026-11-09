import { redirect } from "next/navigation";

export default function SentGiftsPage() {
  redirect("/gifts?tab=sent");
}
