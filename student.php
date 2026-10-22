
<?php
session_start();
require_once "db.php";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Administrator-only access
if (
    !isset($_SESSION["student_id"]) ||
    ($_SESSION["role"] ?? "") !== "admin"
) {
    http_response_code(403);
    exit("Access denied. Please log in as an administrator.");
}

if (empty($_SESSION["csrf_token"])) {
    $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
}

function h($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, "UTF-8");
}

function flash($message, $type = "success") {
    $_SESSION["flash"] = [
        "message" => $message,
        "type" => $type
    ];
}

function redirectToList() {
    header("Location: students.php");
    exit;
}

function getFormValue($key) {
    return trim((string)($_POST[$key] ?? ""));
}

// ADD, EDIT and DELETE
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        if (
            !isset($_POST["csrf_token"]) ||
            !hash_equals(
                $_SESSION["csrf_token"],
                (string)$_POST["csrf_token"]
            )
        ) {
            throw new RuntimeException(
                "Security check failed. Refresh the page and try again."
            );
        }

        $action = $_POST["action"] ?? "";

        if ($action === "delete") {
            $id = filter_var(
                $_POST["student_id"] ?? null,
                FILTER_VALIDATE_INT
            );

            if (!$id || $id < 1) {
                throw new RuntimeException("Invalid student ID.");
            }

            $stmt = $conn->prepare(
                "DELETE FROM students WHERE student_id = ?"
            );
            $stmt->bind_param("i", $id);
            $stmt->execute();

            if ($stmt->affected_rows === 1) {
                flash("Student deleted successfully.");
            } else {
                flash("Student not found or already deleted.", "error");
            }

            $stmt->close();
            redirectToList();
        }

        if ($action === "add" || $action === "edit") {
            $id = filter_var(
                $_POST["student_id"] ?? null,
                FILTER_VALIDATE_INT
            );

            $name = getFormValue("full_name");
            $username = getFormValue("username");
            $email = getFormValue("email");
            $mobile = getFormValue("mobile_number");
            $course = getFormValue("course");
            $year = getFormValue("academic_year");
            $gender = getFormValue("gender");
            $password = (string)($_POST["password"] ?? "");

            if (
                $name === "" || $username === "" ||
                $email === "" || $course === "" || $year === ""
            ) {
                throw new RuntimeException(
                    "Please fill in all required fields."
                );
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new RuntimeException(
                    "Please enter a valid email address."
                );
            }

            if (!in_array(
                $gender,
                ["Male", "Female", "Other"],
                true
            )) {
                throw new RuntimeException("Please select a valid gender.");
            }

            if (!in_array(
                $year,
                ["1", "2", "3", "4"],
                true
            )) {
                throw new RuntimeException(
                    "Please select a valid academic year."
                );
            }

            if ($action === "add") {
                if ($password === "") {
                    throw new RuntimeException(
                        "A password is required for a new student."
                    );
                }

                if (strlen($password) < 8) {
                    throw new RuntimeException(
                        "Password must contain at least 8 characters."
                    );
                }

                $passwordHash = password_hash(
                    $password,
                    PASSWORD_DEFAULT
                );

                $stmt = $conn->prepare(
                    "INSERT INTO students
                    (full_name, username, email, mobile_number,
                     password_hash, course, academic_year, gender)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                );

                $stmt->bind_param(
                    "ssssssss",
                    $name,
                    $username,
                    $email,
                    $mobile,
                    $passwordHash,
                    $course,
                    $year,
                    $gender
                );

                $stmt->execute();
                $stmt->close();

                flash("Student added successfully.");
                redirectToList();
            }

            if ($action === "edit") {
                if (!$id || $id < 1) {
                    throw new RuntimeException("Invalid student ID.");
                }

                $stmt = $conn->prepare(
                    "UPDATE students SET
                        full_name = ?,
                        username = ?,
                        email = ?,
                        mobile_number = ?,
                        course = ?,
                        academic_year = ?,
                        gender = ?
                    WHERE student_id = ?"
                );

                $stmt->bind_param(
                    "sssssssi",
                    $name,
                    $username,
                    $email,
                    $mobile,
                    $course,
                    $year,
                    $gender,
                    $id
                );

                $stmt->execute();
                $changed = $stmt->affected_rows;
                $stmt->close();

                // A zero affected-row count can mean the record
                // was unchanged, not necessarily that it was missing.
                $check = $conn->prepare(
                    "SELECT student_id FROM students WHERE student_id = ?"
                );
                $check->bind_param("i", $id);
                $check->execute();
                $check->store_result();
                $exists = $check->num_rows === 1;
                $check->close();

                if (!$exists) {
                    throw new RuntimeException("Student record not found.");
                }

                flash(
                    $changed > 0
                        ? "Student updated successfully."
                        : "No changes were made to the student record."
                );
                redirectToList();
            }
        }

        throw new RuntimeException("Invalid operation.");

    } catch (RuntimeException $e) {
        flash($e->getMessage(), "error");
        redirectToList();

    } catch (mysqli_sql_exception $e) {
        // MySQL duplicate-key error: username/email already exists.
        if ((int)$e->getCode() === 1062) {
            flash(
                "That username or email is already registered.",
                "error"
            );
        } else {
            error_log("Student management database error: " . $e->getMessage());
            flash(
                "The database operation failed. Please check your data and try again.",
                "error"
            );
        }

        redirectToList();
    }
}

