'use client';

import { useEffect } from 'react';

export default function AdSense({ adSlot, adFormat = 'auto', style = {}, showPlaceholder = false }) {
  useEffect(() => {
    try {
      if (window.adsbygoogle && window.adsbygoogle.loaded) {
        return;
      }
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  const hasAdSenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // If no AdSense ID and placeholder not requested, return null
  if (!hasAdSenseId && !showPlaceholder) {
    return null;
  }

  // If no AdSense ID but placeholder requested, show placeholder
  if (!hasAdSenseId && showPlaceholder) {
    return (
      <div 
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ minHeight: style.minHeight || '90px', ...style }}
      >
        Ad Space
      </div>
    );
  }

  // Render actual AdSense ad
  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}
