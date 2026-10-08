const loadUsersButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

function createDetail(label, value) {
  const detail = document.createElement("p");
  detail.textContent = `${label}: ${value || "Not available"}`;
  return detail;
}

function renderUsers() {
  const filter = filterInput.value.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) =>
    user.name.toLocaleLowerCase().includes(filter)
  );

  usersList.replaceChildren();

  filteredUsers.forEach((user) => {
    const item = document.createElement("li");
    const name = document.createElement("h2");
    name.textContent = user.name;

    item.append(
      name,
      createDetail("Email", user.email),
      createDetail("City", user.address?.city),
      createDetail("Company", user.company?.name)
    );
    usersList.append(item);
  });

  status.textContent = `Loaded ${users.length} users. Showing ${filteredUsers.length}.`;
}

async function loadUsers() {
  loadUsersButton.disabled = true;
  status.textContent = "Loading users...";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    const loadedUsers = await response.json();
    if (!Array.isArray(loadedUsers)) {
      throw new Error("The server returned an invalid users list.");
    }

    users = loadedUsers;
    renderUsers();
  } catch (error) {
    status.textContent = `Error loading users: ${error.message}`;
  } finally {
    loadUsersButton.disabled = false;
  }
}

loadUsersButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", () => {
  if (users.length > 0) {
    renderUsers();
  }
});
