"use client";

import { useState, useEffect } from "react";
import { Menu, Search, X, ChevronDown, Sun, Moon } from "lucide-react";
import logo from "../../public/ndb.png";
import Image from "next/image";
import Link from "next/link";

// Helper function to generate URL-friendly slugs from titles
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export default function DailyPostClone() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState(["Home"]);

  interface NewsItem {
    id: string;
    title: string;
    slug: string;
    category: string;
    image: string;
    excerpt: string;
    date: string;
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

  // Fetch news from API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          "https://news-app-three-lyart.vercel.app/news-app/published"
        );
        const result = await response.json();
        if (result.success && result.data) {
          interface ApiNewsItem {
            _id: string;
            newsTitle: string;
            category: string;
            newsImage: string;
            newsBody: string;
            createdAt: string;
            views?: number;
          }

          const mappedNews: NewsItem[] = result.data.map((item: ApiNewsItem) => ({
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
            views: item.views || 0,
          }));
          setFeaturedNews(mappedNews);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };
    fetchNews();
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "https://news-app-three-lyart.vercel.app/news-app-category"
        );
        const result = await response.json();
        if (result.success && result.data) {
          interface ApiCategoryItem {
            categoryName: string;
          }

          const categoryNames = result.data.map(
            (item: ApiCategoryItem) => item.categoryName
          );
          setCategories(["Home", ...categoryNames]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(["Home"]);
      }
    };
    fetchCategories();
  }, []);

  // Function to record a view for an article
  interface RecordViewResponse {
    success: boolean;
    views: number;
  }

  const recordView = async (newsId: string): Promise<void> => {
    try {
      const response = await fetch(
        `https://news-app-three-lyart.vercel.app/news-app/news-view/${newsId}`,
        { method: "POST" }
      );
      const result: RecordViewResponse = await response.json();
      if (result.success) {
        setFeaturedNews((prevNews) =>
          prevNews.map((news) =>
            news.id === newsId ? { ...news, views: result.views } : news
          )
        );
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
      {/* Main header with logo and navigation */}
      <header
        className={`relative py-2 px-4 lg:px-8 transition-all duration-300 ${
          darkMode
            ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-r from-white via-gray-50 to-white"
        } shadow-lg border ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_50%)]"></div>
        </div>

        <div className="container mx-auto relative">
          <div className="flex items-center justify-between mb-6">
            {/* Logo Section */}
            <div className="flex items-center group">
  <Link
    href="/"
    className="relative overflow-hidden rounded-xl p-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
    <Image
      alt="Logo"
      src={logo}
      className="w-auto h-7 lg:h-20 relative z-10 transition-all duration-300 group-hover:brightness-110"
    />
  </Link>
</div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Mobile Menu Toggle */}
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

              {/* Desktop Search */}
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

          {/* Navigation */}
          <nav
            className={`${
              mobileMenuOpen ? "block" : "hidden"
            } lg:block transition-all duration-300`}
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

                {/* More Dropdown */}
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
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-red-500 to-red-600 w-0 group-hover:w-6 transition-all duration-300 hidden lg:block"></div>
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

      {/* Breaking news ticker */}
      <div
        className={`py-1 ${darkMode ? "bg-red-700" : "bg-red-600"} text-white`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center">
            <span className="font-bold mr-4">BREAKING NEWS:</span>
            <div className="overflow-hidden whitespace-nowrap flex-1" aria-live="polite">
              {featuredNews.length > 0 ? (
                <div className="inline-block animate-marquee">
                  <span className="inline-block pr-8">
                    {featuredNews.slice(0, 4).map((news) => news.title).join(" • ")}
                  </span>
                  <span className="inline-block pr-8">
                    {featuredNews.slice(0, 4).map((news) => news.title).join(" • ")}
                  </span>
                </div>
              ) : (
                <span>No breaking news available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 lg:px-8 py-6">
        {/* Ad Placement - Top Banner */}
        <div
          className={`mb-6 p-4 rounded-lg shadow-md text-center ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="py-16 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Advertise With Us
              </h3>
              <p className="text-sm text-gray-200 mb-4">
                Reach millions with Naija Daily's premium ad spaces!
              </p>
              <Link
                href="/advertise"
                className="inline-block px-6 py-2 bg-white text-blue-700 font-semibold rounded hover:bg-gray-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Featured News Section */}
       <section className="mb-8">
  <h2 className="text-2xl font-bold border-b-2 border-red-600 pb-2 mb-4">
    Featured News
  </h2>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {featuredNews.length > 0 ? (
      featuredNews.map((news) => (
        <div
          key={news.id}
          className={`${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          } rounded-lg shadow-md overflow-hidden`}
        >
           <Link
                href={`/news/${news.slug}`}
                className=""
                onClick={() => recordView(news.id)}
              >
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded mb-2">
              {news.category}
            </span>
            <h3 className="text-xl font-bold mb-2">{news.title}</h3>

            <div
              className={`mb-3 text-sm leading-relaxed ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
              dangerouslySetInnerHTML={{ __html: news.excerpt }}
            />

            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                {news.date} • {news.views} views
              </span>
              <Link
                href={`/news/${news.slug}`}
                className="text-red-600 hover:underline font-medium"
                onClick={() => recordView(news.id)}
              >
                Read More
              </Link>
            </div>
          </div>
          </Link>
        </div>
      ))
    ) : (
      <p className="text-gray-500">Loading news...</p>
    )}
  </div>
</section>


        {/* Two column layout for content */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main news column */}
       <div className="w-full lg:w-2/3">
    <section className="mb-8">
      <h2 className="text-2xl font-bold border-b-2 border-red-600 pb-2 mb-4">
        Latest News
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredNews.slice(0, 4).map((news) => (
          <article
            key={news.id}
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-md overflow-hidden`}
          >
             <Link
                  href={`/news/${news.slug}`}
                  className=""
                  onClick={() => recordView(news.id)}
                >
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-40 object-cover"
              loading="lazy"
            />

           
            <div className="p-4">
              <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded mb-2">
                {news.category}
              </span>
              <h3 className="text-lg font-bold mb-2">{news.title}</h3>
              
                <div
              className={`mb-3 text-sm leading-relaxed ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
              dangerouslySetInnerHTML={{ __html: news.excerpt }}
            />
              <div className="flex justify-between items-center">
                <time className="text-xs text-gray-500" dateTime={news.date}>
                  {new Date(news.date).toLocaleDateString()}
                </time>
                <Link
                  href={`/news/${news.slug}`}
                  className="text-sm text-red-600 hover:underline font-medium"
                  onClick={() => recordView(news.id)}
                >
                  Read More
                </Link>
              </div>
            </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  </div>

          {/* Sidebar */}
          <div className="w-full lg:w-1/3">
            {/* Ad Placement - Sidebar */}
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
                />
                <button
                  className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded hover:bg-red-700"
                  onClick={() =>
                    alert("Subscription functionality would be implemented here")
                  }
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
                <p className="mb-2">123 News Street</p>
                <p className="mb-2">Lagos, Nigeria</p>
                <p className="mb-2">Email: info@dailypost.ng</p>
                <p>Phone: +234 123 456 7890</p>
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