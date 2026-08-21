require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const app = require("../src/app");
const connectDB = require("../src/database/db");

let server;
let baseUrl;

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  return {
    status: response.status,
    body,
  };
};

test.before(async () => {
  await connectDB();

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await mongoose.disconnect();
});

test("auth flow works end to end", async () => {
  const uniqueStamp = Date.now();
  const email = `codex.test.${uniqueStamp}@example.com`;

  const register = await requestJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Test User",
      email,
      password: "Password123",
    }),
  });

  assert.equal(register.status, 201);
  assert.equal(register.body.success, true);
  assert.equal(register.body.user.email, email);

  const login = await requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123",
    }),
  });

  assert.equal(login.status, 200);
  assert.equal(login.body.success, true);
  assert.ok(login.body.token);

  const me = await requestJson("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${login.body.token}`,
    },
  });

  assert.equal(me.status, 200);
  assert.equal(me.body.success, true);
  assert.equal(me.body.user.email, email);

  const profile = await requestJson("/api/auth/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${login.body.token}`,
    },
    body: JSON.stringify({
      name: "Updated Test User",
      avatar: "https://example.com/avatar.png",
    }),
  });

  assert.equal(profile.status, 200);
  assert.equal(profile.body.success, true);
  assert.equal(profile.body.user.name, "Updated Test User");
  assert.equal(profile.body.user.avatar, "https://example.com/avatar.png");
  assert.equal(profile.body.user.email, email);
});

test("task CRUD works end to end for the logged-in user", async () => {
  const uniqueStamp = Date.now();
  const email = `codex.tasks.${uniqueStamp}@example.com`;

  await requestJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Task User",
      email,
      password: "Password123",
    }),
  });

  const login = await requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123",
    }),
  });

  const authHeaders = {
    Authorization: `Bearer ${login.body.token}`,
  };

  const create = await requestJson("/api/tasks", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Write backend tests",
      description: "Cover auth and task APIs",
      status: "todo",
      priority: "high",
    }),
  });

  assert.equal(create.status, 201);
  assert.equal(create.body.success, true);
  assert.equal(create.body.task.title, "Write backend tests");

  const list = await requestJson("/api/tasks?page=1&limit=10&sort=newest", {
    headers: authHeaders,
  });

  assert.equal(list.status, 200);
  assert.equal(list.body.success, true);
  assert.ok(list.body.count >= 1);

  const stats = await requestJson("/api/tasks/stats", {
    headers: authHeaders,
  });

  assert.equal(stats.status, 200);
  assert.equal(stats.body.success, true);
  assert.ok(stats.body.stats.total >= 1);
  assert.ok(stats.body.stats.status.todo >= 1);
  assert.ok(stats.body.stats.priority.high >= 1);

  const taskId = create.body.task._id;

  const read = await requestJson(`/api/tasks/${taskId}`, {
    headers: authHeaders,
  });

  assert.equal(read.status, 200);
  assert.equal(read.body.success, true);
  assert.equal(read.body.task.title, "Write backend tests");

  const update = await requestJson(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      status: "in-progress",
      priority: "medium",
    }),
  });

  assert.equal(update.status, 200);
  assert.equal(update.body.success, true);
  assert.equal(update.body.task.status, "in-progress");

  const remove = await requestJson(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: authHeaders,
  });

  assert.equal(remove.status, 200);
  assert.equal(remove.body.success, true);
});
