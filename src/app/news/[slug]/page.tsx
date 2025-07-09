

import type { Metadata } from 'next'
import News from '../../components/News'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Fetch your article data here
  const response = await fetch(`https://news-app-three-lyart.vercel.app/news-app/published?slug=${params.slug}`);
  const result = await response.json();
  
  // Find the article with matching slug
  const article = result.data?.find((item: any) => 
    generateSlug(item.newsTitle) === params.slug
  );

  if (!article) {
    return {
      title: "Article Not Found - Naija Daily",
      description: "The article you're looking for doesn't exist",
    };
  }

  return {
    title: `${article.newsTitle.substring(0, 60)} | Naija Daily`,
    description: article.newsBody.substring(0, 160),
    openGraph: {
      title: article.newsTitle.substring(0, 60),
      description: article.newsBody.substring(0, 160),
      url: `https://naijadaily.ng/news/${params.slug}`,
      type: 'article',
      publishedTime: article.createdAt,
      images: [
        {
          url: article.newsImage.startsWith('http') 
            ? article.newsImage 
            : `https://naijadaily.ng${article.newsImage}`,
          width: 1200,
          height: 630,
          alt: article.newsTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.newsTitle.substring(0, 60),
      description: article.newsBody.substring(0, 160),
      images: [
        article.newsImage.startsWith('http') 
          ? article.newsImage 
          : `https://naijadaily.ng${article.newsImage}`,
      ],
    },
  };
}

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

interface Pagination {
  currentPage: number;
  totalPages: number;
  limit: number;
}

export default function NewsArticlePage() {
  
  return (
    <div
     
    >
<News/>
    </div>
  );
}