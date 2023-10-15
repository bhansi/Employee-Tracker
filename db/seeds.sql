INSERT INTO department (name)
VALUES
    ("Executive"),
    ("Sales"),
    ("Marketing"),
    ("Legal");

INSERT INTO role (title, salary, department_id)
VALUES
    ("CEO", 1000000, 1)
    ("Sales Manager", 100000, 2),
    ("Sales", 70000, 2),
    ("Marketing Manager", 100000, 3),
    ("Marketing", 70000, 3),
    ("Legal Manager", 100000, 4),
    ("Legal", 70000, 4)

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
    ("Pam", "Beesly", 1, NULL),
    ("Michael", "Scott", 2, 1),
    ("Jim", "Halpert", 3, 2),
    ("Dwight", "Schrute", 3, 2),
    ("Angela", "Martin", 4, 1),
    ("Kelly", "Kapoor", 5, 5),
    ("Andy", "Bernard", 5, 5),
    ("Kevin", "Malone", 6, 1),
    ("Stanley", "Hudson", 7, 8),
    ("Ryan", "Howard", 7, 8);
