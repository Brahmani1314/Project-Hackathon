import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const DEFAULT_SUBJECT = "JavaScript";
const DEFAULT_QUESTIONS = [
  { id: "q1", question: "Which keyword is used to declare a variable in JavaScript?", optionA: "var", optionB: "int", optionC: "define", optionD: "variable", answer: "A" },
  { id: "q2", question: "Which symbol is used for a single-line comment?", optionA: "//", optionB: "/* */", optionC: "#", optionD: "<!-- -->", answer: "A" },
  { id: "q3", question: "Which method converts JSON text into a JavaScript object?", optionA: "JSON.stringify()", optionB: "JSON.parse()", optionC: "JSON.convert()", optionD: "JSON.object()", answer: "B" },
  { id: "q4", question: "Which keyword creates a block-scoped variable?", optionA: "var", optionB: "let", optionC: "define", optionD: "variable", answer: "B" },
  { id: "q5", question: "Which operator is used for strict equality?", optionA: "=", optionB: "==", optionC: "===", optionD: "!=", answer: "C" }
];

function readStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function initialData() {
  if (localStorage.getItem("students") === null) writeStore("students", []);
  if (localStorage.getItem("admins") === null) writeStore("admins", []);
  if (localStorage.getItem("results") === null) writeStore("results", []);
  if (localStorage.getItem("subjects") === null) writeStore("subjects", [DEFAULT_SUBJECT]);

  if (localStorage.getItem("subjectQuestions") === null) {
    const oldQuestions = readStore("questions", null);
    writeStore("subjectQuestions", {
      [DEFAULT_SUBJECT]: Array.isArray(oldQuestions) && oldQuestions.length ? oldQuestions : DEFAULT_QUESTIONS
    });
  }
  localStorage.removeItem("questions");
}
function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [students, setStudents] = useState(() => readStore("students", []));
  const [admins, setAdmins] = useState(() => readStore("admins", []));
  const [subjects, setSubjects] = useState(() => readStore("subjects", [DEFAULT_SUBJECT]));
  const [questionBank, setQuestionBank] = useState(() => readStore("subjectQuestions", { [DEFAULT_SUBJECT]: DEFAULT_QUESTIONS }));
  const [results, setResults] = useState(() => readStore("results", []));
  const [currentStudent, setCurrentStudent] = useState(() => readStore("loggedInStudent", null));
  const [currentAdmin, setCurrentAdmin] = useState(() => readStore("loggedInAdmin", null));
  const [selectedSubject, setSelectedSubject] = useState(() => localStorage.getItem("selectedExamSubject") || "");
  const [notice, setNotice] = useState("");

  useEffect(() => { initialData(); }, []);
  useEffect(() => { writeStore("students", students); }, [students]);
  useEffect(() => { writeStore("admins", admins); }, [admins]);
  useEffect(() => { writeStore("subjects", subjects); }, [subjects]);
  useEffect(() => { writeStore("subjectQuestions", questionBank); }, [questionBank]);
  useEffect(() => { writeStore("results", results); }, [results]);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }
  function studentSignup(data) {
    const email = data.email.trim().toLowerCase();
    if (students.some(item => item.email === email)) return notify("This student email is already registered.");
    setStudents([...students, { name: data.name.trim(), email, password: data.password }]);
    notify("Student account created. Please log in.");
    setPage("student-login");
  }
  function studentLogin(email, password) {
    const found = students.find(item => item.email === email.trim().toLowerCase() && item.password === password);
    if (!found) return notify("Invalid student email or password.");
    setCurrentStudent(found);
    writeStore("loggedInStudent", found);
    setPage("student-dashboard");
  }
  function adminSignup(data) {
    const email = data.email.trim().toLowerCase();
    if (admins.some(item => item.email === email)) return notify("An admin account with this email already exists.");
    setAdmins([...admins, { name: data.name.trim(), email, password: data.password }]);
    notify("Admin account created. You can now log in.");
    setPage("admin-login");
  }
  function adminLogin(email, password) {
    const found = admins.find(item => item.email === email.trim().toLowerCase() && item.password === password);
    if (!found) return notify("Invalid admin email or password. Please sign up first.");
    const session = { name: found.name, email: found.email };
    setCurrentAdmin(session);
    writeStore("loggedInAdmin", session);
    setPage("admin-dashboard");
  }
  function logoutStudent() {
    setCurrentStudent(null);
    localStorage.removeItem("loggedInStudent");
    localStorage.removeItem("selectedExamSubject");
    setSelectedSubject("");
    setPage("home");
  }
  function logoutAdmin() {
    setCurrentAdmin(null);
    localStorage.removeItem("loggedInAdmin");
    setPage("home");
  }
  function addSubject(name) {
    const clean = name.trim();
    if (!clean) return false;
    if (subjects.some(subject => subject.toLowerCase() === clean.toLowerCase())) {
      notify("This subject already exists.");
      return false;
    }
    setSubjects([...subjects, clean]);
    setQuestionBank({ ...questionBank, [clean]: [] });
    notify(`${clean} subject added.`);
    return true;
  }
  function addQuestion(subject, question) {
    setQuestionBank(prev => ({ ...prev, [subject]: [...(prev[subject] || []), { ...question, id: makeId() }] }));
    notify("Question added successfully.");
  }
  function updateQuestion(subject, updatedQuestion) {
    setQuestionBank(prev => ({
      ...prev,
      [subject]: (prev[subject] || []).map(item => item.id === updatedQuestion.id ? updatedQuestion : item)
    }));
    notify("Question updated.");
  }
  function deleteQuestion(subject, id) {
    setQuestionBank(prev => ({ ...prev, [subject]: (prev[subject] || []).filter(item => item.id !== id) }));
    notify("Question deleted.");
  }
  function submitExam(answers) {
    const questions = questionBank[selectedSubject] || [];
    const score = questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
    const result = {
      id: makeId(),
      studentName: currentStudent.name,
      studentEmail: currentStudent.email,
      subject: selectedSubject,
      score,
      total: questions.length,
      date: new Date().toLocaleString()
    };
    setResults(prev => [...prev, result]);
    localStorage.removeItem("selectedExamSubject");
    setSelectedSubject("");
    setPage("student-results");
    notify("Exam submitted successfully.");
  }

  const pageProps = { notify, subjects, questionBank, results, students };

  return (
    <div className="app-shell">
      <Header page={page} setPage={setPage} currentStudent={currentStudent} currentAdmin={currentAdmin}
        logoutStudent={logoutStudent} logoutAdmin={logoutAdmin} />
      {notice && <div className="toast" role="status">{notice}</div>}

      {page === "home" && <Home setPage={setPage} />}
      {page === "student-signup" && <AuthCard title="Student Signup" switchText="Already registered? Login" onSwitch={() => setPage("student-login")} onSubmit={studentSignup} signup />}
      {page === "student-login" && <AuthCard title="Student Login" switchText="New student? Create an account" onSwitch={() => setPage("student-signup")} onSubmit={(data) => studentLogin(data.email, data.password)} />}
      {page === "admin-signup" && <AuthCard title="Admin Signup" switchText="Already have an admin account? Login" onSwitch={() => setPage("admin-login")} onSubmit={adminSignup} signup />}
      {page === "admin-login" && <AuthCard title="Admin Login" switchText="New admin? Create an account" onSwitch={() => setPage("admin-signup")} onSubmit={(data) => adminLogin(data.email, data.password)} />}

      {page === "admin-dashboard" && (currentAdmin
        ? <AdminDashboard {...pageProps} currentAdmin={currentAdmin} addSubject={addSubject} addQuestion={addQuestion} updateQuestion={updateQuestion} deleteQuestion={deleteQuestion} />
        : <RedirectMessage message="Please log in as an admin." action={() => setPage("admin-login")} />)}

      {page === "student-dashboard" && (currentStudent
        ? <StudentDashboard student={currentStudent} subjects={subjects} questionBank={questionBank}
            onStart={(subject) => { setSelectedSubject(subject); localStorage.setItem("selectedExamSubject", subject); setPage("exam"); }} onResults={() => setPage("student-results")} />
        : <RedirectMessage message="Please log in as a student." action={() => setPage("student-login")} />)}

      {page === "exam" && (currentStudent && selectedSubject
        ? <ExamPage subject={selectedSubject} questions={questionBank[selectedSubject] || []} onSubmit={submitExam} onCancel={() => setPage("student-dashboard")} />
        : <RedirectMessage message="Choose a subject from your student dashboard first." action={() => setPage("student-dashboard")} />)}

      {page === "student-results" && (currentStudent
        ? <StudentResults results={results.filter(result => result.studentEmail === currentStudent.email)} />
        : <RedirectMessage message="Please log in as a student." action={() => setPage("student-login")} />)}
      <footer>Online Examination System · React Edition</footer>
    </div>
  );
}

