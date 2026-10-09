# Distributed Email Infrastructure at Scale

> A production-oriented, Distributed Email Infrastructure at Scale with microservices-based notification platform for
> sending single, bulk, and scheduled emails using RabbitMQ, MongoDB,
> Redis, and background workers.

<img width="1360" height="537" alt="image" src="https://github.com/user-attachments/assets/d5ae7030-2a00-47d9-aad6-11e1046580d7" />



## Overview

The **Scalable Notification System** is a distributed email notification
platform designed to demonstrate real-world backend and system-design
concepts.

Users can:

-   Send a single email
-   Send bulk emails
-   Upload a recipient list
-   Schedule emails for a future time
-   Track campaign and notification status
-   Monitor failures and retries

The system uses **RabbitMQ** for asynchronous processing, a
**Transactional Outbox Pattern** for reliable event publishing,
**Redis** for rate limiting, and a dedicated **Worker Service** for
email delivery.

The project also includes **Docker, CI/CD, Prometheus, and Grafana** for
deployment and observability.

------------------------------------------------------------------------


### Supporting infrastructure

``` text
Redis
 ├── API sliding-window rate limiting
 └── Email sending rate limiting

Prometheus
 └── Metrics

Grafana
 └── Monitoring dashboards

Docker
 └── Containerization

GitHub Actions
 └── CI/CD
```

------------------------------------------------------------------------

# Microservices

## 1. API Gateway

The API Gateway is the entry point for client requests.

### Responsibilities

-   Route requests to the correct microservice
-   Validate authentication where required
-   API rate limiting
-   Request logging
-   Basic request validation
-   Centralized error handling

### API Rate Limiting

Redis is used to implement a **Sliding Window Rate Limiter**.

Example:

``` text
User
  │
  ▼
API Gateway
  │
  ▼
Redis Sliding Window
  │
  ├── Within limit → Allow
  │
  └── Limit exceeded → HTTP 429
```

This protects the backend services from excessive API requests.

------------------------------------------------------------------------

# 2. Auth Service

The Auth Service manages authentication and user information.

### Responsibilities

-   User registration
-   Login
-   Password hashing
-   JWT authentication
-   Refresh tokens
-   User information
-   Authentication-related operations

### Auth Database

MongoDB database dedicated to the Auth Service.

``` text
Auth DB
│
├── users
│
└── refresh_tokens
```

### `users`

Example:

``` json
{
  "_id": "user_123",
  "name": "User Name",
  "email": "user@example.com",
  "passwordHash": "...",
  "role": "USER",
  "createdAt": "..."
}
```

### `refresh_tokens`

Example:

``` json
{
  "_id": "token_123",
  "userId": "user_123",
  "tokenHash": "...",
  "expiresAt": "..."
}
```

------------------------------------------------------------------------

# 3. Notification Service

The Notification Service manages the creation and scheduling of
notifications.

### Supported operations

-   Send a single email
-   Send bulk emails
-   Upload recipient lists
-   Schedule emails
-   Create campaigns
-   Track notification status
-   Manage notification data
-   Create Outbox Events

The Notification Service **does not directly send the email**.

Instead:

``` text
Notification Service
       │
       ▼
Notification DB
       │
       ▼
Outbox Publisher
       │
       ▼
RabbitMQ
       │
       ▼
Worker Service
       │
       ▼
Email Provider
```

------------------------------------------------------------------------

# Notification Database

The Notification Service has its own MongoDB database.

``` text
Notification DB
│
├── campaigns
├── notifications
├── outbox_events
├── idempotency_records
└── failures
```

## `campaigns`

A campaign represents a bulk/scheduled email operation.

Example:

``` json
{
  "_id": "campaign_001",
  "userId": "user_123",
  "total": 100,
  "scheduledAt": "2026-10-10T10:00:00",
  "status": "SCHEDULED"
}
```

Possible statuses:

``` text
SCHEDULED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

------------------------------------------------------------------------

## `notifications`

Each individual recipient/email is represented as a notification.

Example:

``` json
{
  "_id": "notification_001",
  "campaignId": "campaign_001",
  "to": "recipient@example.com",
  "from": "sender@example.com",
  "subject": "Interview Invitation",
  "body": "Hello, ...",
  "scheduledAt": "2026-10-10T10:00:00",
  "status": "SCHEDULED"
}
```

Possible statuses:

``` text
SCHEDULED
PENDING
QUEUED
PROCESSING
SUCCESS
FAILED
```

For a campaign containing 100 recipients:

``` text
Campaign C001
│
├── Notification N001
├── Notification N002
├── Notification N003
├── ...
└── Notification N100
```

------------------------------------------------------------------------

# Transactional Outbox Pattern

The system uses the **Transactional Outbox Pattern** to reliably publish
events to RabbitMQ.

## Why Outbox?

Without an Outbox:

``` text
Save notification to MongoDB
        ↓
