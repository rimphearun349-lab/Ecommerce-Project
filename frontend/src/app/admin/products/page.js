"use client";

import Link from "next/link";
import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { Notice, PageHeader, Table, buttonClass, cell, inputClass } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { formatPrice } from "@/lib/format";
import { validateProduct } from "@/lib/validation";
import { deleteProduct, getCategories, getErrorMessage, getFieldErrors, getProducts, saveProduct } from "@/services/api";

function FieldError({ message }) {
  return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;
}

const emptyForm = { name: "", description: "", price: "", quantity: "", image: "", categoryId: "" };

export default function AdminProductsPage() {
  const productsApi = useApi(() => getProducts());
  const categoriesApi = useApi(() => getCategories());
  const [editingId, setEditingId] = useState(null); // null = form closed, 0 = new product
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (productsApi.error) return <ErrorMessage message={productsApi.error} onRetry={productsApi.reload} />;
  if (!productsApi.data || !categoriesApi.data) return <Loading message="Loading products..." />;

  function openForm(product) {
    setError("");
    setFieldErrors({});
    setEditingId(product ? product.id : 0);
    setForm(
      product
        ? {
            name: product.name,
            description: product.description ?? "",
            price: product.price,
            quantity: product.quantity,
            image: product.image ?? "",
            categoryId: product.categoryId,
          }
        : { ...emptyForm, categoryId: categoriesApi.data[0]?.id ?? "" }
    );
  }

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    const problems = validateProduct(form);
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      await saveProduct(editingId || null, {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        categoryId: Number(form.categoryId),
      });
      setEditingId(null);
      productsApi.reload();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    }
    setBusy(false);
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setError("");
    try {
      await deleteProduct(product.id);
      productsApi.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Products">
        <button onClick={() => openForm(null)} className={buttonClass.primary}>
          + Add product
        </button>
      </PageHeader>

      <Notice message={error} />

      {editingId !== null && (
        <form onSubmit={handleSave} noValidate className="mb-6 grid gap-3 rounded-lg bg-white p-5 shadow-sm sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">{editingId ? "Edit product" : "New product"}</h2>
          <div>
            <input name="name" value={form.name} onChange={change} placeholder="Name" className={inputClass} />
            <FieldError message={fieldErrors.name} />
          </div>
          <div>
            <select name="categoryId" value={form.categoryId} onChange={change} className={inputClass}>
              {categoriesApi.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.categoryId} />
          </div>
          <div>
            <input name="price" type="number" step="0.01" value={form.price} onChange={change} placeholder="Price" className={inputClass} />
            <FieldError message={fieldErrors.price} />
          </div>
          <div>
            <input name="quantity" type="number" value={form.quantity} onChange={change} placeholder="Stock quantity" className={inputClass} />
            <FieldError message={fieldErrors.quantity} />
          </div>
          <input name="image" value={form.image} onChange={change} placeholder="Image file name (e.g. phone.jpg)" className={`${inputClass} sm:col-span-2`} />
          <textarea name="description" value={form.description} onChange={change} placeholder="Description" rows={3} className={`${inputClass} sm:col-span-2`} />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy} className={buttonClass.primary}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className={buttonClass.ghost}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <Table headers={["No.", "Name", "Category", "Price", "Stock", ""]} empty="No products yet. Add the first one.">
        {productsApi.data.map((product, index) => (
          <tr key={product.id}>
            <td className={cell} title={`Database ID: ${product.id}`}>{index + 1}</td>
            <td className={`${cell} font-medium`}>{product.name}</td>
            <td className={cell}>{product.categoryName}</td>
            <td className={cell}>{formatPrice(product.price)}</td>
            <td className={cell}>{product.quantity}</td>
            <td className={`${cell} space-x-2 text-right`}>
              <Link href={`/product/${product.id}`} target="_blank" className={`${buttonClass.ghost} inline-block`}>
                View
              </Link>
              <button onClick={() => openForm(product)} className={buttonClass.ghost}>
                Edit
              </button>
              <button onClick={() => handleDelete(product)} className={buttonClass.danger}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
