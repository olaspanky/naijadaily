import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const res = await fetch("https://news-app-three-lyart.vercel.app/news-app/published", {
    cache: "no-store",
  });
  const result = await res.json();

  const article = result.data.find((item: any) => {
    const slugified = item.newsTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slugified === params.slug;
  });

  if (!article) return { title: "Not found" };

  const imageUrl = article.newsImage?.startsWith("http")
    ? article.newsImage
    : `https://naijadaily.ng${article.newsImage}`;

  return {
    title: article.newsTitle,
    description: article.newsBody?.substring(0, 160),
    openGraph: {
      title: article.newsTitle,
      description: article.newsBody?.substring(0, 160),
      url: `https://naijadaily.ng/news/${params.slug}`,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.newsTitle,
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
}