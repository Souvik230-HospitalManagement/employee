const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
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
      req.session.username = username; // Store username in session
      const userDesignation = results[0].designation; // Assuming 'designation' is the column name in your database
      console.log(`Login successful. User Designation: ${userDesignation}`);

      if (userDesignation === 'Employee') {
        res.redirect('/emp-details'); // Redirect to employee details page after successful login
      } else if (userDesignation === 'Team Leader') {
        res.redirect('/team-leader-details'); // Redirect to team leader welcome page
      } else {
        res.status(403).send('Unauthorized access');
      }
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
  const INSERT_QUERY = 'INSERT INTO emp_details (username, employee_code, phone_number, user_role_id, manager_id, deperment, dept_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const UPDATE_QUERY = 'UPDATE emp_details SET employee_code = ?, phone_number = ?, user_role_id = ?, manager_id = ?, deperment = ?, dept_id = ? WHERE username = ?';

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
// Route to serve the team leader rating page
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});





