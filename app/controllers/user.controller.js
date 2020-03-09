const User = require('../models/user.model');

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
            res.statusMessage = "OK";
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