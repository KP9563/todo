import React, { useState } from "react";

const App = () => {
  const [todo, setTodo] = useState("");
  const [todoList, setTodoList] = useState([]);

  const addTodo = () => {
    if (todo.trim() === "") return;
    setTodoList([...todoList, { id: Date.now(), text: todo, completed: false }]);
    setTodo(""); 
  };

  
  const toggleComplete = (id) => {
    setTodoList(
      todoList.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };
  const deleteTodo = (id) => {
    setTodoList(todoList.filter((item) => item.id !== id));
  }

  return (
    <div style={{ padding: "20px" }} className='app-container'>
      <h1>To-Do List</h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Add a new task"
          value={todo} 
          onChange={(e) => setTodo(e.target.value)} 
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul className="todo-list">
        {todoList.map((item) => (
          <li
            key={item.id}
            onClick={() => toggleComplete(item.id)}
            style={{
              cursor: "pointer",
              textDecoration: item.completed ? "line-through" : "none",
            }}
          >
            <span> {item.text}</span> <button className="delete-btn" onClick={(e)=>{
              e.stopProgramagation();
              deleteTodo(item.id);
            }}> Delete </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
