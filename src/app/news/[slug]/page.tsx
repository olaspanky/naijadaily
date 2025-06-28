// app/news/[slug]/page.tsx
import { Metadata } from "next";
import NewsArticleClient from "./NewsArticleClient";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  try {
    const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published", {
      cache: "no-store",
    });
    const result = await response.json();
    const article = result.data.find((item: any) =>
      item.newsTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === slug
    );
    if (article) {
      return {
        title: article.newsTitle,
        description: article.newsBody.slice(0, 160).replace(/<[^>]+>/g, ""),
      };
    }
  } catch (err) {
    console.error("generateMetadata error", err);
  }

  return {
    title: "NaijaDaily.ng - Article",
    description: "Read breaking news and stories from Nigeria and around the world.",
  };
}

export default function NewsArticlePage({ params }: { params: { slug: string } }) {
  return <NewsArticleClient slug={params.slug} />;
}
