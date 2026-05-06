# Orphanage Management System

A modernized web application for managing orphanage operations efficiently. This system supports handling donations with multi-currency functionality, children records, staff management, and providing a comprehensive data-driven admin dashboard. 

The project has recently undergone an architectural migration from legacy PHP into a modern **Node.js, Express, and EJS** architecture following the MVC design pattern.

## Features

- **Admin Dashboard**: Modern, intuitive dashboard with data visualizations and summary statistics.
- **Donation Management**: Process and track donations, featuring currency selection and secure payment records.
- **Children Module**: Full CRUD functionality to manage children's records with advanced search and filtering.
- **Data Export & Reporting**: Generate CSV reports of system data.
- **Authentication**: Secure bcrypt-based login and authentication system for administrative staff.
- **Contact & Communication**: Embedded forms for public inquiries and contact messaging.

## Tech Stack

- **Modern Backend**: Node.js, Express.js
- **Views & UI**: EJS (Embedded JavaScript templates), modern CSS styling, dark-mode support.
- **Legacy Components**: PHP (gradually migrating towards the Node.js architecture)
- **Database**: MySQL

## Project Structure

- `/node_backend/` - Contains the new modern Node.js application (Controllers, Models, Views, Routes).
- `/admin/` - Legacy PHP admin portal files.
- `/api/` - Directory for API endpoints.
- `/css/`, `/js/`, `/images/` - Frontend assets.
- `index.php`, `donate.php`, `contact.php`, etc. - Public-facing legacy PHP pages.

## Getting Started

### Prerequisites
- Node.js and npm installed
- XAMPP or any local web server providing MySQL database and PHP parsing

### Setup Instructions

1. **Clone the repository:**
   Place the project inside your XAMPP `htdocs` directory (e.g., `C:\xampp\htdocs\orphanage-management-system`).

2. **Database Configuration:**
   - Create a MySQL database (e.g., using phpMyAdmin) for the system.
   - Import any existing SQL schema/dumps required by the project.
   - Configure your database credentials in the project. Update `.env` files in the node backend or PHP database connection files as needed.

3. **Node.js Backend Setup:**
   Navigate into the Node.js modern backend to start the service:
   ```bash
   cd node_backend
   npm install
   ```
   
   Create a `.env` file in the `node_backend` directory (if not fully configured):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=orphanage_db
   PORT=3000
   SESSION_SECRET=your_secret_key
   ```

   Run the modern backend server:
   ```bash
   npm start
   # or
   node app.js
   ```

4. **Running the Application:**
   - For legacy PHP frontend pages: Open `http://localhost/orphanage-management-system/` in your browser.
   - For Node.js views and admin features, access via `http://localhost:3000/` (or your configured port).

## License
MIT License
