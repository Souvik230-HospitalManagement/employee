const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const PORT = process.env.PORT || 3000;

// Set Handlebars as the view engine
app.set('view engine', 'hbs');

// Serve static files from node_modules
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use express-session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // default MySQL username in XAMPP
  password: '', // default MySQL password in XAMPP is empty
  database: 'employee', // name of the database you created
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// Route to serve the registration page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/register', (req, res) => {
  const { name, email, designation, username, password } = req.body;
  const INSERT_USER_QUERY = 'INSERT INTO register (name, email, designation, username, password) VALUES (?, ?, ?, ?, ?)';

  db.query(INSERT_USER_QUERY, [name, email, designation, username, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      res.status(500).send('Error registering user');
      return;
    }
    console.log('User registered successfully');
    res.redirect('/login'); // Redirect to login page after successful registration
  });
});

// Route to serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const SELECT_USER_QUERY = 'SELECT * FROM register WHERE username = ? AND password = ?';

  db.query(SELECT_USER_QUERY, [username, password], (err, results) => {
    if (err) {
      console.error('Error querying user:', err);
      res.status(500).send('Error logging in');
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      req.session.userId = user.id; // Store user ID in session
      req.session.username = username; // Store username in session

      // Check if user details already exist in emp_details1
      const CHECK_EMP_DETAILS_QUERY = 'SELECT * FROM emp_details1 WHERE id = ?';
      db.query(CHECK_EMP_DETAILS_QUERY, [user.id], (err, empResults) => {
        if (err) {
          console.error('Error checking emp_details1:', err);
          res.status(500).send('Error logging in');
          return;
        }

        if (empResults.length === 0) {
          // Insert name and email from register table into emp_details1
          const INSERT_EMP_DETAILS_QUERY = 'INSERT INTO emp_details1 (id, full_name, email) VALUES (?, ?, ?)';
          db.query(INSERT_EMP_DETAILS_QUERY, [user.id, user.name, user.email], (err, insertResult) => {
            if (err) {
              console.error('Error inserting into emp_details1:', err);
              res.status(500).send('Error logging in');
              return;
            }
            console.log('User details inserted into emp_details1');
          });
        }

        const userDesignation = user.designation; // Assuming 'designation' is the column name in your database
        console.log(`Login successful. User Designation: ${userDesignation}`);

        if (userDesignation === 'Employee') {
          res.redirect('/index'); // Redirect to employee details page after successful login
        } else if (userDesignation === 'Team Leader') {
          res.redirect('/index'); // Redirect to team leader welcome page
        } else {
          res.status(403).send('Unauthorized access');
        }
      });
    } else {
      console.log('Invalid username or password');
      res.status(401).send('Invalid username or password');
    }
  });
});


// Route to serve the employee details page
app.get('/emp-details', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'emp-details.html'));
});

// Handle form submission for employee details
app.post('/emp-details', (req, res) => {
  const username = req.session.username;
  const { employeeCode, phoneNumber, userRoleId, managerId, designation, deptId } = req.body;

  const SELECT_QUERY = 'SELECT * FROM emp_details WHERE username = ?';
  const INSERT_QUERY = 'INSERT INTO emp_details (username, employee_code, work_location, user_role_id, manager_id, deperment, dept_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const UPDATE_QUERY = 'UPDATE emp_details SET employee_code = ?, work_location = ?, user_role_id = ?, manager_id = ?, deperment = ?, dept_id = ? WHERE username = ?';

  db.query(SELECT_QUERY, [username], (err, results) => {
    if (err) {
      console.error('Error querying employee details:', err);
      res.status(500).send('Error submitting employee details');
      return;
    }

    if (results.length > 0) {
      db.query(UPDATE_QUERY, [employeeCode, phoneNumber, userRoleId, managerId, designation, deptId, username], (err, result) => {
        if (err) {
          console.error('Error updating employee details:', err);
          res.status(500).send('Error updating employee details');
          return;
        }
        console.log('Employee details updated successfully');
        res.redirect('/emp-self-rating'); // Redirect to self-rating page after successful update
      });
    } else {
      db.query(INSERT_QUERY, [username, employeeCode, phoneNumber, userRoleId, managerId, designation, deptId], (err, result) => {
        if (err) {
          console.error('Error inserting employee details:', err);
          res.status(500).send('Error submitting employee details');
          return;
        }
        console.log('Employee details submitted successfully');
        res.redirect('/emp-self-rating'); // Redirect to self-rating page after successful insertion
      });
    }
  });
});

