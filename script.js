/* =====================================================
   ONLINE EXAMINATION SYSTEM
   Admin accounts, dynamic subjects and subject-wise exams
   Data is stored in this browser's Local Storage.
===================================================== */

const DEFAULT_SUBJECT = "JavaScript";

const defaultQuestions = [
    { question: "Which keyword is used to declare a variable in JavaScript?", optionA: "var", optionB: "int", optionC: "define", optionD: "variable", answer: "A" },
    { question: "Which symbol is used for a single-line comment?", optionA: "//", optionB: "/* */", optionC: "#", optionD: "<!-- -->", answer: "A" },
    { question: "Which method converts JSON text into a JavaScript object?", optionA: "JSON.stringify()", optionB: "JSON.parse()", optionC: "JSON.convert()", optionD: "JSON.object()", answer: "B" },
    { question: "Which keyword creates a block-scoped variable?", optionA: "var", optionB: "let", optionC: "define", optionD: "variable", answer: "B" },
    { question: "Which operator is used for strict equality?", optionA: "=", optionB: "==", optionC: "===", optionD: "!=", answer: "C" }
];

function readStore(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value === null ? fallback : value;
    } catch {
        return fallback;
    }
}
function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

/* Initial data + migration from the old single-question-list format */
if (localStorage.getItem("students") === null) writeStore("students", []);
if (localStorage.getItem("admins") === null) writeStore("admins", []);
if (localStorage.getItem("results") === null) writeStore("results", []);
if (localStorage.getItem("subjects") === null) writeStore("subjects", [DEFAULT_SUBJECT]);

if (localStorage.getItem("subjectQuestions") === null) {
    const oldQuestions = readStore("questions", null);
    const initialQuestions = {};
    initialQuestions[DEFAULT_SUBJECT] = Array.isArray(oldQuestions) && oldQuestions.length
        ? oldQuestions : defaultQuestions;
    writeStore("subjectQuestions", initialQuestions);
}
if (localStorage.getItem("questions") !== null) {
    // Keep the old key for compatibility, but the new system uses subjectQuestions.
    localStorage.removeItem("questions");
}

/* ---------------- STUDENT SIGNUP ---------------- */
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", event => {
        event.preventDefault();
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;
        const students = readStore("students", []);

        if (students.some(student => student.email === email)) {
            alert("This email is already registered.");
            return;
        }
        students.push({ name, email, password });
        writeStore("students", students);
        alert("Student signup successful. Please log in.");
        window.location.href = "login.html";
    });
}

/* ---------------- STUDENT LOGIN ---------------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", event => {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;
        const student = readStore("students", []).find(item =>
            item.email === email && item.password === password
        );
        if (!student) {
            alert("Invalid email or password.");
            return;
        }
        localStorage.setItem("loggedInStudent", JSON.stringify(student));
        window.location.href = "student.html";
    });
}

/* ---------------- STUDENT DASHBOARD ---------------- */
const welcomeStudent = document.getElementById("welcomeStudent");
if (welcomeStudent) {
    const student = readStore("loggedInStudent", null);
    if (!student) {
        window.location.href = "login.html";
    } else {
        welcomeStudent.textContent = `Welcome, ${student.name}`;
        populateStudentSubjects();
    }
}

function populateStudentSubjects() {
    const select = document.getElementById("studentSubject");
    if (!select) return;
    const subjects = readStore("subjects", []);
    select.innerHTML = "";
    if (!subjects.length) {
        select.innerHTML = '<option value="">No subjects available</option>';
        select.disabled = true;
        const count = document.getElementById("subjectQuestionCount");
        if (count) count.textContent = "Please contact the admin to add a subject.";
        return;
    }
    select.disabled = false;
    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        select.appendChild(option);
    });
    updateStudentQuestionCount();
    select.addEventListener("change", updateStudentQuestionCount);
}
function updateStudentQuestionCount() {
    const select = document.getElementById("studentSubject");
    const label = document.getElementById("subjectQuestionCount");
    if (!select || !label) return;
    const bank = readStore("subjectQuestions", {});
    const count = (bank[select.value] || []).length;
    label.textContent = `${count} question(s) available for this subject.`;
}
function startExam() {
    const select = document.getElementById("studentSubject");
    if (!select || !select.value) {
        alert("No subject is available yet.");
        return;
    }
    const bank = readStore("subjectQuestions", {});
    if (!(bank[select.value] || []).length) {
        alert("There are no questions for this subject yet.");
        return;
    }
    localStorage.setItem("selectedExamSubject", select.value);
    window.location.href = "exam.html";
}
function viewResult() {
    window.location.href = "result.html";
}

