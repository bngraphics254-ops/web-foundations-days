const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

// Update character and word counts
function updateCounts() {
    const text = noteText.value;

    const characters = text.length;

    const words = text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    charCount.textContent = `${characters} / 200 characters`;
    wordCount.textContent = `${words} words`;

    // Remove previous classes
    charCount.classList.remove("warning", "over");

    // Warning after 180 characters
    if (characters > 180 && characters <= 200) {
        charCount.classList.add("warning");
    }

    // Over 200 characters
    if (characters > 200) {
        charCount.classList.add("over");
    }
}

// Save draft
function saveDraft() {
    localStorage.setItem("draft", noteText.value);
}

// Clear note
function clearNote() {
    noteText.value = "";

    localStorage.removeItem("draft");

    updateCounts();
}

// Input event
noteText.addEventListener("input", function () {
    updateCounts();
    saveDraft();
});

// Clear button
clearBtn.addEventListener("click", function () {
    clearNote();
});

// Escape key
noteText.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        clearNote();
    }
});

// Theme button
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    const darkMode = document.body.classList.contains("dark");

    if (darkMode) {
        themeToggle.textContent = "Light mode";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.textContent = "Dark mode";
        localStorage.setItem("theme", "light");
    }
});

// Restore saved draft
const savedDraft = localStorage.getItem("draft");

if (savedDraft !== null) {
    noteText.value = savedDraft;
}

// Restore saved theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
} else {
    themeToggle.textContent = "Dark mode";
}

// Set initial counters
updateCounts();