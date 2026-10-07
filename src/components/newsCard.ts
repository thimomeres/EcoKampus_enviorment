import type { Article, NewsCategory } from "../types/news";
import { escapeHtml, formatRelativeDate, isHttpUrl } from "../utils/format";

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  "pilah-sampah": "Pilah Sampah",
  "dampak-sampah": "Dampak Sampah",
  "go-green": "Go Green",
  "jaga-lingkungan": "Jaga Lingkungan",
  "jerhemy-owen": "Jerhemy Owen",
};

function categoryIcon(category: NewsCategory): string {
  if (category === "pilah-sampah") {
    return `<svg class="news-card__icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="18" width="10" height="22" rx="2" fill="currentColor" opacity=".85"/><rect x="19" y="12" width="10" height="28" rx="2" fill="currentColor"/><rect x="32" y="8" width="10" height="32" rx="2" fill="currentColor" opacity=".7"/></svg>`;
  }
  if (category === "dampak-sampah") {
    return `<svg class="news-card__icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6 42 38H6L24 6z" fill="currentColor"/><rect x="22" y="18" width="4" height="12" fill="#fff"/><rect x="22" y="32" width="4" height="4" fill="#fff"/></svg>`;
  }
  if (category === "go-green") {
    return `<svg class="news-card__icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40c0-12 10-22 20-22-2 14-12 22-20 22Z" fill="currentColor"/><path d="M24 40C24 28 14 18 4 18c2 14 12 22 20 22Z" fill="currentColor" opacity=".7"/><rect x="22" y="22" width="4" height="18" fill="currentColor"/></svg>`;
  }
  if (category === "jerhemy-owen") {
    return `<svg class="news-card__icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16" r="8" fill="currentColor"/><path d="M8 42c0-9 7-15 16-15s16 6 16 15z" fill="currentColor"/></svg>`;
  }
  return `<svg class="news-card__icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8c8 6 14 12 14 20a14 14 0 1 1-28 0c0-8 6-14 14-20z" fill="currentColor"/></svg>`;
}

function safeHref(url: string): string {
  return isHttpUrl(url) ? escapeHtml(url) : "#berita";
}

export function renderNewsCard(article: Article, featured = false): string {
  const title = escapeHtml(article.title);
  const summary = escapeHtml(article.summary);
  const source = escapeHtml(article.source);
  const date = escapeHtml(formatRelativeDate(article.publishedAt));
  const label = escapeHtml(CATEGORY_LABEL[article.category]);
  const featuredClass = featured ? " news-card--featured" : "";
  const hasImage = article.imageUrl && isHttpUrl(article.imageUrl);
  // Placeholder selalu ada di bawah; foto menimpanya dan dihapus bila gagal dimuat.
  const media = `<div class="news-card__placeholder news-card__placeholder--${article.category}">${categoryIcon(article.category)}</div>${
    hasImage
      ? `<img src="${escapeHtml(article.imageUrl ?? "")}" alt="" class="news-card__img" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : ""
  }`;

  const action = article.curated
    ? `<button type="button" class="news-card__btn" data-open-article="${escapeHtml(article.id)}">Baca selengkapnya</button>`
    : `<a class="news-card__btn news-card__btn--external" href="${safeHref(article.url)}" target="_blank" rel="noopener noreferrer">Baca selengkapnya <span aria-hidden="true">↗</span></a>`;

  return `
    <article class="news-card${featuredClass}" data-category="${article.category}">
      <div class="news-card__media">${media}</div>
      <div class="news-card__body">
        <span class="news-chip">${label}</span>
        <h3 class="news-card__title">${title}</h3>
        ${summary ? `<p class="news-card__summary">${summary}</p>` : ""}
        <p class="news-card__meta"><span>${source}</span> · <time datetime="${escapeHtml(article.publishedAt)}">${date}</time></p>
        ${action}
      </div>
    </article>
  `;
}
