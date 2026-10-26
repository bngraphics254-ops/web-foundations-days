TicketHub — System Design

1. Requirements

TicketHub is an online ticket-selling platform where users can discover events, view available seats, reserve seats, purchase tickets, and receive electronic tickets. The system must support normal daily traffic and handle sudden traffic spikes when popular concerts go on sale.

1.1 Functional Requirements

The system must:

1. Allow users to register, log in, and manage their accounts.
2. Allow users to browse, search, and view upcoming concerts and events.
3. Display event details, including dates, venues, ticket prices, and seat availability.
4. Allow users to select and temporarily reserve available seats.
5. Allow users to purchase tickets through a payment gateway.
6. Generate electronic tickets after successful payment.
7. Allow users to view their orders and purchased tickets.
8. Send booking confirmations and electronic tickets by email.
9. Allow administrators to create events, configure seating, set ticket prices, and monitor sales.
10. Prevent multiple customers from purchasing the same seat.

1.2 Non-Functional Requirements

Scalability: The system must support two million registered users and scale horizontally when traffic increases.

Performance: Event listings and event details should load quickly. The system should aim for a response time below two seconds for most ordinary requests under normal operating conditions.

Availability: The system should remain available during busy ticket-sale periods. Multiple application servers should reduce the risk of a single application server failure disrupting the entire platform.

Consistency: Seat reservations, orders, and ticket issuance must maintain data integrity. A seat must not be sold to two different customers for the same event.

Security: Passwords must be securely hashed, sensitive communication must use HTTPS, and protected endpoints must require authentication and authorization.

Reliability: The system must safely handle failed requests, payment retries, and temporary service failures without creating duplicate orders or tickets.

Maintainability: The application should use clearly separated components so that individual services can be updated and maintained more easily.

Data protection: The system must protect personal information and payment-related data and provide appropriate access controls and backups.

---

2. Traffic and Capacity Estimates

TicketHub has 2 million registered users. Under normal conditions, 50,000 people visit the website each day, and each visitor views approximately 10 pages. The system sells 5,000 tickets on a normal day.

During a popular concert sale, 200,000 people attempt to purchase tickets for 20,000 available seats within the first 10 minutes.

2.1 Normal Traffic

Registered users: 2,000,000.

Daily visitors: 50,000.

Daily page views:

50,000 × 10 = 500,000 page views per day.

Average page views per second:

500,000 ÷ 86,400 = approximately 5.8 page views per second.

This calculation assumes that page views are distributed evenly across 24 hours. Actual traffic will vary throughout the day.

Normal daily ticket sales: 5,000 tickets.

Average ticket sales per second:

5,000 ÷ 86,400 = approximately 0.058 tickets per second.

This is an average of approximately 208 tickets per hour, although actual purchases will occur in bursts.

For capacity planning, assume that each page view generates an average of three API requests.

Estimated daily API requests:

500,000 × 3 = 1,500,000 API requests per day.

Average API requests per second:

1,500,000 ÷ 86,400 = approximately 17.4 requests per second.

These figures provide a baseline for estimating application capacity. The actual number of API requests depends on the website's design and user behaviour.

2.2 Popular Concert Traffic

When a popular concert goes on sale, 200,000 people attempt to buy tickets for 20,000 available seats in the first 10 minutes.

Number of people attempting to purchase tickets: 200,000.

Duration: 10 minutes = 600 seconds.

Average arrival rate:

200,000 ÷ 600 = approximately 333 people per second.

Number of available seats: 20,000.

Demand-to-supply ratio:

200,000 ÷ 20,000 = 10 people competing for each available seat, on average.

Only 20,000 seats are available, so at most 20,000 successful seat purchases can be completed for this concert.

The average arrival rate of 333 people per second is not necessarily the actual purchase rate. Some users will browse, fail to reserve a seat, abandon checkout, or encounter payment failures.

2.3 Scaling Strategy

TicketHub will use horizontal scaling to support sudden increases in traffic.

The proposed approach includes:

1. Deploy multiple application servers behind a load balancer.
2. Cache public event details and other frequently accessed information.
3. Use a relational database for transactional booking operations.
4. Apply database indexing to frequently queried fields.
5. Use a queue for background tasks such as email delivery and ticket notifications.
6. Introduce rate limiting and a virtual waiting room during exceptionally busy sales.
7. Monitor CPU, memory, response times, database connections, error rates, and request volumes.
8. Increase application capacity before major concert sales and scale automatically where supported.

