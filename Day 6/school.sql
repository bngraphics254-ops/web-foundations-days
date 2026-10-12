-- ============================================
-- DAY 6 SQL ASSIGNMENT
-- Database: school
-- ============================================

CREATE DATABASE IF NOT EXISTS school;
USE school;

-- ============================================
-- 1. CREATE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS enrolments (
    enrolment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    grade DECIMAL(5,2),

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (course_id)
        REFERENCES courses(course_id),

    UNIQUE (student_id, course_id),

    CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100))
);

-- ============================================
-- 2. SAMPLE DATA
-- ============================================

INSERT INTO students (first_name, last_name, email)
VALUES
('Brian', 'Ndanu', 'brian@example.com'),
('Alice', 'Wanjiku', 'alice@example.com'),
('David', 'Kamau', 'david@example.com'),
('Mary', 'Achieng', 'mary@example.com'),
('Peter', 'Mwangi', 'peter@example.com');

INSERT INTO courses (course_name, course_code)
VALUES
('Web Development', 'WEB101'),
('Database Systems', 'DBS102'),
('Computer Networks', 'NET103'),
('Programming Fundamentals', 'PRO104');

INSERT INTO enrolments (student_id, course_id, grade)
VALUES
(1, 1, 85.00),
(1, 2, 92.00),
(1, 3, 78.00),
(2, 1, 90.00),
(2, 2, 88.00),
(3, 1, 75.00),
(3, 3, 82.00),
(4, 2, 95.00);

-- ============================================
-- 3. QUERY 1: ALL STUDENTS
-- ============================================

SELECT *
FROM students;

-- ============================================
-- 4. QUERY 2: ALL COURSES
-- ============================================

SELECT *
FROM courses;

-- ============================================
-- 5. QUERY 3: STUDENTS, COURSES AND GRADES
-- ============================================

SELECT
    students.student_id,
    students.first_name,
    students.last_name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
ORDER BY students.student_id, courses.course_name;

-- ============================================
-- 6. QUERY 4: AVERAGE GRADE PER COURSE
-- ============================================

SELECT
    courses.course_name,
    COUNT(enrolments.enrolment_id) AS total_students,
    ROUND(AVG(enrolments.grade), 2) AS average_grade
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY
    courses.course_id,
    courses.course_name
ORDER BY courses.course_name;

-- ============================================
-- 7. QUERY 5: ALL STUDENTS INCLUDING
--    THOSE WITHOUT ENROLMENTS
-- ============================================

SELECT
    students.student_id,
    students.first_name,
    students.last_name,
    courses.course_name,
    enrolments.grade
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
LEFT JOIN courses
    ON enrolments.course_id = courses.course_id
ORDER BY students.student_id, courses.course_name;