// const express = require('express');
// const path = require('path');
// const mysql = require('mysql');
// const bodyParser = require('body-parser');
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Set Handlebars as the view engine
// app.set('view engine', 'hbs');

// // Serve static files from node_modules
// app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
// app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
// app.use('/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

// // Serve static files from the "public" directory
// app.use(express.static(path.join(__dirname, 'public')));

// // Use body-parser middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // MySQL Database Connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root', // default MySQL username in XAMPP
//   password: '', // default MySQL password in XAMPP is empty
//   database: 'employee', // name of the database you created
// });

// // Connect to MySQL
// db.connect((err) => {
//   if (err) {
//     throw err;
//   }
//   console.log('Connected to MySQL database');
// });

// // Route to serve the registration page
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'register.html'));
// });

// app.post('/register', (req, res) => {
//   const { name, email, username, password } = req.body;
//   const INSERT_USER_QUERY = 'INSERT INTO register (name, email, username, password) VALUES (?, ?, ?, ?)';

//   db.query(INSERT_USER_QUERY, [name, email, username, password], (err, result) => {
//     if (err) {
//       console.error('Error inserting user:', err);
//       res.status(500).send('Error registering user');
//       return;
//     }
//     console.log('User registered successfully');
//     res.redirect('/login'); // Redirect to login page after successful registration
//   });
// });

// // Route to serve the login page
// app.get('/login', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'login.html'));
// });

// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   const SELECT_USER_QUERY = 'SELECT * FROM register WHERE username = ? AND password = ?';

//   db.query(SELECT_USER_QUERY, [username, password], (err, results) => {
//     if (err) {
//       console.error('Error querying user:', err);
//       res.status(500).send('Error logging in');
//       return;
//     }

//     if (results.length > 0) {
//       console.log('Login successful');
//       res.redirect('/emp-details'); // Redirect to employee details page after successful login
//     } else {
//       console.log('Invalid username or password');
//       res.status(401).send('Invalid username or password');
//     }
//   });
// });

// // Route to serve the employee details page
// app.get('/emp-details', (req, res) => {
//   res.sendFile(path.join(__dirname, 'views', 'emp-details.html'));
// });

// app.post('/emp-details', (req, res) => {
//   const { employeeCode, phoneNumber, userRoleId, managerId, designation, deptId } = req.body;
//   const INSERT_EMPLOYEE_QUERY = 'INSERT INTO emp-details (employee-code, phone-number, user-role-id, manager-id, designation, dept-id) VALUES (?, ?, ?, ?, ?, ?)';

//   db.query(INSERT_EMPLOYEE_QUERY, [employeeCode, phoneNumber, userRoleId, managerId, designation, deptId], (err, result) => {
//     if (err) {
//       console.error('Error inserting employee details:', err);
//       res.status(500).send('Error submitting employee details');
//       return;
//     }
//     console.log('Employee details submitted successfully');
//     res.redirect('/emp-details'); // Redirect to employee details page after successful submission
//   });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });





const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
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

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
  const { name, email, username, password } = req.body;
  const INSERT_USER_QUERY = 'INSERT INTO register (name, email, username, password) VALUES (?, ?, ?, ?)';

  db.query(INSERT_USER_QUERY, [name, email, username, password], (err, result) => {
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
      console.log('Login successful');
      res.redirect('/emp-details'); // Redirect to employee details page after successful login
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
  const { employeeCode, phoneNumber, userRoleId, managerId, designation, deptId } = req.body;
  const INSERT_EMPLOYEE_QUERY = 'INSERT INTO emp_details (employee_code, phone_number, user_role_id, manager_id, designation, dept_id) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(INSERT_EMPLOYEE_QUERY, [employeeCode, phoneNumber, userRoleId, managerId, designation, deptId], (err, result) => {
    if (err) {
      console.error('Error inserting employee details:', err);
      res.status(500).send('Error submitting employee details');
      return;
    }
    console.log('Employee details submitted successfully');
    res.redirect('/emp-details'); // Redirect to employee details page after successful submission
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
