Day 7 Assignment: SnapShare Photo App Scaling Plan

 1. Introduction

SnapShare is a photo-sharing application that allows users to upload photos and scroll through a feed containing photos shared by people they follow.

The purpose of this scaling plan is to estimate the application's traffic and storage requirements and propose an architecture that can support millions of users.

 2. Assumptions

The following assumptions are used in this plan:

- SnapShare has 10 million registered users.
- 10% of registered users are active each day.
- Every daily active user uploads one photo per day.
- Every daily active user views 50 feed pages per day.
- Each original photo has an average size of 2 MB.
- Each original photo has one thumbnail with an average size of 50 KB.
- A day contains 86,400 seconds.
- A year contains 365 days.
- Peak feed traffic is five times the average traffic.
- All uploaded photos and their thumbnails are retained for one year.
- All feed views are treated as page requests; individual image downloads may generate additional requests.
- Storage calculations use decimal units: 1 MB = 1,000 KB and 1 TB = 1,000 GB.
- The estimates exclude database metadata, backups, replication overhead, and additional image sizes.

 3. Traffic and Storage Calculations

 3.1 Daily Active Users

Registered users = 10,000,000

Daily active users = Registered users × Daily activity rate

Daily active users = 10,000,000 × 10%

Daily active users = 1,000,000 users

Therefore, SnapShare must support approximately one million active users per day.

 3.2 Daily Photo Uploads

Each daily active user uploads one photo per day.

Daily uploads = Daily active users × Photos per user per day

Daily uploads = 1,000,000 × 1

Daily uploads = 1,000,000 photos

 3.3 Average Uploads Per Second

Average uploads per second = Daily uploads ÷ Seconds per day

Average uploads per second = 1,000,000 ÷ 86,400

Average uploads per second ≈ 11.57 photos

SnapShare should handle approximately 12 uploads per second on average.

For additional planning, if uploads also experience a five-times peak, the system should be prepared for approximately 58 uploads per second.

 3.4 Daily Feed Views

Each daily active user views 50 feed pages per day.

Daily feed views = Daily active users × Feed pages per user per day

Daily feed views = 1,000,000 × 50

Daily feed views = 50,000,000 pages

 3.5 Average Feed Views Per Second

Average feed views per second = Daily feed views ÷ Seconds per day

Average feed views per second = 50,000,000 ÷ 86,400

Average feed views per second ≈ 578.70

SnapShare should therefore support approximately 579 feed page requests per second on average.

 3.6 Peak Feed Views Per Second

Peak feed views are estimated using a multiplier of 5.

Peak feed views per second = Average feed views per second × 5

Peak feed views per second = 578.70 × 5

Peak feed views per second ≈ 2,894

The system should be designed to handle approximately 2,900 feed page requests per second during peak periods.

 3.7 Photo Storage Per Year

Each original photo requires 2 MB of storage.

Daily original photo storage = Daily uploads × Original photo size

Daily original photo storage = 1,000,000 × 2 MB

Daily original photo storage = 2,000,000 MB = 2 TB

Annual original photo storage = 2 TB × 365

Annual original photo storage = 730 TB

Each photo also has a 50 KB thumbnail.

Daily thumbnail storage = 1,000,000 × 50 KB

Daily thumbnail storage = 50,000,000 KB = 50 GB

Annual thumbnail storage = 50 GB × 365

Annual thumbnail storage = 18.25 TB

Total annual storage = Original photo storage + Thumbnail storage

Total annual storage = 730 TB + 18.25 TB

Total annual photo storage = 748.25 TB

This estimate represents the new storage required for one year of uploads, assuming photos and thumbnails are retained and not deleted.

Additional storage capacity will be required for backups, replication, metadata, and operational overhead.

 3.8 Summary of Estimates

| Metric | Estimated result |
|---|---:|
| Registered users | 10 million |
| Daily active users | 1 million |
| Daily uploads | 1 million photos |
| Average uploads per second | 11.57 |
| Estimated peak uploads per second | 57.87 |
| Daily feed views | 50 million |
| Average feed views per second | 578.70 |
| Peak feed views per second | 2,893.52 |
| Original photo storage per year | 730 TB |
| Thumbnail storage per year | 18.25 TB |
| Total photo storage per year | 748.25 TB |

 4. Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system.

Each daily active user uploads one photo but views 50 feed pages per day.

The ratio of feed page views to photo uploads is:

50 feed views : 1 photo upload

This means feed page requests occur approximately 50 times as often as photo uploads, based on the stated assumptions.

 Design implications

