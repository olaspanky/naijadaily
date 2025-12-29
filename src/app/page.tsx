"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../app/components/Navbar";
import SkeletonLoader from "../app/components/SkeletonLoader";
import { IoClose } from "react-icons/io5";

// Consistent slug generator — matches your article page exactly
const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/–/g, "-")
    .trim();

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  image: string;
  excerpt: string;
  date: string;
  rawDate: string;
  views?: number;
}

export default function DailyPostClone() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(""); // ← Fixed: Now properly declared
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [categoryNews, setCategoryNews] = useState<{ [key: string]: NewsItem[] }>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const limit = 8;
  const ads = ["/assets/ad2.jpeg", "/assets/ad3.jpeg"];
  const landingPageCategories = ["News", "Metro", "Politics", "Sports", "Entertainment", "Business"];

  // Set current date
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

  // Fetch Headlines
  useEffect(() => {
    const fetchHeadlines = async () => {
      try {
        const res = await fetch(
          `https://naija-daily-api.onrender.com/news-app/headlines?limit=${limit}`
        );
        if (!res.ok) throw new Error("Failed to fetch headlines");
        const { success, data } = await res.json();

        if (success && data) {
          const mapped: NewsItem[] = data.map((item: any) => ({
            id: item._id,
            title: item.newsTitle,
            slug: generateSlug(item.newsTitle),
            category: "Headlines",
            image: item.newsImage || "/placeholder.jpg",
            excerpt: item.newsBody
              ? item.newsBody.replace(/<[^>]*>/g, " ").substring(0, 130) + "..."
              : "",
            date: new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            rawDate: item.createdAt,
            views: item.views || 0,
          })).sort((a: { rawDate: string }, b: { rawDate: string }) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

          setHeadlines(mapped);
        }
      } catch (err) {
        console.error("Error fetching headlines:", err);
      }
    };

    fetchHeadlines();
  }, []);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://naija-daily-api.onrender.com/news-app-category");
        if (!res.ok) throw new Error("Categories fetch failed");
        const { success, data } = await res.json();

        if (success && data) {
          const cats = data.map((c: any) => c.categoryName);
          setAllCategories(["Headlines", ...cats]);

          const ordered = landingPageCategories.filter((cat) =>
            cats.some((apiCat: string) => apiCat.toLowerCase() === cat.toLowerCase())
          );
          setCategories(["Headlines", ...ordered]);
        } else {
          setCategories(["Headlines"]);
          setAllCategories(["Headlines"]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories(["Headlines"]);
        setAllCategories(["Headlines"]);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Category News
  useEffect(() => {
    if (allCategories.length <= 1) return;

    const fetchCategoryNews = async () => {
      setIsLoading(true);
      const newsByCategory: { [key: string]: NewsItem[] } = {};

      const promises = allCategories
        .filter((cat) => cat !== "Headlines")
        .map(async (category) => {
          try {
            const res = await fetch(
              `https://naija-daily-api.onrender.com/news-app/published?category=${encodeURIComponent(category)}&limit=${limit}`
            );
            if (!res.ok) return;
            const { success, data } = await res.json();

            if (success && data) {
                interface NewsApiItem {
                  _id: string;
                  newsTitle: string;
                  newsImage?: string;
                  newsBody?: string;
                  category?: string;
                  createdAt: string;
                  views?: number;
                }

                const mapped: NewsItem[] = (data as NewsApiItem[])
                  .map((item: NewsApiItem): NewsItem => ({
                  id: item._id,
                  title: item.newsTitle,
                  slug: generateSlug(item.newsTitle),
                  category: item.category || category,
                  image: item.newsImage || "/placeholder.jpg",
                  excerpt: item.newsBody
                    ? item.newsBody.replace(/<[^>]*>/g, " ").substring(0, 130) + "..."
                    : "",
                  date: new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }),
                  rawDate: item.createdAt,
                  views: item.views || 0,
                  }))
                  .sort((a: NewsItem, b: NewsItem): number => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
                newsByCategory[category] = mapped;
            }
          } catch (err) {
            console.error(`Failed to load ${category}:`, err);
          }
        });

      await Promise.all(promises);
      setCategoryNews(newsByCategory);
      setIsLoading(false);
    };

    fetchCategoryNews();
  }, [allCategories]);

  // Record View
  const recordView = async (newsId: string) => {
    try {
      const res = await fetch(
        `https://naija-daily-api.onrender.com/news-app/news-view/${newsId}`,
        { method: "POST" }
      );
      if (!res.ok) return;
      const { views } = await res.json();

      setHeadlines((prev) => prev.map((n) => (n.id === newsId ? { ...n, views } : n)));
      setCategoryNews((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((cat) => {
          updated[cat] = updated[cat].map((n) => (n.id === newsId ? { ...n, views } : n));
        });
        return updated;
      });
    } catch (err) {
      console.error("Failed to record view:", err);
    }
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const adIndices = [2, 5];
  const displayCategories = selectedCategory ? [selectedCategory] : categories;

  return (
    <div
      className={`min-h-screen font-serif text-[12pt] transition-colors ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* SEO */}
      <head>
        <title>{headlines[0]?.title.substring(0, 60) || "Naija Daily - Latest Nigerian News"}</title>
        <meta name="description" content={headlines[0]?.excerpt.substring(0, 160) || "Latest Nigerian News"} />
        <meta property="og:image" content={headlines[0]?.image || "https://naijadaily.ng/public/ndb.png"} />
        <meta property="og:url" content="https://naijadaily.ng" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 transition-opacity ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className={`absolute left-0 top-0 h-full w-64 shadow-2xl transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
            <h2 className="text-lg font-bold">Categories</h2>
            <button onClick={() => setSidebarOpen(false)}><IoClose size={28} /></button>
          </div>
          <nav className="p-4 space-y-1">
            <button onClick={() => { setSelectedCategory(""); setSidebarOpen(false); }}
              className={`w-full text-left py-3 px-4 rounded-lg font-medium transition ${selectedCategory === "" ? "bg-red-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              Home
            </button>
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => { setSelectedCategory(cat); setSidebarOpen(false); }}
                className={`w-full text-left py-3 px-4 rounded-lg font-medium transition ${selectedCategory === cat ? "bg-red-600 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {selectedCategory && (
          <button onClick={() => setSelectedCategory("")} className="mb-8 text-red-600 hover:underline font-semibold">
            ← Back to Home
          </button>
        )}

        {/* Hero Section */}
        {!selectedCategory && headlines.length > 0 && (
          <section className="mb-16 relative rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={headlines[0].image}
              alt={headlines[0].title}
              width={1400}
              height={700}
              priority
              className="w-full h-96 md:h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{headlines[0].title}</h1>
                <p className="text-lg mb-6 opacity-90">{headlines[0].date}</p>
                <Link
                  href={`/news/${headlines[0].slug}`}
                  onClick={() => recordView(headlines[0].id)}
                  className="inline-block bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-lg transition"
                >
                  Read Full Story →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Category Sections */}
        <div className="space-y-20">
          {displayCategories.map((category, idx) => {
            const isHeadlines = category === "Headlines";
            const newsList = isHeadlines ? headlines.slice(selectedCategory ? 0 : 1) : categoryNews[category] || [];
            const showAd = !selectedCategory && adIndices.includes(idx);

            return (
              <section key={category}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold border-b-4 border-red-600 inline-block pb-2">{category}</h2>
                  {!isHeadlines && (
                    <button
                      onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      {selectedCategory === category ? "View Less" : "See All →"}
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <SkeletonLoader count={6} darkMode={darkMode} />
                ) : newsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {newsList.slice(0, selectedCategory ? 18 : 6).map((news) => (
                      <article
                        key={news.id}
                        className={`rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                      >
                        <Link href={`/news/${news.slug}`} onClick={() => recordView(news.id)} className="block h-full">
                          <Image
                            src={news.image}
                            alt={news.title}
                            width={600}
                            height={400}
                            className="w-full h-52 object-cover"
                          />
                          <div className="p-6">
                            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                              {news.category}
                            </span>
                            <h3 className="text-xl font-bold mb-3 line-clamp-2">{news.title}</h3>
                            <p className={`mb-4 text-sm leading-relaxed line-clamp-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {news.excerpt}
                            </p>
                            <div className="flex justify-between items-center text-sm">
                              <time className="text-gray-500">{news.date}</time>
                              <span className="text-red-600 font-semibold hover:underline">Read More →</span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-gray-500 text-lg">No articles available.</p>
                )}

                {showAd && (
                  <div className="mt-16 flex justify-center">
                    <Image
                      src={ads[Math.floor(Math.random() * ads.length)]}
                      alt="Advertisement"
                      width={728}
                      height={90}
                      className="rounded-lg shadow-md"
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <footer className={`mt-24 py-12 ${darkMode ? "bg-gray-800" : "bg-gray-900"} text-white`}>
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Naija Daily</h3>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Nigeria's most comprehensive and trusted online newspaper delivering breaking news,
            politics, business, entertainment, sports, and more.
          </p>
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Naija Daily Nigeria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}