// Route to serve the self-rating page
app.get('/emp-self-rating', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'emp-self-ratting.html'));
});

// Handle form submission for self-rating
app.post('/submit-rating', (req, res) => {
  const username = req.session.username;
  const { rating1, rating2, rating3, rating4, rating5 } = req.body;

  const SELECT_QUERY = 'SELECT * FROM emp_ratting WHERE username = ?';
  const INSERT_QUERY = 'INSERT INTO emp_ratting (username, question1, question2, question3, question4, question5) VALUES (?, ?, ?, ?, ?, ?)';
  const UPDATE_QUERY = 'UPDATE emp_ratting SET question1 = ?, question2 = ?, question3 = ?, question4 = ?, question5 = ? WHERE username = ?';

  db.query(SELECT_QUERY, [username], (err, results) => {
    if (err) {
      console.error('Error querying ratings:', err);
      res.status(500).send('An error occurred while submitting your rating.');
      return;
    }

    if (results.length > 0) {
      db.query(UPDATE_QUERY, [rating1, rating2, rating3, rating4, rating5, username], (err, result) => {
        if (err) {
          console.error('Error updating rating:', err);
          res.status(500).send('An error occurred while updating your rating.');
          return;
        }
        res.send('Rating updated successfully!');
      });
    } else {
      db.query(INSERT_QUERY, [username, rating1, rating2, rating3, rating4, rating5], (err, result) => {
        if (err) {
          console.error('Error inserting rating:', err);
          res.status(500).send('An error occurred while submitting your rating.');
          return;
        }
        res.send('Rating submitted successfully!');
      });
    }
  });
});

// Route to serve the team leader details page
app.get('/team-leader-details', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'team-leader-details.html'));
});

// Handle form submission for team leader details
app.post('/team-leader-details', (req, res) => {
  const username = req.session.username;
  const { teamLeaderCode, phoneNumber, userRoleId, deptId, designation } = req.body;

  const SELECT_QUERY = 'SELECT * FROM team_leader_details WHERE username = ?';
  const INSERT_QUERY = 'INSERT INTO team_leader_details (username, team_leader_code, phone_number, user_role_id, dept_id, designation) VALUES (?, ?, ?, ?, ?, ?)';
  const UPDATE_QUERY = 'UPDATE team_leader_details SET team_leader_code = ?, phone_number = ?, user_role_id = ?, dept_id = ?, designation = ? WHERE username = ?';

  db.query(SELECT_QUERY, [username], (err, results) => {
    if (err) {
      console.error('Error querying team leader details:', err);
      res.status(500).send('Error submitting team leader details');
      return;
    }

    if (results.length > 0) {
      db.query(UPDATE_QUERY, [teamLeaderCode, phoneNumber, userRoleId, deptId, designation, username], (err, result) => {
        if (err) {
          console.error('Error updating team leader details:', err);
          res.status(500).send('Error updating team leader details');
          return;
        }
        console.log('Team leader details updated successfully');
        res.redirect('/team-leader-rating'); // Redirect to team leader self-rating page after successful update
      });
    } else {
      db.query(INSERT_QUERY, [username, teamLeaderCode, phoneNumber, userRoleId, deptId, designation], (err, result) => {
        if (err) {
          console.error('Error inserting team leader details:', err);
          res.status(500).send('Error submitting team leader details');
          return;
        }
        console.log('Team leader details submitted successfully');
        res.redirect('/team-leader-rating'); // Redirect to team leader self-rating page after successful insertion
      });
    }
  });
});

