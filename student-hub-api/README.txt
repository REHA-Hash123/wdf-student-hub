STUDENT HUB - PHP JSON CRUD API

Features
- GET: list students
- POST: add a student
- PUT: update a student
- DELETE: delete a student
- Fetch API interface updates the table without a full page reload
- JSON file storage in data/students.json
- Basic server-side validation and API error responses

Run with XAMPP
1. Extract the student-hub-api folder into C:\xampp\htdocs\
2. Start Apache in the XAMPP Control Panel.
3. Open http://localhost/student-hub-api/ in your browser.
4. Use the form to add, edit, and delete students.

API endpoint
http://localhost/student-hub-api/api.php

Request examples
GET    api.php
POST   api.php with JSON {"name":"Aarav Patel","email":"aarav@example.com"}
PUT    api.php with JSON {"id":"existing-id","name":"Updated Name","email":"updated@example.com"}
DELETE api.php with JSON {"id":"existing-id"}

Important
This is a learning/demo project. JSON-file storage is not intended for concurrent or production use. Add authentication, role-based authorization, CSRF protection, and appropriate access controls before using real student data. Do not expose writable JSON files publicly in a production deployment.
