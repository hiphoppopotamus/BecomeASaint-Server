const petitions = require('../controllers/petition.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.list);
        // .post(petitions.create)
}