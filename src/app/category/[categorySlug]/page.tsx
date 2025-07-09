"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, X, ChevronDown } from "lucide-react";
import logo from "../../../../public/ndb.png"; // Adjust path as needed

// Helper function to generate URL-friendly slugs
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

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

interface RecordViewResponse {
  success: boolean;
  views: number;
}

export default function CategoryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [categories, setCategories] = useState(["Home"]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const categorySlug = params.categorySlug as string;

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

  // Fetch categories
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

  // Fetch news articles by category
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://news-app-three-lyart.vercel.app/news-app/published");
        const result = await response.json();
        if (result.success && result.data) {
          const filteredNews = result.data
            .filter((item: any) => 
              generateSlug(item.category) === categorySlug
            )
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
              views: item.views || 0,
            }));
          setNewsItems(filteredNews);
        } else {
          setError("Failed to fetch news articles");
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setError("Error loading news articles");
      } finally {
        setLoading(false);
      }
    };
    if (categorySlug) {
      fetchNews();
    }
  }, [categorySlug]);

  // Record view
  const recordView = async (newsId: string): Promise<void> => {
    try {
      const response = await fetch(
        `https://news-app-three-lyart.vercel.app/news-app/news-view/${newsId}`,
        { method: "POST" }
      );
      const result: RecordViewResponse = await response.json();
      if (result.success) {
        setNewsItems((prevNews) =>
          prevNews.map((news) =>
            news.id === newsId ? { ...news, views: result.views } : news
          )
        );
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-serif text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-serif ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <header className={`relative py-2 px-4 lg:px-8 ${darkMode ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-r from-white via-gray-50 to-white"} shadow-lg border-b`}>
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Image alt="Logo" src={logo} className="w-auto h-7 lg:h-20" />
            </Link>
            <div className="flex items-center space-x-2">
              <button className="p-3 lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="hidden lg:flex items-center">
                <div className={`relative group ${darkMode ? "bg-gray-700" : "bg-white"} rounded-full shadow-lg`}>
                  <div className="flex items-center">
                    <div className="p-3 text-gray-400"><Search size={20} /></div>
                    <input type="text" placeholder="Search news..." className={`py-3 pr-4 bg-transparent ${darkMode ? "text-white" : "text-gray-800"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <nav className={`${mobileMenuOpen ? "block" : "hidden"} lg:block`}>
            <ul className="flex flex-col lg:flex-row lg:justify-center lg:space-x-8">
              {categories.map((category, index) => (
                <li key={index}>
                  <Link
                    href={category === "Home" ? "/" : `/category/${generateSlug(category)}`}
                    className={`px-4 py-2 font-semibold ${index === 0 ? "text-red-600" : darkMode ? "text-gray-300" : "text-gray-700"} hover:text-red-600`}
                  >
                    {category}
                  </Link>
                </li>
              ))}
              <li className="relative group">
                <Link href="#" className="flex items-center px-4 py-2 font-semibold">
                  More <ChevronDown size={16} className="ml-2" />
                </Link>
                <div className="absolute mt-2 opacity-0 group-hover:opacity-100 group-hover:visible">
                  <ul className={`w-56 py-3 rounded-xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    {["Opinion", "Health", "Technology"].map((item) => (
                      <li key={item}>
                        <Link href={`/category/${item.toLowerCase()}`} className="px-4 py-3 hover:bg-red-600 hover:text-white">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-6">
        <h1 className="text-3xl font-bold mb-6">
          {categories.find(cat => generateSlug(cat) === categorySlug) || "Category"}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsItems.length === 0 ? (
            <p>No articles found in this category.</p>
          ) : (
            newsItems.map((news) => (
              <article
                key={news.id}
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-lg shadow-md overflow-hidden`}
              >
                <Link
                  href={`/news/${news.slug}`}
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
                      className={`mb-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      dangerouslySetInnerHTML={{ __html: news.excerpt }}
                    />
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{news.date}</span>
                      <span className="text-red-600 hover:underline">Read More</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-8 ${darkMode ? "bg-gray-800" : "bg-gray-900"} text-white`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex lg:px-48 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Naija Daily</h3>
              <p className="text-gray-400 mb-4">
                Nigeria's most comprehensive and trusted online newspaper delivering
                breaking news, politics, business, entertainment, sports, and more.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white">Facebook</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Twitter</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Instagram</Link>
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