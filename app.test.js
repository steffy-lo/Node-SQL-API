const request = require("supertest");
const {app, db, server, addUser} = require("./app");

const deleteUser = username => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM users WHERE username = ?", [username], function (err, result) {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(result);
          });
    })
}

beforeEach(async() => {
    await addUser('admin', 'admin');
    await deleteUser('test');
})

afterAll(done => {
    // Closing the DB connection allows Jest to exit successfully.
    db.end();
    server.close();
    done()
})

test('Should register a new user', async() => {
    await request(app).post('/register')
    .send({
        username: 'test',
        password: 'test',
    })
    .expect(200, {message: 'New account for test has been created.'})
})

test('Should send a bad request during registration', async() => {
    await request(app).post('/register')
    .send({ 
        username: 'test',
    })
    .expect(400, {message: "Username or password is missing."})
})

test('Should log in successfully', async() => {
    await request(app).post('/login')
    .send({
        username: 'admin',
        password: 'admin'
    })
    .expect(200, {message: "User was successfully logged in."})

})

test('Should log in unsuccessfully', async() => {
    await request(app).post('/login')
    .send({
        username: 'admin',
        password: 'password'
    })
    .expect(401, {message: "Username or password is incorrect."})

})

test('Unauthorized request for products', async() => {
    await request(app).get('/products')
    .expect(403, {message: "Unauthorized"})
})