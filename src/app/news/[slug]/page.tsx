"use client";

import { useState, useEffect } from "react";
import { Menu, Search, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import logo from "../../../../public/ndb.png";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Head from "next/head";

// Helper function to generate URL-friendly slugs from titles
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

interface RecordViewResponse {
  success: boolean;
  views: number;
}

export default function NewsArticlePage({ initialNewsItem }: { initialNewsItem?: NewsItem }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [categories, setCategories] = useState(["Home"]);
  const [newsItem, setNewsItem] = useState<NewsItem | null>(initialNewsItem || null);
  const [loading, setLoading] = useState(!initialNewsItem);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const sanitizedNewsBody = newsItem ? DOMPurify.sanitize(newsItem.newsBody) : "";
  const excerpt = newsItem ? DOMPurify.sanitize(newsItem.newsBody.substring(0, 150) + "...") : "";

  const handleShare = () => {
    if (!newsItem) return;
    const shareUrl = `https://www.naijadaily.ng/news/${newsItem.slug}`;
    if (navigator.share) {
      navigator.share({
        title: newsItem.newsTitle,
        text: excerpt,
        url: shareUrl,
      }).catch((err) => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleSubscribe = () => {
    console.log("Subscribe clicked");
  };

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://news-app-three-lyart.vercel.app/news-app-category");
        const result = await response.json();
        if (result.success && result.data) {
          const categoryNames = result.data.map((item: { categoryName: string }) => item.categoryName);
          setCategories(["Home", ...categoryNames]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(["Home"]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchNewsArticle = async () => {
      try {
        const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published");
        const result = await response.json();
        if (result.success && result.data) {
          const article = result.data.find(
            (item: NewsItem) => generateSlug(item.newsTitle) === slug
          );
          if (article) {
            const updatedArticle = {
              ...article,
              slug: generateSlug(article.newsTitle),
              createdAt: new Date(article.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            };
            setNewsItem(updatedArticle);
            await recordView(article._id);
          } else {
            setError("Article not found");
          }
        } else {
          setError("Failed to fetch article");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        setError("Error loading article");
      } finally {
        setLoading(false);
      }
    };
    if (!initialNewsItem && slug) {
      fetchNewsArticle();
    }
  }, [slug, initialNewsItem]);

  const recordView = async (newsId: string): Promise<void> => {
    try {
      const response = await fetch(
        `https://news-app-three-lyart.vercel.app/news-app/news-view/${newsId}`,
        { method: "POST" }
      );
      const result: RecordViewResponse = await response.json();
      if (result.success && newsItem && newsItem._id === newsId) {
        setNewsItem((prev) => (prev ? { ...prev, views: result.views } : prev));
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen font-serif text-[12pt] ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <Head>
        <title>{newsItem ? `${newsItem.newsTitle} - Naija Daily` : "Naija Daily"}</title>
        <meta
          name="description"
          content={newsItem ? excerpt : "Naija Daily - Nigeria's trusted news source"}
        />
        {/* Open Graph Meta Tags */}
        <meta
          property="og:title"
          content={newsItem ? newsItem.newsTitle : "Naija Daily"}
        />
        <meta
          property="og:description"
          content={newsItem ? excerpt : "Nigeria's most comprehensive and trusted online newspaper."}
        />
        <meta
          property="og:image"
          content={newsItem ? newsItem.newsImage : "https://www.naijadaily.ng/default-image.jpg"}
        />
        <meta
          property="og:image:alt"
          content={newsItem ? newsItem.newsTitle : "Naija Daily"}
        />
        <meta
          property="og:url"
          content={newsItem ? `https://www.naijadaily.ng/news/${newsItem.slug}` : "https://www.naijadaily.ng"}
        />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Naija Daily" />
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={newsItem ? newsItem.newsTitle : "Naija Daily"}
        />
        <meta
          name="twitter:description"
          content={newsItem ? excerpt : "Nigeria's most comprehensive and trusted online newspaper."}
        />
        <meta
          name="twitter:image"
          content={newsItem ? newsItem.newsImage : "https://www.naijadaily.ng/default-image.jpg"}
        />
        <meta
          name="twitter:image:alt"
          content={newsItem ? newsItem.newsTitle : "Naija Daily"}
        />
        {/* Schema.org Structured Data */}
        {newsItem && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: newsItem.newsTitle,
              image: [newsItem.newsImage],
              datePublished: newsItem.createdAt,
              description: excerpt,
              author: {
                "@type": "Person",
                name: newsItem.createdBy,
              },
              publisher: {
                "@type": "Organization",
                name: "Naija Daily",
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.naijadaily.ng/ndb.png",
                },
              },
            })}
          </script>
        )}
      </Head>

      {loading && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <main className="container mx-auto px-4 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-2/3">
                <div
                  className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 lg:p-8`}
                >
                  <div className="w-24 h-6 bg-gray-300 dark:bg-gray-700 rounded-full mb-4 animate-pulse"></div>
                  <div className="w-full h-12 bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="w-full h-64 lg:h-96 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6 animate-pulse"></div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-full h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {error && !loading && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <p className="text-xl font-serif text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && newsItem && (
        <>
          {/* Header */}
          <header
            className={`relative py-1 px-4 lg:px-8 transition-all duration-300 ${
              darkMode
                ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"
                : "bg-gradient-to-r from-white via-gray-50 to-white"
            } shadow-lg border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_50%)]"></div>
            </div>
            <div className="container mx-auto relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center group">
                  <Link
                    href="/"
                    className="relative overflow-hidden rounded-xl p-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                    <Image
                      alt="Logo"
                      src={logo}
                      className="w-auto h-9 lg:h-20 relative z-10 transition-all duration-300 group-hover:brightness-110"
                    />
                  </Link>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className={`p-3 lg:hidden rounded-xl transition-all duration-300 hover:scale-110 ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
                    } shadow-md hover:shadow-lg`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <div className="relative w-6 h-6">
                      <div
                        className={`absolute inset-0 transition-all duration-300 ${
                          mobileMenuOpen ? "rotate-180 opacity-0" : "rotate-0 opacity-100"
                        }`}
                      >
                        <Menu size={24} />
                      </div>
                      <div
                        className={`absolute inset-0 transition-all duration-300 ${
                          mobileMenuOpen ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
                        }`}
                      >
                        <X size={24} />
                      </div>
                    </div>
                  </button>
                  <div className="hidden lg:flex items-center">
                    <div
                      className={`relative group ${
                        darkMode ? "bg-gray-700" : "bg-white"
                      } rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border ${
                        darkMode ? "border-gray-600" : "border-gray-200"
                      } overflow-hidden`}
                    >
                      <div className="flex items-center">
                        <div className="p-3 text-gray-400 group-hover:text-red-500 transition-colors duration-300">
                          <Search size={20} />
                        </div>
                        <input
                          type="text"
                          placeholder="Search news..."
                          className={`py-3 pr-4 bg-transparent focus:outline-none transition-all duration-300 ${
                            darkMode
                              ? "text-white placeholder-gray-400"
                              : "text-gray-800 placeholder-gray-500"
                          } w-48 focus:w-64`}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <nav
                className={`${mobileMenuOpen ? "block" : "hidden"} lg:block transition-all duration-300`}
              >
                <div
                  className={`${
                    mobileMenuOpen
                      ? `p-4 rounded-xl mt-2 ${
                          darkMode ? "bg-gray-800/50" : "bg-gray-50/50"
                        } backdrop-blur-sm border ${
                          darkMode ? "border-gray-700" : "border-gray-200"
                        }`
                      : ""
                  }`}
                >
                  <ul className="flex flex-col lg:flex-row lg:justify-center lg:space-x-8 space-y-3 lg:space-y-0">
                    {categories.map((category, index) => (
                      <li key={index} className="relative group">
                        <Link
                          href={category === "Home" ? "/" : `/category/${generateSlug(category)}`}
                          className={`relative block px-4 py-2 lg:py-3 font-semibold text-lg transition-all duration-300 rounded-lg lg:rounded-none hover:scale-105 ${
                            index === 0
                              ? "text-red-600 bg-red-50 lg:bg-transparent"
                              : `${
                                  darkMode
                                    ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
                                }`
                          } lg:hover:bg-transparent`}
                        >
                          {category}
                          <div
                            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ${
                              index === 0 ? "w-full lg:w-6" : "w-0 group-hover:w-6"
                            } hidden lg:block`}
                          ></div>
                        </Link>
                      </li>
                    ))}
                    <li className="relative group">
                      <Link
                        href="#"
                        className={`flex items-center px-4 py-2 lg:py-3 font-semibold text-lg transition-all duration-300 rounded-lg lg:rounded-none hover:scale-105 ${
                          darkMode
                            ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50"
                        } lg:hover:bg-transparent`}
                      >
                        More
                        <ChevronDown
                          size={16}
                          className="ml-2 transition-transform duration-300 group-hover:rotate-180"
                        />
                        <div
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-red-500 to-red-600 w-0 group-hover:w-6 transition-all duration-300 hidden lg:block"
                        ></div>
                      </Link>
                      <div
                        className={`absolute left-0 lg:left-1/2 lg:transform lg:-translate-x-1/2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 ${
                          mobileMenuOpen ? "relative mt-2 opacity-100 visible" : ""
                        }`}
                      >
                        <div
                          className={`w-56 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
                            darkMode
                              ? "bg-gray-800/95 border-gray-700"
                              : "bg-white/95 border-gray-200"
                          }`}
                        >
                          <div
                            className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 ${
                              darkMode ? "bg-gray-800" : "bg-white"
                            } border-l border-t ${
                              darkMode ? "border-gray-700" : "border-gray-200"
                            } hidden lg:block`}
                          ></div>
                          <ul className="space-y-1">
                            {["Opinion", "Health", "Technology"].map((item, idx) => (
                              <li key={idx}>
                                <Link
                                  href={`/category/${item.toLowerCase()}`}
                                  className={`flex items-center px-4 py-3 transition-all duration-300 hover:scale-105 ${
                                    darkMode
                                      ? "text-gray-300 hover:text-white hover:bg-red-600/80"
                                      : "text-gray-700 hover:text-white hover:bg-red-600"
                                  } font-medium group/item`}
                                >
                                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3 transform scale-0 group-hover/item:scale-100 transition-transform duration-300"></div>
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </nav>
            </div>
          </header>

          <main className="container mx-auto p-1 lg:px-8 lg:py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-2/3">
                <article
                  className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-1 lg:p-8`}
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
                      <span>{newsItem.views} Views</span>
                    </div>
                    <Image
                      src={newsItem.newsImage}
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
                        onClick={handleShare}
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
                    </div>
                  </div>
                </article>
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

                <section
                  className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-4`}
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
                    Nigeria's most comprehensive and trusted online newspaper delivering
                    breaking news, politics, business, entertainment, sports, and more.
                  </p>
                  <div className="flex space-x-4">
                    <Link href="#" className="text-gray-400 hover:text-white">
                      <span className="sr-only">Facebook</span>
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      <span className="sr-only">Twitter</span>
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </Link>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      <span className="sr-only">Instagram</span>
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
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
        </>
      )}
    </div>
  );
}

// Add server-side props to pre-render meta tags
export async function getServerSideProps(context: any) {
  const { slug } = context.params;
  try {
    const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published");
    const result = await response.json();
    if (result.success && result.data) {
      const article = result.data.find(
        (item: NewsItem) => generateSlug(item.newsTitle) === slug
      );
      if (article) {
        const newsItem: NewsItem = {
          ...article,
          slug: generateSlug(article.newsTitle),
          createdAt: new Date(article.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        };
        return { props: { initialNewsItem: newsItem } };
      }
    }
    return { notFound: true };
  } catch (error) {
    console.error("Error fetching article:", error);
    return { notFound: true };
  }
}