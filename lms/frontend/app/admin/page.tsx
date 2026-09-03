"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";

interface Teacher {
  id: string; // Using string to match database UUID schema
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Fetch pending teacher registration requests from backend
  const fetchPendingTeachers = async () => {
    try {
      setLoading(true);
      setError("");
      // Fixed: Stripped leading /api prefix to rely on lib/api baseURL
      const res = await api.get("/admin/pending-teachers");
      setPendingTeachers(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load pending teachers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  // Approve teacher request and refresh list
  const handleApprove = async (id: string) => {
    try {
      setMessage("");
      setError("");
      // Fixed: Removed double /api path
      await api.post(`/admin/approve-teacher/${id}`);
      setMessage("Teacher approved successfully!");
      fetchPendingTeachers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to approve teacher.");
    }
  };

  // Reject teacher request and refresh list
  const handleReject = async (id: string) => {
    try {
      setMessage("");
      setError("");
      // Fixed: Removed double /api path
      await api.delete(`/admin/reject-teacher/${id}`);
      setMessage("Teacher request rejected.");
      fetchPendingTeachers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to reject teacher.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto mt-12 p-8 card">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          Admin Dashboard - Pending Teacher Approvals
        </h1>

        {/* Status Feedback Messages */}
        {message && <p className="mb-4 text-sm text-green-600 font-medium">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-600 font-medium">{error}</p>}

        {loading ? (
          <p className="text-slate-500">Loading pending requests...</p>
        ) : pendingTeachers.length === 0 ? (
          <p className="text-slate-500">No pending teacher account requests.</p>
        ) : (
          <div className="space-y-4">
            {pendingTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow transition"
              >
                <div>
                  <p className="font-semibold text-slate-900">{teacher.name || "Teacher Account"}</p>
                  <p className="text-sm text-slate-600">{teacher.email}</p>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => handleApprove(teacher.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(teacher.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}