// One-time status message
$message = $_SESSION["flash"] ?? null;
unset($_SESSION["flash"]);

// Load record for editing, if requested
$editStudent = null;
$editId = filter_var(
    $_GET["edit"] ?? null,
    FILTER_VALIDATE_INT
);

if ($editId && $editId > 0) {
    $stmt = $conn->prepare(
        "SELECT student_id, full_name, username, email,
                mobile_number, course, academic_year, gender
         FROM students WHERE student_id = ?"
    );
    $stmt->bind_param("i", $editId);
    $stmt->execute();
    $editStudent = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$editStudent) {
        $message = [
            "message" => "Student record not found.",
            "type" => "error"
        ];
    }
}

// Search and filters
$search = trim((string)($_GET["search"] ?? ""));
$courseFilter = trim((string)($_GET["course"] ?? ""));
$yearFilter = trim((string)($_GET["year"] ?? ""));

$allowedCourses = [
    "BCA", "BSc", "BCom", "BA", "BTech", "MCA", "Other"
];

if (!in_array($courseFilter, $allowedCourses, true)) {
    $courseFilter = "";
}

if (!in_array($yearFilter, ["1", "2", "3", "4"], true)) {
    $yearFilter = "";
}

$stmt = $conn->prepare(
    "SELECT student_id, full_name, username, email,
            mobile_number, course, academic_year, gender
     FROM students
     WHERE (
        ? = ''
        OR full_name LIKE CONCAT('%', ?, '%')
        OR username LIKE CONCAT('%', ?, '%')
        OR email LIKE CONCAT('%', ?, '%')
        OR mobile_number LIKE CONCAT('%', ?, '%')
     )
     AND (? = '' OR course = ?)
     AND (? = '' OR academic_year = ?)
     ORDER BY student_id DESC"
);

$stmt->bind_param(
    "sssssssss",
    $search, $search, $search, $search, $search,
    $courseFilter, $courseFilter,
    $yearFilter, $yearFilter
);

