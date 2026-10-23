"use client";

import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { Notice, PageHeader, Table, buttonClass, cell, inputClass } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { deleteCategory, getCategories, getErrorMessage, saveCategory } from "@/services/api";

export default function AdminCategoriesPage() {
  const { data, error: loadError, reload } = useApi(() => getCategories());
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  if (loadError) return <ErrorMessage message={loadError} onRetry={reload} />;
  if (!data) return <Loading message="Loading categories..." />;

  async function run(action) {
    setError("");
    try {
      await action();
      setName("");
      setEditingId(null);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    run(() => saveCategory(editingId, name.trim()));
  };

  const handleDelete = (category) => {
    if (window.confirm(`Delete "${category.name}"?`)) run(() => deleteCategory(category.id));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  return (
    <div>
      <PageHeader title="Categories" />
      <Notice message={error} />

      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={editingId ? "New name" : "New category name"}
          required
          maxLength={100}
          className={`${inputClass} max-w-xs`}
        />
        <button type="submit" className={buttonClass.primary}>
          {editingId ? "Rename" : "+ Add"}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit} className={buttonClass.ghost}>
            Cancel
          </button>
        )}
      </form>

      <Table headers={["No.", "Name", ""]} empty="No categories yet.">
        {data.map((category, index) => (
          <tr key={category.id}>
            <td className={cell} title={`Database ID: ${category.id}`}>{index + 1}</td>
            <td className={`${cell} font-medium`}>{category.name}</td>
            <td className={`${cell} space-x-2 text-right`}>
              <button
                onClick={() => {
                  setEditingId(category.id);
                  setName(category.name);
                }}
                className={buttonClass.ghost}
              >
                Edit
              </button>
              <button onClick={() => handleDelete(category)} className={buttonClass.danger}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
