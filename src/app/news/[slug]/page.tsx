// app/news/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  params: Promise<{ slug: string }>;
};

// Utility function to generate slug from title
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Interface for news item
interface NewsItem {
  _id: string;
  newsTitle: string;
  slug: string;
  category: string;
  newsImage: string;
  newsBody: string;
  createdAt: string;
  createdBy: string;
  views: number;
}

// Generate metadata for social media sharing
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await params to ensure it's resolved
  const { slug } = await params;

  try {
    const response = await fetch(
      "https://news-app-three-lyart.vercel.app/news-app/published",
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    if (!response.ok) throw new Error("Failed to fetch article");

    const result = await response.json();
    const article = result.data?.find(
      (item: NewsItem) => generateSlug(item.newsTitle) === slug
    );

    if (!article) {
      return {
        title: "Article Not Found",
        description: "The requested article could not be found.",
      };
    }

    const imageUrl = article.newsImage?.startsWith("http")
      ? article.newsImage
      : `https://naijadaily.ng${article.newsImage || "/default-image.jpg"}`;

    return {
      title: article.newsTitle,
      description: article.newsBody.substring(0, 160),
      openGraph: {
        title: article.newsTitle,
        description: article.newsBody.substring(0, 160),
        images: [imageUrl],
        url: `https://naijadaily.ng/news/${slug}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: article.newsTitle,
        description: article.newsBody.substring(0, 160),
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return {
      title: "Error",
      description: "An error occurred while fetching the article.",
    };
  }
}

// Main page component
export default async function NewsArticlePage({ params }: Props) {
  // Await params to ensure it's resolved
  const { slug } = await params;

  // Fetch article data
  let article: NewsItem | null = null;
  try {
    const response = await fetch(
      "https://news-app-three-lyart.vercel.app/news-app/published",
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    if (!response.ok) throw new Error("Failed to fetch article");

    const result = await response.json();
    article = result.data?.find(
      (item: NewsItem) => generateSlug(item.newsTitle) === slug
    );
  } catch (error) {
    console.error("Fetch error:", error);
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center py-8 bg-white h-screen">
        <p className="text-gray-600">Article not found</p>
      </div>
    );
  }

  const newsItem: NewsItem = {
    ...article,
    slug: generateSlug(article.newsTitle),
    createdAt: new Date(article.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };

  const imageUrl = newsItem.newsImage?.startsWith("http")
    ? newsItem.newsImage
    : `https://naijadaily.ng${newsItem.newsImage || "/default-image.jpg"}`;

  const sanitizedNewsBody = DOMPurify.sanitize(newsItem.newsBody);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Simple Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-red-600">
            Naija Daily
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <article className="bg-white rounded-lg shadow-md p-4 md:p-8">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full mb-4">
            {newsItem.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            {newsItem.newsTitle}
          </h1>
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>
              By {newsItem.createdBy} • {newsItem.createdAt}
            </span>
          </div>
          <Image
            src={imageUrl}
            alt={`Featured image for ${newsItem.newsTitle}`}
            width={800}
            height={400}
            className="w-full h-auto rounded-lg mb-6"
            priority
          />
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedNewsBody }}
          />
          <div className="mt-8">
            <Link href="/" className="text-red-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Naija Daily Nigeria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}