$stmt->execute();
$students = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Management | StudentHub</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 24px;
            background: #f4f6f9;
            color: #222;
        }
        .container {
            max-width: 1200px;
            margin: auto;
        }
        .panel {
            background: white;
            padding: 20px;
            margin-bottom: 22px;
            border-radius: 10px;
            box-shadow: 0 2px 8px #0000000d;
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        input, select, button, .button {
            box-sizing: border-box;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
        input, select {
            width: 100%;
            border: 1px solid #ccd2da;
        }
        button, .button {
            border: 0;
            background: #2457c5;
            color: white;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .danger { background: #c62828; }
        .secondary { background: #5b6472; }
        .message {
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        .success {
            color: #155724;
            background: #d4edda;
        }
        .error {
            color: #842029;
            background: #f8d7da;
        }
        .table-wrap { overflow-x: auto; }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        th, td {
            border-bottom: 1px solid #e3e6eb;
            padding: 11px;
            text-align: left;
            white-space: nowrap;
        }
        th { background: #edf1f7; }
        .inline { display: inline; }
        .inline button { margin: 2px; }
        .required { color: #c62828; }
    </style>
</head>
<body>
<div class="container">
    <h1>Student Management</h1>
    <p>Manage student records from one place.</p>

    <?php if ($message): ?>
        <div class="message <?= h($message["type"]) ?>">
            <?= h($message["message"]) ?>
        </div>
    <?php endif; ?>

    <section class="panel">
        <h2><?= $editStudent ? "Edit Student" : "Add Student" ?></h2>

        <form method="POST" action="students.php">
            <input type="hidden" name="csrf_token"
                   value="<?= h($_SESSION["csrf_token"]) ?>">

            <input type="hidden" name="action"
                   value="<?= $editStudent ? "edit" : "add" ?>">

            <?php if ($editStudent): ?>
                <input type="hidden" name="student_id"
                       value="<?= (int)$editStudent["student_id"] ?>">
            <?php endif; ?>

            <div class="form-grid">
                <div>
                    <label>Full Name <span class="required">*</span></label>
                    <input name="full_name" required maxlength="150"
                        value="<?= h($editStudent["full_name"] ?? "") ?>">
                </div>

                <div>
                    <label>Username <span class="required">*</span></label>
                    <input name="username" required maxlength="100"
                        value="<?= h($editStudent["username"] ?? "") ?>">
                </div>

                <div>
                    <label>Email <span class="required">*</span></label>
                    <input type="email" name="email" required maxlength="190"
                        value="<?= h($editStudent["email"] ?? "") ?>">
                </div>

                <div>
                    <label>Mobile Number</label>
                    <input name="mobile_number" maxlength="30"
                        value="<?= h($editStudent["mobile_number"] ?? "") ?>">
                </div>

                <div>
                    <label>Course <span class="required">*</span></label>
                    <select name="course" required>
                        <option value="">Select course</option>
                        <?php foreach ($allowedCourses as $c): ?>
                            <option value="<?= h($c) ?>"
                                <?= ($editStudent["course"] ?? "") === $c
                                    ? "selected" : "" ?>>
                                <?= h($c) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label>Academic Year <span class="required">*</span></label>
                    <select name="academic_year" required>
                        <option value="">Select year</option>
                        <?php for ($y = 1; $y <= 4; $y++): ?>
                            <option value="<?= $y ?>"
                                <?= (string)($editStudent["academic_year"] ?? "")
                                    === (string)$y ? "selected" : "" ?>>
                                Year <?= $y ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>

                <div>
                    <label>Gender</label>
                    <select name="gender" required>
                        <option value="">Select gender</option>
                        <?php foreach (["Male", "Female", "Other"] as $g): ?>
                            <option value="<?= h($g) ?>"
                                <?= ($editStudent["gender"] ?? "") === $g
                                    ? "selected" : "" ?>>
                                <?= h($g) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <?php if (!$editStudent): ?>
                    <div>
                        <label>Initial Password <span class="required">*</span></label>
                        <input type="password" name="password"
                               required minlength="8" autocomplete="new-password">
                    </div>
                <?php endif; ?>
            </div>

            <p>
                <button type="submit">
                    <?= $editStudent ? "Update Student" : "Add Student" ?>
                </button>

                <?php if ($editStudent): ?>
                    <a class="button secondary" href="students.php">Cancel</a>
                <?php endif; ?>
            </p>
        </form>
    </section>

    <section class="panel">
        <h2>Search and Filter Students</h2>

        <form method="GET" action="students.php">
            <div class="form-grid">
                <div>
                    <label>Search</label>
                    <input name="search"
                           placeholder="Name, username, email, mobile"
                           value="<?= h($search) ?>">
                </div>

                <div>
                    <label>Course</label>
                    <select name="course">
                        <option value="">All courses</option>
                        <?php foreach ($allowedCourses as $c): ?>
                            <option value="<?= h($c) ?>"
                                <?= $courseFilter === $c ? "selected" : "" ?>>
                                <?= h($c) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label>Academic Year</label>
                    <select name="year">
                        <option value="">All years</option>
                        <?php for ($y = 1; $y <= 4; $y++): ?>
                            <option value="<?= $y ?>"
                                <?= $yearFilter === (string)$y ? "selected" : "" ?>>
                                Year <?= $y ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>
            </div>

            <p>
                <button type="submit">Search / Filter</button>
                <a class="button secondary" href="students.php">Reset</a>
            </p>
        </form>
    </section>

    <section class="panel">
        <h2>Student Records</h2>

        <div class="table-wrap">
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Gender</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <?php if ($students->num_rows === 0): ?>
                    <tr>
                        <td colspan="9">No student records found.</td>
                    </tr>
                <?php else: ?>
                    <?php while ($student = $students->fetch_assoc()): ?>
                        <tr>
                            <td><?= (int)$student["student_id"] ?></td>
                            <td><?= h($student["full_name"]) ?></td>
                            <td><?= h($student["username"]) ?></td>
                            <td><?= h($student["email"]) ?></td>
                            <td><?= h($student["mobile_number"]) ?></td>
                            <td><?= h($student["course"]) ?></td>
                            <td><?= h($student["academic_year"]) ?></td>
                            <td><?= h($student["gender"]) ?></td>
                            <td>
                                <a class="button"
                                   href="students.php?edit=<?= (int)$student["student_id"] ?>">
                                    Edit
                                </a>

                                <form class="inline" method="POST"
                                      action="students.php"
                                      onsubmit="return confirm('Delete this student record?');">
                                    <input type="hidden" name="csrf_token"
                                           value="<?= h($_SESSION["csrf_token"]) ?>">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="student_id"
                                           value="<?= (int)$student["student_id"] ?>">
                                    <button class="danger" type="submit">
                                        Delete
                                    </button>
                                </form>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>
</body>
</html>
<?php
$stmt->close();
?>
