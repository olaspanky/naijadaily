import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch("https://naija-daily-api.onrender.com/news-app/published", {
      cache: "no-store",
    });
    
    if (!res.ok) throw new Error("Failed to fetch article data");
    const result = await res.json();

    if (!result.data || !Array.isArray(result.data)) {
      return { 
        title: "Article Not Found",
        description: "The requested article could not be found"
      };
    }

    const article = result.data.find((item: any) => {
      const slugified = item.newsTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return slugified === params.slug;
    });

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
        canonical: `https://naijadaily.ng/news/${params.slug}`
      },
      openGraph: {
        title: article.newsTitle,
        description: article.newsBody?.substring(0, 160) || "Read the latest news on Naija Daily",
        url: `https://naijadaily.ng/news/${params.slug}`,
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
        description: article.newsBody?.substring(0, 160) || "Read the latest news on Naija Daily",
        images: [imageUrl],
        site: "@NaijaDaily",
        creator: article.createdBy,
      },
    };
  } catch (error) {
    return { 
      title: "Error Loading Article",
      description: "An error occurred while loading the article"
    };
  }
}