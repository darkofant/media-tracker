"use client";

import styles from "@/app/page.module.css";

type StarRatingInputProps = {
  idPrefix: string;
  name: string;
  legend: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function StarRatingInput({ idPrefix, name, legend, value, onChange, disabled = false }: StarRatingInputProps) {
  return (
    <fieldset className={`${styles.fieldGroup} ${styles.starRating}`}>
      <legend>{legend}</legend>
      <div className={styles.ratingStars}>
        {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
          <span key={star}>
            <input
              id={`${idPrefix}-${star}`}
              className={styles.visuallyHidden}
              type="radio"
              name={name}
              value={star}
              disabled={disabled}
              checked={Number(value) === star}
              onChange={(event) => onChange(event.target.value)}
              aria-label={`${star} von 5 Sternen`}
            />
            <label
              htmlFor={`${idPrefix}-${star}`}
              className={`${styles.ratingStar} ${Number(value) >= star ? styles.ratingStarSelected : ""}`}
              title={`${star} von 5 Sternen`}
            >
              ★
            </label>
          </span>
        ))}
        <button
          type="button"
          className={styles.ratingClearButton}
          onClick={() => onChange("")}
          disabled={disabled || !value}
          aria-label="Bewertung zurücksetzen"
          title="Bewertung zurücksetzen"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </fieldset>
  );
}
