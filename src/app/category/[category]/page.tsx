// app/category/[category]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SkeletonLoader from "../../components/SkeletonLoader";
import Navbar from "../../components/Navbar";

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

const ITEMS_PER_PAGE = 15;

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = decodeURIComponent(params.category as string);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Fetch paginated news for this category
  useEffect(() => {
    if (!category) return;

    const fetchCategoryNews = async () => {
      setIsLoading(true);
      try {
        const skip = (currentPage - 1) * ITEMS_PER_PAGE;
        const res = await fetch(
          `https://naija-daily-api.onrender.com/news-app/published?category=${encodeURIComponent(
            category
          )}&limit=${ITEMS_PER_PAGE}&skip=${skip}`
        );

        if (!res.ok) throw new Error("Failed to fetch news");

        const json = await res.json();

        if (json.success && json.data) {
          const mapped: NewsItem[] = json.data
            .map((item: any) => ({
              id: item._id,
              title: item.newsTitle,
              slug: generateSlug(item.newsTitle),
              category: item.category || category,
              image: item.newsImage || "/placeholder.jpg",
              excerpt: item.newsBody
                ? item.newsBody.replace(/<[^>]*>/g, " ").trim().substring(0, 150) + "..."
                : "No excerpt available.",
              date: new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              rawDate: item.createdAt,
              views: item.views || 0,
            }))
            // Sort newest first (in case API doesn't)
            .sort((a: NewsItem, b: NewsItem) => 
              new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
            );

          setNews(mapped);
          
          // Calculate total pages from API response or total count
          if (json.totalPages) {
            setTotalPages(json.totalPages);
          } else if (json.total) {
            setTotalItems(json.total);
            setTotalPages(Math.ceil(json.total / ITEMS_PER_PAGE));
          } else {
            // Fallback: if we got full page of results, assume there might be more
            setTotalPages(mapped.length === ITEMS_PER_PAGE ? currentPage + 1 : currentPage);
          }
          
          // Scroll to top when page changes
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setNews([]);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error loading category news:", err);
        setNews([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryNews();
  }, [category, currentPage]);

  const recordView = async (newsId: string) => {
    try {
      const res = await fetch(
        `https://naija-daily-api.onrender.com/news-app/news-view/${newsId}`,
        { method: "POST" }
      );
      if (!res.ok) return;
      const { views } = await res.json();
      setNews((prev) =>
        prev.map((n) => (n.id === newsId ? { ...n, views } : n))
      );
    } catch (err) {
      console.error("Failed to record view:", err);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div
      className={`min-h-screen font-serif text-[12pt] transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-8 text-red-600 hover:underline font-semibold flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-12 border-b-4 border-red-600 inline-block pb-3">
          {category}
        </h1>

        {isLoading ? (
          <SkeletonLoader count={15} darkMode={darkMode} />
        ) : news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {news.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <Link
                    href={`/news/${item.slug}`}
                    onClick={() => recordView(item.id)}
                    className="block h-full"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={600}
                      height={400}
                      className="w-full h-56 object-cover"
                      priority={news.indexOf(item) < 6} // Priority for first row
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 line-clamp-2">
                        {item.title}
                      </h3>
                      <p
                        className={`mb-4 text-sm leading-relaxed line-clamp-3 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {item.excerpt}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <time className="text-gray-500">{item.date}</time>
                        <span className="text-red-600 font-semibold hover:underline">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-3 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition font-medium"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {/* Show first page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        1
                      </button>
                      <span className="px-2">...</span>
                    </>
                  )}

                  {/* Show nearby pages */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === currentPage ||
                        page === currentPage - 1 ||
                        page === currentPage + 1 ||
                        (currentPage <= 2 && page <= 3) ||
                        (currentPage >= totalPages - 1 && page >= totalPages - 2)
                    )
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg transition font-medium ${
                          currentPage === page
                            ? "bg-red-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  {/* Show last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No articles found in this category yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}