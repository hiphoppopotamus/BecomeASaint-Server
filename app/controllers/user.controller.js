const User = require('../models/user.model');
const validator = require("email-validator");
const cryptoRandomString = require('crypto-random-string');

exports.create = async function (req, res) {
    if (req.body.name === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property name';
        res.status(400)
            .send('Data should have required property name');
        return
    } else if (req.body.email === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property email';
        res.status(400)
            .send('Data should have required property email');
        return
    } else if (req.body.password === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property password';
        res.status(400)
            .send('Data should have required property password');
        return
    }

    const user_data = req.body;
    let name = user_data['name'].toString();
    let email = user_data['email'].toString();
    let password = user_data['password'].toString();

    if (name.length < 1) {
        res.statusMessage = 'Bad Request: data.name should NOT be shorter than 1 characters';
        res.status(400)
            .send('data.name should NOT be shorter than 1 characters');
        return
    } else if (email.length < 1) {
        res.statusMessage = 'Bad Request: data.email should NOT be shorter than 1 characters';
        res.status(400)
            .send('data.email should NOT be shorter than 1 characters');
        return
    } else if (password.length < 1) {
        res.statusMessage = 'Bad Request: data.password should NOT be shorter than 1 characters';
        res.status(400)
            .send('data.password should NOT be shorter than 1 characters');
        return
    } else if (validator.validate(email) === false) {
        res.statusMessage = "Bad Request: data.email should match format \"email\"";
        res.status(400)
            .send("Bad Request: data.email should match format \"email\"");
        return
    }

    try {
        const isInDatabase = await User.checkIfUserInDatabase(email);
        if (isInDatabase) {
            res.statusMessage = "Bad Request: email already in use";
            res.status(400).send();
        } else {
            const userIdResponse = await User.insert(user_data);
            res.statusMessage = "Created";
            res.status(201)
                .send(userIdResponse);
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR creating user ${err}`)
        console.error(err);
    }
};


exports.login = async function (req, res) {
    if (req.body.email === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property email';
        res.status(400)
            .send('Data should have required property email');
        return
    } else if (req.body.password === undefined) {
        res.statusMessage = 'Bad Request: Data should have required property password';
        res.status(400)
            .send('Data should have required property password');
        return
    }

    let email = req.body.email.toString();
    let password = req.body.password.toString();

    if (email.length < 1) {
        res.statusMessage = 'Bad Request: data.email should NOT be shorter than 1 characters';
        res.status(400)
            .send('data.email should NOT be shorter than 1 characters');
        return
    } else if (password.length < 1) {
        res.statusMessage = 'Bad Request: data.password should NOT be shorter than 1 characters';
        res.status(400)
            .send('data.password should NOT be shorter than 1 characters');
        return
    } else if (validator.validate(email) === false) {
        res.statusMessage = "Bad Request: data.email should match format \"email\"";
        res.status(400)
            .send("Bad Request: data.email should match format \"email\"");
        return
    }

    try {
        let token = cryptoRandomString({length: 32, type: 'base64'});
        // CREATE MODEL FUNCTION FOR Dat
        const response = await User.login(email, password, token);
        if (response === undefined) {
            res.statusMessage = "Bad Request: Invalid email/password supplied";
            res.status(400)
                .send('Invalid email/password supplied');
        } else {
            res.statusMessage = "OK";
            res.status(200)
                .send(response);
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR logging in user ${err}`)
    }
};


exports.logout = async function (req, res) {
    const auth_token = req.headers['x-authorization'].toString();
    try {
        const isLoggedOut = await User.logout(auth_token);
        if (isLoggedOut) {
            res.statusMessage = "OK";
            res.status(200).send();
        } else {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR logging out user ${err}`)
    }
};


exports.read = async function (req, res) {
    const userId = req.params.id;
    try {
        const isValidUser = await User.validateUser(userId);
        if (!isValidUser) {
            res.statusMessage = "User Not Found";
            res.status(404)
                .send();
        }

        const auth_token = req.headers['x-authorization'];
        const isMyUser = await User.checkIfIsMyUser(userId, auth_token);
        const response = await User.getUser(userId, isMyUser);
        res.statusMessage = "OK";
        res.status(200)
            .send(response);

    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR getting user ${err}`)
        console.error(err);
    }
    // check if userId matches wit token


}

