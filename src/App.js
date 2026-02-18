import React, { useState, useEffect } from "react";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    let url = "http://127.0.0.1:8000/api/tickets/?";

    if (filterStatus) url += `status=${filterStatus}&`;
    if (search) url += `search=${search}&`;

    const res = await fetch(url);
    const data = await res.json();
    setTickets(data);
  };

  const fetchStats = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/tickets/stats/");
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filterStatus, search]);

  const handleClassify = async () => {
    if (!description) return;

    const res = await fetch("http://127.0.0.1:8000/api/tickets/classify/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    });

    const data = await res.json();

    setCategory(data.suggested_category || "");
    setPriority(data.suggested_priority || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("http://127.0.0.1:8000/api/tickets/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        priority,
        status: "open",
      }),
    });

    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("");

    fetchTickets();
    fetchStats();
  };

  const updateStatus = async (id, newStatus) => {
    await fetch(`http://127.0.0.1:8000/api/tickets/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    fetchTickets();
    fetchStats();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Ticket</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br /><br />

        <textarea
          placeholder="Description"
          value={description}
          onBlur={handleClassify}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        <br /><br />

        <button type="submit">Submit</button>
      </form>

      <hr />

      <h3>Filters</h3>
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
        <option value="">All</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>

      <br /><br />

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <hr />

      {stats && (
        <div>
          <h2>Stats Dashboard</h2>
          <p>Total Tickets: {stats.total_tickets}</p>
          <p>Open Tickets: {stats.open_tickets}</p>
          <p>Avg Tickets Per Day: {stats.avg_tickets_per_day}</p>
        </div>
      )}

      <hr />

      <h2>Tickets</h2>

      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ border: "1px solid black", padding: 10, margin: 10 }}>
          <h4>{ticket.title}</h4>
          <p>{ticket.description}</p>
          <p>Status: {ticket.status}</p>

          <button onClick={() => updateStatus(ticket.id, "in_progress")}>
            In Progress
          </button>

          <button onClick={() => updateStatus(ticket.id, "resolved")}>
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;
