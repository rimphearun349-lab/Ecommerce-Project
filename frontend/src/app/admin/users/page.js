"use client";

import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { PageHeader, Table, cell } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { formatDate } from "@/lib/format";
import { getUsers } from "@/services/api";

export default function AdminUsersPage() {
  const { data, error, reload } = useApi(() => getUsers());

  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!data) return <Loading message="Loading users..." />;

  return (
    <div>
      <PageHeader title={`Users (${data.length})`} />
      <Table headers={["No.", "Username", "Email", "Role", "Joined"]} empty="No users yet.">
        {data.map((user, index) => (
          <tr key={user.id}>
            <td className={cell} title={`Database ID: ${user.id}`}>{index + 1}</td>
            <td className={`${cell} font-medium`}>{user.username}</td>
            <td className={cell}>{user.email}</td>
            <td className={cell}>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.role}
              </span>
            </td>
            <td className={cell}>{user.createdAt ? formatDate(user.createdAt) : "-"}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
