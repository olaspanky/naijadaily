import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Navbar from "@/app/components/Navbar";

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

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

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;

  // Fetch post information
  const response = await fetch(
    "https://news-app-three-lyart.vercel.app/news-app/published"
  );
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
      url: `https://naijadaily.ng/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.newsTitle,
      description: article.newsBody.substring(0, 160),
      images: [imageUrl],
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const slug = params.slug;

  // Fetch article data
  const response = await fetch(
    "https://news-app-three-lyart.vercel.app/news-app/published"
  );
  const result = await response.json();
  const article = result.data?.find(
    (item: NewsItem) => generateSlug(item.newsTitle) === slug
  );

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

  // Fetch related articles
  const relatedResponse = await fetch(
    `https://news-app-three-lyart.vercel.app/news-app/published?category=${article.category}&page=1&limit=3`
  );
  const relatedResult = await relatedResponse.json();
  const relatedArticles = relatedResult.data
    ?.filter((item: NewsItem) => item._id !== article._id)
    .map((item: NewsItem) => ({
      ...item,
      slug: generateSlug(item.newsTitle),
      createdAt: new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    }));

  // Fetch categories
  const categoryResponse = await fetch(
    "https://news-app-three-lyart.vercel.app/news-app-category"
  );
  const categoryResult = await categoryResponse.json();
  const categories = ["Home", ...(categoryResult.data?.map((item: { categoryName: string }) => item.categoryName) || [])];

  const imageUrl = newsItem.newsImage?.startsWith("http")
    ? newsItem.newsImage
    : `https://naijadaily.ng${newsItem.newsImage || "/default-image.jpg"}`;

  const sanitizedNewsBody = DOMPurify.sanitize(newsItem.newsBody);

  return (
    <div className="min-h-screen font-serif text-[12pt] bg-gray-50 text-gray-900">
      <Navbar
        categories={categories}
        selectedCategory="Home"
        setSelectedCategory={() => {}}
        darkMode={false}
        toggleDarkMode={() => {}}
      />
      <main className="container mx-auto p-1 lg:px-8 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <article className="bg-white rounded-lg shadow-md p-1 lg:p-8">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full mb-4">
                  {newsItem.category}
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">
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
                  className="w-full h-auto aspect-[2/1] object-cover rounded-lg mb-6"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority
                />
              </div>
              <div
                className="prose prose-lg max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizedNewsBody }}
              />
              <div className="mt-8 flex justify-between items-center">
                <Link
                  href="/"
                  className="text-red-600 hover:underline font-medium"
                >
                  ← Back to Home
                </Link>
                {/* Add share buttons as needed */}
              </div>
            </article>
            <section className="mt-8 bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold border-b-2 border-red-600 pb-2 mb-4">
                Related Articles
              </h2>
              {relatedArticles.length === 0 ? (
                <p>No related articles found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {relatedArticles.map((article: NewsItem) => (
                    <Link key={article._id} href={`/${article.slug}`}>
                      <div className="flex items-center space-x-4">
                        <Image
                          src={
                            article.newsImage?.startsWith("http")
                              ? article.newsImage
                              : `https://naijadaily.ng${article.newsImage || "/default-image.jpg"}`
                          }
                          alt={article.newsTitle}
                          width={100}
                          height={50}
                          className="rounded object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-semibold">{article.newsTitle}</h3>
                          <p className="text-xs text-gray-500">
                            {article.category} • {article.createdAt}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
          {/* Sidebar with Subscribe and Sponsor sections */}
          <div className="w-full lg:w-1/3">
            <div className="mb-6 p-4 rounded-lg shadow-md text-center bg-white">
              <div className="py-24 bg-gradient-to-r from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Sponsor Our News
                  </h3>
                  <p className="text-sm text-gray-200 mb-4">
                    Partner with Naija Daily to showcase your brand!
                  </p>
                  <Link
                    href="/advertise"
                    className="inline-block px-6 py-2 bg-white text-green-700 font-semibold rounded hover:bg-gray-200"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
            <section className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold border-b-2 border-red-600 pb-2 mb-4">
                Subscribe
              </h2>
              <p className="mb-4 text-sm">
                Get the latest news delivered to your inbox
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full p-2 rounded border bg-gray-100 border-gray-300"
                  aria-label="Email address for subscription"
                />
                <button
                  className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded hover:bg-red-700"
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe Now
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className={`py-8  "bg-gray-800" : "bg-gray-900"} text-white`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Naija Daily</h3>
              <p className="text-gray-400 mb-4">
                Nigeria's most comprehensive and trusted online newspaper delivering
                breaking news, politics, business, entertainment, sports, and more.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
              <address className="not-italic text-gray-400">
                <p className="mb-2">Suite 4, Block A, G-Wing, Bassan Plaza, Off Herbert Macaulay Way, Central Business District, FCT-Abuja.</p>
                <p className="mb-2">Abuja, Nigeria</p>
                <p className="mb-2">Email: info@naijadaily.ng</p>
                <p>Phone: +2347042037202</p>
              </address>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Naija Daily Nigeria. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}