Publish message to RabbitMQ
        ↓
RabbitMQ fails
```

The database contains the notification, but RabbitMQ never receives the
event.

This can result in lost work.

With the Outbox Pattern:

``` text
MongoDB Transaction
│
├── Save Notification
│
└── Save Outbox Event
```

Both records are saved together.

------------------------------------------------------------------------

# `outbox_events`

The Outbox Events collection stores events that need to be published.

Example:

``` json
{
  "_id": "event_001",
  "notificationId": "notification_001",
  "campaignId": "campaign_001",
  "status": "PENDING",
  "createdAt": "..."
}
```

Possible statuses:

``` text
PENDING
PUBLISHED
```

------------------------------------------------------------------------

# Outbox Publisher

The Outbox Publisher is a separate background process/container
responsible for publishing pending Outbox Events to RabbitMQ.

It checks approximately every **5 seconds**.

The publisher finds events that are ready to be sent based on the
notification schedule.

Example:

``` text
Every 5 seconds
       │
       ▼
Query Notification DB
       │
       ▼
Find scheduled notifications
whose scheduled time is within
the configured 1-minute window
       │
       ▼
Create/Publish corresponding events
       │
       ▼
RabbitMQ
```

The RabbitMQ message is intentionally small.

Instead of sending the entire email body:

``` json
{
  "eventId": "event_001",
  "notificationId": "notification_001"
}
```

The Worker uses the `notificationId` to identify the notification and
obtain the required information.

------------------------------------------------------------------------

# RabbitMQ

RabbitMQ is used as the asynchronous messaging system between the
Notification Service/Outbox Publisher and Worker Service.

### Basic flow

``` text
Outbox Publisher
       │
       ▼
RabbitMQ
       │
       ▼
Worker Service
```

RabbitMQ allows the system to process large numbers of emails
asynchronously without blocking API requests.

------------------------------------------------------------------------

#  4. Worker Service

The Worker Service is responsible for actual email delivery.

### Responsibilities

-   Consume RabbitMQ messages
-   Idempotency checks
-   Email sending
-   Email rate limiting
-   Retry failed emails
-   Update notification status
-   Handle failures
-   Send permanently failed messages to DLQ

------------------------------------------------------------------------

# Idempotency

The Worker uses an event ID to prevent duplicate processing.

Example:

``` text
RabbitMQ Message

{
  "eventId": "event_001",
  "notificationId": "notification_001"
}
```

The Worker checks the `idempotency_records` collection before
processing.

``` text
Receive event
     │
     ▼
Check eventId
     │
     ├── Already processed
     │       ↓
     │      Skip
     │
     └── Not processed
             ↓
         Process email
             ↓
        Update status
```

### Why is this required?

Consider:

``` text
Worker receives event
       ↓
Email is successfully sent
       ↓
Worker crashes before completing its database update
       ↓
RabbitMQ redelivers the message
```

Without idempotency, the email could be sent again.

The Worker therefore checks the notification state/idempotency record
before processing duplicate deliveries.

### Important design principle

The system uses:

``` text
At-least-once message processing
+
Idempotent consumer
```

Because the external email provider is not part of the MongoDB/RabbitMQ
transaction, the system does not claim absolute exactly-once email
delivery.

------------------------------------------------------------------------

# Email Sending Rate Limiting

The Worker Service has a separate rate limiter from the API Gateway.

Configured sending limit:

``` text
30 emails / 10 seconds
```

This controls the rate at which the system sends emails to the external
email provider.

Example:

``` text
RabbitMQ
   │
   ▼
Workers
   │
   ▼
Email Rate Limiter
   │
   ├── Allowed → Send
   │
   └── Limit reached → Wait / Retry
```

Redis can be used to maintain this distributed sending limit.

------------------------------------------------------------------------

#  Retry Mechanism

Temporary email failures are retried.

Example:

``` text
Attempt 1
   ↓
FAIL
   ↓
Retry

Attempt 2
   ↓
FAIL
   ↓
Retry

Attempt 3
   ↓
FAIL
   ↓
Retry

Attempt 4
   ↓
FAIL
   ↓
Retry

Attempt 5
   ↓
FAIL
   ↓
