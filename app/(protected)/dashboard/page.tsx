"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Plus, RefreshCw } from "lucide-react";

type TabType = "live" | "vod" | "series";

interface Credential {
  id: string;
  dns: string;
  label: string;
  created_at: string;
}

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

interface DashboardItem {
  id: string;
  name: string;
  image: string;
  category_id: string;
}

function normalizeItems(raw: any[]): DashboardItem[] {
  return raw.map((item, index) => ({
    id: String(item.stream_id ?? item.series_id ?? item.num ?? `${item.name}-${index}`),
    name: String(item.name ?? "Unbekannt"),
    image: String(item.stream_icon ?? item.cover ?? item.thumbnail ?? ""),
    category_id: String(item.category_id ?? ""),
  }));
}

function sidebarTitle(tab: TabType): string {
  if (tab === "vod") return "MOVIE CATEGORIES";
  if (tab === "series") return "SERIES CATEGORIES";
  return "GROUPS";
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("live");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      void loadCredentials();
    }
  }, [status]);

  useEffect(() => {
    if (!selectedCredential) return;
    void loadCategories();
  }, [selectedCredential, activeTab]);

  useEffect(() => {
    if (!selectedCredential || !selectedCategoryId) {
      setItems([]);
      return;
    }

    void loadItems(false, selectedCategoryId);
  }, [selectedCredential, selectedCategoryId, activeTab]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.category_name.toLowerCase().includes(term));
  }, [categories, search]);

  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c.category_id === selectedCategoryId)?.category_name || null;
  }, [categories, selectedCategoryId]);

  const loadCredentials = async () => {
    try {
      const res = await fetch("/api/xtream/credentials");
      const data = await res.json();
      if (data.credentials?.length > 0) {
        setCredentials(data.credentials);
        setSelectedCredential((prev) => prev ?? data.credentials[0].id);
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedCredential) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/xtream/categories?type=${activeTab}&credentialId=${selectedCredential}`
      );
      const data = await res.json();
      const list: Category[] = Array.isArray(data.categories) ? data.categories : [];
      setCategories(list);

      if (activeTab === "live" && list.length > 0) {
        setSelectedCategoryId(list[0].category_id);
      } else {
        setSelectedCategoryId(null);
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
      setSelectedCategoryId(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (forceRefresh: boolean, categoryId: string) => {
    if (!selectedCredential) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/xtream/channels?type=${activeTab}&credentialId=${selectedCredential}&categoryId=${encodeURIComponent(
          categoryId
        )}&refresh=${forceRefresh}`
      );
      const data = await res.json();
      const rawList: any[] = Array.isArray(data.data) ? data.data : [];
      setItems(normalizeItems(rawList));
    } catch (error) {
      console.error("Error loading items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loadingCredentials) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="glass-card p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-300">Laden...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Willkommen, {session.user?.name || "User"}!</h1>
          <p className="text-gray-300">Waehle einen Xtream-Zugang aus um Inhalte zu sehen.</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="glass-button px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>

      {credentials.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Noch keine Zugangsdaten</h2>
          <p className="text-gray-300 mb-6">Fuege deinen Xtream-Zugang hinzu um zu starten</p>
          <a
            href="/credentials"
            className="glass-button-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Zugangsdaten hinzufuegen
          </a>
        </div>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2 glass-scrollbar">
            {credentials.map((cred) => (
              <button
                key={cred.id}
                onClick={() => setSelectedCredential(cred.id)}
                className={`glass-card px-4 py-3 whitespace-nowrap transition-all ${
                  selectedCredential === cred.id ? "border-violet-500 bg-violet-500/10" : "hover:bg-white/10"
                }`}
              >
                <div className="font-medium text-white">{cred.label}</div>
                <div className="text-xs text-gray-300">{cred.dns}</div>
              </button>
            ))}
          </div>

          <div className="glass-card p-4 flex gap-2 items-center">
            {(["live", "vod", "series"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`glass-tab ${activeTab === tab ? "glass-tab-active" : ""}`}
              >
                {tab === "live" && "Live"}
                {tab === "vod" && "Movies"}
                {tab === "series" && "TV Shows"}
              </button>
            ))}
            <button
              onClick={() => selectedCategoryId && void loadItems(true, selectedCategoryId)}
              disabled={loading || !selectedCategoryId}
              className="glass-button px-4 py-2 ml-auto flex items-center gap-2 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Neu laden
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4 min-h-[60vh]">
            <aside className="glass-card p-4 flex flex-col gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="glass-input w-full py-2"
              />

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">{sidebarTitle(activeTab)}</h3>
                <div className="space-y-2 max-h-[64vh] overflow-y-auto glass-scrollbar pr-1">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.category_id}
                      onClick={() => setSelectedCategoryId(cat.category_id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all border ${
                        selectedCategoryId === cat.category_id
                          ? "bg-violet-500/20 border-violet-400 text-white"
                          : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
                      }`}
                    >
                      {cat.category_name}
                    </button>
                  ))}

                  {!loading && filteredCategories.length === 0 && (
                    <div className="text-sm text-gray-400">Keine Kategorien gefunden.</div>
                  )}
                </div>
              </div>
            </aside>

            <section className="glass-card p-4">
              {!selectedCategoryId ? (
                <div className="text-gray-300">Select a category...</div>
              ) : loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                  <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
                </div>
              ) : (
                <>
                  <div className="mb-4 text-white font-semibold">{selectedCategoryName}</div>

                  {activeTab === "live" ? (
                    <div className="space-y-3 max-h-[68vh] overflow-y-auto glass-scrollbar pr-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="glass-card-hover p-3 flex items-center gap-4 rounded-xl"
                        >
                          <div className="w-16 h-12 rounded-md bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-lg">TV</span>
                            )}
                          </div>
                          <div className="text-white text-sm md:text-base font-medium truncate">{item.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="channel-grid">
                      {items.map((item) => (
                        <div key={item.id} className="glass-card-hover p-2 rounded-xl">
                          <div className="aspect-[2/3] rounded-lg bg-white/5 overflow-hidden mb-2 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-sm">No Image</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-100 truncate">{item.name}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && items.length === 0 && (
                    <div className="text-gray-400 mt-4">Keine Inhalte in dieser Kategorie gefunden.</div>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}