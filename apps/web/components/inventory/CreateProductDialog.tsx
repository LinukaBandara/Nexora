"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { createProduct, getCategories, getUnits, Category, Unit } from "@/lib/nexora-api";

interface CreateProductDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  "w-full rounded-input border border-border px-3 py-2 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "mb-1 block text-secondary font-medium text-text-secondary";

export function CreateProductDialog({ onClose, onCreated }: CreateProductDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupsError, setLookupsError] = useState<string | null>(null);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCategories(), getUnits()])
      .then(([cats, us]) => {
        setCategories(cats);
        setUnits(us);
        if (cats.length > 0) setCategoryId(cats[0].id);
        if (us.length > 0) setUnitId(us[0].id);
      })
      .catch((err) => setLookupsError(err instanceof ApiError ? err.message : "Unable to load categories/units."))
      .finally(() => setLookupsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createProduct({
        sku,
        name,
        categoryId,
        unitId,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        reorderLevel: Number(reorderLevel),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create the product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title="Add product" onClose={onClose}>
      {lookupsLoading ? (
        <div className="py-6 text-center text-body text-text-muted">Loading...</div>
      ) : lookupsError ? (
        <div className="py-6 text-center text-body text-danger">{lookupsError}</div>
      ) : categories.length === 0 || units.length === 0 ? (
        <div className="py-6 text-center text-body text-text-muted">
          You need at least one category and one unit before creating a product.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>SKU</label>
              <input required value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClass}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Cost price</label>
              <input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Selling price</label>
              <input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reorder level</label>
              <input type="number" min="0" step="1" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className={inputClass} />
            </div>
          </div>

          {error && <div className="rounded-input bg-danger-bg px-3 py-2 text-secondary text-danger">{error}</div>}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create product"}</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
