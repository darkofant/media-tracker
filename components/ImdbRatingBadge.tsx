import styles from "@/app/page.module.css";

type ImdbRatingBadgeProps = {
  rating: number | null;
};

function getRatingStyle(rating: number | null) {
  if (rating === null) {
    return { className: styles.imdbRatingUnrated, description: "Keine IMDb-Bewertung verfügbar" };
  }
  if (rating >= 9) {
    return { className: styles.imdbRatingAwesome, description: "Awesome" };
  }
  if (rating >= 8) {
    return { className: styles.imdbRatingGreat, description: "Great" };
  }
  if (rating >= 7) {
    return { className: styles.imdbRatingGood, description: "Good" };
  }
  if (rating >= 6) {
    return { className: styles.imdbRatingRegular, description: "Regular" };
  }
  if (rating >= 4) {
    return { className: styles.imdbRatingBad, description: "Bad" };
  }
  return { className: styles.imdbRatingGarbage, description: "Garbage" };
}

export function ImdbRatingBadge({ rating }: ImdbRatingBadgeProps) {
  const ratingStyle = getRatingStyle(rating);
  const label =
    rating === null
      ? ratingStyle.description
      : `IMDb-Bewertung ${rating.toFixed(1)} von 10: ${ratingStyle.description}`;

  return (
    <span className={`${styles.imdbRatingBadge} ${ratingStyle.className}`} aria-label={label} title={label}>
      {rating === null ? "–" : rating.toFixed(1)}
    </span>
  );
}
