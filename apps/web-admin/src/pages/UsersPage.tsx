import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api } from "../api/client";
import { UserRow } from "../types";

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    void api<{ data: UserRow[]; total: number }>("/users").then((result) => setUsers(result.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-stone-500">All platform users across tenant workspaces.</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          <Users className="h-4 w-4 text-mint" />
          <h2 className="font-semibold">Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">{user.workspace?.name ?? "Platform"}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
