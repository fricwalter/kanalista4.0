"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Credential {
  id: string;
  dns: string;
  label: string;
  created_at: string;
}

export default function CredentialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dns: "",
    username: "",
    password: "",
    label: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      loadCredentials();
    }
  }, [status, router]);

  const loadCredentials = async () => {
    try {
      const res = await fetch("/api/xtream/credentials");
      const data = await res.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error("Error loading credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/xtream/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Speichern");
      }

      setSuccess("Zugangsdaten erfolgreich gespeichert!");
      setFormData({ dns: "", username: "", password: "", label: "" });
      loadCredentials();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCredential = async (id: string) => {
    if (!confirm("Möchtest du diesen Zugang wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/xtream/credentials?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Fehler beim Löschen");
      }

      loadCredentials();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Xtream Zugangsdaten</h1>

      {/* Form */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Neuen Zugang hinzufügen</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">DNS / Server URL</label>
            <input
              type="text"
              value={formData.dns}
              onChange={(e) => setFormData({ ...formData, dns: e.target.value })}
              placeholder="http://mein-iptv-server.com:8080"
              className="glass-input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Benutzername</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="mein_user"
                className="glass-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Passwort</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="glass-input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Label (optional)</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Mein IPTV"
              className="glass-input w-full"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="glass-button-primary w-full py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Zugang speichern
              </>
            )}
          </button>
        </form>
      </div>

      {/* Credentials List */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Gespeicherte Zugänge</h2>

        {credentials.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Zugänge gespeichert</p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-white">{cred.label}</div>
                  <div className="text-sm text-gray-400">{cred.dns}</div>
                </div>
                <button
                  onClick={() => deleteCredential(cred.id)}
                  className="glass-button p-2 rounded-lg text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
