const User = require('../models/user.model');
const Petition = require('../models/petition.model');
const _ = require('underscore');
const moment = require('moment');

exports.list = async function (req, res) {
    const petitionFilter = req.query;
    if (petitionFilter) {
        let acceptableSortFilters = ['ALPHABETICAL_ASC', 'ALPHABETICAL_DESC', 'SIGNATURES_ASC', 'SIGNATURES_DESC'];
        for (let filter in petitionFilter) {
            if (filter === 'q') {
                if (petitionFilter[filter].toString().length < 1) {
                    res.statusMessage = 'Bad Request: ' + filter + ' should be integer';
                    res.status(400).send();
                    return
                }
            } else if (filter === "sortBy") {
                if (!acceptableSortFilters.includes(petitionFilter[filter])) {
                    res.statusMessage = 'Bad Request: ' + filter + ' should be equal to one of the allowed values';
                    res.status(400).send();
                    return
                }
            } else if (filter !== 'q' && filter !== 'sortBy') {
                // checks if number given is a string
                if (isNaN(petitionFilter[filter])) {
                    res.statusMessage = 'Bad Request: ' + filter + ' should be integer';
                    res.status(400).send();
                    return
                }
            }
        }
    }

    try {
        let categoryIdExists = await Petition.checkCategoryId(petitionFilter['categoryId']);
        if (!categoryIdExists && petitionFilter['categoryId']) {
            res.statusMessage = 'Bad Request: invalid category ID';
            res.status(400)
                .send('invalid category ID');
            return
        }

        let q = petitionFilter['q'];
        let categoryId = petitionFilter['categoryId'];
        let authorId = petitionFilter['authorId'];
        let sortBy = petitionFilter['sortBy'];
        let count = petitionFilter['count'];
        let startIndex = petitionFilter['startIndex'];

        let filters = {
            "searchTerm": q,
            "categoryId": categoryId,
            "authorId": authorId
        };

        let filteredPetitions = await Petition.getFilteredPetitions(filters, sortBy, count, startIndex);
        res.statusMessage = "OK";
        res.status(200)
            .send(filteredPetitions);
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR getting petitions ${err}`)
    }
};


exports.create = async function (req, res) {
    const authToken = req.headers['x-authorization'];
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        let petitionData = req.body;
        if (petitionData['title'] === undefined) {
            res.statusMessage = 'Bad Request: Data should have required property title';
            res.status(400)
                .send('Data should have required property title');
            return
        } else if (petitionData['description'] === undefined) {
            res.statusMessage = 'Bad Request: Data should have required property description';
            res.status(400)
                .send('Data should have required property description');
            return
        } else if (petitionData['categoryId'] === undefined) {
            res.statusMessage = 'Bad Request: Data should have required property categoryId';
            res.status(400)
                .send('Data should have required property categoryId');
            return
        } else if (petitionData['closingDate'] === undefined) {
            res.statusMessage = 'Bad Request: Data should have required property closingDate';
            res.status(400)
                .send('Data should have required property closingDate');
            return
        }

        for (let property in petitionData) {
            if (property !== 'categoryId') {
                if (typeof petitionData[property] !== "string") {
                    res.statusMessage = 'Bad Request: ' + property + ' should be string';
                    res.status(400)
                        .send('Bad Request: ' + property + ' should be string');
                    return
                } else if (property !== 'closingDate' && petitionData[property].toString().length < 1) {
                    res.statusMessage = 'Bad Request: ' + property + ' should NOT be shorter than 1 characters';
                    res.status(400)
                        .send('Bad Request: ' + property + ' should NOT be shorter than 1 characters');
                    return
                }
            }

            if (property === 'categoryId') {
                if (typeof petitionData[property] !== "number") {
                    res.statusMessage = 'Bad Request: ' + property + ' should be integer';
                    res.status(400).send();
                    return
                }
            }

            if (property === 'closingDate') {
                if (!moment(petitionData[property], moment.ISO_8601, true).isValid()) {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send();
                    console.log('closing date invalid')
                    return
                } else if (moment(petitionData[property]).isBefore(new Date())) {
                    res.statusMessage = 'Bad Request: ' + property + ' must be in the future';
                    res.status(400).send();
                    console.log('date is before today!')
                    return
                }
            }
        }

        let categoryIdExists = await Petition.checkCategoryId(petitionData['categoryId']);
        if (!categoryIdExists && petitionData['categoryId']) {
            res.statusMessage = 'Bad Request: categoryId does not match any existing category';
            res.status(400)
                .send('invalid category ID');
            return
        }

        let userId = await User.getUserIdFromToken(authToken);
        let insertIdResponse = await Petition.insert(petitionData, userId);
        res.statusMessage = 'Created';
        res.status(201)
            .send(insertIdResponse);


        // Check if logged in to do anything X-AUTH
        // if not logged in: 401 Unauthorized
        // not null

        // title and description must be string > 1 and not null
        // category id must exist in db
        // closing date must be a date or else returns internal server error

        // If logged in 201 Created



    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
        console.error(err);
    }
};


exports.read = async function (req, res) {
    const petitionId = req.params.id;
    try {
        let response = await Petition.getOne(petitionId);
        if (response === undefined) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("User Not Found");
        } else {
            res.statusMessage = 'OK';
            res.status(200)
                .send(response);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR getting petition ${err}`)
    }
};


exports.update = async function(req, res) {
    
}