// Route to serve the team leader rating page
app.get('/team-leader-rating', (req, res) => {
  const teamLeaderCode = req.session.teamLeaderCode;

  // Query to fetch employee usernames managed by the current team leader
  const SELECT_EMPLOYEES_QUERY = `
    SELECT e.username
    FROM emp_details e
    WHERE e.manager_id = (SELECT manager_id FROM team_leader_details WHERE team_leader_code = ?)`;

  db.query(SELECT_EMPLOYEES_QUERY, [teamLeaderCode], (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      res.status(500).send('Error fetching employees');
      return;
    }

    // Render the team-leader-rating view and pass the employees data
    res.render('team-leader-rating', { employees: results }); // Assuming 'results' contains an array of employee usernames
  });
});

// Route to handle submission of ratings
app.post('/team-leader-submit-rating', (req, res) => {
  const { employeeUsername, rating1, rating2, rating3, rating4, rating5 } = req.body;
  if (!req.session.username) {
    res.status(400).send('Team leader not logged in');
    return;
  }

  const teamLeaderUsername = req.session.username;

  // Check if rating exists, then update; otherwise, insert
  const SELECT_RATING_QUERY = `
    SELECT * FROM team_leader_ratting 
    WHERE team_leader_username = ? AND employee_username = ?`;

  db.query(SELECT_RATING_QUERY, [teamLeaderUsername, employeeUsername], (err, results) => {
    if (err) {
      console.error('Error checking existing rating:', err);
      res.status(500).send('Error submitting rating');
      return;
    }

    if (results.length > 0) {
      // Update existing rating
      const UPDATE_RATING_QUERY = `
        UPDATE team_leader_ratting
        SET question1 = ?, question2 = ?, question3 = ?, question4 = ?, question5 = ?
        WHERE team_leader_username = ? AND employee_username = ?`;

      db.query(UPDATE_RATING_QUERY, [rating1, rating2, rating3, rating4, rating5, teamLeaderUsername, employeeUsername], (err, result) => {
        if (err) {
          console.error('Error updating rating:', err);
          res.status(500).send('Error submitting rating');
          return;
        }
        
        res.redirect('/team-leader-rating');
      });
    } else {
      // Insert new rating
      const INSERT_RATING_QUERY = `
        INSERT INTO team_leader_ratting (team_leader_username, employee_username, question1, question2, question3, question4, question5)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      db.query(INSERT_RATING_QUERY, [teamLeaderUsername, employeeUsername, rating1, rating2, rating3, rating4, rating5], (err, result) => {
        if (err) {
          console.error('Error inserting rating:', err);
          res.status(500).send('Error submitting rating');
          return;
        }
        
        res.redirect('/team-leader-rating');
      });
    }
  });
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/add-deperment-form', (req, res) => {
  console.log("deperment-form");
   res.sendFile(path.join(__dirname, 'views', 'add-deperment-form.html'));
  //res.redirect("/views/deperments-list.html");
});
app.post('/add-department', (req, res) => {
  const { dept_id, depertment_name, team_leader_name } = req.body;

  // Verify if the required fields are present
  if (!dept_id || !depertment_name || !team_leader_name) {
      return res.status(400).send('Bad Request: Missing required fields');
  }

  // Insert data into the database
  const sql = 'INSERT INTO add_depertment (dept_id, depertment_name, team_leader_name) VALUES (?, ?, ?)';
  db.query(sql, [dept_id, depertment_name, team_leader_name], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Server error');
      }
      res.status(200).send('Department added');
  });
});


app.get('/departments', (req, res) => {
  const sql = 'SELECT * FROM add_depertment';
  db.query(sql, (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.render('deperments-list', { departments: results });
      }
  });
});

// Route to render edit form
app.get('/edit/:dept_id', (req, res) => {
  const dept_id = req.params.dept_id;
  const sql = 'SELECT * FROM add_depertment WHERE dept_id = ?';
  db.query(sql, [dept_id], (err, result) => {
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.render('edit-department', { department: result[0] });
      }
  });
});

// Route to handle edit operation
app.post('/edit/:dept_id', (req, res) => {
  const dept_id = req.params.dept_id;
  const { depertment_name, team_leader_name } = req.body;
  
  const sql = 'UPDATE add_depertment SET depertment_name = ?, team_leader_name = ? WHERE dept_id = ?';
  db.query(sql, [depertment_name, team_leader_name, dept_id], (err, result) => {
    console.log("edit department");
    if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.redirect('/departments'); // Redirect to departments list after update
      }
  });
});

// Route to handle delete operation
app.post('/delete/:dept_id', (req, res) => {
  const dept_id = req.params.dept_id;
  
  const sql = 'DELETE FROM add_depertment WHERE dept_id = ?';
  console.log("delete department");
  db.query(sql, [dept_id], (err, result) => {
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.redirect('/departments'); // Redirect to departments list after delete
      }
  });
});


// Route to render the form to add an employee
app.get('/add-employee', (req, res) => {
  console.log("employee-form");
  res.sendFile(path.join(__dirname, 'views', 'add-employee-form.html'));
});

// Route to handle adding a new employee
app.post('/add-employee', (req, res) => {
  const { emp_id, emp_name, deperment_name, role } = req.body;
  // Verify if the required fields are present
  if (!emp_id || !emp_name || !deperment_name || !role) {
      return res.status(400).send('Bad Request: Missing required fields');
  }
  // Insert data into the database
  const sql = 'INSERT INTO add_employee (emp_id, emp_name, deperment_name, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [emp_id, emp_name, deperment_name, role], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Server error');
      }
      res.status(200).send('Employee added');
  });
});

// Route to display the list of employees
app.get('/employees', (req, res) => {
  const sql = 'SELECT * FROM add_employee';
  db.query(sql, (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.render('employee-list', { employees: results });
      }
  });
});

// Route to render edit form
app.get('/edit-emp/:emp_id', (req, res) => {
  const emp_id = req.params.emp_id;
  const sql = 'SELECT * FROM add_employee WHERE emp_id = ?';
  db.query(sql, [emp_id], (err, result) => {
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.render('edit-employee', { employee: result[0] });
      }
  });
});

// Route to handle edit operation

app.post('/edit-emp/:emp_id', (req, res) => {
  const emp_id = req.params.emp_id;
  const { deperment_name, emp_name, role } = req.body;

  const sql = 'UPDATE add_employee SET deperment_name = ?, role = ?, emp_name = ? WHERE emp_id = ?';
  db.query(sql, [deperment_name, role, emp_name, emp_id], (err, result) => {
      console.log("edit employee");
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.redirect('/employees'); // Redirect to employees list after update
      }
  });
});


// Route to handle delete operation
app.post('/delete-emp/:emp_id', (req, res) => {
  const emp_id = req.params.emp_id;

  const sql = 'DELETE FROM add_employee WHERE emp_id = ?';
  console.log("delete employee");
  db.query(sql, [emp_id], (err, result) => {
      if (err) {
          console.error(err);
          res.status(500).send('Server error');
      } else {
          res.redirect('/employees'); // Redirect to employees list after delete
      }
  });
});

app.get('/emp_details1', (req, res) => {
  console.log("employee-profile page");
  res.sendFile(path.join(__dirname, 'views', 'emp_details1.html'));
});

// Endpoint to handle form submission
app.post('/emp_details1', (req, res) => {
  const {
    fullName,
    company,
    job,
    country,
    address,
    phone,
    email,
    twitter,
    facebook,
    linkedin
  } = req.body;

  const sql = 'INSERT INTO emp_details1 (full_name, company, job, country, address, phone, email, twitter_id, facebook_id, linkedin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [fullName, company, job, country, address, phone, email, twitter, facebook, linkedin];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into database:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).send({ message: 'Form submitted successfully', id: result.insertId });
  });
});

// Middleware
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.use(express.urlencoded({ extended: true }));

app.get('/users_profile', (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send('Unauthorized');
  }

  const query = `
    SELECT 
      r.name AS full_name, r.email, ed.* 
    FROM 
      register r
    LEFT JOIN 
      emp_details1 ed 
    ON 
      r.email = ed.email 
    WHERE 
      r.id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user details:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0) {
      const user = results[0];
      res.render('users-profile', {
        fullName: user.full_name,
        company: user.company || '',
        job: user.job || '',
        country: user.country || '',
        address: user.address || '',
        phone: user.phone || '',
        email: user.email,
        twitter: user.twitter || '',
        facebook: user.facebook || '',
        linkedin: user.linkedin || '',
        about: user.about || '',
        emailNotifications: {
          changesMade: user.changesMade || false,
          newProducts: user.newProducts || false,
          proOffers: user.proOffers || false,
          securityAlerts: user.securityAlerts || false,
        }
      });
    } else {
      res.status(404).send('User not found');
    }
  });
});

