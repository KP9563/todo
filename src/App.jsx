import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const App = () => {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState("medium");
  const [tag, setTag] = useState("Work");
  const [dueDate, setDueDate] = useState("");
  const reminderTimersRef = useRef({});

  // Fetch todos from backend
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

  // Save todos in localStorage
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // Notification permission
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          toast.success("Notifications enabled ✅");
        } else if (perm === "denied") {
          toast("Notifications denied. Enable in browser settings.");
        }
      });
    }
  }, []);

  // Task reminders
  useEffect(() => {
    Object.values(reminderTimersRef.current).forEach((id) => clearTimeout(id));
    reminderTimersRef.current = {};

    todos.forEach((t) => {
      if (!t.dueDate || t.completed) return;

      const due = new Date(t.dueDate).getTime();
      const msUntilDue = due - Date.now();

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
      Object.values(reminderTimersRef.current).forEach((id) => clearTimeout(id));
      reminderTimersRef.current = {};
    };
  }, [todos]);

  // Add new task
  const addTask = async () => {
    if (todo.trim() === "") {
      toast.error("Task cannot be empty");
      return;
    }

    const newTask = {
      text: todo.trim(),
      priority,
      tag,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
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

      setTodo("");
      setPriority("medium");
      setTag("Work");
      setDueDate("");
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

  // Filters
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

  // Check overdue
  const isOverdue = (task) => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  return (
    <div className="app-container">
      <h1>My Tasks</h1>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Input Section */}
      <div className="input-container">
        <input
          type="text"
          value={todo}
          placeholder="What needs to be done?"
          onChange={(e) => setTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Shopping">Shopping</option>
        </select>

        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          title="Due date (optional)"
        />

        <button onClick={addTask}>Add</button>
      </div>

      {/* Filters */}
      <div className="filter-container">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("active")}>Active</button>
        <button onClick={() => setFilter("completed")}>Completed</button>
      </div>

      {/* Task List */}
      <ul>
        <AnimatePresence>
          {sortedTodos.map((task) => {
            const overdue = isOverdue(task);
            const priorityClass =
              task.priority === "high"
                ? "priority-high"
                : task.priority === "medium"
                ? "priority-medium"
                : "priority-low";

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
                  <span className="task-text">{task.text}</span>

                  <span
                    className={`tag ${
                      task.tag === "Work"
                        ? "tag-work"
                        : task.tag === "Personal"
                        ? "tag-personal"
                        : "tag-shopping"
                    }`}
                  >
                    {task.tag}
                  </span>

                  {task.dueDate && (
                    <small className={`task-date ${overdue ? "overdue-date" : ""}`}>
                      {new Date(task.dueDate).toLocaleString()}
                    </small>
                  )}
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
