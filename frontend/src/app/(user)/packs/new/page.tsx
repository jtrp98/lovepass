"use client";
import { GiftExperienceHeader, GiftViews } from "@/components/nav";
import { PackComposer } from "@/components/pack-composer";

export default function NewPackPage() {
  return (
    <div className="pocket-book space-y-6 pb-24">
      <GiftExperienceHeader />
      <GiftViews />
      <PackComposer />
    </div>
  );
}
