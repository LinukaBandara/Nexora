"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { createCustomer } from "@/lib/nexora-api";

interface CreateCustomerDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  "w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]";

export function CreateCustomerDialog({ onClose, onCreated }: CreateCustomerDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentTermDays, setPaymentTermDays] = useState("30");
  const [creditLimit, setCreditLimit] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCustomer({
        name,
        email: email || undefined,
        phone: phone || undefined,
        defaultPaymentTermDays: Number(paymentTermDays),
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create the customer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title="Add new customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Customer / Company Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex Agri Solutions"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="accounts@company.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 000 0000"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Payment Terms (days)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={paymentTermDays}
              onChange={(e) => setPaymentTermDays(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Credit Limit (optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="No limit"
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
            {submitting ? "Creating..." : "Save customer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
