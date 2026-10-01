'use client';
import { useState } from 'react';

/**
 * Signed-in user's picture: the Google profile photo when there is one, otherwise (or if it fails to load)
 * the first letter of their name on the brand green.
 */
export default function UserAvatar({ name, picture, size = 36, className = '' }: { name?: string; picture?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (picture && !failed) {
    return (
      // Google photo: external URL, so a plain <img> avoids image-domain config
      // eslint-disable-next-line @next/next/no-img-element
      <img src={picture} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} style={style} className={`rounded-full object-cover ${className}`} />
    );
  }
  return (
    <span style={{ ...style, fontSize: size * 0.44 }} className={`rounded-full bg-obuya-avatar text-white font-semibold flex items-center justify-center ${className}`}>
      {name?.trim().charAt(0).toUpperCase() || 'U'}
    </span>
  );
}
