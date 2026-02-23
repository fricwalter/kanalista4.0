"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Plus, RefreshCw } from "lucide-react";

interface Credential {
  id: string;
  dns: string;
  label: string;
  created_at: string;
}

interface Channel {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "vod" | "series">("live");
  const [loading, setLoading] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // Credentials laden
  useEffect(() => {
    if (status === "authenticated") {
      loadCredentials();
    }
  }, [status]);

  // Channels laden wenn Credential ausgewählt
  useEffect(() => {
    if (selectedCredential) {
      loadChannels(false);
    }
  }, [selectedCredential, activeTab]);

  const loadCredentials = async () => {
    try {
      const res = await fetch("/api/xtream/credentials");
      const data = await res.json();
      if (data.credentials?.length > 0) {
        setCredentials(data.credentials);
        setSelectedCredential(data.credentials[0].id);
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const loadChannels = async (forceRefresh: boolean = false) => {
    if (!selectedCredential) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/xtream/channels?type=${activeTab}&credentialId=${selectedCredential}&refresh=${forceRefresh}`
      );
      const data = await res.json();
      if (data.data) {
        setChannels(data.data);
      }
    } catch (error) {
      console.error("Error loading channels:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loadingCredentials) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="glass-card p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      {/* Willkommen */}
      <div className="glass-card p-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Willkommen, {session.user?.name || "User"}!
          </h1>
          <p className="text-gray-400">
            Wähle einen Xtream-Zugang aus um deine Kanäle zu sehen
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="glass-button px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>

      {/* Keine Credentials */}
      {credentials.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Noch keine Zugangsdaten
          </h2>
          <p className="text-gray-400 mb-6">
            Füge deinen Xtream-Zugang hinzu um zu starten
          </p>
          <a
            href="/credentials"
            className="glass-button-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Zugangsdaten hinzufügen
          </a>
        </div>
      ) : (
        <>
          {/* Credential Selector */}
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            {credentials.map((cred) => (
              <button
                key={cred.id}
                onClick={() => setSelectedCredential(cred.id)}
                className={`glass-card px-4 py-3 whitespace-nowrap transition-all ${
                  selectedCredential === cred.id
                    ? "border-violet-500 bg-violet-500/10"
                    : "hover:bg-white/10"
                }`}
              >
                <div className="font-medium text-white">{cred.label}</div>
                <div className="text-xs text-gray-400">{cred.dns}</div>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["live", "vod", "series"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`glass-tab ${
                  activeTab === tab ? "glass-tab-active" : ""
                }`}
              >
                {tab === "live" && "📡 Live"}
                {tab === "vod" && "🎬 VOD"}
                {tab === "series" && "📺 Serien"}
              </button>
            ))}
            <button
              onClick={() => loadChannels(true)}
              disabled={loading}
              className="glass-button px-4 py-2 ml-auto flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Neu laden
            </button>
          </div>

          {/* Channel Grid */}
          {loading ? (
            <div className="glass-card p-10 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
            </div>
          ) : (
            <div className="channel-grid">
              {channels.map((channel: any) => (
                <div
                  key={channel.stream_id}
                  className="glass-card-hover p-4 flex flex-col items-center"
                >
                  <div className="w-16 h-16 mb-3 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                    {channel.stream_icon ? (
                      <img
                        src={channel.stream_icon}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-2xl">📺</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-white truncate max-w-[120px]">
                      {channel.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && channels.length === 0 && (
            <div className="glass-card p-10 text-center text-gray-400">
              Keine Kanäle gefunden
            </div>
          )}
        </>
      )}
    </div>
  );
}
