const User = require('../models/user.model');



// The response will contain a (unique) randomly-generated token that the
// client-side should store. Whenever the client makes a request that
// requires authentication, it should provide that same token as the
// value of the `X-Authorization` header in the request.
// The server will compare this to the value it has stored in the database
// to authenticate that request.",
exports.login = async function (req, res) {

    let emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;

    if (typeof req.body.email === 'undefined') {
        res.statusMessage = 'Bad Request: Data should have required property email';
        res.status(400)
            .send('Data should have required property email');
        return
    } else if (typeof req.body.password === 'undefined') {
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
    } else if (emailRegex.test(email) === false) {
        res.statusMessage = "Bad Request: data.email should match format \"email\"";
        res.status(400)
            .send("Bad Request: data.email should match format \"email\"");
        return
    }

    try {
        const result = await User.login(email, password);
        if (typeof result === 'undefined') {
            res.statusMessage = "Bad Request: Invalid email/password supplied";
            res.status(400)
                .send('Invalid email/password supplied');
        } else {
            res.statusMessage = "OK";
            res.status(200)
                .send(result);
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR creating user ${err}`)

        // console.log(err instanceof TypeError);
        // if (err instanceof TypeError) {
        //     res.statusMessage = "Bad Request: Internal Server Error";
        //     res.status(400)
        //         .send(`ERROR creating user ${err}`)
        //
        // } else {
        //     res.statusMessage = "Internal Server Error";
        //     res.status(500)
        //         .send(`ERROR creating user ${err}`)
        // }
    }
}

exports.create = async function (req, res) {
    try {
        let user_data = req.body;
        let emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;

        if (emailRegex.test(user_data['email'].toString()) === false) {
            res.statusMessage = "Email should be valid";
            res.status(400)
                .send(`${user_data['email']} is an invalid email`);
        } else if (user_data['password'].toString() === "") {
            res.statusMessage = "Password should not be empty";
            res.status(400)
                .send('Password should not be empty');
        } else {
            const result = await User.insert(user_data);
            //check in db result
            res.statusMessage = "Created";
            res.status(201)
                .send(result);
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR creating user ${err}`)
    }
};