/* ---------------- EXAM DISPLAY + SUBMISSION ---------------- */
const questionsContainer = document.getElementById("questionsContainer");
if (questionsContainer) {
    const student = readStore("loggedInStudent", null);
    const subject = localStorage.getItem("selectedExamSubject");
    if (!student) {
        window.location.href = "login.html";
    } else if (!subject) {
        window.location.href = "student.html";
    } else {
        const bank = readStore("subjectQuestions", {});
        const questions = bank[subject] || [];
        document.getElementById("studentName").textContent = `Student: ${student.name}`;
        document.getElementById("examSubjectTitle").textContent = `${subject} Examination`;
        if (!questions.length) {
            questionsContainer.textContent = "No questions are available for this subject.";
        } else {
            questionsContainer.innerHTML = questions.map((question, index) => `
                <article class="question">
                    <h3>${index + 1}. ${escapeHTML(question.question)}</h3>
                    ${["A", "B", "C", "D"].map(letter => `
                        <label class="answer-option">
                            <input type="radio" name="question${index}" value="${letter}">
                            ${letter}. ${escapeHTML(question["option" + letter])}
                        </label>
                    `).join("")}
                </article>
            `).join("");
        }
    }
}
const examForm = document.getElementById("examForm");
if (examForm) {
    examForm.addEventListener("submit", event => {
        event.preventDefault();
        const student = readStore("loggedInStudent", null);
        const subject = localStorage.getItem("selectedExamSubject");
        if (!student || !subject) {
            window.location.href = "login.html";
            return;
        }
        const bank = readStore("subjectQuestions", {});
        const questions = bank[subject] || [];
        if (!questions.length) {
            alert("There are no questions to submit.");
            return;
        }
        let score = 0;
        questions.forEach((question, index) => {
            const selected = document.querySelector(`input[name="question${index}"]:checked`);
            if (selected && selected.value === question.answer) score++;
        });
        const results = readStore("results", []);
        results.push({
            studentName: student.name,
            studentEmail: student.email,
            subject,
            score,
            total: questions.length,
            date: new Date().toLocaleString()
        });
        writeStore("results", results);
        localStorage.removeItem("selectedExamSubject");
        alert("Exam submitted successfully.");
        window.location.href = "result.html";
    });
}

/* ---------------- STUDENT RESULTS ---------------- */
const studentResultsContainer = document.getElementById("studentResults");
if (studentResultsContainer) {
    const student = readStore("loggedInStudent", null);
    if (!student) {
        window.location.href = "login.html";
    } else {
        const results = readStore("results", []).filter(result =>
            result.studentEmail === student.email
        ).reverse();
        if (!results.length) {
            studentResultsContainer.innerHTML = '<p class="empty-state">You have not attempted any examination yet.</p>';
        } else {
            studentResultsContainer.innerHTML = results.map(result => {
                const percentage = result.total ? (result.score / result.total * 100).toFixed(2) : "0.00";
                return `<article class="admin-result">
                    <h3>${escapeHTML(result.subject || "General Exam")}</h3>
                    <p><strong>Score:</strong> ${result.score} / ${result.total}</p>
                    <p><strong>Percentage:</strong> ${percentage}%</p>
                    <p><strong>Date:</strong> ${escapeHTML(result.date)}</p>
                </article>`;
            }).join("");
        }
    }
}
function goDashboard() {
    window.location.href = "student.html";
}
function studentLogout() {
    localStorage.removeItem("loggedInStudent");
    localStorage.removeItem("selectedExamSubject");
    window.location.href = "index.html";
}

/* ---------------- ADMIN LOGIN / SIGNUP ---------------- */
const showAdminLogin = document.getElementById("showAdminLogin");
const showAdminSignup = document.getElementById("showAdminSignup");
const adminLoginSection = document.getElementById("adminLoginSection");
const adminSignupSection = document.getElementById("adminSignupSection");

function switchAdminAuth(showSignup) {
    if (!adminLoginSection || !adminSignupSection) return;
    adminLoginSection.hidden = showSignup;
    adminSignupSection.hidden = !showSignup;
    showAdminLogin.classList.toggle("active", !showSignup);
    showAdminSignup.classList.toggle("active", showSignup);
}
if (showAdminLogin) showAdminLogin.addEventListener("click", () => switchAdminAuth(false));
if (showAdminSignup) showAdminSignup.addEventListener("click", () => switchAdminAuth(true));

