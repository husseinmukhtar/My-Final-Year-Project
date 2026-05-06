# Orphanage Management System

## Project Documentation Artifact

### Student Project Documentation Starter

**Project Title:** Orphanage Management System  
**Project Type:** Web-based information management system  
**Prepared For:** Supervisor review  
**Prepared On:** April 12, 2026  

## 1. Introduction

The Orphanage Management System is a web-based application designed to improve the administration of orphanage operations. The system provides a centralized platform for managing child records, staff records, donation records, adoption requests, reporting, and administrator authentication.

This project addresses the limitations of manual record keeping and fragmented workflows by digitizing core orphanage processes. It combines a legacy PHP-based interface with a newer Node.js and Express backend that follows an MVC structure. This makes the project both a working management system and a migration effort from a traditional PHP application to a more modern web architecture.

## 2. Problem Statement

Many orphanage homes and care centers still rely on paper files or disconnected spreadsheets for storing information about children, donations, staff, and adoption requests. This approach creates several challenges:

- difficulty retrieving records quickly
- risk of data loss or duplication
- weak visibility into donation activity
- limited reporting support for management decisions
- inefficient tracking of adoption requests and child welfare records

The proposed system solves these problems by offering a structured digital platform for storing, updating, searching, and reporting orphanage data.

## 3. Aim and Objectives

### Aim

To develop a secure and efficient orphanage management system that improves record management, donation tracking, reporting, and administrative operations.

### Objectives

- To create a centralized database for children, staff, donations, and adoption requests.
- To provide secure login access for authorized administrators.
- To support CRUD operations for major orphanage records.
- To enable donation tracking for both cash and item-based donations.
- To generate management reports and CSV exports for analysis.
- To improve operational efficiency through a modern web interface.

## 4. Scope of the System

The current project scope covers the following functional areas:

- administrator login and session management
- child record management
- staff record management
- donation management
- adoption request management
- dashboard statistics and summaries
- report generation and CSV export
- public-facing donation submission pages

The current implementation is mainly designed for orphanage administrators and internal staff. It does not yet include advanced roles such as sponsors, social workers, or external adoption officers with separate dashboards.

## 5. Existing System and Motivation for Improvement

Traditional orphanage administration often depends on manual books, files, and spreadsheets. These methods are slow, error-prone, and difficult to scale. In contrast, the proposed system provides:

- faster access to records
- easier updating and searching of data
- improved data consistency
- better visibility into donations and adoptions
- quicker preparation of management reports

## 6. Methodology and Development Approach

The project follows a practical iterative development approach. The implementation shows evidence of gradual migration from legacy PHP pages into a more modular Node.js MVC backend. This approach allows the system to remain usable while modern features are being introduced.

### Development approach used

- legacy PHP frontend pages for public access and some administration
- modern Node.js backend for modularized business logic
- MVC pattern in the Node backend
- MySQL database for persistent storage
- session-based authentication for protected modules

## 7. System Architecture

The system uses a hybrid architecture with two main parts:

### Legacy Layer

- PHP public pages such as `index.php`, `about.php`, `contact.php`, `donate.php`, `login.php`, and `register.php`
- PHP admin pages in the `admin/` folder
- PHP API endpoints in the `api/` folder
- shared PHP database connection in `includes/db.php`

### Modern Layer

- Node.js and Express application in `node_backend/`
- MVC organization using `controllers/`, `models/`, `routes/`, `views/`, and `middleware/`
- EJS templating for dynamic server-rendered views
- MySQL connection pooling through `mysql2/promise`
- Express session middleware for authentication state

### High-Level Flow

1. A user or administrator accesses the system through a browser.
2. Public requests are handled by PHP pages or Node public routes.
3. Protected admin requests pass through authentication checks.
4. Controllers process requests and call models.
5. Models interact with the MySQL database.
6. Results are rendered to EJS views or returned as downloadable CSV reports.

## 8. Technologies Used

- **Frontend:** HTML, CSS, JavaScript, EJS
- **Backend:** PHP, Node.js, Express.js
- **Database:** MySQL
- **Authentication:** bcryptjs and express-session
- **Server Environment:** XAMPP for Apache, PHP, and MySQL
- **Development Style:** Hybrid legacy-to-modern migration

## 9. Database and Data Management

