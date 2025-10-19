"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  LogOut,
  CheckCircle2,
  Circle,
  Loader,
} from "lucide-react";
import type { User, Todo } from "@/types/todo";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
      } else {
        const currentUser: User = {
          id: data.user.id,
          email: data.user.email || "",
        };
        setUser(currentUser);
        await fetchTodos(currentUser.id);
      }
      setPageLoading(false);
    };
    fetchUser();
  }, [router]);

  const fetchTodos = async (uid: string) => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", uid)
      .order("id", { ascending: false });
    if (error) console.error("Error fetching todos:", error.message);
    setTodos(data || []);
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from("todos")
      .insert({ title: newTodo, user_id: user.id });
    if (error) alert(error.message);
    setNewTodo("");
    await fetchTodos(user.id);
    setLoading(false);
  };

  const toggleComplete = async (id: number, completed: boolean) => {
    if (!user) return;
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
    fetchTodos(user.id);
  };

  const deleteTodo = async (id: number) => {
    if (!user) return;
    await supabase.from("todos").delete().eq("id", id);
    fetchTodos(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const completionPercentage =
    todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6 border-b border-slate-700/50 backdrop-blur-sm">
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          TaskFlow
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="mb-12 space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold">
            Your Tasks
            <span className="block text-2xl text-slate-400 font-normal mt-2">
              {completedCount} of {todos.length} completed
            </span>
          </h1>

          {/* Progress Bar */}
          {todos.length > 0 && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-sm text-slate-400">
                {completionPercentage}% complete
              </p>
            </div>
          )}
        </div>

        {/* Add Todo Input */}
        <div
          className="mb-8 space-y-3 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTodo()}
                placeholder="Add a new task..."
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white placeholder-slate-500"
              />
            </div>
            <button
              onClick={addTodo}
              disabled={loading || !newTodo.trim()}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Add
            </button>
          </div>
        </div>

        {/* Todos List */}
        <div
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {todos.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="text-6xl">🎉</div>
              <p className="text-xl text-slate-400">
                No tasks yet! Add one to get started.
              </p>
            </div>
          ) : (
            todos.map((todo, index) => (
              <div
                key={todo.id}
                className="group flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:translate-x-1 animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.05}s` }}
              >
                <button
                  onClick={() => toggleComplete(todo.id, todo.completed)}
                  className="flex-shrink-0 transition-all duration-300 hover:scale-110"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500 group-hover:text-blue-400" />
                  )}
                </button>

                <span
                  className={`flex-1 text-lg transition-all duration-300 ${
                    todo.completed
                      ? "line-through text-slate-500"
                      : "text-white group-hover:text-blue-300"
                  }`}
                >
                  {todo.title}
                </span>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
