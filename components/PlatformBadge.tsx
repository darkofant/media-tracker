import { getPlatformMark } from "@/lib/platforms";
import styles from "@/app/page.module.css";

type PlatformBadgeProps = {
  platform: string | null;
};

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  if (!platform) {
    return <span>Keine Plattform angegeben</span>;
  }

  return (
    <span className={styles.platformBadge} title={platform} aria-label={platform}>
      <span className={styles.platformMark} aria-hidden="true">
        {platform === "Kino" ? (
          <svg viewBox="0 0 20 20" className={styles.cinemaMark}>
            <path d="M3 7h14v10H3zM3 7l1.5-4h13L16 7" />
            <path d="m5 3 2 4m2-4 2 4m2-4 2 4" />
          </svg>
        ) : (
          getPlatformMark(platform)
        )}
      </span>
      <span>{platform}</span>
    </span>
  );
}
