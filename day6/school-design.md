# School Database Design

## 1. Project Overview

The School Database is a relational database designed to manage students, courses, and student enrolments.

The database is named `school` and contains three tables:
- `students`
- `courses`
- `enrolments`

## 2. Database Entities

### Students

The `students` table stores student information.

| Column | Data Type | Description |
|---|---|---|
| student_id | INT | Primary key identifying each student |
| first_name | VARCHAR(50) | Student's first name |
| last_name | VARCHAR(50) | Student's last name |
| email | VARCHAR(100) | Unique student email address |

### Courses

The `courses` table stores course information.

| Column | Data Type | Description |
|---|---|---|
| course_id | INT | Primary key identifying each course |
| course_name | VARCHAR(100) | Name of the course |
| course_code | VARCHAR(20) | Unique course code |

### Enrolments

The `enrolments` table connects students to courses and stores grades.

| Column | Data Type | Description |
|---|---|---|
| enrolment_id | INT | Primary key identifying each enrolment |
| student_id | INT | Foreign key referencing students |
| course_id | INT | Foreign key referencing courses |
| grade | DECIMAL(5,2) | Student's grade for the course |

A grade may be NULL if it has not yet been assigned.

## 3. Relationships

- One student can have multiple enrolments.
- One course can have multiple enrolments.
- Each enrolment belongs to one student and one course.
- Students and courses have a many-to-many relationship, resolved through the enrolments table.

## 4. Entity Relationship Diagram

```text
+-------------------+
|     students      |
+-------------------+
| PK student_id     |
|    first_name     |
|    last_name      |
|    email          |
+-------------------+
          |
          | 1
          |
          | N
+-------------------+
|    enrolments     |
+-------------------+
| PK enrolment_id   |
| FK student_id     |
| FK course_id      |
|    grade          |
+-------------------+
          |
          | N
          |
          | 1
+-------------------+
|      courses      |
+-------------------+
| PK course_id      |
|    course_name    |
|    course_code    |
+-------------------+

PK = Primary Key
FK = Foreign Key