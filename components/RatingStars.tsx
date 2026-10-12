import styles from "@/app/page.module.css";

export function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span>Noch keine Bewertung</span>;
  }

  return (
    <span className={styles.ratingDisplay} aria-label={`${rating} von 5 Sternen`}>
      <span aria-hidden="true">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
      <span>{rating}/5</span>
    </span>
  );
}