const adminSignupForm = document.getElementById("adminSignupForm");
if (adminSignupForm) {
    adminSignupForm.addEventListener("submit", event => {
        event.preventDefault();
        const name = document.getElementById("adminSignupName").value.trim();
        const email = document.getElementById("adminSignupEmail").value.trim().toLowerCase();
        const password = document.getElementById("adminSignupPassword").value;
        const confirm = document.getElementById("adminSignupConfirm").value;
        if (password !== confirm) {
            alert("Passwords do not match.");
            return;
        }
        const admins = readStore("admins", []);
        if (admins.some(admin => admin.email === email)) {
            alert("An admin account with this email already exists.");
            return;
        }
        admins.push({ name, email, password });
        writeStore("admins", admins);
        alert("Admin account created. You can now log in.");
        adminSignupForm.reset();
        switchAdminAuth(false);
    });
}
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", event => {
        event.preventDefault();
        const email = document.getElementById("adminLoginEmail").value.trim().toLowerCase();
        const password = document.getElementById("adminLoginPassword").value;
        const admin = readStore("admins", []).find(item =>
            item.email === email && item.password === password
        );
        if (!admin) {
            alert("Invalid admin email or password. Please sign up first if you do not have an account.");
            return;
        }
        localStorage.setItem("loggedInAdmin", JSON.stringify({ name: admin.name, email: admin.email }));
        showAdminDashboard();
    });
}

const adminDashboard = document.getElementById("adminDashboard");
if (adminDashboard) {
    const currentAdmin = readStore("loggedInAdmin", null);
    if (currentAdmin) showAdminDashboard();
}
function showAdminDashboard() {
    if (!adminDashboard) return;
    document.getElementById("adminAuth").hidden = true;
    adminDashboard.hidden = false;
    const admin = readStore("loggedInAdmin", {});
    document.getElementById("adminWelcome").textContent = `Welcome, ${admin.name || "Admin"}`;
    refreshAdminDashboard();
}
function adminLogout() {
    localStorage.removeItem("loggedInAdmin");
    window.location.reload();
}

/* ---------------- SUBJECT MANAGEMENT ---------------- */
const subjectForm = document.getElementById("subjectForm");
if (subjectForm) {
    subjectForm.addEventListener("submit", event => {
        event.preventDefault();
        const input = document.getElementById("subjectName");
        const name = input.value.trim();
        if (!name) return;
        const subjects = readStore("subjects", []);
        if (subjects.some(subject => subject.toLowerCase() === name.toLowerCase())) {
            alert("This subject already exists.");
            return;
        }
        subjects.push(name);
        writeStore("subjects", subjects);
        const bank = readStore("subjectQuestions", {});
        bank[name] = bank[name] || [];
        writeStore("subjectQuestions", bank);
        input.value = "";
        refreshAdminDashboard();
        alert(`${name} subject added successfully.`);
    });
}
function populateSubjectSelects() {
    const subjects = readStore("subjects", []);
    const questionSelect = document.getElementById("questionSubject");
    const questionFilter = document.getElementById("filterQuestionSubject");
    const resultFilter = document.getElementById("filterResultSubject");
    const fill = (select, includeAll) => {
        if (!select) return;
        const previous = select.value;
        select.innerHTML = includeAll ? '<option value="__all">All subjects</option>' : "";
        subjects.forEach(subject => {
            const option = document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });
        if (previous && [...select.options].some(option => option.value === previous)) {
            select.value = previous;
        }
        if (!subjects.length && !includeAll) select.innerHTML = '<option value="">Add a subject first</option>';
    };
    fill(questionSelect, false);
    fill(questionFilter, true);
    fill(resultFilter, true);
}
const questionForm = document.getElementById("questionForm");
if (questionForm) {
    questionForm.addEventListener("submit", event => {
        event.preventDefault();
        const subject = document.getElementById("questionSubject").value;
        if (!subject) {
            alert("Please create a subject first.");
            return;
        }
        const question = {
            id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
            question: document.getElementById("questionText").value.trim(),
            optionA: document.getElementById("optionA").value.trim(),
            optionB: document.getElementById("optionB").value.trim(),
            optionC: document.getElementById("optionC").value.trim(),
            optionD: document.getElementById("optionD").value.trim(),
            answer: document.getElementById("correctAnswer").value
        };
        const bank = readStore("subjectQuestions", {});
        bank[subject] = bank[subject] || [];
        bank[subject].push(question);
        writeStore("subjectQuestions", bank);
        questionForm.reset();
        refreshAdminDashboard();
        alert("Question added to " + subject + ".");
    });
}
const questionFilter = document.getElementById("filterQuestionSubject");
if (questionFilter) questionFilter.addEventListener("change", displayAdminQuestions);
const resultFilter = document.getElementById("filterResultSubject");
if (resultFilter) resultFilter.addEventListener("change", displayAdminResults);

