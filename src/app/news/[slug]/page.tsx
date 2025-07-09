import { Metadata } from "next";
import NewsArticleClient from "./NewsArticleClient";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { slug } = params;

  try {
    const res = await fetch(`https://news-app-three-lyart.vercel.app/news-app/published?slug=${slug}`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Failed to fetch article");
    const article = await res.json();

    if (!article) {
      return {
        title: "Article Not Found",
        description: "The requested article could not be found"
      };
    }

    const imageUrl = article.newsImage?.startsWith("http")
      ? article.newsImage
      : `https://naijadaily.ng${article.newsImage || "/default-image.jpg"}`;

    return {
      title: article.newsTitle,
      description: article.newsBody?.substring(0, 160) || "Read the latest news on Naija Daily",
      alternates: {
        canonical: `https://naijadaily.ng/news/${slug}`
      },
      openGraph: {
        title: article.newsTitle,
        description: article.newsBody?.substring(0, 160),
        url: `https://naijadaily.ng/news/${slug}`,
        type: "article",
        publishedTime: article.createdAt,
        authors: [article.createdBy],
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: article.newsTitle || "News Article Image",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: article.newsTitle,
        description: article.newsBody?.substring(0, 160),
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: "Error Loading Article",
      description: "An error occurred while loading the article"
    };
  }
}

export default function NewsArticlePage({ params }: PageProps) {
  return <NewsArticleClient />;
}
