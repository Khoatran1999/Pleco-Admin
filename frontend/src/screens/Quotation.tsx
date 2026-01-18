import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

interface FishItem {
  id: number;
  name: string;
  size?: string;
  category_name?: string;
  wholesale_price?: number;
  retail_price?: number;
  cost_price?: number;
  stock?: number;
}

const Quotation: React.FC = () => {
  const [fishes, setFishes] = useState<FishItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceType, setPriceType] = useState<
    "wholesale_price" | "retail_price"
  >("wholesale_price");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [hiddenRows, setHiddenRows] = useState<Record<number, boolean>>({});
  const [sortKey, setSortKey] = useState<
    "featured" | "newest" | "best" | "name" | "price" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setLoading(true);
    api
      .get("/fishes")
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? [];
        setFishes(data);
      })
      .catch(() => setFishes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return fishes.filter((f) => {
      const price = Number((f as any)[priceType] ?? 0);
      if (minPrice !== "" && price < Number(minPrice)) return false;
      if (maxPrice !== "" && price > Number(maxPrice)) return false;
      return true;
    });
  }, [fishes, priceType, minPrice, maxPrice]);

  const setSingleSort = (
    key: "featured" | "newest" | "best" | "name" | "price",
    dir: "asc" | "desc",
  ) => {
    setSortKey(key);
    setSortDir(dir);
  };

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (!sortKey) return arr;
    arr.sort((a: any, b: any) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "featured":
        case "newest":
          return ((b.id ?? 0) - (a.id ?? 0)) * dir;
        case "best":
          return ((b.stock ?? 0) - (a.stock ?? 0)) * dir;
        case "name":
          return String(a.name || "").localeCompare(String(b.name || "")) * dir;
        case "price":
          return (
            (Number((a as any)[priceType] ?? 0) -
              Number((b as any)[priceType] ?? 0)) *
            dir
          );
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir, priceType]);

  const toggleHide = (id: number) =>
    setHiddenRows((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Báo Giá</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm">Loại giá</label>
          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value as any)}
            className="px-3 py-2 rounded-lg border"
          >
            <option value="retail_price">Giá bán lẻ</option>
            <option value="wholesale_price">Giá sỉ</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-bold mb-2">Sort By:</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSingleSort("featured", "desc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Featured
          </button>
          <button
            onClick={() => setSingleSort("newest", "desc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Newest
          </button>
          <button
            onClick={() => setSingleSort("best", "desc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Best Selling
          </button>
          <button
            onClick={() => setSingleSort("name", "asc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            A to Z
          </button>
          <button
            onClick={() => setSingleSort("name", "desc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Z to A
          </button>
          <button
            onClick={() => setSingleSort("price", "asc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Price: ↑
          </button>
          <button
            onClick={() => setSingleSort("price", "desc")}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Price: ↓
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Min price"
          value={minPrice}
          onChange={(e) =>
            setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="px-3 py-2 rounded-lg border w-32"
        />
        <input
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) =>
            setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="px-3 py-2 rounded-lg border w-32"
        />
        <button
          onClick={() => {
            setMinPrice("");
            setMaxPrice("");
          }}
          className="px-4 py-2 bg-slate-100 rounded-lg"
        >
          Reset
        </button>
        <button
          onClick={() => setHiddenRows({})}
          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg"
        >
          Show all (
          {Object.keys(hiddenRows).filter((k) => hiddenRows[Number(k)]).length})
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-500/20 overflow-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left bg-slate-800/30 border-b border-slate-800/50">
              <th className="px-4 py-3 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                Tên
              </th>
              <th className="px-4 py-3 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                Kích thước
              </th>
              <th className="px-4 py-3 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                Category
              </th>
              <th className="px-4 py-3 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                Giá
              </th>
              <th className="px-4 py-3 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading && sorted.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {!loading &&
              sorted.map((f) => {
                const isHidden = !!hiddenRows[f.id];
                return (
                  <tr
                    key={f.id}
                    className="border-t"
                    style={{ display: isHidden ? "none" : undefined }}
                  >
                    <td className="px-4 py-3 font-medium">{f.name}</td>
                    <td className="px-4 py-3">{f.size || "-"}</td>
                    <td className="px-4 py-3">{f.category_name || "-"}</td>
                    <td className="px-4 py-3">
                      {Number((f as any)[priceType] ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleHide(f.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm"
                      >
                        {hiddenRows[f.id] ? "Hiện" : "Ẩn"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quotation;
