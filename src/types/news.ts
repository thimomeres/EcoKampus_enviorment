export type NewsCategory =
  | "pilah-sampah"
  | "dampak-sampah"
  | "go-green"
  | "jaga-lingkungan"
  | "jerhemy-owen";

export interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  imageUrl?: string;
  curated?: boolean;
  body?: string[];
}

export interface NewsPayload {
  articles: Article[];
  updatedAt: string;
}

export type NewsSourceStatus = "live" | "cached" | "offline";

export interface NewsResult {
  articles: Article[];
  status: NewsSourceStatus;
  updatedAt: string;
}
