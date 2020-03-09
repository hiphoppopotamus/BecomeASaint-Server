const users = require('../controllers/user.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(users.create);
    // .post(petitions.create)
}