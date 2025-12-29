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

const ITEMS_PER_PAGE = 15; // You can change this

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = decodeURIComponent(params.category as string);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [darkMode] = useState(false); // You can sync this with global state if needed

  // Fetch news for this category with pagination
  useEffect(() => {
    const fetchCategoryNews = async () => {
      setIsLoading(true);
      try {
        const skip = (currentPage - 1) * ITEMS_PER_PAGE;
        const res = await fetch(
          `https://naija-daily-api.onrender.com/news-app/published?category=${encodeURIComponent(
            category
          )}&limit=${ITEMS_PER_PAGE}&skip=${skip}`
        );

        if (!res.ok) throw new Error("Failed to fetch");

        const { success, data, total } = await res.json(); // Assume your API returns { data: [...], total: number }

        if (success && data) {
          const mapped: NewsItem[] = data
            .map((item: any) => ({
              id: item._id,
              title: item.newsTitle,
              slug: generateSlug(item.newsTitle),
              category: item.category || category,
              image: item.newsImage || "/placeholder.jpg",
              excerpt: item.newsBody
                ? item.newsBody.replace(/<[^>]*>/g, " ").substring(0, 150) + "..."
                : "",
              date: new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              rawDate: item.createdAt,
              views: item.views || 0,
            }))
            .sort((a: NewsItem, b: NewsItem) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

          setNews(mapped);
          setTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1);
        }
      } catch (err) {
        console.error("Error loading category:", err);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (category) fetchCategoryNews();
  }, [category, currentPage]);

  const recordView = async (newsId: string) => {
    try {
      const res = await fetch(`https://naija-daily-api.onrender.com/news-app/news-view/${newsId}`, {
        method: "POST",
      });
      if (!res.ok) return;
      const { views } = await res.json();
      setNews((prev) =>
        prev.map((n) => (n.id === newsId ? { ...n, views } : n))
      );
    } catch (err) {
      console.error("View record failed:", err);
    }
  };

  return (
    <div
      className={`min-h-screen font-serif text-[12pt] ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <Navbar /* pass your props */ />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-8 text-red-600 hover:underline font-semibold"
        >
          ← Back
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-12 border-b-4 border-red-600 inline-block pb-3">
          {category}
        </h1>

        {isLoading ? (
          <SkeletonLoader count={12} darkMode={darkMode} />
        ) : news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {news.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <Link href={`/news/${item.slug}`} onClick={() => recordView(item.id)}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={600}
                      height={400}
                      className="w-full h-56 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 line-clamp-2">{item.title}</h3>
                      <p className={`mb-4 text-sm leading-relaxed line-clamp-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {item.excerpt}
                      </p>
                      <div className="flex justify-between text-sm">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition"
                >
                  Previous
                </button>

                <span className="text-lg font-medium">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-20 text-xl text-gray-500">
            No articles found in this category yet.
          </p>
        )}
      </main>
    </div>
  );
}