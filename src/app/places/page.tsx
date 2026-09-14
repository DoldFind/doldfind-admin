"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PlaceForm } from "@/components/PlaceForm";
import {
  Search,
  Trash2,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";
import { PlaceDetails } from "@/types/place";

interface SessionInfo {
  username: string;
  badge: string;
}

export default function PlacesManagement() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Places Data
  const [places, setPlaces] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPlaceType, setFilterPlaceType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMainCategory, setFilterMainCategory] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterUploader, setFilterUploader] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "a-z", "z-a"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Selected Place for Editing
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);

  // Place ID for Deletion Confirmation
  const [deletingPlace, setDeletingPlace] = useState<PlaceDetails | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Logout state
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Fetch session status on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setSession(result.data);
          }
        }
      } catch (err) {
        console.error("Session verification failed:", err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  // Fetch places
  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/places");
      const data = await res.json();
      if (res.ok && data.success) {
        setPlaces(data.data || []);
      } else {
        setApiError(data.error?.message || "Failed to load places.");
      }
    } catch {
      setApiError("Network error. Failed to load places.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch("/api/places")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success) {
          setPlaces(data.data || []);
        } else {
          setApiError(data.error?.message || "Failed to load places.");
        }
      })
      .catch(() => {
        if (active) setApiError("Network error. Failed to load places.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle Toast timers
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (!deletingPlace) return;
    const targetId = deletingPlace.id;
    try {
      const res = await fetch(`/api/places/${targetId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Place deleted permanently from database.", "success");
        setPlaces((prev) => prev.filter((p) => p.id !== targetId));
      } else {
        showToast(result.error?.message || "Failed to delete place.", "error");
      }
    } catch {
      showToast("Network error. Failed to delete place.", "error");
    } finally {
      setDeletingPlace(null);
    }
  };

  // Filter options derived from data
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((p) => (p.categories || []).forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [places]);

  const uniqueMainCategories = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((p) => {
      if (p.mainCategory) cats.add(p.mainCategory);
    });
    return Array.from(cats).sort();
  }, [places]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    places.forEach((p) => {
      if (p.city) cities.add(p.city);
    });
    return Array.from(cities).sort();
  }, [places]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    places.forEach((p) => {
      if (p.state) states.add(p.state);
    });
    return Array.from(states).sort();
  }, [places]);

  const uniqueUploaders = useMemo(() => {
    const uploaders = new Set<string>();
    places.forEach((p) => {
      if (p.uploaderId) uploaders.add(p.uploaderId);
    });
    return Array.from(uploaders).sort();
  }, [places]);

  // Filter & Sort Calculation
  const filteredPlaces = useMemo(() => {
    return places
      .filter((place) => {
        if (debouncedSearch.trim() !== "") {
          const q = debouncedSearch.toLowerCase().trim();
          const matchName = (place.placeName || "").toLowerCase().includes(q);
          const matchCity = (place.city || "").toLowerCase().includes(q);
          const matchArea = (place.area || "").toLowerCase().includes(q);
          const matchState = (place.state || "").toLowerCase().includes(q);
          const matchCategories = (place.categories || []).some((c) => c.toLowerCase().includes(q));
          const matchMainCat = (place.mainCategory || "").toLowerCase().includes(q);
          const matchUploader = (place.uploaderId || "").toLowerCase().includes(q);
          const matchId = (place.id || "").toLowerCase().includes(q);

          if (!matchName && !matchCity && !matchArea && !matchState && !matchCategories && !matchMainCat && !matchUploader && !matchId) {
            return false;
          }
        }

        if (filterPlaceType && (place.placeType || "").toLowerCase() !== filterPlaceType.toLowerCase()) {
          return false;
        }
        if (filterCategory && !(place.categories || []).some((c) => c.toLowerCase() === filterCategory.toLowerCase())) {
          return false;
        }
        if (filterMainCategory && (place.mainCategory || "").toLowerCase() !== filterMainCategory.toLowerCase()) {
          return false;
        }
        if (filterCity && (place.city || "").toLowerCase() !== filterCity.toLowerCase()) {
          return false;
        }
        if (filterState && (place.state || "").toLowerCase() !== filterState.toLowerCase()) {
          return false;
        }
        if (filterUploader && (place.uploaderId || "").toLowerCase() !== filterUploader.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "a-z") {
          return (a.placeName || "").localeCompare(b.placeName || "");
        }
        if (sortBy === "z-a") {
          return (b.placeName || "").localeCompare(a.placeName || "");
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        // Default newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [places, debouncedSearch, filterPlaceType, filterCategory, filterMainCategory, filterCity, filterState, filterUploader, sortBy]);

  const paginatedPlaces = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlaces.slice(start, start + pageSize);
  }, [filteredPlaces, currentPage]);

  const totalPages = Math.ceil(filteredPlaces.length / pageSize);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-4">
        <div className="bg-[#0e0e0e] border border-white/10 rounded-xl p-6 max-w-xs text-center flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white">Authentication Required</h2>
          <Link href="/" className="px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-neutral-200 transition">
            Log In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#0e0e0e] text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-3.5 py-2 rounded-lg border border-white/20 bg-[#171717] text-white text-xs font-medium shadow-xl animate-fadeIn">
          {toast.message}
        </div>
      )}

      {/* Header Navigation */}
      <header className="border-b border-white/10 bg-[#0e0e0e]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-sm tracking-tight text-white">
              DoldFind
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs">
              <Link href="/" className="text-neutral-400 hover:text-white transition">
                Contribute
              </Link>
              <Link href="/places" className="text-white border-b border-white pb-0.5 font-medium">
                Places
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400">{session.username}</span>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="border border-white/15 text-neutral-300 hover:text-white hover:bg-white/5 py-1 px-2.5 rounded text-xs transition disabled:opacity-50"
            >
              {logoutLoading ? "..." : "Log Out"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation sub-bar */}
        <div className="md:hidden border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 h-9 text-xs">
            <Link href="/" className="text-neutral-400 hover:text-white transition">
              Contribute
            </Link>
            <Link href="/places" className="text-white border-b border-white">
              Places
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Places
          </h1>

          <Link
            href="/"
            className="flex items-center gap-1.5 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Place
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#121212]/60 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search places..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white w-full focus:ring-0 p-0 placeholder:text-neutral-600"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 text-neutral-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <select
              value={filterPlaceType}
              onChange={(e) => { setFilterPlaceType(e.target.value); setCurrentPage(1); }}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="">All Types</option>
              <option value="Spot">Spot</option>
              <option value="Cafe">Cafe</option>
              <option value="Market">Market</option>
            </select>

            <select
              value={filterMainCategory}
              onChange={(e) => { setFilterMainCategory(e.target.value); setCurrentPage(1); }}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="">All Categories</option>
              {uniqueMainCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterCity}
              onChange={(e) => { setFilterCity(e.target.value); setCurrentPage(1); }}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterState}
              onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="">All States</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="">All Tags</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterUploader}
              onChange={(e) => { setFilterUploader(e.target.value); setCurrentPage(1); }}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="">All Uploaders</option>
              {uniqueUploaders.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-white transition"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
            </select>
          </div>

          {(filterPlaceType || filterCategory || filterMainCategory || filterCity || filterState || filterUploader || search) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterPlaceType("");
                setFilterCategory("");
                setFilterMainCategory("");
                setFilterCity("");
                setFilterState("");
                setFilterUploader("");
                setSortBy("newest");
              }}
              className="text-[11px] text-neutral-400 hover:text-white self-end flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#141414] border border-white/10 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
                <div className="h-16 bg-white/5 rounded w-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && apiError && (
          <div className="border border-red-500/30 bg-red-950/20 rounded-xl p-5 text-center flex flex-col gap-2 max-w-md mx-auto my-8">
            <p className="text-xs text-red-400">{apiError}</p>
            <button
              onClick={fetchPlaces}
              className="mt-2 px-3 py-1.5 bg-[#171717] border border-white/10 text-xs text-white rounded-lg w-fit mx-auto hover:bg-[#222] transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !apiError && filteredPlaces.length === 0 && (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 my-6">
            <p className="text-xs text-neutral-400">No places found.</p>
            <Link href="/" className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-neutral-200 transition">
              Add Place
            </Link>
          </div>
        )}

        {/* Places Grid */}
        {!loading && !apiError && filteredPlaces.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="text-xs text-neutral-500">
              {filteredPlaces.length} places
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-[#141414] border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition group overflow-hidden"
                >
                  {(place.cardCover || (place.images && place.images.length > 0)) && (
                    <div className="relative -mx-4 -mt-4 h-36 bg-black overflow-hidden border-b border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={place.cardCover || place.images[0]}
                        alt={place.placeName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-semibold text-white line-clamp-1">
                        {place.placeName}
                      </h3>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setSelectedPlace(place)}
                          className="p-1 text-neutral-400 hover:text-white rounded transition"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPlace(place)}
                          className="p-1 text-neutral-400 hover:text-red-400 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <span className="bg-white/10 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                        {place.placeType || "Spot"}
                      </span>
                      {place.mainCategory && (
                        <span className="bg-white/5 text-neutral-300 text-[10px] px-2 py-0.5 rounded border border-white/10">
                          {place.mainCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {place.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {place.description}
                    </p>
                  )}

                  <div className="border-t border-white/10 pt-2 text-[11px] text-neutral-400 flex flex-col gap-1 mt-auto">
                    <div>
                      {place.area ? `${place.area}, ` : ""}{place.city}, {place.state}
                    </div>
                    {place.entryFee && (
                      <div className="text-neutral-500">
                        Fee: {place.entryFee}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-neutral-500">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="p-1 border border-white/10 rounded text-neutral-400 hover:text-white disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="p-1 border border-white/10 rounded text-neutral-400 hover:text-white disabled:opacity-30 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Place Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4 flex justify-center items-start animate-fadeIn">
          <div className="w-full max-w-4xl bg-[#0e0e0e] border border-white/15 rounded-xl shadow-2xl relative my-6 overflow-hidden">
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded transition z-50"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">
                Edit Place: {selectedPlace.placeName}
              </h2>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <PlaceForm
                initialPlace={selectedPlace}
                onSuccess={(updatedPlace) => {
                  showToast("Place updated", "success");
                  setPlaces((prev) => prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p)));
                  setSelectedPlace(null);
                }}
                onCancel={() => setSelectedPlace(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0e0e0e] border border-white/15 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">Delete Place</h3>
            <p className="text-xs text-neutral-400">
              Delete <strong className="text-white">{deletingPlace.placeName}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingPlace(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white border border-white/10 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 py-5 mt-12 text-center text-xs text-neutral-600">
        &copy; {new Date().getFullYear()} DoldFind
      </footer>
    </main>
  );
}