DLQ
```

The maximum retry count is:

``` text
5 attempts
```

Typical retryable errors can include:

-   Temporary network failure
-   Email provider timeout
-   Provider 5xx response
-   Temporary provider unavailability

Permanent errors such as invalid recipient data can be handled as
failures without repeatedly retrying them.

------------------------------------------------------------------------

#  Dead Letter Queue (DLQ)

Messages that cannot be successfully processed after the configured
retry attempts are moved to the Dead Letter Queue.

``` text
Worker
  │
  ▼
Email fails
  │
  ▼
Retry
  │
  ▼
5 attempts exhausted
  │
  ▼
DLQ
```

The DLQ prevents permanently failing messages from continuously blocking
the main queue.

------------------------------------------------------------------------

# DLQ Monitoring

The Notification Service checks the DLQ approximately every **30
seconds**.

``` text
Every 30 seconds
       │
       ▼
Check DLQ
       │
       ▼
Failed messages?
       │
       ▼
Update failure/status information
       │
       ▼
Failures collection / Notification DB
```

This allows the dashboard to display failed notifications and their
status.

------------------------------------------------------------------------

#  Failures Collection

The `failures` collection keeps information about notifications that
ultimately failed.

Example:

``` json
{
  "_id": "failure_001",
  "notificationId": "notification_001",
  "campaignId": "campaign_001",
  "reason": "Email provider unavailable",
  "attempts": 5,
  "status": "FAILED",
  "createdAt": "..."
}
```

This can later be used by the dashboard for failure analysis.

------------------------------------------------------------------------

# Scheduled Email Flow

Example:

> A user uploads 100 email recipients and schedules them for tomorrow at
> 10:00 AM.

### Step 1 --- User uploads recipient list

``` text
React Dashboard
      ↓
API Gateway
      ↓
Notification Service
```

### Step 2 --- Notification Service stores data

``` text
Campaign
   ↓
100 Notifications
   ↓
Notification DB
```

Initially:

``` text
status = SCHEDULED
```

### Step 3 --- Scheduled time approaches

The Outbox Publisher checks the database every 5 seconds.

When the notification is within the configured scheduling window:

``` text
SCHEDULED
    ↓
Ready for publishing
    ↓
RabbitMQ
```

### Step 4 --- RabbitMQ

Messages contain:

``` json
{
  "eventId": "event_001",
  "notificationId": "notification_001"
}
```

### Step 5 --- Worker

``` text
RabbitMQ
    ↓
Worker
    ↓
Idempotency Check
    ↓
Rate Limit Check
    ↓
Send Email
    ↓
Update Notification Status
```

### Step 6 --- Result

Successful:

``` text
notification.status = SUCCESS
```

Failed:

``` text
Retry
   ↓
Maximum 5 attempts
   ↓
DLQ
   ↓
Failure record
```

------------------------------------------------------------------------

# Campaign Tracking

The dashboard can display campaign-level information such as:

``` text
Campaign: Interview Invitations

Total       : 100
Successful  : 82
Processing  : 10
Failed      : 5
Pending     : 3
```

Example progress:

``` text
████████████████░░░░ 82%
```

------------------------------------------------------------------------

# Observability

The project uses **Prometheus and Grafana** for monitoring.

## Prometheus

Prometheus collects application and infrastructure metrics.

Potential metrics include:

``` text
API request count
API request latency
API rate-limit violations

Emails sent
Emails failed
Emails retried

RabbitMQ queue depth
RabbitMQ processing rate

Worker processing time
Worker failures

DLQ message count
Email rate-limit violations
```

## Grafana

Grafana displays dashboards using Prometheus metrics.

Example dashboard:

``` text
┌──────────────────────────────────────┐
│       Notification System            │
├───────────────┬──────────────────────┤
│ Emails Sent   │ 12,420               │
│ Failed        │ 182                  │
│ Retries       │ 421                  │
│ DLQ           │ 12                   │
├───────────────┴──────────────────────┤
│ Email Throughput                     │
│               📈                     │
├──────────────────────────────────────┤
│ Queue Depth                          │
│               📈                     │
└──────────────────────────────────────┘
```

------------------------------------------------------------------------

# Docker

All major components are containerized.

Expected local infrastructure:

``` text
Docker
│
├── API Gateway
├── Auth Service
├── Notification Service
├── Outbox Publisher
├── Worker Service
│
├── Auth MongoDB
├── Notification MongoDB
├── RabbitMQ
├── Redis
│
├── Prometheus
└── Grafana
```

Docker Compose can be used to run the complete system locally.

------------------------------------------------------------------------

# CI/CD Pipeline

GitHub Actions is used for the CI/CD pipeline.

Expected pipeline:

``` text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub Actions
    │
    ├── Install dependencies
    ├── Lint
    ├── Run tests
    ├── Build services
    ├── Build Docker images
    └── Push images
             │
             ▼
          Registry
