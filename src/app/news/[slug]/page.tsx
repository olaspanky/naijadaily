

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
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

// Fetch article ID by slug (fallback if slug-based endpoint unavailable)
async function fetchArticleIdBySlug(slug: string): Promise<string | null> {
  let currentPage = 1;
  const limit = 10;

  while (true) {
    try {
      const response = await fetch(
        `https://news-app-three-lyart.vercel.app/news-app/published?page=${currentPage}&limit=${limit}`,
        { next: { revalidate: 60 } }
      );
      if (!response.ok) {
        console.error(`API error on page ${currentPage}: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        console.error(`Invalid API response on page ${currentPage}:`, result);
        return null;
      }

      const article = result.data.find(
        (item: NewsItem) => generateSlug(item.newsTitle) === slug
      );

      if (article) {
        console.log(`Found article ID ${article._id} for slug ${slug}`);
        return article._id;
      }

      if (currentPage >= result.totalPages) {
        console.warn(`Slug ${slug} not found in ${result.totalPages} pages`);
        break;
      }
      currentPage++;
    } catch (error) {
      console.error(`Error fetching page ${currentPage} for slug ${slug}:`, error);
      return null;
    }
  }

  return null;
}

// Fetch article by ID
async function fetchArticleById(id: string): Promise<NewsItem | null> {
  try {
    const response = await fetch(
      `https://news-app-three-lyart.vercel.app/news-app/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) {
      console.error(`API error for ID ${id}: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      console.error(`Invalid API response for ID ${id}:`, result);
      return null;
    }

    const article = result.data;
    console.log(`Fetched article for ID ${id}: ${article.newsTitle}`);
    return {
      ...article,
      slug: generateSlug(article.newsTitle),
      createdAt: new Date(article.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  } catch (error) {
    console.error(`Error fetching article by ID ${id}:`, error);
    return null;
  }
}

// Fetch article by slug
async function fetchArticleBySlug(slug: string): Promise<NewsItem | null> {
  console.log(`Attempting to fetch article for slug: ${slug}`);
  const articleId = await fetchArticleIdBySlug(slug);
  if (!articleId) {
    console.warn(`No article ID found for slug: ${slug}`);
    return null;
  }
  return await fetchArticleById(articleId);
}

// Generate metadata for social media sharing
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  const article = await fetchArticleBySlug(slug);

  if (!article) {
    console.warn(`Metadata generation failed for slug: ${slug}`);
    return {
      title: "Article Not Found - Naija Daily",
      description: "The requested article could not be found.",
      openGraph: {
        title: "Article Not Found - Naija Daily",
        description: "The requested article could not be found.",
        images: [
          {
            url: "https://naijadaily.ng/default-image.jpg",
            width: 800,
            height: 400,
            alt: "Naija Daily",
          },
        ],
        url: `https://naijadaily.ng/news/${slug}`,
        type: "website",
        siteName: "Naija Daily",
      },
      twitter: {
        card: "summary_large_image",
        title: "Article Not Found - Naija Daily",
        description: "The requested article could not be found.",
        images: ["https://naijadaily.ng/default-image.jpg"],
        site: "@naijadaily",
      },
    };
  }

  const imageUrl = article.newsImage || "https://naijadaily.ng/default-image.jpg";
  console.log(`Metadata image URL for ${article.newsTitle}: ${imageUrl}`);

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
        },
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
}

// Main page component
export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  console.log(`Rendering page for slug: ${slug}`);

  // Fetch article data
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    console.error(`Article not found for slug: ${slug}`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center lg:p-8 p-2 bg-white rounded-xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-4">The article you're looking for doesn't exist or has been moved.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Use newsImage directly with fallback
  const imageUrl = article.newsImage || "https://naijadaily.ng/default-image.jpg";
  console.log(`Article image URL: ${imageUrl}`);

  const sanitizedNewsBody = DOMPurify.sanitize(article.newsBody, {
    ADD_TAGS: ["a"],
    ADD_ATTR: ["href", "target", "rel"],
  });

  // Fetch similar posts
  let similarPosts: NewsItem[] = [];
  try {
    const response = await fetch(
      `https://news-app-three-lyart.vercel.app/news-app/published?category=${encodeURIComponent(
        article.category
      )}&limit=4`,
      { next: { revalidate: 60 } }
    );
    if (response.ok) {
      const result = await response.json();
      similarPosts = result.data
        ?.filter((item: NewsItem) => item._id !== article._id)
        .slice(0, 3)
        .map((item: NewsItem) => ({
          ...item,
          slug: generateSlug(item.newsTitle),
          createdAt: new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }));
      console.log(`Fetched ${similarPosts.length} similar posts for category: ${article.category}`);
    } else {
      console.error(`Failed to fetch similar posts: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching similar posts:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
>
      {/* Enhanced Navbar */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto p-2 lg:px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 lg:h-10  flex items-center justify-center">
               <img src="/ndb.png" className="h-8 lg:h-10 w-auto"
/>
              </div>
            
            </Link>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                Latest News
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-2 lg:px-4 lg:py-8 max-w-7xl">
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Article Header */}
          <div className="p-2 lg:p-6 md:p-10">
            <div className="flex items-center space-x-3 mb-6">
              <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-lg">
                {article.category}
              </span>
             
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-6">
              {article.newsTitle}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                  <span className="text-red-700 font-semibold text-sm">
                    {article.createdBy.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{article.createdBy}</p>
                  <p className="text-sm text-gray-500">{article.createdAt}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Featured Image */}
          <div className="mx-6 md:mx-10 mb-8">
            <div className="relative w-full h-64 md:h-96 lg:h-[32rem] rounded-xl overflow-hidden shadow-2xl">
              <img
 src={imageUrl}
 alt={`Featured image for ${article.newsTitle }`}
 className="object-cover rounded-lg"
 />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>

          {/* Article Content */}
          <div className="px-6 md:px-10 pb-10">
            <div
              className="prose prose-lg max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold 
                prose-p:text-gray-900 prose-p:leading-relaxed prose-p:text-base
                prose-a:text-red-600 prose-a:hover:text-red-700 prose-a:font-medium prose-a:no-underline hover:prose-a:underline 
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-blockquote:border-red-500 prose-blockquote:bg-red-50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-blockquote:text-gray-800
                prose-li:text-gray-900
                [&>*]:text-gray-900"
              dangerouslySetInnerHTML={{ __html: sanitizedNewsBody }}
            />
          </div>
        </article>

        {/* Enhanced Similar Posts Section */}
        {similarPosts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-red-700 rounded-full mr-4" />
              <h3 className="text-2xl font-bold text-gray-900">
                More in {article.category}
              </h3>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {similarPosts.map((post) => {
                const postImageUrl = post.newsImage || "https://naijadaily.ng/default-image.jpg";
                return (
                  <Link
                    key={post._id}
                    href={`/news/${post.slug}`}
                    className="group block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200 transform hover:-translate-y-1"
                  >
                    <div className="aspect-video overflow-hidden">
                      <div className="relative w-full h-full">
                        <img
                          src={postImageUrl}
                          alt={post.newsTitle}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          style={{
                            filter: 'contrast(1.05) saturate(1.05)',
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <div className="p-6">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-full mb-3 shadow-md">
                        {post.category}
                      </span>
                      <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-3 text-lg leading-snug">
                        {post.newsTitle}
                      </h4>
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {stripHtmlTags(post.newsBody).substring(0, 120)}...
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mr-2">
                          <span className="text-red-700 font-semibold text-xs">
                            {post.createdBy.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{post.createdBy} • {post.createdAt}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="mt-12 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ND</span>
              </div>
              <span className="text-xl font-bold">Naija Daily Nigeria</span>
            </div>
            <p className="text-gray-400 text-center md:text-right">
              © {new Date().getFullYear()} Naija Daily Nigeria. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}