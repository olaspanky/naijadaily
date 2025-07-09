import type { Metadata } from 'next'
import News from '../../components/News'

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    // Fetch article data
    const response = await fetch(`https://news-app-three-lyart.vercel.app/news-app/published`);
    const result = await response.json();

    // Find the article with matching slug
    const article = result.data?.find((item: NewsItem) => 
      generateSlug(item.newsTitle) === params.slug
    );

    if (!article) {
      return {
        title: "Article Not Found - Naija Daily",
        description: "The article you're looking for doesn't exist",
      };
    }

    // Ensure image URL is absolute
    const imageUrl = article.newsImage.startsWith("http")
      ? article.newsImage
      : `https://naijadaily.ng${article.newsImage || "/default-image.jpg"}`;

    return {
      title: `${article.newsTitle.substring(0, 60)} | Naija Daily`,
      description: article.newsBody.substring(0, 160),
      openGraph: {
        title: article.newsTitle.substring(0, 60),
        description: article.newsBody.substring(0, 160),
        url: `https://naijadaily.ng/news/${params.slug}`,
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
        title: article.newsTitle.substring(0, 60),
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

interface PageProps {
  params: {
    slug: string;
  };
}

export default function NewsArticlePage({ params }: PageProps) {
  return (
    <div>
      <News slug={params.slug} />
    </div>
  );
}