The booking database must remain the authoritative source for seat availability. Cached information must never be used as the final authority when confirming a seat reservation.

---

3. API Design

TicketHub will expose a REST API using HTTP methods and JSON request and response bodies. The API will use a consistent URL structure and appropriate HTTP status codes.

3.1 API Endpoints

| HTTP Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user. |
| POST | `/api/v1/auth/login` | Authenticate a user. |
| GET | `/api/v1/events` | Retrieve and search available events. |
| GET | `/api/v1/events/{eventId}` | Retrieve details for a particular event. |
| GET | `/api/v1/events/{eventId}/seats` | Retrieve seat availability for an event. |
| POST | `/api/v1/reservations` | Temporarily reserve available seats. |
| GET | `/api/v1/reservations/{reservationId}` | Retrieve reservation details and status. |
| DELETE | `/api/v1/reservations/{reservationId}` | Cancel a reservation when permitted. |
| POST | `/api/v1/orders` | Create an order from a valid reservation. |
| POST | `/api/v1/payments` | Initiate payment for an order. |
| GET | `/api/v1/orders/{orderId}` | Retrieve order details and payment status. |
| GET | `/api/v1/users/me/tickets` | Retrieve the authenticated user's tickets. |

3.2 Example: Retrieve Events

Request

`GET /api/v1/events`

Purpose

Returns a list of upcoming events. The API may support pagination and filtering by event date, venue, or category.

Example response

```json
{
  "events": [
    {
      "eventId": 101,
      "title": "Summer Music Festival",
      "venue": "Central Arena",
      "date": "2027-01-15",
      "status": "ON_SALE"
    }
  ],
  "page": 1,
  "totalPages": 1
}
```

Expected status: `200 OK`.

3.3 Example: Reserve a Seat

Request

`POST /api/v1/reservations`

Example request body

```json
{
  "eventId": 101,
  "seatIds": [501],
  "idempotencyKey": "reservation-request-abc123"
}
```

The authenticated user's identity is obtained from the server-side authentication context rather than trusting a user ID supplied in the request body.

Purpose

Attempts to reserve the requested seat for a limited period, such as five minutes.

Example successful response

```json
{
  "reservationId": "RES-1001",
  "eventId": 101,
  "seatIds": [501],
  "status": "HELD",
  "expiresAt": "2027-01-15T10:05:00Z"
}
```

Expected status: `201 Created`.

If the seat is already reserved or sold, the API returns `409 Conflict`.

3.4 Example: Create an Order

Request

`POST /api/v1/orders`

Example request body

```json
{
  "reservationId": "RES-1001",
  "idempotencyKey": "order-request-xyz456"
}
```

Purpose

Creates an order associated with the authenticated user and a valid reservation.

Example response

```json
{
  "orderId": "ORD-2001",
  "reservationId": "RES-1001",
  "status": "PENDING_PAYMENT",
  "totalAmount": 2500,
  "currency": "KES"
}
```

Expected status: `201 Created`.

3.5 HTTP Status Codes

The API will use standard HTTP status codes:

- `200 OK`: The request completed successfully.
- `201 Created`: A new resource, such as an order or reservation, was created.
- `400 Bad Request`: The request contains invalid input.
- `401 Unauthorized`: The request requires valid authentication.
- `403 Forbidden`: The authenticated user does not have permission to perform the action.
- `404 Not Found`: The requested resource does not exist or cannot be found.
- `409 Conflict`: The requested seat is unavailable or a booking conflict occurred.
- `429 Too Many Requests`: The client exceeded a rate limit.
- `500 Internal Server Error`: An unexpected server error occurred.
- `503 Service Unavailable`: The service cannot currently handle the request.

Payment initiation and callback processing must be idempotent. Repeating a request must not create duplicate charges, orders, or tickets.

---

4. Data Model

TicketHub will use a relational database such as PostgreSQL or MySQL to store users, events, seats, reservations, orders, payments, and tickets.

A relational database is suitable because booking operations require transactions, referential integrity, and uniqueness constraints.

4.1 Database Tables

Table 1: users

Stores registered customer accounts.

| Column | Type | Description |
|---|---|---|
| user_id | BIGINT | Primary key. |
| full_name | VARCHAR(150) | Customer's name. |
| email | VARCHAR(255) | Customer's email; unique. |
| password_hash | VARCHAR(255) | Securely hashed password. |
| created_at | TIMESTAMP | Account creation time. |

Relationship: One user can have multiple reservations and orders.

