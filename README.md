# Getting Started
To test locally...

### 1. Initialize environment variables in your .env file

Example

```
DATABASE = test
DATABASE_HOST = localhost
DATABASE_USER = root
DATABASE_PASSWORD = 
JWT_SECRET = jwtsecretpassword
JWT_EXPIRES_IN = 1d
JWT_COOKIE_EXPIRES = 1
```

### 2. Run the server
```
npm start
```

# Endpoints

## POST /register
Creates a new user with the given username and password (if a user with the given username doesn't already exist).

## POST /login
Authenticates a user who is successfully logged in by creating a new session cookie.

## GET /products
A protected route that gets products stored in the database.
Query parameters:
- itemsPerPage (number)
- pageNumber (number)
- showAssetClassBreakdown ("true" or "false")
- showGeographicalBreakdown ("true" or "false")
- filterByCodes (list)
- filterByNames (list)

Pagination is turned on if itemsPerPage **and** pageNumber is specified, turned off if either or both is not specified.

# Using ESLint
## CLI
```
eslint app.js
```
## Visual Studio Code
Install the ESLint extension

# Unit Tests
```
npm run test
```