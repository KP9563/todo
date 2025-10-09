import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const FILTER_GROUPS = {
  Status: ["all", "active", "completed"],
  Tags: ["Work", "Personal", "Shopping"],
  Priority: ["high", "medium", "low"],
};

const PRIORITY_CLASSES = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

const TAG_CLASSES = {
  Work: "tag-work",
  Personal: "tag-personal",
  Shopping: "tag-shopping",
};

const App = () => {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState("medium");
  const [tag, setTag] = useState("Work");
  const [dueDate, setDueDate] = useState("");
  const reminderTimersRef = useRef({});

  // Fetch todos
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch("http://localhost:5001/todos");
        const data = await res.json();
        setTodos(data);
      } catch (err) {
        console.error("Failed to fetch todos:", err);
        toast.error("Backend not reachable 🚨");
      }
    };
    fetchTodos();
  }, []);

  // Local storage
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // Notifications
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") toast.success("Notifications enabled ✅");
      });
    }
  }, []);

  // Reminders
  useEffect(() => {
    Object.values(reminderTimersRef.current).forEach(clearTimeout);
    reminderTimersRef.current = {};

    todos.forEach((t) => {
      if (!t.dueDate || t.completed) return;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      const msUntilDue = due.getTime() - Date.now();

      if (msUntilDue > 0) {
        const id = setTimeout(() => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Task due", { body: `${t.text} • ${t.tag}` });
          }
          toast(`Due: ${t.text}`);
        }, msUntilDue);

        reminderTimersRef.current[t.id] = id;
      }
    });

    return () => {
      Object.values(reminderTimersRef.current).forEach(clearTimeout);
      reminderTimersRef.current = {};
    };
  }, [todos]);

  // Helpers
  const resetForm = () => {
    setTodo("");
    setPriority("medium");
    setTag("Work");
    setDueDate("");
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.completed) return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < Date.now();
  };

  // Add task
  const addTask = async () => {
    if (todo.trim() === "") {
      toast.error("Task cannot be empty");
      return;
    }

    const newTask = {
      text: todo.trim(),
      priority,
      tag,
      dueDate: dueDate ? new Date(dueDate).toISOString().split("T")[0] : null,
    };

    try {
      const res = await fetch("http://localhost:5001/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      const savedTask = await res.json();
      setTodos([...todos, savedTask]);
      toast.success("Task added ✅");
      resetForm();
    } catch (err) {
      console.error("Failed to save todo:", err);
      toast.error("Could not save todo 🚨");
    }
  };

  // Toggle complete
  const toggleTask = (id) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    toast.success("Task updated");
  };

  // Delete task
  const removeTask = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
    toast("🗑️ Task deleted");
  };

  // Dynamic filtering
  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // Sort by priority
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sortedTodos = [...filteredTodos].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="app-container">
      <h1>My Tasks</h1>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Input Section */}
      <div className="input-section">
        <div className="input-top">
          <input
            type="text"
            value={todo}
            placeholder="✍️ Add a new task..."
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button className="add-btn" onClick={addTask}>
            ➕ Add Task
          </button>
        </div>

        <div className="input-options">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {FILTER_GROUPS.Priority.map((p) => (
              <option key={p} value={p}>
                {p === "high" ? "🔴 High" : p === "medium" ? "🟡 Medium" : "🟢 Low"}
              </option>
            ))}
          </select>

          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            {FILTER_GROUPS.Tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Due date options */}
          <div className="due-date-options">
            <button
              type="button"
              onClick={() => setDueDate(new Date().toISOString().split("T")[0])}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setDueDate(tomorrow.toISOString().split("T")[0]);
              }}
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              title="Pick a date"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Filters */}
      <div className="filter-container">
        {Object.values(FILTER_GROUPS).flat().map((f) => (
          <button
            key={f}
            className={filter === f ? "active-filter" : ""}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <ul>
        <AnimatePresence>
          {sortedTodos.map((task) => {
            const overdue = isOverdue(task);
            const priorityClass = PRIORITY_CLASSES[task.priority];
            const tagClass = TAG_CLASSES[task.tag];

            return (
              <motion.li
                key={task.id}
                className={`task-card ${priorityClass} ${
                  task.completed ? "completed" : ""
                } ${overdue ? "overdue" : ""}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="task-left task-content">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <div>
                    <span className="task-text">{task.text}</span>
                    <div>
                      <span className={`tag ${tagClass}`}>{task.tag}</span>
                      {task.dueDate && (
                        <small className={`task-date ${overdue ? "overdue-date" : ""}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={() => removeTask(task.id)} className="delete-btn">
                  ❌
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* Footer */}
      <div className="footer">
        <p>{todos.filter((t) => !t.completed).length} tasks left</p>
      </div>
    </div>
  );
};

export default App;
