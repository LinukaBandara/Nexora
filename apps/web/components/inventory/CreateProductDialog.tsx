"use client";

import React, { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { createProduct, getCategories, getUnits, Category, Unit } from "@/lib/nexora-api";

interface CreateProductDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  "w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]";

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
  const [reorderLevel, setReorderLevel] = useState("10");

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
    <Dialog title="Add product to catalog" onClose={onClose}>
      {lookupsLoading ? (
        <div className="py-8 text-center text-xs text-[#7A8E82]">Loading category and unit data...</div>
      ) : lookupsError ? (
        <div className="py-6 text-center text-xs text-[#C84A4A]">{lookupsError}</div>
      ) : categories.length === 0 || units.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#7A8E82]">
          You need at least one category and unit before creating products.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>SKU / Item Code *</label>
              <input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. NX-100"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Drip Irrigation Valve"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit of Measurement *</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className={inputClass}
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Cost Price (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Selling Price (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Reorder Level</label>
              <input
                type="number"
                min="0"
                step="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[#F5C2C2] bg-[#FDF5F5] p-3 text-xs font-medium text-[#C84A4A]">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#123B2A] text-xs font-semibold text-white hover:bg-[#184F38]"
            >
              {submitting ? "Saving..." : "Create product"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