```

Deployment can then use the generated Docker images.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   React.js
-   JavaScript
-   HTML
-   CSS
-   Dashboard UI

## Backend

-   Node.js
-   Express.js
-   REST APIs

## Microservices

-   API Gateway
-   Auth Service
-   Notification Service
-   Outbox Publisher
-   Worker Service

## Database

-   MongoDB

## Messaging

-   RabbitMQ

## Caching / Rate Limiting

-   Redis
-   Sliding Window Rate Limiting

## Email

-   External Email Provider

## Observability

-   Prometheus
-   Grafana

## DevOps

-   Docker
-   Docker Compose
-   GitHub Actions
-   CI/CD

------------------------------------------------------------------------

# Complete End-to-End Flow

``` text
1. User logs in
       ↓
2. Auth Service validates user
       ↓
3. User opens Notification Dashboard
       ↓
4. User uploads email list
       ↓
5. User provides:
       - From
       - Subject
       - Body
       - Recipients
       - Schedule
       ↓
6. Notification Service creates Campaign
       ↓
7. Notification Service creates Notifications
       ↓
8. Data is stored in Notification DB
       ↓
9. Outbox Events are stored
       ↓
10. Outbox Publisher checks every 5 seconds
       ↓
11. Scheduled notifications become ready
       ↓
12. Event is published to RabbitMQ
       ↓
13. Worker consumes event
       ↓
14. Worker checks idempotency/status
       ↓
15. Worker applies email rate limit
       ↓
16. Worker sends email
       ↓
17. Success → update notification
       ↓
18. Failure → retry
       ↓
19. After 5 failed attempts → DLQ
       ↓
20. DLQ is checked every 30 seconds
       ↓
21. Failure information is stored
       ↓
22. Dashboard displays final status
       ↓
23. Prometheus collects metrics
       ↓
24. Grafana displays system health
```

------------------------------------------------------------------------

# Key System Design Concepts Demonstrated

This project demonstrates:

-   Microservices Architecture
-   API Gateway Pattern
-   Asynchronous Processing
-   Message Queues
-   RabbitMQ
-   Transactional Outbox Pattern
-   Idempotent Consumers
-   At-Least-Once Message Processing
-   Retry Mechanisms
-   Dead Letter Queues
-   API Rate Limiting
-   Sliding Window Rate Limiting
-   Distributed Email Rate Limiting
-   Scheduled Jobs
-   Bulk Processing
-   MongoDB
-   Redis
-   Docker
-   CI/CD
-   Prometheus
-   Grafana
-   Failure Handling
-   Horizontal Worker Scaling

------------------------------------------------------------------------

# Future Improvements

Potential future enhancements:

-   Multiple email providers
-   Email provider fallback
-   Priority queues
-   Campaign pause/resume
-   Campaign cancellation
-   Tenant-level quotas
-   Advanced analytics
-   Worker auto-scaling
-   Circuit breaker
-   Notification templates
-   Email delivery webhooks
-   Kubernetes deployment

------------------------------------------------------------------------

# Important Design Decisions

### Why RabbitMQ?

To decouple email creation from email delivery and allow asynchronous
processing.

### Why Transactional Outbox?

To prevent events from being lost when the Notification DB succeeds but
RabbitMQ publishing fails.

### Why Redis?

To implement fast distributed rate limiting.

### Why Worker Service?

To process email delivery independently and allow horizontal scaling.

### Why Idempotency?

Because RabbitMQ can redeliver messages, and the worker must safely
handle duplicate events.

### Why DLQ?

To isolate messages that repeatedly fail instead of endlessly retrying
them.

### Why Prometheus + Grafana?

To monitor throughput, latency, failures, retries, queue depth, and
system health.

------------------------------------------------------------------------

# Project Goal

The primary goal of this project is to build a **reliable, scalable,
asynchronous notification platform** while demonstrating practical
distributed-system concepts used in production backend systems.

The system is designed around:

``` text
Reliability
     +
Scalability
     +
Asynchronous Processing
     +
Failure Handling
     +
Observability
```

------------------------------------------------------------------------

# Author

**Balu Eswar**

B.Tech CSE --- SRM University AP

------------------------------------------------------------------------

## Project Highlights

``` text
3 Core Microservices
        +
Outbox Publisher
        +
RabbitMQ
        +
MongoDB
        +
Redis
        +
Worker-based Processing
        +
Retries + DLQ
        +
Idempotency
        +
Rate Limiting
        +
Docker
        +
CI/CD
        +
Prometheus + Grafana
```

> Built as a practical system-design and backend engineering project
> focused on reliable asynchronous notification delivery.
