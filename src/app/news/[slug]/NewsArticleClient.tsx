"use client";

import { useState, useEffect } from "react";
import { Menu, Search, X, ChevronDown, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

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
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Home");
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [categories, setCategories] = useState<string[]>(["Home"]);
  const [error, setError] = useState<string | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    limit: 3,
  });
  const router = useRouter();
  const params = useParams();
  const { slug } = params;
  const sanitizedNewsBody = newsItem ? DOMPurify.sanitize(newsItem.newsBody) : "";

  // Update document head with meta tags when newsItem changes
  // Remove your current useEffect for metadata and replace with:

useEffect(() => {
  if (!newsItem) return;
  
  // Update title
  document.title = newsItem.newsTitle;
  
  // Update meta tags
  const setMetaTag = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  const setOgTag = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  setMetaTag('description', newsItem.newsBody.substring(0, 160));
  
  const imageUrl = newsItem.newsImage?.startsWith("http")
    ? newsItem.newsImage
    : `https://naijadaily.ng${newsItem.newsImage || "/default-image.jpg"}`;

  // Open Graph tags
  setOgTag('og:title', newsItem.newsTitle);
  setOgTag('og:description', newsItem.newsBody.substring(0, 160));
  setOgTag('og:image', imageUrl);
  setOgTag('og:url', window.location.href);
  setOgTag('og:type', 'article');

  // Twitter tags
  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', newsItem.newsTitle);
  setMetaTag('twitter:description', newsItem.newsBody.substring(0, 160));
  setMetaTag('twitter:image', imageUrl);
}, [newsItem]);
  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published");
        const result = await response.json();
        if (result.success && result.data) {
          const article = result.data.find(
            (item: NewsItem) => generateSlug(item.newsTitle) === slug
          );
          if (article) {
            const newsItemData: NewsItem = {
              ...article,
              slug: generateSlug(article.newsTitle),
              createdAt: new Date(article.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            };
            setNewsItem(newsItemData);

            const viewResponse = await fetch(
              `https://news-app-three-lyart.vercel.app/news-app/news-view/${article._id}`,
              { method: "POST" }
            );
            const viewResult = await viewResponse.json();
            if (viewResult.success) {
              setNewsItem((prev) => (prev ? { ...prev, views: viewResult.views } : prev));
            }

            const relatedResponse = await fetch(
              `https://news-app-three-lyart.vercel.app/news-app/published?category=${article.category}&page=${pagination.currentPage}&limit=${pagination.limit}`
            );
            const relatedResult = await relatedResponse.json();
            if (relatedResult.success && relatedResult.data) {
              setRelatedArticles(
                relatedResult.data
                  .filter((item: NewsItem) => item._id !== article._id)
                  .map((item: NewsItem) => ({
                    ...item,
                    slug: generateSlug(item.newsTitle),
                    createdAt: new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }),
                  }))
              );
              setPagination((prev) => ({
                ...prev,
                totalPages: Math.ceil(relatedResult.total / pagination.limit),
              }));
            }
          } else {
            setError("Article not found");
          }
        } else {
          setError("Failed to fetch article");
        }

        const categoryResponse = await fetch("https://news-app-three-lyart.vercel.app/news-app-category");
        const categoryResult = await categoryResponse.json();
        if (categoryResult.success && categoryResult.data) {
          setCategories(["Home", ...categoryResult.data.map((item: { categoryName: string }) => item.categoryName)]);
        }
      } catch (err) {
        setError("Error loading article");
        console.error("Client-side error:", err);
      }
    };

    fetchData();
  }, [slug, pagination.currentPage]);

  useEffect(() => {
    const date = new Date();
    setCurrentDate(
      date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const handleShare = (platform?: string) => {
    if (!newsItem) return;
    const url = `https://naijadaily.ng/${newsItem.slug}`;
    const title = encodeURIComponent(newsItem.newsTitle);
    const excerpt = encodeURIComponent(newsItem.newsBody.substring(0, 160));

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${title}%20${url}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, "_blank");
    } else if (navigator.share) {
      navigator.share({
        title: newsItem.newsTitle,
        text: newsItem.newsBody.substring(0, 160) + "...",
        url,
      }).catch((err) => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleSubscribe = () => {
    console.log("Subscribe clicked");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const imageUrl = newsItem?.newsImage?.startsWith("http")
    ? newsItem.newsImage
    : `https://naijadaily.ng${newsItem?.newsImage || "/default-image.jpg"}`;

  if (error || !newsItem) {
    return (
     <div className="flex items-center justify-center py-8 bg-white h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-gray-600">Loading latest news...</p>
              </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-serif text-[12pt] ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="container mx-auto p-1 lg:px-8 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <article
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-md p-1 lg:p-8`}
            >
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
                className={`prose prose-lg ${
                  darkMode ? "prose-invert" : ""
                } max-w-none leading-relaxed 
                  [&>p]:mb-6 [&>h1]:mb-6 [&>h1]:mt-8
                  [&>h2]:mb-5 [&>h2]:mt-7 [&>h3]:mb-4 [&>h3]:mt-6
                  [&>h4]:mb-4 [&>h4]:mt-5 [&>h5]:mb-3 [&>h5]:mt-4
                  [&>h6]:mb-3 [&>h6]:mt-4 [&>ul]:mb-6 [&>ol]:mb-6 
                  [&>li]:mb-2 [&>blockquote]:mb-6 [&>blockquote]:mt-6
                  [&>pre]:mb-6 [&>pre]:mt-6 [&>table]:mb-6 [&>table]:mt-6
                  [&>hr]:mb-8 [&>hr]:mt-8`}
                dangerouslySetInnerHTML={{ __html: sanitizedNewsBody }}
              />
              <div className="mt-8 flex justify-between items-center">
                <Link
                  href="/"
                  className="text-red-600 hover:underline font-medium"
                >
                  ← Back to Home
                </Link>
                <div className="flex space-x-4">
                  <button
                    className="flex items-center text-gray-500 hover:text-red-600"
                    onClick={() => handleShare()}
                    aria-label="Share this article"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                    </svg>
                    Share
                  </button>
                  <button
                    className="flex items-center text-gray-500 hover:text-green-600"
                    onClick={() => handleShare("whatsapp")}
                    aria-label="Share on WhatsApp"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.297.297-.445.099-.149.099-.347-.002-.496-.099-.149-.446-.547-.669-.845-.223-.297-.472-.198-.67-.05-.198.149-1.489.745-1.687.943-.198.198-.297.496-.446.744-.148.247-.347.396-.545.545-.198.149-.297.347-.446.545-.148.198-.247.446-.347.644-.099.198-.099.496.05.694.148.198.644.894 1.489 1.489.845.595 1.489.893 1.786.992.297.099.595.099.892-.05.297-.148 1.191-.595 1.489-.744.297-.149.595-.297.744-.446.148-.149.297-.347.347-.496.05-.149.05-.347-.05-.496zM12 0C5.373 0 0 5.373 0 12c0 2.626.847 5.066 2.282 7.039L1 23l4.022-1.282A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22.091c-2.093 0-4.138-.573-5.922-1.658l-.423-.267-2.382.763.772-2.322-.267-.423A10.085 10.085 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 12-4.486 10.091-10 10.091z" />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    className="flex items-center text-gray-500 hover:text-blue-600"
                    onClick={() => handleShare("facebook")}
                    aria-label="Share on Facebook"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Facebook
                  </button>
                  <button
                    className="flex items-center text-gray-500 hover:text-blue-400"
                    onClick={() => handleShare("twitter")}
                    aria-label="Share on Twitter"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Twitter
                  </button>
                </div>
              </div>
            </article>

            <section
              className={`mt-8 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-4`}
            >
              <h2 className="text-xl font-bold border-b-2 border-red-600 pb-2 mb-4">
                Related Articles
              </h2>
              {relatedArticles.length === 0 ? (
                <p>No related articles found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {relatedArticles.map((article) => (
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
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: Math.max(prev.currentPage - 1, 1),
                    }))
                  }
                  className={`px-4 py-2 rounded ${
                    pagination.currentPage === 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: Math.min(prev.currentPage + 1, prev.totalPages),
                    }))
                  }
                  className={`px-4 py-2 rounded ${
                    pagination.currentPage === pagination.totalPages
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </section>
          </div>

          <div className="w-full lg:w-1/3">
            <div
              className={`mb-6 p-4 rounded-lg shadow-md text-center ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="py-24 bg-gradient-to-r from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Sponsor Our News
                  </h3><p className="text-sm text-gray-200 mb-4">
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

            <section
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-md p-4`}
            >
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
                  className={`w-full p-2 rounded border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  aria-label="Email address for subscription"
                />
                <button
                  className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded hover:bg-red-700"
                  onClick={handleSubscribe}
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe Now
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>



      <footer className={`py-8 ${darkMode ? "bg-gray-800" : "bg-gray-900"} text-white`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Naija Daily</h3>
              <p className="text-gray-400 mb-4">
                Nigeria's most comprehensive and trustedਕ
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
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map((category, index) => (
                  <li key={index}>
                    <Link
                      href={category === "Home" ? "/" : `/category/${generateSlug(category)}`}
                      className="text-gray-400 hover:text-white"
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" className="text-gray-400 hover:text-white">
                    Advertise With Us
                  </Link>
                </li>
              </ul>
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