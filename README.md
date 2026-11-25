# Online Examination System — React Edition

## Features
- Separate student and admin signup/login screens
- Admin dashboard with overview statistics
- Admin can create any subject dynamically
- Questions are stored separately for each subject
- Admin can add, edit and delete MCQ questions
- Admin can filter the question bank and results by subject
- Students can choose a subject, take its MCQ exam and view their results

## Run the project
1. Install Node.js (LTS).
2. Extract this project ZIP.
3. Open a terminal in the extracted project folder.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the local address shown by Vite (usually http://localhost:5173).

## Project structure
- `index.html` — React app entry HTML
- `src/main.jsx` — React entry point
- `src/App.jsx` — application components, state and functionality
- `src/styles.css` — responsive styling
- `package.json` — dependencies and run scripts

## Data storage and security note
This is a frontend academic demo. It stores accounts, subjects, questions and results in browser Local Storage. This is not secure authentication: passwords are not protected by a server, and data is limited to the browser profile/device. A production system should use a backend API, database, password hashing and server-side authorization.
