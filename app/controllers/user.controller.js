const User = require('../models/user.model');
const emailValidator = require('email-validator');
const cryptoRandomString = require('crypto-random-string');
const _ = require('underscore');
const fs = require('mz/fs');

const PHOTO_DIRECTORY = './storage/photos/';


exports.create = async function (req, res) {
    const userData = req.body;

    if (userData['name'] === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property name';
        res.status(400)
            .send('Data should have required property name');
        return
    } else if (userData['email'] === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property email';
        res.status(400)
            .send('Data should have required property email');
        return
    } else if (userData['password'] === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property password';
        res.status(400)
            .send('Data should have required property password');
        return
    }

    for (let property in userData) {
        if (typeof userData[property] !== "string") {
            res.statusMessage = 'Bad Request: ' + property + ' should be string';
            res.status(400)
                .send('Bad Request: ' + property + ' should be string');
            return
        } else if (userData[property].toString().length < 1) {
            res.statusMessage = 'Bad Request: ' + property + ' should NOT be shorter than 1 characters';
            res.status(400)
                .send('Bad Request: ' + property + ' should NOT be shorter than 1 characters');
            return
        } else if (property === 'email' && !emailValidator.validate(userData['email'].toString())) {
            res.statusMessage = 'Bad Request: ' + userData['email'] + ' should match format \'email\'';
            res.status(400)
                .send('Bad Request: ' + userData['email'] + ' should match format \'email\'');
            return
        }
    }

    try {
        let email = userData['email'].toString();
        const isInDatabase = await User.checkIfUserInDatabase(email);
        if (isInDatabase) {
            res.statusMessage = 'Bad Request: email already in use';
            res.status(400).send();
        } else {
            const userIdResponse = await User.insert(userData);
            res.statusMessage = 'Created';
            res.status(201)
                .send(userIdResponse);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR creating user ${err}`);
        console.error(err);
    }
};


exports.login = async function (req, res) {
    if (req.body['email'] === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property email';
        res.status(400)
            .send('Data should have required property email');
        return
    } else if (req.body['password'] === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property password';
        res.status(400)
            .send('Data should have required property password');
        return
    }

    for (let property in req.body) {
        if (typeof req.body[property] !== "string") {
            res.statusMessage = 'Bad Request: ' + property + ' should be string';
            res.status(400)
                .send('Bad Request: ' + property + ' should be string');
            return
        } else if (req.body[property].toString().length < 1) {
            res.statusMessage = 'Bad Request: ' + property + ' should NOT be shorter than 1 characters';
            res.status(400)
                .send('data.name should NOT be shorter than 1 characters');
            return
        }
    }

    let email = req.body['email'].toString();
    let password = req.body['password'].toString();

    if (!emailValidator.validate(email)) {
        res.statusMessage = 'Bad Request: data.email should match format \'email\'';
        res.status(400)
            .send('Bad Request: data.email should match format \'email\'');
        return
    }

    try {
        let token = cryptoRandomString({length: 32, type: 'base64'});
        let isInDatabase = await User.checkIfUserInDatabase(email);
        if (!isInDatabase) {
            res.statusMessage = 'Bad Request: Invalid email/password supplied';
            res.status(400)
                .send('Invalid email/password supplied');
            return
        }

        let isCorrectPassword = await User.checkCurrentPassword(email, password);
        if (!isCorrectPassword) {
            res.statusMessage = 'Bad Request: Invalid email/password supplied';
            res.status(400)
                .send('Invalid email/password supplied');
            return
        }

        await User.updateToken(email, token);
        const response = await User.login(email, token);
        if (response === undefined) {
            res.statusMessage = 'Bad Request: Invalid email/password supplied';
            res.status(400)
                .send('Invalid email/password supplied');
        } else {
            res.statusMessage = 'OK';
            res.status(200)
                .send(response);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR logging in user ${err}`)
    }
};


exports.logout = async function (req, res) {
    const authToken = req.headers['x-authorization'].toString();
    try {
        const isLoggedOut = await User.logout(authToken);
        if (isLoggedOut) {
            res.statusMessage = 'OK';
            res.status(200).send();
        } else {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR logging out user ${err}`)
    }
};


exports.read = async function (req, res) {
    const userId = req.params.id;
    try {
        const isValidUser = await User.validateUser(userId);
        if (!isValidUser) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("User Not Found");
            return
        }

        const authToken = req.headers['x-authorization'];
        const isMyUser = await User.checkIfIsUserIdLoggedIn(userId, authToken);
        const response = await User.getUser(userId, isMyUser);
        res.statusMessage = 'OK';
        res.status(200)
            .send(response);
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR getting user ${err}`)
        console.error(err);
    }
};


