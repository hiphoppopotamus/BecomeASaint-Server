const petitions = require('../controllers/petition.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.list)
        .post(petitions.create);

    app.route(app.rootUrl + '/petitions/:id')
        .get(petitions.read)
        .patch(petitions.update);
};