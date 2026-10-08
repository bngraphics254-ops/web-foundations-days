# Library Books REST API

The API uses `/books` as the books resource. Book representations contain an
`id`, `title`, `author`, and `publishedYear`.

| Method | Path | Description | Example request body | Success status |
|---|---|---|---|---|
| GET | `/books` | List all books. | — | `200 OK` |
| GET | `/books/{id}` | Get the book with the specified ID. | — | `200 OK` |
| POST | `/books` | Create a book. | `{"title":"The Hobbit","author":"J.R.R. Tolkien","publishedYear":1937}` | `201 Created` |
| PUT | `/books/{id}` | Replace the book with the specified ID. | `{"title":"The Hobbit","author":"J.R.R. Tolkien","publishedYear":1937}` | `200 OK` |
| DELETE | `/books/{id}` | Delete the book with the specified ID. | — | `204 No Content` |
| GET | `/books?author=J.R.R.%20Tolkien` | List books by the specified author. | — | `200 OK` |

## Error responses

- `400 Bad Request` — the request is invalid, such as creating a book without
  the required `title` or `author`.
- `404 Not Found` — the requested book ID does not exist, such as requesting
  `GET /books/999`.