function editQuestion(subject, questionId) {
    const bank = readStore("subjectQuestions", {});
    const list = bank[subject] || [];
    const question = list.find(item => String(item.id) === String(questionId));
    if (!question) return;
    const updatedText = prompt("Edit question:", question.question);
    if (updatedText === null) return;
    const updated = { ...question, question: updatedText.trim() };
    ["A", "B", "C", "D"].forEach(letter => {
        const value = prompt(`Edit option ${letter}:`, updated["option" + letter]);
        if (value !== null) updated["option" + letter] = value.trim();
    });
    const answer = prompt("Correct answer (A, B, C or D):", updated.answer);
    if (answer === null) return;
    if (!["A", "B", "C", "D"].includes(answer.trim().toUpperCase())) {
        alert("Correct answer must be A, B, C or D. No changes saved.");
        return;
    }
    updated.answer = answer.trim().toUpperCase();
    bank[subject] = list.map(item => String(item.id) === String(questionId) ? updated : item);
    writeStore("subjectQuestions", bank);
    refreshAdminDashboard();
}
function deleteQuestion(subject, questionId) {
    if (!confirm("Delete this question?")) return;
    const bank = readStore("subjectQuestions", {});
    bank[subject] = (bank[subject] || []).filter(item => String(item.id) !== String(questionId));
    writeStore("subjectQuestions", bank);
    refreshAdminDashboard();
}
function displayAdminQuestions() {
    const container = document.getElementById("adminQuestions");
    if (!container) return;
    const bank = readStore("subjectQuestions", {});
    const filter = document.getElementById("filterQuestionSubject")?.value || "__all";
    const subjects = readStore("subjects", []);
    const shownSubjects = filter === "__all" ? subjects : subjects.filter(subject => subject === filter);
    let html = "";
    shownSubjects.forEach(subject => {
        const questions = bank[subject] || [];
        html += `<h3 class="subject-heading">${escapeHTML(subject)} <span>${questions.length} question(s)</span></h3>`;
        if (!questions.length) html += '<p class="empty-state">No questions in this subject yet.</p>';
        questions.forEach((question, index) => {
            const id = escapeHTML(question.id ?? index);
            html += `<article class="admin-question">
                <div class="section-heading"><h3>${index + 1}. ${escapeHTML(question.question)}</h3>
                <div class="action-buttons">
                    <button type="button" class="small-button" onclick="editQuestion('${escapeHTML(subject)}','${id}')">Edit</button>
                    <button type="button" class="small-button danger-button" onclick="deleteQuestion('${escapeHTML(subject)}','${id}')">Delete</button>
                </div></div>
                <p>A. ${escapeHTML(question.optionA)} &nbsp; B. ${escapeHTML(question.optionB)}</p>
                <p>C. ${escapeHTML(question.optionC)} &nbsp; D. ${escapeHTML(question.optionD)}</p>
                <p><strong>Correct answer:</strong> ${escapeHTML(question.answer)}</p>
            </article>`;
        });
    });
    container.innerHTML = html || '<p class="empty-state">No subjects have been created.</p>';
}
function displayAdminResults() {
    const container = document.getElementById("adminResults");
    if (!container) return;
    const filter = document.getElementById("filterResultSubject")?.value || "__all";
    let results = readStore("results", []);
    if (filter !== "__all") results = results.filter(result => (result.subject || "JavaScript") === filter);
    if (!results.length) {
        container.innerHTML = '<p class="empty-state">No results found for this selection.</p>';
        return;
    }
    container.innerHTML = results.slice().reverse().map(result => {
        const percentage = result.total ? (result.score / result.total * 100).toFixed(2) : "0.00";
        return `<article class="admin-result">
            <div class="section-heading"><h3>${escapeHTML(result.studentName)}</h3><span class="result-subject">${escapeHTML(result.subject || "JavaScript")}</span></div>
            <p><strong>Email:</strong> ${escapeHTML(result.studentEmail)}</p>
            <p><strong>Score:</strong> ${result.score} / ${result.total} &nbsp; <strong>Percentage:</strong> ${percentage}%</p>
            <p><strong>Date:</strong> ${escapeHTML(result.date)}</p>
        </article>`;
    }).join("");
}
function refreshAdminDashboard() {
    populateSubjectSelects();
    displayAdminQuestions();
    displayAdminResults();
    const subjects = readStore("subjects", []);
    const bank = readStore("subjectQuestions", {});
    const questionCount = subjects.reduce((total, subject) => total + (bank[subject] || []).length, 0);
    document.getElementById("totalSubjects").textContent = subjects.length;
    document.getElementById("totalQuestions").textContent = questionCount;
    document.getElementById("totalStudents").textContent = readStore("students", []).length;
    document.getElementById("totalAttempts").textContent = readStore("results", []).length;
}
