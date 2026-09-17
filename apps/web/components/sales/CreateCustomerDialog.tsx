"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { createCustomer } from "@/lib/nexora-api";

interface CreateCustomerDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  "w-full rounded-input border border-border px-3 py-2 text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "mb-1 block text-secondary font-medium text-text-secondary";

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
    <Dialog title="Add customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Payment terms (days)</label>
            <input
              type="number" min="0" step="1"
              value={paymentTermDays}
              onChange={(e) => setPaymentTermDays(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Credit limit (optional)</label>
            <input
              type="number" min="0" step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="No limit"
              className={inputClass}
            />
          </div>
        </div>

        {error && <div className="rounded-input bg-danger-bg px-3 py-2 text-secondary text-danger">{error}</div>}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create customer"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