Table 2: venues

Stores event venue information.

| Column | Type | Description |
|---|---|---|
| venue_id | BIGINT | Primary key. |
| name | VARCHAR(200) | Venue name. |
| location | VARCHAR(255) | Venue location. |

Relationship: One venue can host multiple events and contains a defined seating layout.

Table 3: events

Stores concert and event information.

| Column | Type | Description |
|---|---|---|
| event_id | BIGINT | Primary key. |
| venue_id | BIGINT | Foreign key referencing venues. |
| title | VARCHAR(200) | Event title. |
| description | TEXT | Event description. |
| start_time | TIMESTAMP | Event start time. |
| status | VARCHAR(30) | Event status. |

Relationship: Each event belongs to one venue. A venue can host multiple events.

Table 4: seats

Stores the physical seating layout of each venue.

| Column | Type | Description |
|---|---|---|
| seat_id | BIGINT | Primary key. |
| venue_id | BIGINT | Foreign key referencing venues. |
| section | VARCHAR(50) | Seating section. |
| row_label | VARCHAR(20) | Row identifier. |
| seat_number | VARCHAR(20) | Seat identifier. |

Relationship: Each seat belongs to one venue. The combination of `venue_id`, `section`, `row_label`, and `seat_number` must be unique.

Table 5: reservations

Stores temporary seat reservations.

| Column | Type | Description |
|---|---|---|
| reservation_id | BIGINT | Primary key. |
| user_id | BIGINT | Foreign key referencing users. |
| event_id | BIGINT | Foreign key referencing events. |
| seat_id | BIGINT | Foreign key referencing seats. |
| status | VARCHAR(30) | HELD, CONFIRMED, EXPIRED, or CANCELLED. |
| expires_at | TIMESTAMP | Reservation expiration time. |
| created_at | TIMESTAMP | Reservation creation time. |

Relationship: A user can have multiple reservations. Each reservation references one event and one seat.

The system must validate that the seat belongs to the venue hosting the event.

Table 6: orders

Stores purchase orders.

| Column | Type | Description |
|---|---|---|
| order_id | BIGINT | Primary key. |
| user_id | BIGINT | Foreign key referencing users. |
| total_amount | DECIMAL(12,2) | Total order amount. |
| currency | CHAR(3) | Currency code, such as KES. |
| status | VARCHAR(30) | Order payment and fulfillment status. |
| created_at | TIMESTAMP | Order creation time. |

Relationship: One user can create multiple orders. An order may contain multiple tickets.

Table 7: payments

Stores payment transaction records.

| Column | Type | Description |
|---|---|---|
| payment_id | BIGINT | Primary key. |
| order_id | BIGINT | Foreign key referencing orders. |
| provider_reference | VARCHAR(255) | Payment provider reference; unique when present. |
| amount | DECIMAL(12,2) | Payment amount. |
| status | VARCHAR(30) | PENDING, SUCCESSFUL, FAILED, or REFUNDED. |
| created_at | TIMESTAMP | Payment creation time. |

Relationship: Each payment belongs to an order. An order may have multiple payment attempts, but the system must prevent duplicate successful charges.

Table 8: tickets

Stores issued electronic tickets.

| Column | Type | Description |
|---|---|---|
| ticket_id | BIGINT | Primary key. |
| order_id | BIGINT | Foreign key referencing orders. |
| event_id | BIGINT | Foreign key referencing events. |
| seat_id | BIGINT | Foreign key referencing seats. |
| ticket_code | VARCHAR(100) | Unique ticket identifier. |
| status | VARCHAR(30) | ISSUED, CANCELLED, or USED. |
| issued_at | TIMESTAMP | Ticket issuance time. |

Relationship: Each ticket belongs to an order and identifies a seat for a particular event.

4.2 Relationships Between Tables

The principal relationships are:

- `users` 1-to-many `reservations`.
- `users` 1-to-many `orders`.
- `venues` 1-to-many `events`.
- `venues` 1-to-many `seats`.
- `events` 1-to-many `reservations`.
- `seats` 1-to-many reservation history records.
- `orders` 1-to-many `payments`.
- `orders` 1-to-many `tickets`.
- `events` 1-to-many `tickets`.

The reservations table represents temporary holds and their history. The tickets table represents issued tickets.

4.3 Database Constraints and Seat Uniqueness

To prevent duplicate sales, the system must enforce the rule that a seat can have only one active reservation or confirmed ticket for a particular event.