Because the system is read-heavy, its architecture should prioritize fast feed delivery and efficient handling of repeated requests.

The design will use:

- A Content Delivery Network (CDN) to serve cached images from locations closer to users.
- A cache to reduce repeated database queries and speed up feed generation.
- Application servers that can scale horizontally to handle increasing traffic.
- A database read replica to handle read queries without placing all the load on the primary database.
- Object storage to store original photos and thumbnails independently of the database.
- A message queue and background worker to process thumbnails without delaying the upload request.

The system must also handle writes reliably, but read performance is the main optimization priority.

 5. Why Photos Should Not Be Stored Inside the Database

Original photos and thumbnails should not be stored directly as large binary objects inside the main relational database.

Storing large photos in the database would increase database storage requirements, backup sizes, and data transfer overhead. It could also make database maintenance and scaling more expensive.

Instead, SnapShare should use object storage for original photos and thumbnails.

Object storage is designed to store large amounts of files and retrieve them using object keys or URLs.

The database should store photo metadata, such as:

- Photo ID
- User ID
- Object storage key or URL
- Caption
- Upload timestamp
- Thumbnail storage key
- Visibility settings

This separation allows the database to handle metadata and relationships efficiently while object storage handles the actual image files.

The CDN can then cache and deliver frequently requested images without requiring every image request to reach the application servers.

 6. Proposed Architecture Diagram

The following diagram shows how SnapShare components work together.

```text
                         SNAPSHARE USERS
                                |
                 +--------------+--------------+
                 |                             |
              Uploads                     Feed Requests
                 |                             |
                 +--------------+--------------+
                                |
                         +------+------+
                         |     CDN     |
                         +------+------+
                                |
                      Cacheable image requests
                                |
                     +----------+----------+
                     |                     |
                 CDN Cache Hit         CDN Cache Miss
                     |                     |
                 Return Image               |
                                           |
                                  +--------v---------+
                                  |  Load Balancer   |
                                  +--------+---------+
                                           |
                            +--------------+--------------+
                            |              |              |
                       +----v----+    +----v----+    +----v----+
                       |  App 1  |    |  App 2  |    |  App N  |
                       +----+----+    +----+----+    +----+----+
                            |              |              |
                            +--------------+--------------+
                                           |
                             +-------------+-------------+
                             |                           |
                       +-----v------+              +-----v------+
                       |    Cache   |              |   Queue    |
                       +-----+------+              +-----+------+
                             |                           |
                             |                      +----v------+
                             |                      | Thumbnail |
                             |                      |  Worker   |
                             |                      +-----+------+
                             |                            |
                             |                      +-----v------+
                             |                      |   Object   |
                             |                      |  Storage   |
                             |                      | Originals  |
                             |                      | Thumbnails |
                             |                      +------------+
                             |
                      +------v-------+
                      | Primary DB   |
                      | Photo/User   |
                      | Metadata     |
                      +------+-------+
                             |
                      Replication
                             |
                      +------v-------+
                      | Read Replica |
                      +--------------+
```

Note: The CDN serves cached images directly when possible. Requests that cannot be served from the CDN continue to the application infrastructure. The load balancer distributes application requests, while the queue and worker process thumbnail jobs asynchronously.

The primary database handles writes and coordinates replication to the read replica. Application servers use the cache and read replica for appropriate read operations.

 7. Components and the Problems They Solve

 7.1 CDN (Content Delivery Network)

The CDN caches and delivers photos and thumbnails from geographically distributed locations, reducing image download latency and the load on SnapShare's infrastructure.

 7.2 Load Balancer

The load balancer distributes incoming application requests across multiple application servers, preventing one server from becoming overloaded and improving availability.

 7.3 Application Servers

Application servers handle authentication, photo uploads, feed generation, permissions, and communication with the cache, database, queue, and object storage.

 7.4 Cache

The cache stores frequently requested feed data and other reusable information in fast-access memory, reducing repeated database queries and improving response times.

 7.5 Primary Database

The primary database stores and updates structured information such as users, photo metadata, captions, follow relationships, and permissions.

 7.6 Database Read Replica

The read replica serves suitable read queries using replicated database data, reducing read pressure on the primary database and improving the system's ability to handle feed traffic.

 7.7 Object Storage

Object storage holds original photos and generated thumbnails, allowing SnapShare to store large amounts of image data without filling the main database with image files.

 7.8 Message Queue

The message queue stores thumbnail-processing jobs until workers can process them, allowing uploads to complete without waiting for image processing.

 7.9 Thumbnail Worker