function Header({ page, setPage, currentStudent, currentAdmin, logoutStudent, logoutAdmin }) {
  return <header className="topbar">
    <button className="brand" onClick={() => setPage("home")}>Online Examination System</button>
    <nav>
      {currentStudent ? <>
        <button onClick={() => setPage("student-dashboard")}>Dashboard</button>
        <button onClick={logoutStudent}>Logout</button>
      </> : currentAdmin ? <>
        <button onClick={() => setPage("admin-dashboard")}>Dashboard</button>
        <button onClick={logoutAdmin}>Logout</button>
      </> : <>
        <button onClick={() => setPage("student-login")}>Student Login</button>
        <button onClick={() => setPage("student-signup")}>Student Signup</button>
        <button onClick={() => setPage("admin-login")}>Admin</button>
      </>}
    </nav>
  </header>;
}
function Home({ setPage }) {
  return <main className="hero-wrap">
    <section className="hero">
      <span className="eyebrow">LEARN · PRACTICE · EVALUATE</span>
      <h1>Online Examination System</h1>
      <p>Take subject-wise multiple-choice examinations and view your results.</p>
      <div className="hero-actions">
        <button className="primary" onClick={() => setPage("student-signup")}>Student Signup</button>
        <button className="outline" onClick={() => setPage("student-login")}>Student Login</button>
        <button className="soft" onClick={() => setPage("admin-login")}>Admin Portal</button>
      </div>
    </section>
    <section className="feature-grid">
      <Feature title="Multiple Subjects" text="Admins can create subjects such as Java, Python and DBMS." />
      <Feature title="Online MCQ Exams" text="Students can choose a subject and submit answers online." />
      <Feature title="Instant Results" text="Scores and percentages are calculated automatically." />
    </section>
  </main>;
}
function Feature({ title, text }) {
  return <article className="feature-card"><h3>{title}</h3><p>{text}</p></article>;
}
function AuthCard({ title, switchText, onSwitch, onSubmit, signup = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  function submit(event) {
    event.preventDefault();
    if (signup && password !== confirm) return alert("Passwords do not match.");
    onSubmit({ name, email, password });
  }
  return <main className="auth-wrap">
    <form className="panel auth-panel" onSubmit={submit}>
      <span className="eyebrow">ACCOUNT ACCESS</span>
      <h1>{title}</h1>
      {signup && <Field label="Full Name" value={name} onChange={setName} required />}
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} minLength={6} required />
      {signup && <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} minLength={6} required />}
      <button className="primary full" type="submit">{signup ? "Create Account" : "Login"}</button>
      <button className="text-button" type="button" onClick={onSwitch}>{switchText}</button>
    </form>
  </main>;
}
function Field({ label, value, onChange, type = "text", required = false, minLength }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} required={required} minLength={minLength} /></label>;
}
function RedirectMessage({ message, action }) {
  return <main className="content-wrap"><section className="panel"><p>{message}</p><button className="primary" onClick={action}>Continue</button></section></main>;
}
function StatCard({ label, value }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong></article>;
}
function AdminDashboard({ currentAdmin, subjects, questionBank, results, students, addSubject, addQuestion, updateQuestion, deleteQuestion }) {
  const [subjectName, setSubjectName] = useState("");
  const [subject, setSubject] = useState(subjects[0] || "");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterResult, setFilterResult] = useState("All");
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", answer: "A" });
  const totalQuestions = subjects.reduce((sum, item) => sum + (questionBank[item] || []).length, 0);
  useEffect(() => { if (!subjects.includes(subject)) setSubject(subjects[0] || ""); }, [subjects, subject]);
  function submitQuestion(event) {
    event.preventDefault();
    if (!subject) return alert("Create a subject first.");
    addQuestion(subject, form);
    setForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", answer: "A" });
  }
  function edit(item, subjectName) {
    const question = window.prompt("Edit question text:", item.question);
    if (question === null) return;
    const optionA = window.prompt("Edit option A:", item.optionA);
    if (optionA === null) return;
    const optionB = window.prompt("Edit option B:", item.optionB);
    if (optionB === null) return;
    const optionC = window.prompt("Edit option C:", item.optionC);
    if (optionC === null) return;
    const optionD = window.prompt("Edit option D:", item.optionD);
    if (optionD === null) return;
    const answer = window.prompt("Correct answer (A, B, C or D):", item.answer);
    if (answer === null) return;
    if (!["A", "B", "C", "D"].includes(answer.trim().toUpperCase())) return alert("Enter A, B, C or D.");
    updateQuestion(subjectName, { ...item, question: question.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(), answer: answer.trim().toUpperCase() });
  }
  const visibleSubjects = filterSubject === "All" ? subjects : subjects.filter(item => item === filterSubject);
  const visibleResults = results.filter(item => filterResult === "All" || item.subject === filterResult);
  return <main className="content-wrap">
    <div className="page-heading"><div><span className="eyebrow">ADMIN CONTROL PANEL</span><h1>Welcome, {currentAdmin.name}</h1><p>Manage subjects, question banks and student results.</p></div></div>
    <section className="stats-grid">
      <StatCard label="Total Subjects" value={subjects.length} />
      <StatCard label="Total Questions" value={totalQuestions} />
      <StatCard label="Registered Students" value={students.length} />
      <StatCard label="Exam Attempts" value={results.length} />
    </section>

    <section className="panel section-panel">
      <SectionTitle number="01" title="Create a New Subject" subtitle="Add a subject that students can choose for their examination." />
      <form className="inline-form" onSubmit={event => { event.preventDefault(); if (addSubject(subjectName)) setSubjectName(""); }}>
        <input placeholder="e.g. Java, Python, DBMS" value={subjectName} onChange={event => setSubjectName(event.target.value)} required />
        <button className="primary" type="submit">Add Subject</button>
      </form>
      <div className="chip-list">{subjects.map(item => <span className="chip" key={item}>{item}</span>)}</div>
    </section>

    <section className="panel section-panel">
      <SectionTitle number="02" title="Add Questions" subtitle="Every question is saved under the selected subject." />
      <form onSubmit={submitQuestion} className="question-form">
        <label className="field"><span>Subject</span><select value={subject} onChange={event => setSubject(event.target.value)} required disabled={!subjects.length}>{subjects.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>Question</span><textarea value={form.question} onChange={event => setForm({ ...form, question: event.target.value })} required rows="2" /></label>
        <div className="option-grid">
          {["A", "B", "C", "D"].map(letter => <label className="field" key={letter}><span>Option {letter}</span><input value={form["option" + letter]} onChange={event => setForm({ ...form, ["option" + letter]: event.target.value })} required /></label>)}
        </div>
        <label className="field"><span>Correct Answer</span><select value={form.answer} onChange={event => setForm({ ...form, answer: event.target.value })}><option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option></select></label>
        <button className="primary" type="submit" disabled={!subjects.length}>Save Question</button>
      </form>
    </section>

    <section className="panel section-panel">
      <div className="section-title-row"><SectionTitle number="03" title="Question Bank" subtitle="View, edit or delete questions by subject." /><select className="filter-select" value={filterSubject} onChange={event => setFilterSubject(event.target.value)}><option>All</option>{subjects.map(item => <option key={item}>{item}</option>)}</select></div>
      {visibleSubjects.map(item => <div className="subject-group" key={item}>
        <h3>{item} <small>{(questionBank[item] || []).length} question(s)</small></h3>
        {(questionBank[item] || []).length === 0 && <p className="empty">No questions added for this subject yet.</p>}
        {(questionBank[item] || []).map((question, index) => <article className="question-item" key={question.id}>
          <div className="question-item-head"><strong>{index + 1}. {question.question}</strong><div className="button-row"><button className="small outline" onClick={() => edit(question, item)}>Edit</button><button className="small danger" onClick={() => window.confirm("Delete this question?") && deleteQuestion(item, question.id)}>Delete</button></div></div>
          <p>A. {question.optionA} · B. {question.optionB}</p><p>C. {question.optionC} · D. {question.optionD}</p><small>Correct answer: {question.answer}</small>
        </article>)}
      </div>)}
    </section>

    <section className="panel section-panel">
      <div className="section-title-row"><SectionTitle number="04" title="Student Results" subtitle="Review exam attempts and scores." /><select className="filter-select" value={filterResult} onChange={event => setFilterResult(event.target.value)}><option>All</option>{subjects.map(item => <option key={item}>{item}</option>)}</select></div>
      {visibleResults.length === 0 ? <p className="empty">No results available for this filter.</p> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Subject</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead><tbody>{visibleResults.slice().reverse().map(item => <tr key={item.id}><td>{item.studentName}</td><td>{item.studentEmail}</td><td>{item.subject}</td><td>{item.score}/{item.total}</td><td>{item.total ? (item.score / item.total * 100).toFixed(1) : 0}%</td><td>{item.date}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
function SectionTitle({ number, title, subtitle }) {
  return <div className="section-title"><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>;
}
function StudentDashboard({ student, subjects, questionBank, onStart, onResults }) {
  const [selected, setSelected] = useState(subjects[0] || "");
  const count = (questionBank[selected] || []).length;
  return <main className="content-wrap narrow">
    <span className="eyebrow">STUDENT PORTAL</span><h1>Welcome, {student.name}</h1><p className="muted">Choose a subject to start your examination.</p>
    <section className="panel section-panel">
      <h2>Available Subjects</h2>
      {subjects.length ? <>
        <label className="field"><span>Select Subject</span><select value={selected} onChange={event => setSelected(event.target.value)}>{subjects.map(item => <option key={item}>{item}</option>)}</select></label>
        <p className="muted">{count} question(s) available.</p>
        <button className="primary" disabled={!count} onClick={() => onStart(selected)}>Start Exam</button>
        {!count && <p className="empty">No questions are available in this subject yet.</p>}
      </> : <p className="empty">No subjects have been created by the admin yet.</p>}
    </section>
    <section className="panel section-panel"><h2>My Results</h2><p className="muted">View your previous subject-wise exam results.</p><button className="outline" onClick={onResults}>View Results</button></section>
  </main>;
}
function ExamPage({ subject, questions, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({});
  return <main className="content-wrap narrow">
    <span className="eyebrow">ONLINE EXAMINATION</span><h1>{subject} Examination</h1><p className="muted">{questions.length} multiple-choice questions</p>
    {questions.length ? <form onSubmit={event => { event.preventDefault(); onSubmit(answers); }}>
      {questions.map((question, index) => <article className="panel exam-question" key={question.id}>
        <h3>{index + 1}. {question.question}</h3>
        {["A", "B", "C", "D"].map(letter => <label className="radio-option" key={letter}><input type="radio" name={`q-${question.id}`} checked={answers[index] === letter} onChange={() => setAnswers({ ...answers, [index]: letter })} /> <span>{letter}. {question["option" + letter]}</span></label>)}
      </article>)}
      <div className="button-row"><button className="primary" type="submit">Submit Exam</button><button className="outline" type="button" onClick={onCancel}>Cancel</button></div>
    </form> : <section className="panel"><p>No questions are available for this subject.</p><button className="outline" onClick={onCancel}>Back to dashboard</button></section>}
  </main>;
}
function StudentResults({ results }) {
  return <main className="content-wrap narrow"><span className="eyebrow">STUDENT PORTAL</span><h1>My Examination Results</h1>
    {results.length ? results.slice().reverse().map(item => <article className="panel result-card" key={item.id}><div className="result-top"><h3>{item.subject}</h3><span className="chip">{item.total ? (item.score / item.total * 100).toFixed(1) : 0}%</span></div><p><strong>Score:</strong> {item.score} / {item.total}</p><p><strong>Date:</strong> {item.date}</p></article>) : <section className="panel"><p className="empty">You have not attempted any examinations yet.</p></section>}
  </main>;
}