The database design should include:

1. Primary keys for uniquely identifying records.
2. Foreign keys to maintain valid relationships.
3. Unique constraints on user email addresses and ticket codes.
4. A unique constraint on the combination of `event_id` and `seat_id` for issued tickets.
5. A database-enforced mechanism to prevent overlapping active reservations for the same event and seat.
6. Transactions and appropriate locking when reserving or confirming seats.

A partial unique index, where supported, can enforce uniqueness for active reservation records. For example, in PostgreSQL, a partial unique index could cover reservations whose status is `HELD` or `CONFIRMED`.

However, an index alone does not safely handle expiration unless expired reservations are first transitioned out of the active state. Time-dependent conditions should not simply be embedded in an index predicate. The reservation transaction must check expiration, release an expired hold safely, and then acquire the seat.

For a database-independent design, an event-seat inventory record with an atomic state transition can also be used. All booking attempts for the same event and seat must pass through that authoritative record.

---

5. System Architecture

TicketHub will use a horizontally scalable web architecture with a load balancer, application servers, a relational database, a cache, a message queue, background workers, and an external payment gateway.

5.1 Architecture Diagram

```text
                    +-----------------------+
                    |       Customers       |
                    | Web / Mobile Browser |
                    +-----------+-----------+
                                |
                                v
                    +-----------------------+
                    |     Load Balancer     |
                    | TLS / Request Routing |
                    +-----------+-----------+
                                |
                   +------------+------------+
                   |            |            |
                   v            v            v
             +-----------+ +-----------+ +-----------+
             | App Server| | App Server| | App Server|
             |     1     | |     2     | |     3     |
             +-----+-----+ +-----+-----+ +-----+-----+
                   |             |             |
                   +-------------+-------------+
                                 |
             +-------------------+-------------------+
             |                   |                   |
             v                   v                   v
      +--------------+   +---------------+   +----------------+
      | Cache        |   | Relational DB |   | Message Queue  |
      | Event Details|   | Orders / Seats|   | Background Jobs|
      +--------------+   +-------+-------+   +-------+--------+
                                 |                   |
                                 |                   v
                                 |          +----------------+
                                 |          | Background     |
                                 |          | Workers        |
                                 |          +-------+--------+
                                 |                  |
                                 |                  v
                                 |          +----------------+
                                 |          | Email / Ticket |
                                 |          | Notifications  |
                                 |          +----------------+
                                 |
                                 v
                       +--------------------+
                       | Payment Processing |
                       | Payment Gateway    |
                       +--------------------+
```

5.2 Explanation of Components

1. Customers

Customers use a web browser or mobile application to discover events, select seats, make payments, and access their tickets.

2. Load balancer

The load balancer distributes incoming requests across available application servers. It improves scalability and prevents a single application server from receiving all requests.

It can also perform health checks and stop routing requests to unhealthy application instances.

3. Application servers

Application servers implement business logic and API endpoints. They authenticate users, retrieve event information, validate reservations, create orders, and coordinate payment processing.

Multiple instances can run simultaneously. The servers should be stateless where practical, storing shared application state in appropriate databases or distributed services.

4. Relational database

The relational database stores authoritative records for users, events, seats, reservations, orders, payments, and tickets.

Transactions, row-level locking, unique constraints, and conditional updates protect booking integrity.

The database is the final authority for determining whether a seat can be reserved or sold.

5. Cache

A cache stores frequently requested public information, such as event descriptions, venue details, and event images or metadata.

It reduces repeated database queries and improves response times.

Seat availability displayed from the cache is only informational. Before creating a reservation, the application must verify and claim the seat through the authoritative booking database.

6. Message queue

The message queue stores tasks that can be processed asynchronously, including sending emails, delivering ticket notifications, and processing certain background operations.

It helps prevent slow notification services from delaying ordinary application requests.

7. Background workers

Background workers consume queued tasks and process them independently of the main application servers. They can retry temporary email-delivery failures and update task status.

Tasks that issue tickets must still respect the authoritative order and payment state.

8. Payment gateway

The payment gateway securely processes customer payments.

The application creates a payment attempt and associates it with an order. It verifies the provider's signed webhook or retrieves the payment status from the provider before treating the payment as successful.

Repeated payment notifications must be processed idempotently to prevent duplicate ticket issuance.

5.3 Preventing Two Customers from Buying the Same Seat

The most important consistency requirement is that a particular seat for a particular event can only be sold once.

