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

// Utility function to strip HTML tags and clean text
const stripHtmlTags = (html: string) => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
};

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

    // Clean description by removing HTML tags
    const cleanDescription = stripHtmlTags(article.newsBody).substring(0, 160);

    return {
      title: `${article.newsTitle} - Naija Daily`,
      description: cleanDescription,
      openGraph: {
        title: article.newsTitle,
        description: cleanDescription,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 400,
            alt: article.newsTitle,
          }
        ],
        url: `https://naijadaily.ng/news/${slug}`,
        type: "article",
        siteName: "Naija Daily",
      },
      twitter: {
        card: "summary_large_image",
        title: article.newsTitle,
        description: cleanDescription,
        images: [imageUrl],
        site: "@naijadaily",
      },
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return {
      title: "Error - Naija Daily",
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
  let allArticles: NewsItem[] = [];
  
  try {
    const response = await fetch(
      "https://news-app-three-lyart.vercel.app/news-app/published",
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    if (!response.ok) throw new Error("Failed to fetch article");

    const result = await response.json();
    allArticles = result.data || [];
    article = allArticles.find(
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

  // Get similar posts (same category, excluding current article)
  const similarPosts = allArticles
    .filter(item => 
      item.category === newsItem.category && 
      item._id !== newsItem._id
    )
    .slice(0, 3)
    .map(item => ({
      ...item,
      slug: generateSlug(item.newsTitle),
      createdAt: new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

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
          
          {/* Similar Posts Section */}
          {similarPosts.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800">
                Similar Posts in {newsItem.category}
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {similarPosts.map((post) => {
                  const postImageUrl = post.newsImage?.startsWith("http")
                    ? post.newsImage
                    : `https://naijadaily.ng${post.newsImage || "/default-image.jpg"}`;
                  
                  return (
                    <Link
                      key={post._id}
                      href={`/news/${post.slug}`}
                      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200"
                    >
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={postImageUrl}
                          alt={post.newsTitle}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-4">
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full mb-2">
                          {post.category}
                        </span>
                        <h4 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2 mb-2">
                          {post.newsTitle}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          {stripHtmlTags(post.newsBody).substring(0, 100)}...
                        </p>
                        <div className="text-xs text-gray-400">
                          By {post.createdBy} • {post.createdAt}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          
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