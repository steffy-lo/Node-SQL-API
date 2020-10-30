const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

const mysql = require("mysql");
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect(err => {
    if (err) {
        console.log(err)
    } else {
        console.log("MySQL Connected")
    }
})

app.use(express.json());
app.use(cookieParser());

//=========================================== HELPER FUNCTIONS =============================================================

function getBreakdown(type, productCode) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT allocation_date, name, allocation_amount / SUM(allocation_amount) AS allocation_percentage FROM ${type} WHERE code = ?`, 
        [productCode], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(result);
        })
    })
}

function getQueryResults(byCodes, byNames) {
    return new Promise((resolve, reject) => {
        if (!byCodes && !byNames) {
            // select all products
            db.query('SELECT * FROM Products', (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            })

        } else if (byCodes) {
            // if both byCodes and byNames are provided, byNames will be ignored and will only filter by code
            db.query('SELECT * FROM Products WHERE code IN (?)', [byCodes], (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            })

        } else {
            // filter by name
            db.query('SELECT * FROM Products WHERE name IN (?)' + [byNames], (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            })
        }
    })
}

//=========================================== END POINTS ===================================================================

app.get("/", (req, res) => {
    res.send("<h1>Root</h1>")
})

app.post("/register", (req, res) => {
    const { username, password } = req.body

    if (!username || !password) res.status(400).send({message: "Username or password is missing."})

    db.query('SELECT username FROM users WHERE username = ?', [username], async(err, result) => {
        if (err) {
            console.log(err);
        }

        if (result.length > 0) {
            res.send({message: 'The username is already taken.'})
        } else {
            let hashedPassword = await bcrypt.hash(password, 8);
            db.query('INSERT INTO users SET ?', 
            {
                username: username, 
                password: hashedPassword
            }, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                    res.send({message: 'New account for ' + username + ' has been created.'})
                }
            })
        }  

    })
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) res.status(400).send({message: "Username or password is missing."})

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) {
            console.log(err);
        }
        if (!result || !(await bcrypt.compare(password, result[0].password)) ) {
            res.status(401).send({message: "Email or password is incorrect."})
        } else {
            const id = result[0].id;
            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });

            const cookieConfig = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                httpOnly: true
            }

            res.cookie('jwtCookie', token, cookieConfig);
            res.status(200).send({message: "User was successfully logged in."})
        }
    })
})

app.get("/products", (req, res) => {

    const jwtCookie = req.cookies.jwtCookie;

    jwt.verify(jwtCookie, process.env.JWT_SECRET, async (err, data) => {
        if (err) {
            res.status(403).send()
        } else if (data.id) { 
            // we have an authenticated user

            let itemsPerPage = req.query.itemsPerPage;
            let pageNumber = req.query.pageNumber;

            let pagination = false;
            if (itemsPerPage && pageNumber) {
                try {
                    itemsPerPage = parseInt(itemsPerPage);
                    pageNumber = parseInt(pageNumber);
                } catch {
                    res.status(400).send()
                }
                // with pagination
                pagination = { 
                    itemsPerPage, 
                    pageNumber,
                }
            } else if (itemsPerPage || pageNumber) {
                res.status(400).send()
            }

    
            const byCodes = req.query.filterByCodes ? req.query.filterByCodes.split(",") : undefined;
            const byNames = req.query.filterByNames ? req.query.filterByNames.split(",") : undefined;

            let result = await getQueryResults(byCodes, byNames);
            if (pagination) {
                pagination.numberOfPages = Math.ceil(result.length / itemsPerPage);
                result = result.slice(itemsPerPage*(pageNumber - 1), itemsPerPage*pageNumber);
            }

            if (pagination || byCodes || byNames) {
                // Make sure that there's pagination or filter or else dataset will be too large to show breakdown
                const showAssetBreakdown = req.query.showAssetClassBreakdown;
                const showGeographicalBreakdown = req.query.showGeographicalBreakdown;
                if (showAssetBreakdown) {
                    for (let i = 0; i < result.length; i++) {
                        result[i].assetClassBreakdown =  await getBreakdown("assetsbreakdown", result[i].code);
                    }
                }
                if (showGeographicalBreakdown) {
                    for (let i = 0; i < result.length; i++) {
                        result[i].geographicalBreakdown =  await getBreakdown("geographicalbreakdown", result[i].code);
                    }
                }
            }
            const products = {pagination, items: result};
            res.send(products);
        }
    })
})

// Express server listening...
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});