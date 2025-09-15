// server/index.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// ------------------ 🔹 Firebase Setup ------------------
console.log("🟢 Starting backend initialization...");

const serviceAccountPath = path.resolve("todo-app-8a51d-firebase-adminsdk-fbsvc-3aa5637f47.json");
console.log("🔹 Resolving Firebase JSON path:", serviceAccountPath);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  console.log("✅ Firebase service account loaded successfully");
} catch (err) {
  console.error("❌ Failed to load Firebase service account:", err.message);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase initialized successfully");
} catch (err) {
  console.error("❌ Firebase init failed:", err.message);
  process.exit(1);
}

const db = admin.firestore();
const todosCollection = db.collection("todos");
console.log("✅ Firestore reference obtained");

// ------------------ 🔹 Express Setup ------------------
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
console.log("✅ Middleware configured (CORS & JSON parsing)");

// ------------------ 🔹 Routes ------------------

/**
 * Get all todos
 */
app.get("/todos", async (req, res) => {
  console.log("📥 GET /todos request received");
  try {
    const snapshot = await todosCollection.get();
    const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Returning ${todos.length} todos`);
    res.json(todos);
  } catch (err) {
    console.error("🔥 Error fetching todos:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

/**
 * Add a new todo
 */
app.post("/todos", async (req, res) => {
  console.log("📥 POST /todos request received with body:", req.body);
  try {
    const { text, priority, tag, dueDate } = req.body;

    if (!text || typeof text !== "string") {
      console.error("❌ Invalid 'text' field:", text);
      return res.status(400).json({ error: "Invalid or missing 'text'" });
    }

    const newTodo = {
      text: text.trim(),
      completed: false,
      priority: priority || "medium",
      tag: tag || "General",
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await todosCollection.add(newTodo);
    console.log("✅ Todo saved with ID:", docRef.id);

    res.status(201).json({ id: docRef.id, ...newTodo });
  } catch (err) {
    console.error("🔥 Error adding todo:", err);
    res.status(500).json({ error: "Failed to add todo" });
  }
});

// ------------------ 🔹 Start Server ------------------
app.listen(PORT, () => {
  console.log(`✅ Backend running with Firebase at http://localhost:${PORT}`);
});
