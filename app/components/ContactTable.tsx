"use client";
// src/app/components/ContactTable.tsx

import { useMemo, useState } from "react";

export type Contact = {
  id: string;
  name: string;
  area: string;
  kakuyaku: string;
};

type Props = {
  initialContacts: Contact[];
};

export default function ContactTable({ initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // id being updated
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", area: "", kakuyaku: "未確約" });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", area: "" });

  const sortContacts = (list: Contact[]) =>
    [...list].sort(
      (a, b) =>
        a.area.localeCompare(b.area, "ja") ||
        a.name.localeCompare(b.name, "ja"),
    );

  const areas = useMemo(() => {
    const order = ["門前", "ポーラスター", "東"];
    const uniqueAreas = Array.from(
      new Set(contacts.map((contact) => contact.area)),
    );
    return order.filter((area) => uniqueAreas.includes(area));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesArea = selectedArea ? contact.area === selectedArea : true;
      const matchesName = query
        ? contact.name.toLowerCase().includes(query)
        : true;
      return matchesArea && matchesName;
    });
  }, [contacts, selectedArea, searchQuery]);

  const confirmedCount = useMemo(
    () =>
      filteredContacts.filter((contact) => contact.kakuyaku === "確約").length,
    [filteredContacts],
  );

  const showActionButtons = searchQuery.trim().length > 0;

  const toggleSearch = () => {
    setShowSearch((current) => {
      if (current) {
        setSearchQuery("");
      }
      return !current;
    });
  };

  // Toggle kakuyaku between "未確約" and "確約"
  const handleToggle = async (contact: Contact) => {
    const next = contact.kakuyaku === "確約" ? "未確約" : "確約";
    setLoading(contact.id);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kakuyaku: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated: Contact = await res.json();
      setContacts((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch (e) {
      alert("更新に失敗しました。");
    } finally {
      setLoading(null);
    }
  };

  // Create new contact
  const handleCreate = async () => {
    if (!form.name.trim() || !form.area.trim()) {
      alert("名前とエリアを入力してください。");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Create failed");
      const created: Contact = await res.json();
      setContacts((prev) => sortContacts([...prev, created]));
      setForm({ name: "", area: "", kakuyaku: "未確約" });
      setShowForm(false);
    } catch {
      alert("作成に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete contact
  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("削除に失敗しました。");
    }
  };

  // Start inline edit
  const startEdit = (contact: Contact) => {
    setEditId(contact.id);
    setEditForm({ name: contact.name, area: contact.area });
  };

  // Save inline edit
  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated: Contact = await res.json();
      setContacts((prev) =>
        sortContacts(prev.map((c) => (c.id === id ? updated : c))),
      );
      setEditId(null);
    } catch {
      alert("更新に失敗しました。");
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
            <span className="title-ja">確約管理</span>
            <span className="title-en">KAKUYAKU MANAGER</span>
          </h1>
          <button className="btn-add" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "✕ キャンセル" : "+ 新規登録"}
          </button>
        </div>
      </header>

      <div className="area-filter-bar">
        <button className="search-toggle-button" onClick={toggleSearch}>
          名前検索
        </button>
        {showSearch && (
          <input
            className="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前検索"
          />
        )}
        <div className="area-button-row">
          <button
            className={`area-button ${selectedArea === null ? "active" : ""}`}
            onClick={() => setSelectedArea(null)}
          >
            全て
          </button>
          {areas.map((area) => (
            <button
              key={area}
              className={`area-button ${selectedArea === area ? "active" : ""}`}
              onClick={() => setSelectedArea(area)}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="form-panel">
          <div className="form-grid">
            <div className="field">
              <label>名前</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：山田太郎"
              />
            </div>
            <div className="field">
              <label>エリア</label>
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              >
                <option value="" disabled>
                  選択してください
                </option>
                <option value="ポーラスター">ポーラスター</option>
                <option value="門前">門前</option>
                <option value="東">東</option>
              </select>
            </div>
            <div className="field">
              <label>確約状態</label>
              <select
                value={form.kakuyaku}
                onChange={(e) => setForm({ ...form, kakuyaku: e.target.value })}
              >
                <option value="未確約">未確約</option>
                <option value="確約">確約</option>
              </select>
            </div>
          </div>
          <button
            className="btn-submit"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
        </div>
      )}

      <main className="table-section">
        <div className="table-meta">
          <span className="count-badge">
            {selectedArea ? `${selectedArea} の件数: ` : "全エリアの件数: "}
            {filteredContacts.length} 件
            {confirmedCount > 0 ? ` ・ 確約 ${confirmedCount} 件` : ""}
          </span>
        </div>
        <div className="table-wrapper">
          <table className="contact-table">
            <thead>
              <tr>
                <th>名前</th>
                {/* <th>エリア</th> */}
                <th>確約状態</th>
                {showActionButtons ? <th>操作</th> : null}
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionButtons ? 3 : 2}
                    className="empty-state"
                  >
                    データがありません
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="contact-row">
                    <td>
                      {editId === contact.id ? (
                        <input
                          className="inline-input"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      ) : (
                        <span className="contact-name">{contact.name}</span>
                      )}
                    </td>
                    {/* <td>
                      {editId === contact.id ? (
                        <input
                          className="inline-input"
                          value={editForm.area}
                          onChange={(e) =>
                            setEditForm({ ...editForm, area: e.target.value })
                          }
                        />
                      ) : (
                        <span className="area-tag">{contact.area}</span>
                      )}
                    </td> */}
                    <td>
                      <button
                        className={`kakuyaku-toggle ${
                          contact.kakuyaku === "確約" ? "confirmed" : "pending"
                        }`}
                        onClick={() => handleToggle(contact)}
                        disabled={loading === contact.id}
                      >
                        {loading === contact.id ? "…" : contact.kakuyaku}
                      </button>
                    </td>
                    {showActionButtons ? (
                      <td className="action-cell">
                        {editId === contact.id ? (
                          <>
                            <button
                              className="btn-save"
                              onClick={() => saveEdit(contact.id)}
                            >
                              保存
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={() => setEditId(null)}
                            >
                              戻る
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-edit"
                              onClick={() => startEdit(contact)}
                            >
                              編集
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(contact.id)}
                            >
                              削除
                            </button>
                          </>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap");

        .app-wrapper {
          min-height: 100vh;
          background: #0d0d0d;
          color: #e8e6e0;
          font-family: "Noto Sans JP", sans-serif;
        }

        .app-header {
          border-bottom: 1px solid #2a2a2a;
          padding: 0 2rem;
          background: #0d0d0d;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 0;
        }

        .app-title {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 0;
        }

        .title-ja {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #e8e6e0;
          line-height: 1.1;
        }

        .title-en {
          font-family: "Space Mono", monospace;
          font-size: 0.6rem;
          letter-spacing: 0.35em;
          color: #555;
          text-transform: uppercase;
        }

        .btn-add {
          background: #c8a96e;
          color: #0d0d0d;
          border: none;
          padding: 0.6rem 1.4rem;
          font-family: "Noto Sans JP", sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: background 0.15s;
        }

        .btn-add:hover {
          background: #e0be82;
        }

        .form-panel {
          max-width: 960px;
          margin: 1.5rem auto;
          padding: 1.5rem 2rem;
          background: #161616;
          border: 1px solid #2a2a2a;
          border-left: 3px solid #c8a96e;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .field label {
          display: block;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: #888;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          font-family: "Space Mono", monospace;
        }

        .field input,
        .field select {
          width: 100%;
          background: #0d0d0d;
          border: 1px solid #333;
          color: #e8e6e0;
          padding: 0.55rem 0.75rem;
          font-family: "Noto Sans JP", sans-serif;
          font-size: 0.9rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .field input:focus,
        .field select:focus {
          border-color: #c8a96e;
        }

        .btn-submit {
          background: #1e1e1e;
          border: 1px solid #c8a96e;
          color: #c8a96e;
          padding: 0.6rem 2rem;
          font-family: "Noto Sans JP", sans-serif;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.15s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #c8a96e;
          color: #0d0d0d;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .table-section {
          max-width: 960px;
          margin: 2rem auto;
          padding: 0 2rem 4rem;
        }

        .table-meta {
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .count-badge {
          font-family: "Space Mono", monospace;
          font-size: 0.95rem;
          color: #ffffff;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .area-filter-bar {
          max-width: 960px;
          margin: 1rem auto 0;
          padding: 0 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .area-button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .search-toggle-button {
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #ccc;
          padding: 0.35rem 0.75rem;
          font-family: "Space Mono", monospace;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s;
          align-self: flex-start;
        }

        .search-toggle-button:hover {
          border-color: #c8a96e;
          color: #e8e6e0;
        }

        .search-input {
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #ccc;
          padding: 0.55rem 1rem;
          font-family: "Space Mono", monospace;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .area-button:hover {
          border-color: #c8a96e;
          color: #e8e6e0;
        }

        .area-button.active {
          background: #c8a96e;
          border-color: #c8a96e;
          color: #0d0d0d;
        }

        .search-input {
          flex: 1 1 240px;
          min-width: 240px;
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #e8e6e0;
          box-sizing: border-box;
          padding: 0.15rem 0.6rem;
          line-height: 1;
          height: 1.6rem;
          font-family: "Space Mono", monospace;
          font-size: 0.78rem;
          outline: none;
        }

        .search-input:focus {
          border-color: #c8a96e;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .contact-table {
          width: 100%;
          border-collapse: collapse;
        }

        .contact-table thead tr {
          border-bottom: 1px solid #2a2a2a;
        }

        .contact-table th {
          font-family: "Space Mono", monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: #555;
          text-transform: uppercase;
          padding: 0.65rem 1rem;
          text-align: left;
          font-weight: 400;
        }

        .contact-row {
          border-bottom: 1px solid #1a1a1a;
          transition: background 0.1s;
        }

        .contact-row:hover {
          background: #141414;
        }

        .contact-table td {
          padding: 0.85rem 1rem;
          vertical-align: middle;
        }

        .contact-name {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .area-tag {
          font-size: 0.82rem;
          color: #999;
          background: #1a1a1a;
          padding: 0.2rem 0.6rem;
          border: 1px solid #2a2a2a;
        }

        .kakuyaku-toggle {
          border: none;
          padding: 0.35rem 1rem;
          font-family: "Noto Sans JP", sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.15s;
          min-width: 72px;
        }

        .kakuyaku-toggle.confirmed {
          background: #1a3a2a;
          color: #5ecf8a;
          border: 1px solid #2d6045;
        }

        .kakuyaku-toggle.confirmed:hover {
          background: #1e4530;
        }

        .kakuyaku-toggle.pending {
          background: #2a1f1a;
          color: #d4845a;
          border: 1px solid #5a3520;
        }

        .kakuyaku-toggle.pending:hover {
          background: #33261e;
        }

        .kakuyaku-toggle:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .action-cell {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit,
        .btn-delete,
        .btn-save,
        .btn-cancel {
          background: transparent;
          border: 1px solid #333;
          color: #888;
          padding: 0.3rem 0.75rem;
          font-family: "Noto Sans JP", sans-serif;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-edit:hover {
          border-color: #c8a96e;
          color: #c8a96e;
        }

        .btn-delete:hover {
          border-color: #c85a5a;
          color: #c85a5a;
        }

        .hidden-action-button {
          visibility: hidden;
          pointer-events: none;
        }

        .btn-save:hover {
          border-color: #5ecf8a;
          color: #5ecf8a;
        }

        .btn-cancel:hover {
          border-color: #888;
          color: #ccc;
        }

        .inline-input {
          background: #0d0d0d;
          border: 1px solid #c8a96e;
          color: #e8e6e0;
          padding: 0.3rem 0.5rem;
          font-family: "Noto Sans JP", sans-serif;
          font-size: 0.9rem;
          width: 100%;
          outline: none;
          box-sizing: border-box;
        }

        .empty-state {
          text-align: center;
          color: #444;
          padding: 3rem 1rem !important;
          font-family: "Space Mono", monospace;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .header-inner {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