exports.update = async function (req, res) {
    // updating name, email, password, city, country
    const userId = req.params.id;
    const authToken = req.headers['x-authorization'];
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        const isValidUser = await User.validateUser(userId);
        if (!isValidUser) {
            console.log('User provided is not a valid user!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("User Not Found");
            return
        }

        // checks if user is logged in with user provided in params.id
        const isMyUser = await User.checkIfIsUserIdLoggedIn(userId, authToken);
        if (!isMyUser) {
            console.log('I am not logged in as user id from params!');
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send();
            return
        }

        const userData = req.body;
        if (_.isEmpty(userData)) {
            res.statusMessage = 'Bad Request: you must provide some details to update';
            res.status(400)
                .send();
            return
        }

        for (let property in userData) {
            if (userData[property] !== undefined && typeof userData[property] !== "string") {
                res.statusMessage = 'Bad Request: ' + property + ' should be string';
                res.status(400)
                    .send('Bad Request: ' + property + ' should be string');
                return
            } else if (userData[property] !== undefined && userData[property].toString().length < 1) {
                res.statusMessage = 'Bad Request: ' + property + ' should NOT be shorter than 1 characters';
                res.status(400)
                    .send('data.name should NOT be shorter than 1 characters');
                return
            }
        }

        if (userData['email'] !== undefined && !emailValidator.validate(userData['email'].toString())) {
            res.statusMessage = 'Bad Request: ' + userData['email'] + ' should match format \'email\'';
            res.status(400)
                .send('Bad Request: ' + userData['email'] + ' should match format \'email\'');
            return
        } else if (userData['password'] === undefined) {
            res.statusMessage = 'Internal Server Error';
            res.status(500)
                .send('Please provide password that you want to change to');
            return
        }

        // check if currentPassword correct
        // includes case if currentPassword is null
        let isCurrentPassword = await User.checkCurrentPassword(parseInt(userId), userData['currentPassword']);
        if (!isCurrentPassword) {
            res.statusMessage = 'Bad Request: incorrect password';
            res.status(400)
                .send('incorrect password');
            return
        }

        let emailIsInUse = await User.checkIfEmailAlreadyInUse(userId, userData['email']);
        if (emailIsInUse) {
            res.statusMessage = 'Bad Request: email ' + userData['email'] + ' is already in use';
            res.status(400)
                .send('Bad Request: email ' + userData['email'] + ' is already in use');
            return
        }

        let affectedRows = await User.alter(userId, userData);
        res.statusMessage = 'OK';
        res.status(200)
            .send("Affected rows: " + affectedRows);
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
        console.error(err);
    }
};


exports.readPhoto = async function (req, res) {
    const userId = req.params.id;
    // check if user has photo
    try {
        const isValidUser = await User.validateUser(userId);
        if (!isValidUser) {
            console.log('User provided is not a valid user!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send('User Not Found');
            return
        }

        const filename = await User.getUserPhotoFilename(userId);
        if (!filename) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send('User does not have photo');
        } else {
            let photo = `${PHOTO_DIRECTORY}${filename}`;
            console.log(photo);
            res.statusMessage = 'OK';
            res.status(200)
                .download(photo);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
        console.error(err);
    }
};


exports.uploadPhoto = async function (req, res) {
    // Check if a user is logged in by validating userId and token
    // if not logged in 401 Unauthorised (no auth token) or IF AUTH TOKEN IS NOT IN DATABASE
    const userId = req.params.id;
    const authToken = req.headers['x-authorization'];
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        // if user not valid (like user dont exist) 404
        const isValidUser = await User.validateUser(userId);
        if (!isValidUser) {
            console.log('User provided is not a valid user!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("User Not Found");
            return
        }

        // if logged in but not my token 403 Forbidden
        const isMyUser = await User.checkIfIsUserIdLoggedIn(userId, authToken);
        if (!isMyUser) {
            console.log('I am not logged in as user id from params!');
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send('Cannot change other users photo');
            return
        }

        let acceptableFormats = ['png', 'jpg', 'jpeg', 'gif'];
        let format = req.headers['content-type'].toString().split('/')[1];
        if (!acceptableFormats.includes(format)) {
            res.statusMessage = `Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: image/${format}`;
            res.status(400)
                .send('Invalid file type');
            return
        }

        let filename = `user_${userId}.${format}`;
        await fs.writeFile('./storage/default/' + filename, req.body, 'binary', () => {});

        let currentPhoto = await User.getUserPhotoFilename(userId);
        await User.insertPhoto(userId, filename);
        if (!currentPhoto) {
            res.statusMessage = 'Created';
            res.status(201)
                .send(`Inserted photo`);
        } else {
            res.statusMessage = 'OK';
            res.status(200)
                .send(`Inserted photo`);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
        console.error(err);
    }
};


exports.deletePhoto = async function (req, res) {
    const userId = req.params.id;
    const authToken = req.headers['x-authorization'];
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        // if user not valid (like user dont exist) 404
        const isValidUser = await User.validateUser(userId);
        if (!isValidUser) {
            console.log('User provided is not a valid user!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("User Not Found");
            return
        }

        // if logged in but not my token 403 Forbidden
        const isMyUser = await User.checkIfIsUserIdLoggedIn(userId, authToken);
        if (!isMyUser) {
            console.log('I am not logged in as user id from params!');
            res.statusMessage = 'Forbidden';
            res.status(403)
                .send('Cannot change other users photo');
            return
        }

        let currentPhoto = await User.getUserPhotoFilename(userId);
        if (!currentPhoto) {
            console.log('User provided does not have a photo to delete!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send();
            return
        } else {
            let affectedRows = await User.deletePhoto(userId);
            res.statusMessage = 'OK';
            res.status(200)
                .send("Deleted row: " + affectedRows);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
        console.error(err);
    }
};

