"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../app/components/Navbar";
import Head from "next/head";
import SkeletonLoader from "../app/components/SkeletonLoader";
import { IoClose } from "react-icons/io5";

// Helper functions
const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function DailyPostClone() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [categoryNews, setCategoryNews] = useState<{ [key: string]: NewsItem[] }>(
    {}
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]); // Store all categories for sidebar
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Track selected category
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar state

  const limit = 7; // Limit to 7 articles per category
  const defaultTitle = "Naija Daily - Latest Nigerian News";
  const defaultDescription =
    "Stay updated with the latest news from Nigeria in politics, business, entertainment, sports, and more.";
  const defaultImage = "https://naijadaily.ng/public/ndb.png";
  const ads = ["/assets/ad2.jpeg", "/assets/ad3.jpeg"]; // Ad images

  // Define the specific categories to show on the landing page in order
  const landingPageCategories = ["News", "Metro", "Politics", "Sport", "Entertainment", "Business"];

  interface NewsItem {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string;
    excerpt: string;
    date: string;
    rawDate: string; // Add rawDate for sorting
    views: number;
  }

  // Fetch current date
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

  // Fetch headlines
  useEffect(() => {
    const fetchHeadlines = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://news-app-three-lyart.vercel.app/news-app/headlines?limit=${limit}`
        );
        const result = await response.json();
        if (result.success && result.data) {
          const mappedHeadlines: NewsItem[] = result.data
            .map((item: any) => ({
              id: item._id,
              title: item.newsTitle,
              slug: generateSlug(item.newsTitle),
              category: "Headlines",
              image: item.newsImage,
              excerpt: item.newsBody.substring(0, 100) + "...",
              date: new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              rawDate: item.createdAt, // Store raw date for sorting
              views: item.views || 0,
            }))
            .sort((a: NewsItem, b: NewsItem) =>
              new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
            ); // Sort by rawDate in descending order
          setHeadlines(mappedHeadlines);
        }
      } catch (error) {
        console.error("Error fetching headlines:", error);
        setHeadlines([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeadlines();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "https://news-app-three-lyart.vercel.app/news-app-category"
        );
        const result = await response.json();
        if (result.success && result.data) {
          const categoryNames = result.data.map(
            (item: { categoryName: string }) => item.categoryName
          );

          // Store all categories for sidebar
          setAllCategories(["Headlines", ...categoryNames]);

          // Filter and order categories based on landingPageCategories
          const filteredCategories = landingPageCategories.filter(cat =>
            categoryNames.some((apiCat: string) =>
              apiCat.toLowerCase() === cat.toLowerCase()
            )
          );
          setCategories(["Headlines", ...filteredCategories]); // Add Headlines as the first category
        } else {
          setCategories(["Headlines"]);
          setAllCategories(["Headlines"]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(["Headlines"]);
        setAllCategories(["Headlines"]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch news for each category (now uses allCategories for fetching all category data)
  useEffect(() => {
    const fetchCategoryNews = async () => {
      setIsLoading(true);
      try {
        const newsByCategory: { [key: string]: NewsItem[] } = {};
        // Fetch news for all categories (excluding Headlines) so sidebar categories have data
        for (const category of allCategories.filter((cat) => cat !== "Headlines")) {
          const response = await fetch(
            `https://news-app-three-lyart.vercel.app/news-app/published?category=${encodeURIComponent(
              category
            )}&limit=${limit}`
          );
          const result = await response.json();
          if (result.success && result.data) {
            newsByCategory[category] = result.data
              .map((item: any) => ({
                id: item._id,
                title: item.newsTitle,
                slug: generateSlug(item.newsTitle),
                category: item.category,
                image: item.newsImage,
                excerpt: item.newsBody.substring(0, 100) + "...",
                date: new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
                rawDate: item.createdAt, // Store raw date for sorting
                views: item.views || 0,
              }))
              .sort((a: NewsItem, b: NewsItem) =>
                new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
              ); // Sort by rawDate in descending order
          } else {
            newsByCategory[category] = [];
          }
        }
        setCategoryNews(newsByCategory);
      } catch (error) {
        console.error("Error fetching category news:", error);
        setCategoryNews({});
      } finally {
        setIsLoading(false);
      }
    };
    if (allCategories.length > 0) {
      fetchCategoryNews();
    }
  }, [allCategories]);
  // Record a view
  const recordView = async (newsId: string): Promise<void> => {
    try {
      const response = await fetch(
        `https://news-app-three-lyart.vercel.app/news-app/news-view/${newsId}`,
        { method: "POST" }
      );
      const result: { success: boolean; views: number } = await response.json();
      if (result.success) {
        setHeadlines((prev) =>
          prev.map((news) =>
            news.id === newsId ? { ...news, views: result.views } : news
          )
        );
        setCategoryNews((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((category) => {
            updated[category] = updated[category].map((news) =>
              news.id === newsId ? { ...news, views: result.views } : news
            );
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Randomly decide where to place ads (e.g., after 2nd and 4th categories)
  const getAdPlacementIndices = (categoryCount: number) => {
    const indices = [];
    for (let i = 2; i < categoryCount; i += 3) {
      indices.push(i);
    }
    return indices;
  };

  return (
    <div
      className={`min-h-screen font-serif text-[12pt] ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
        }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <Head>
        <title>
          {headlines.length > 0
            ? `${headlines[0].title.substring(0, 60)} | Naija Daily`
            : defaultTitle}
        </title>
        <meta
          name="description"
          content={
            headlines.length > 0
              ? headlines[0].excerpt.substring(0, 160)
              : defaultDescription
          }
        />
        <meta
          property="og:title"
          content={
            headlines.length > 0
              ? headlines[0].title.substring(0, 60)
              : defaultTitle
          }
        />
        <meta
          property="og:description"
          content={
            headlines.length > 0
              ? headlines[0].excerpt.substring(0, 160)
              : defaultDescription
          }
        />
        <meta
          property="og:image"
          content={headlines.length > 0 ? headlines[0].image : defaultImage}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content={
            headlines.length > 0
              ? `Featured image for ${headlines[0].title}`
              : "Naija Daily logo"
          }
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:url" content="https://naijadaily.ng" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Naija Daily" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={
            headlines.length > 0
              ? headlines[0].title.substring(0, 60)
              : defaultTitle
          }
        />
        <meta
          name="twitter:description"
          content={
            headlines.length > 0
              ? headlines[0].excerpt.substring(0, 160)
              : defaultDescription
          }
        />
        <meta
          name="twitter:image"
          content={headlines.length > 0 ? headlines[0].image : defaultImage}
        />
        <meta
          name="twitter:image:alt"
          content={
            headlines.length > 0
              ? `Featured image for ${headlines[0].title}`
              : "Naija Daily logo"
          }
        />
        <meta name="twitter:site" content="@NaijaDaily" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="apple-mobile-web-app-title"
          content={
            headlines.length > 0
              ? headlines[0].title.substring(0, 60)
              : defaultTitle
          }
        />
        <link rel="canonical" href="https://naijadaily.ng" />
      </Head>



      {/* Navbar */}
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen} // Pass sidebar toggle function
      />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">All Categories</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >


              <IoClose size={20} />
            </button>
          </div>
        </div>
        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedCategory("");
                setSidebarOpen(false);
              }}
              className={`w-full text-left py-2 px-3 rounded transition-colors duration-200 ${selectedCategory === ""
                  ? "bg-red-600 text-white font-bold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              Home
            </button>
            {allCategories.map((category, index) => (
              <button
                key={`sidebar-${category}-${index}`}
                onClick={() => {
                  setSelectedCategory(category === selectedCategory ? "" : category);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded transition-colors duration-200 ${selectedCategory === category
                    ? "bg-red-600 text-white font-bold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-30"
          style={{
            background: 'linear-gradient(135deg, rgba(247, 243, 243, 0.7), rgba(250, 246, 246, 0.9))',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Breaking News Ticker */}


      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Back to Home Button */}
        {selectedCategory && (
          <div className="mb-6">
            <button
              onClick={() => setSelectedCategory("")}
              className="text-sm text-red-600 hover:underline font-medium"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Hero Headline Section */}
        {!selectedCategory && headlines.length > 0 && !isLoading && (
          <section className="mb-12 relative">
            <img
              src={headlines[0].image}
              alt={headlines[0].title}
              className="w-full h-80 sm:h-96 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white p-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {headlines[0].title}
                </h1>
                <p className="text-sm sm:text-base mb-4">{headlines[0].date}</p>
                <Link
                  href={`/news/${headlines[0].slug}`}
                  onClick={() => recordView(headlines[0].id)}
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Read More
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Category Sections with Ads */}
        <div className="flex flex-col gap-8">
          {(selectedCategory ? [selectedCategory] : categories).map(
            (category, index) => {
              const adIndices = getAdPlacementIndices(
                selectedCategory ? 1 : categories.length
              );
              const showAd = adIndices.includes(index);
              const newsToDisplay =
                category === "Headlines"
                  ? headlines.slice(selectedCategory ? 0 : 1).slice(0, 7)
                  : categoryNews[category]?.slice(0, 7) || [];

              return (
                <div key={category} className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold border-b-2 border-red-600 pb-2">
                      {category}
                    </h2>
                    <button
                      onClick={() =>
                        setSelectedCategory(
                          category === selectedCategory ? "" : category
                        )
                      }
                      className="text-sm sm:text-base text-red-600 hover:underline font-medium"
                    >
                      {selectedCategory === category ? "Show All" : "See More"}
                    </button>
                  </div>
                  {isLoading ? (
                    <SkeletonLoader darkMode={darkMode} count={6} />
                  ) : newsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newsToDisplay.map((news) => (
                        <article
                          key={news.id}
                          className={`${darkMode
                              ? "bg-gray-800 text-white"
                              : "bg-white text-black"
                            } rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col`}
                        >
                          <Link
                            href={`/news/${news.slug}`}
                            onClick={() => recordView(news.id)}
                            className="flex flex-col h-full"
                          >
                            <img
                              src={news.image}
                              alt={news.title}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                            />
                            <div className="p-5 flex flex-col flex-grow">
                              <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded mb-3">
                                {news.category}
                              </span>
                              <h3 className="text-lg font-bold mb-2 line-clamp-2">
                                {news.title}
                              </h3>
                              <div
                                className={`mb-4 text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"
                                  } line-clamp-3`}
                                dangerouslySetInnerHTML={{
                                  __html: news.excerpt,
                                }}
                              />
                              <div className="flex justify-between items-center mt-auto">
                                <time
                                  className="text-xs text-gray-500"
                                  dateTime={news.date}
                                >
                                  {news.date}
                                </time>
                                <span className="text-sm text-red-600 hover:underline font-medium">
                                  Read More
                                </span>
                              </div>
                            </div>
                          </Link>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <SkeletonLoader />
                    </div>
                  )}
                  {showAd && !selectedCategory && (
                    <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md text-center">
                      <Image
                        src={ads[Math.floor(Math.random() * ads.length)]}
                        alt="Advertisement"
                        width={728}
                        height={90}
                        className="mx-auto w-full max-w-[728px] h-auto"
                      />
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`py-8 ${darkMode ? "bg-gray-800" : "bg-gray-900"} text-white`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Naija Daily</h3>
              <p className="text-gray-400 mb-4">
                Nigeria's most comprehensive and trusted online newspaper
                delivering breaking news, politics, business, entertainment,
                sports, and more.
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
              <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
              <address className="not-italic text-gray-400">
                <p className="mb-2">
                  Suite 4, Block A, G-Wing, Bassan Plaza, Off Herbert Macaulay
                  Way, Central Business District, FCT-Abuja.
                </p>
                <p className="mb-2">Abuja, Nigeria</p>
                <p className="mb-2">Email: info@naijadaily.ng</p>
                <p>Phone: +2347042037202</p>
              </address>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>
              © {new Date().getFullYear()} Naija Daily Nigeria. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* CSS Animation for Marquee */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
          white-space: nowrap;
        }
      `}</style>

    </div>
  );
}