app.post('/update-profile', (req, res) => {
  const {
    fullName,
    company,
    job,
    country,
    address,
    phone,
    email,
    twitter,
    facebook,
    linkedin
  } = req.body;

  const sql = `
    UPDATE 
      emp_details1 
    SET 
      full_name = ?, 
      company = ?, 
      job = ?, 
      country = ?, 
      address = ?, 
      phone = ?, 
      twitter_id = ?, 
      facebook_id = ?, 
      linkedin_id = ? 
    WHERE 
      email = ?
  `;
  const values = [fullName, company, job, country, address, phone, twitter, facebook, linkedin, email];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating data in database:', err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).send({ message: 'Profile updated successfully' });
  });
});

// View employee details
app.get('/view-emp/:emp_id', (req, res) => {
  const emp_id = req.params.emp_id;
 console.log("if Table: add_employee attribute emp_id Primary match with  Table: emp_details attribute employee_code then Table: emp_details details need to show by click on 'view' button ")
  const sql = `
    SELECT ae.emp_id, ae.emp_name, ae.deperment_name, ae.role, 
           ed.id, ed.work_location, ed.user_role_id, ed.manager_id, ed.deperment, ed.dept_id, ed.username
    FROM add_employee ae
    LEFT JOIN emp_details ed ON ae.emp_id = ed.employee_code
    WHERE ae.emp_id = ?
  `;
  
  db.query(sql, [emp_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    if (result.length === 0) {
      return res.status(404).send('Employee details not found');
    }
    res.render('view-emp', { employee: result[0] }); // Render a view-emp.ejs page with employee details
  });
});

