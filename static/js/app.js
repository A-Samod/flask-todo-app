$(function () {
  const $list = $("#todo-list");
  const $error = $("#error");

  function showError(message) {
    if (!message) {
      $error.addClass("d-none");
      $error.text("");
      return;
    }
    $error.text(message).removeClass("d-none");
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function renderTodo(todo) {
    const checked = todo.done ? "checked" : "";
    const doneClass = todo.done ? "done" : "";

    return `
      <li class="list-group-item d-flex align-items-start justify-content-between gap-3" data-id="${todo.id}">
        <div class="d-flex gap-3 flex-grow-1">
          <input class="form-check-input mt-1" type="checkbox" ${checked} />
          <div>
            <div class="todo-title ${doneClass}">${escapeHtml(todo.title)}</div>
            <div class="todo-meta">Created: ${formatDate(todo.created_at)}</div>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm edit">Edit</button>
          <button class="btn btn-outline-danger btn-sm delete">Delete</button>
        </div>
      </li>
    `;
  }

  function escapeHtml(text) {
    return $("<div>").text(text).html();
  }

  function fetchTodos() {
    $.getJSON("/api/todos")
      .done(function (data) {
        $list.empty();
        data.forEach((todo) => $list.append(renderTodo(todo)));
        showError("");
      })
      .fail(function () {
        showError("Failed to load tasks.");
      });
  }

  function createTodo(title) {
    return $.ajax({
      url: "/api/todos",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ title }),
    });
  }

  function updateTodo(id, payload) {
    return $.ajax({
      url: `/api/todos/${id}`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(payload),
    });
  }

  function deleteTodo(id) {
    return $.ajax({
      url: `/api/todos/${id}`,
      method: "DELETE",
    });
  }

  $("#todo-form").on("submit", function (e) {
    e.preventDefault();
    const title = $("#todo-title").val().trim();
    if (!title) {
      showError("Please add a task title.");
      return;
    }

    createTodo(title)
      .done(function () {
        $("#todo-title").val("");
        fetchTodos();
      })
      .fail(function (xhr) {
        showError(xhr.responseJSON?.error || "Failed to add task.");
      });
  });

  $("#refresh").on("click", fetchTodos);

  $list.on("change", "input[type='checkbox']", function () {
    const $item = $(this).closest("li");
    const id = $item.data("id");
    const done = $(this).is(":checked");

    updateTodo(id, { done })
      .done(fetchTodos)
      .fail(function () {
        showError("Failed to update task.");
      });
  });

  $list.on("click", ".delete", function () {
    const id = $(this).closest("li").data("id");
    deleteTodo(id)
      .done(fetchTodos)
      .fail(function () {
        showError("Failed to delete task.");
      });
  });

  $list.on("click", ".edit", function () {
    const $item = $(this).closest("li");
    const id = $item.data("id");
    const current = $item.find(".todo-title").text();
    const next = prompt("Update task title:", current);

    if (next === null) return;

    updateTodo(id, { title: next })
      .done(fetchTodos)
      .fail(function (xhr) {
        showError(xhr.responseJSON?.error || "Failed to update task.");
      });
  });

  fetchTodos();
});