TicketHub will use an atomic reservation process backed by the relational database.

Step 1: Customer selects a seat.

The application displays the seat as available based on the latest available information. This display does not guarantee that the seat is still available.

Step 2: The application attempts to reserve the seat.

The application starts a database transaction and obtains the necessary lock on the event-seat inventory record, or performs an equivalent atomic conditional update.

The reservation succeeds only if the seat is not already sold and does not have another unexpired hold.

Step 3: The database enforces uniqueness.

The database's constraints and locking rules prevent two concurrent transactions from successfully claiming the same event-seat combination.

If two customers attempt to reserve the seat simultaneously, one transaction succeeds. The other must wait, fail its condition, or receive a uniqueness conflict.

The losing request receives `409 Conflict` and must select another available seat.

Step 4: The reservation expires automatically.

A successful reservation receives an expiration time, such as five minutes.

If the customer does not complete checkout, a scheduled worker or subsequent booking transaction transitions the expired reservation out of its active state and releases the seat.

Expiration must be handled through a transaction so that an expired hold cannot race with a successful payment or another reservation.

Step 5: The customer completes payment.

The application creates an order associated with the reservation and initiates payment through the payment gateway.

The seat remains protected while payment is in progress. The system must define a clear policy for payments that complete after the reservation deadline.

Step 6: The application confirms the booking.

After independently verifying successful payment, the application starts a database transaction to confirm the reservation, mark the order as paid, and create the ticket.

The transaction verifies that the reservation is still valid and that the seat has not already been sold. It must not issue a ticket if the reservation has expired or another booking has already claimed the seat.

Step 7: The ticket is issued once.

The database enforces uniqueness for the event and seat combination in the tickets table. An idempotency key and unique payment-provider reference help prevent duplicate processing.

The application commits the booking transaction and schedules ticket delivery. If a notification fails, the ticket remains recorded and the notification can be retried.

Result: Even if many customers click the same seat at the same time, only one valid booking can claim and sell that seat.

If payment succeeds after the reservation has expired and the seat has been sold to another customer, the system must not issue a duplicate ticket. It should initiate a safe refund or another explicitly defined recovery process.

---

6. Trade-Offs

6.1 Caching Versus Data Consistency

Caching improves performance by reducing database queries for frequently accessed event information.

However, cached seat availability can become outdated when another customer reserves a seat.

TicketHub will cache public event information but use the authoritative database for reservation and purchase decisions.

Trade-off: This design improves browsing performance while retaining stronger consistency for critical booking operations.

6.2 Temporary Reservations Versus Customer Convenience

Temporary reservations prevent multiple customers from purchasing the same seat during checkout.

However, customers who reserve seats and fail to pay temporarily prevent others from selecting them.

TicketHub will use short reservation periods and safely release expired holds.

Trade-off: Short holds improve seat availability for other customers but may inconvenience users who need more time to complete payment.

6.3 Synchronous Versus Asynchronous Processing

Synchronous processing is useful for operations that require an immediate result, such as reserving a seat and creating an order.

Asynchronous processing is useful for tasks such as sending emails and delivering ticket notifications.

TicketHub will process critical booking decisions synchronously through database transactions while using a message queue for background notifications.

Trade-off: Asynchronous processing improves scalability and responsiveness, but notifications may be delayed or delivered more than once. Background workers must therefore support retries and idempotent processing.

6.4 Relational Database Versus Distributed Storage

A relational database provides transactions, foreign keys, and uniqueness constraints that support reliable ticket booking.

However, a single database can become a bottleneck when a popular concert attracts a very large number of simultaneous requests.

TicketHub will begin with a properly indexed relational database and scalable application servers. If traffic grows substantially, database replicas can serve read-heavy queries, while booking writes continue to use the authoritative database.

Further distribution or sharding may be considered when justified by measured demand.

Trade-off: A centralized transactional database simplifies consistency but can limit write throughput. Distributing booking data may improve scalability while making transactions and coordination more complex.

---

Conclusion

TicketHub is designed to support two million registered users, normal daily traffic of 50,000 visitors, and sudden surges of approximately 333 arriving customers per second during a popular concert sale.

Horizontal scaling, caching, database optimization, rate limiting, and background processing will help the system handle increased demand.

The most important design decision is to protect seat reservations and ticket issuance through atomic database operations, appropriate uniqueness constraints, expiration handling, and idempotent payment processing.

This approach allows TicketHub to scale its browsing and application layers without sacrificing the integrity of ticket purchases.
