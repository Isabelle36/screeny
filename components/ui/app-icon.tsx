type AppIconProps = {
  src: string;
  // Pass "" when the app name is already printed next to the icon, so it isn't read twice.
  alt: string;
  className: string;
};

// The inset 10% outline keeps white/pale icons from dissolving into the light background.
export function AppIcon({ src, alt, className }: AppIconProps) {
  if (!src) return <span aria-hidden="true" className={`${className} block bg-muted-surface`} />;
  return <img src={src} alt={alt} className={`${className} object-cover outline-1 -outline-offset-1 outline-black/10`} />;
}