//upload add-employee-form
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
app.post('/upload-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileType = path.extname(req.file.originalname).toLowerCase();
  const newFilename = path.join(__dirname, 'uploads', req.file.filename);

  if (fileType === '.csv') {
    const results = [];
    fs.createReadStream(newFilename)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        results.forEach(row => {
          const { emp_id, emp_name, deperment_name, role } = row;
          const sql = 'INSERT INTO add_employee (emp_id, emp_name, deperment_name, role) VALUES (?, ?, ?, ?)';
          db.query(sql, [emp_id, emp_name, deperment_name, role], (err, result) => {
            if (err) {
              console.error('Error inserting data into database:', err);
            }
            console.log("file uploderd");
          });
        });
        fs.unlinkSync(newFilename);
        res.status(200).send('CSV file uploaded and data inserted successfully.');
      });
  } else if (fileType === '.txt') {
    fs.readFile(newFilename, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        res.status(500).send('Server error');
        return;
      }

      const lines = data.split('\n');
      const header = lines[0].split(',').map(item => item.trim());

      if (header.length !== 4 || header[0] !== 'emp_id' || header[1] !== 'emp_name' || header[2] !== 'deperment_name' || header[3] !== 'role') {
        fs.unlinkSync(newFilename);
        return res.status(400).send('Invalid file format. Ensure the header contains: emp_id, emp_name, deperment_name, role');
      }

      const queries = lines.slice(1).map(line => {
        const [emp_id, emp_name, deperment_name, role] = line.split(',').map(item => item.trim());

        if (!emp_id || !emp_name || !deperment_name || !role) {
          return null;
        }

        const sql = 'INSERT INTO add_employee (emp_id, emp_name, deperment_name, role) VALUES (?, ?, ?, ?)';
        return db.query(sql, [emp_id, emp_name, deperment_name, role], (err, result) => {
          if (err) {
            console.error('Error inserting data into database:', err);
          }
          console.log("file uploderd");
        });
      }).filter(query => query !== null);

      Promise.all(queries).then(() => {
        fs.unlinkSync(newFilename);
        res.status(200).send('.txt file uploaded and data inserted successfully.');
      }).catch(err => {
        console.error('Error executing queries:', err);
        res.status(500).send('Server error');
      });
    });
  } else {
    fs.unlinkSync(newFilename);
    res.status(400).send('Unsupported file type.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