The thumbnail worker retrieves queued jobs, reads the original photo from object storage, generates a smaller thumbnail, stores the thumbnail, and updates the photo's processing status or metadata.

 8. Step-by-Step Photo Upload Flow

The upload process works as follows:

1. User selects a photo: The user selects an image and submits it through the SnapShare application.

2. Request reaches the application: The upload request reaches the load balancer, which forwards it to an available application server.

3. Authentication and validation: The application server verifies the user's identity, checks upload permissions, validates the file type and size, and applies any necessary security checks.

4. Original photo is stored: The application uploads the original photo to object storage and obtains its storage key.

5. Metadata is saved: The application saves the photo ID, user ID, storage key, caption, timestamp, and processing status in the primary database.

6. Thumbnail job is queued: The application places a thumbnail-generation job in the message queue. The job contains the information required to locate the original photo and update its metadata.

7. Upload is acknowledged: Once the original photo has been stored and the necessary metadata and job have been safely recorded, the application returns a successful upload response. The thumbnail may still be processing.

8. Worker receives the job: A background worker retrieves the thumbnail job from the queue.

9. Original photo is retrieved: The worker reads the original image from object storage.

10. Thumbnail is generated: The worker resizes and compresses the original photo to create a thumbnail of approximately 50 KB, where practical.

11. Thumbnail is stored: The worker uploads the thumbnail to object storage.

12. Metadata is updated: The worker updates the database to indicate that thumbnail processing is complete and records the thumbnail's storage key.

13. Photo becomes available in the feed: When another user requests a feed containing the photo, the application retrieves the necessary metadata and supplies the relevant image references. The CDN can cache and serve the thumbnail to reduce future response times.

 Upload reliability

The queue should support retries when thumbnail processing fails. Jobs should be idempotent so that retrying a job does not create inconsistent metadata or unnecessary duplicate results.

If processing continues to fail, the system should record the error and allow the job to be investigated or retried later.

 9. Trade-Offs

 Trade-Off 1: CDN Caching vs. Freshness and Privacy

Advantage: CDN caching reduces image delivery latency, decreases traffic reaching the application servers, and improves performance for users viewing popular photos.

Disadvantage: Cached content may become stale after an image changes or is deleted. Private photos could also be exposed if caching and authorization rules are configured incorrectly.

Decision: Use appropriate cache-control policies, cache invalidation, and authorization checks. Private images should use secure delivery mechanisms, such as short-lived signed URLs or an authenticated image-delivery service.

 Trade-Off 2: Database Read Replicas vs. Data Consistency

Advantage: Read replicas distribute read traffic and reduce the workload on the primary database.

Disadvantage: Replication can introduce delays, meaning recently uploaded photos or updated metadata might not immediately appear in replica-based queries.

Decision: Use read replicas for feed and metadata queries where slight delays are acceptable. Use the primary database for operations that require immediate confirmation of a write or stronger consistency.

 Trade-Off 3: Asynchronous Thumbnail Generation vs. Immediate Availability

Advantage: A message queue and background worker allow uploads to complete without waiting for thumbnail generation, improving responsiveness and separating image processing from request handling.

Disadvantage: Users may temporarily see a placeholder while the thumbnail is being generated, and failed jobs require retry and monitoring mechanisms.

Decision: Process thumbnails asynchronously, display a placeholder when necessary, and implement reliable job retries and failure monitoring.

 Trade-Off 4: Object Storage vs. Simpler Database Storage

Advantage: Object storage separates large image files from structured data, supports independent scaling, and works well with CDN delivery.

Disadvantage: The architecture becomes more complex because the application must manage storage keys, access permissions, metadata consistency, and potential failures across multiple services.

Decision: Use object storage for photos and the database for metadata because the expected image volume is too large to handle efficiently as ordinary database records.

 10. Conclusion

SnapShare has 10 million registered users and approximately 1 million daily active users under the stated assumptions.

The system is expected to receive about 1 million photo uploads and 50 million feed page views per day. Average feed traffic is approximately 579 requests per second, while estimated peak feed traffic is approximately 2,894 requests per second.

The application will require approximately 730 TB of original photo storage and 18.25 TB of thumbnail storage for one year of uploads, giving a total of approximately 748.25 TB before additional overhead.

Because SnapShare is read-heavy, the proposed architecture emphasizes CDN caching, application-server scaling, caching, and database read replicas. Original photos and thumbnails are stored in object storage, while a message queue and background worker handle thumbnail generation asynchronously.

This architecture provides a foundation for scaling SnapShare as the number of users, photos, and feed requests grows.