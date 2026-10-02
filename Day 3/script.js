const notes = [
  {
    text: "Buy milk",
    category: "personal"
  },
  {
    text: "Finish JavaScript assignment",
    category: "school"
  },
  {
    text: "Call John",
    category: "personal"
  },
  {
    text: "Study arrays and objects",
    category: "school"
  }
];

// 1. Search notes
function searchNotes(notes, searchTerm) {
  return notes.filter(note =>
    note.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// 2. Find the longest note
function longestNote(notes) {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}

// 3. Count notes by category
function countByCategory(notes) {
  const counts = {};

  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

// 4. Get summary
function getSummary(notes) {
  const counts = countByCategory(notes);
  const total = notes.length;

  const noteWord = total === 1 ? "note" : "notes";

  return `There are ${total} ${noteWord}. Categories: ${JSON.stringify(counts)}`;
}

// 5. Check for duplicate
function isDuplicate(notes, text) {
  return notes.some(note =>
    note.text.trim().toLowerCase() === text.trim().toLowerCase()
  );
}

// 6. Add a note
function addNote(notes, text, category) {
  if (isDuplicate(notes, text)) {
    return false;
  }

  if (text.trim().length === 0) {
    return false;
  }

  if (category.trim().length === 0) {
    return false;
  }

  notes.push({
    text: text.trim(),
    category: category.trim()
  });

  return true;
}


// ==========================
// TESTING
// ==========================

// searchNotes
console.log(searchNotes(notes, "javascript"));
// Expected: [{ text: "Finish JavaScript assignment", category: "school" }]

console.log(searchNotes(notes, "python"));
// Expected: []

// longestNote
console.log(longestNote(notes));
// Expected: the "Finish JavaScript assignment" note

console.log(longestNote([]));
// Expected: null

// countByCategory
console.log(countByCategory(notes));
// Expected: { personal: 2, school: 2 }

console.log(countByCategory([]));
// Expected: {}

// getSummary
console.log(getSummary(notes));
// Expected: There are 4 notes. Categories: {"personal":2,"school":2}

console.log(getSummary([notes[0]]));
// Expected: There are 1 note. Categories: {"personal":1}

// isDuplicate
console.log(isDuplicate(notes, "BUY MILK"));
// Expected: true

console.log(isDuplicate(notes, "Go shopping"));
// Expected: false

// addNote
console.log(addNote(notes, "Go shopping", "personal"));
// Expected: true

console.log(addNote(notes, "  Buy Milk  ", "personal"));
// Expected: false

console.log(addNote(notes, "", "personal"));
// Expected: false

console.log(addNote(notes, "New note", ""));
// Expected: false
