import { Metadata } from "next";
import News from "../../components/News";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid JSON response");
    }

    const article = result.data?.find((item: NewsItem) => generateSlug(item.newsTitle) === slug);

    if (!article) {
      return {
        title: "Article Not Found - Naija Daily",
        description: "The article you're looking for doesn't exist",
      };
    }

    const imageUrl = article.newsImage?.startsWith("http")
      ? article.newsImage
      : `https://naijadaily.ng${article.newsImage || "/default-image.jpg"}`;

    return {
      title: `${article.newsTitle.substring(0, 60)} | Naija Daily`,
      description: article.newsBody.substring(0, 160),
      openGraph: {
        title: article.newsTitle.substring(0, 60),
        description: article.newsBody.substring(0, 160),
        url: `https://naijadaily.ng/news/${generateSlug(article.newsTitle)}`,
        type: "article",
        publishedTime: article.createdAt,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `Featured image for ${article.newsTitle}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: article.newsTitle.substring(2, 60),
        description: article.newsBody.substring(0, 160),
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Error - Naija Daily",
      description: "An error occurred while loading this article",
    };
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    // Fetch article data on the server
    const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid JSON response");
    }

    const article = result.data?.find((item: NewsItem) => generateSlug(item.newsTitle) === slug);

    if (!article) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Article not found</p>
          </div>
        </div>
      );
    }

    // Prepare article data with formatted date
    const newsItem: NewsItem = {
      ...article,
      slug: generateSlug(article.newsTitle),
      createdAt: new Date(article.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    // Pass the resolved article to the News component
    return <News initialNewsItem={newsItem} slug={newsItem.slug} />;
  } catch (error) {
    console.error("Error in NewsArticlePage:", error);
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Unable to load article</p>
          <p className="text-gray-500 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }
}