Both the PHP layer and the Node backend connect to the same MySQL database named `orphanage_management_system`. This supports continuity between the old and new parts of the application.

### Main data areas visible from the codebase

- users
- children
- staff
- donations
- adoption requests
- reporting aggregates

The project includes migration helper files such as `db_migrate.php`, `node_backend/db_migrate.js`, and `node_backend/migrate_payment_system.js`, which indicate ongoing schema evolution.

## 10. Implemented Modules

### 10.1 Authentication Module

The system includes login and logout functionality for administrators. The Node backend uses bcrypt-based password verification and session storage. Access to major modules is restricted through middleware.

### 10.2 Children Management Module

This module supports:

- viewing child records
- searching and filtering children
- adding new children
- editing child information
- deleting child records
- viewing dashboard summaries and recent child records

### 10.3 Staff Management Module

This module supports:

- staff registration
- viewing and searching staff records
- editing staff details
- deleting staff records
- duplicate email validation

### 10.4 Donation Management Module

This module supports:

- recording cash donations
- recording item donations
- capturing donor details
- validating payment method, amount, and item descriptions
- updating and deleting donation records
- public donation submission

### 10.5 Adoption Management Module

This module supports:

- recording adoption requests
- editing adoption request data
- tracking adoption status
- deleting adoption request records

### 10.6 Reporting Module

This module supports:

- dashboard statistics
- monthly donation summaries
- children grouped by status
- recent adoption request summaries
- CSV export for donations
- CSV export for children
- CSV export for adoptions

## 11. Functional Requirements

The system should be able to:

- authenticate administrators before granting access to protected modules
- add, edit, search, and delete child records
- add, edit, search, and delete staff records
- add, edit, search, and delete donation records
- accept public donation submissions
- add, edit, search, and delete adoption requests
- generate summaries and reports
- export selected data to CSV format

## 12. Non-Functional Requirements

- usability through a web-based interface
- maintainability through modular MVC structure in the Node backend
- data consistency through validation rules
- security through password hashing and session control
- scalability through gradual migration to a modern backend
- accessibility through browser-based deployment on a local server

## 13. Current Strengths of the Project

- clear real-world use case
- multiple major modules already implemented
- practical migration from legacy PHP to modern Node.js
- working CRUD flows across core orphanage operations
- report export capability for management use
- support for both internal administration and public donation interaction

## 14. Current Limitations and Risks

The review of the current codebase suggests a few limitations that can be discussed during supervision:

- the system is split across PHP and Node.js, so deployment and maintenance are more complex than a single-stack application
- the Node login controller still contains verbose debug logging that should be removed before production use
- no automated test suite is currently visible in the project
- there is no formal API documentation yet
- role-based authorization appears basic and can be improved further
- deployment and configuration documentation is still minimal

## 15. Recommended Next Steps

- unify more features under the Node MVC backend
- document the database schema formally
- prepare use case diagrams, flowcharts, and ER diagrams
- remove temporary debug statements from authentication logic
- introduce automated testing for critical modules
- strengthen validation and authorization rules
- prepare screenshots for the final report
- produce a proper user manual and administrator manual

## 16. Suggested Documentation Chapters for Final Report

This artifact can be expanded into a full academic or project report using the following structure:

1. Introduction
2. Statement of the Problem
3. Aim and Objectives
4. Literature Review
5. System Analysis
6. System Design
7. Implementation
8. Testing and Results
9. Conclusion
10. Recommendations

## 17. Conclusion

The Orphanage Management System is a practical management application intended to improve the efficiency of orphanage operations. The system already demonstrates core features such as child management, staff administration, donation tracking, adoption request handling, authentication, and reporting. Its hybrid architecture also reflects an ongoing modernization effort from PHP to Node.js and Express.

As a documentation starter, this artifact provides a solid foundation for supervisor review and can be extended into a complete project report with diagrams, screenshots, schema design, testing results, and evaluation.

## 18. Short Supervisor Brief

The project is a web-based orphanage administration platform built with PHP, Node.js, Express, EJS, and MySQL. It manages children, staff, donations, adoption requests, authentication, and reports. The current implementation already supports major CRUD operations and CSV reporting, while the next phase is to strengthen documentation, testing, architecture consolidation, and final project presentation materials.
