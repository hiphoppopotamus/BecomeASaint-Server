const User = require('../models/user.model');
const Petition = require('../models/petition.model');
const Category = require('../models/category.model');
const Signature = require('../models/signature.model');
const _ = require('underscore');
const moment = require('moment');
const fs = require('mz/fs');

const PHOTO_DIRECTORY = './storage/photos/';


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
        let categoryIdExists = await Category.checkCategoryId(petitionFilter['categoryId']);
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

        let categoryIdExists = await Category.checkCategoryId(petitionData['categoryId']);
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
                .send("Petition Not Found");
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


exports.update = async function (req, res) {
    const authToken = req.headers['x-authorization'];
    const petitionId = req.params.id;
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        let isValidPetition = await Petition.validatePetition(petitionId);
        if (!isValidPetition) {
            console.log('Petition provided is not a valid petition!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("Petition Not Found");
            return
        }

        const userId = await User.getUserIdFromToken(authToken);
        const isMyUser = await User.checkIfIsUserIdLoggedIn(userId, authToken);
        if (!isMyUser) {
            console.log('I am not logged in as user id from params!');
            res.statusMessage = 'Forbidden';
            res.status(403).send();
            return
        }

        const petitionIsBelongsToUser = await Petition.checkIfPetitionBelongsToUser(petitionId, userId);
        if (!petitionIsBelongsToUser) {
            console.log(`This is not my petition! I can't modify it!`);
            res.statusMessage = 'Forbidden';
            res.status(403).send();
            return
        }


        const petitionData = req.body;
        let validProperties = ['title', 'description', 'categoryId', 'closingDate']
        let validPropertyExists = false;
        for (let property in petitionData) {
            if (!validProperties.includes(property)) {
                console.log('asdasas')
                continue;
            }

            validPropertyExists = true;
            if (property !== 'categoryId') {
                if (typeof petitionData[property] !== 'string') {
                    res.statusMessage = 'Bad Request: ' + property + ' should be string';
                    res.status(400)
                        .send('Bad Request: ' + property + ' should be string');
                    return
                } else if (property === 'title' && petitionData[property].toString().length < 1) {
                    res.statusMessage = 'Bad Request: ' + property + ' should NOT be shorter than 1 characters';
                    res.status(400)
                        .send('data.title should NOT be shorter than 1 characters');
                    return
                }
            } else if (property === 'categoryId'  && typeof petitionData[property] !== 'number') {
                res.statusMessage = 'Bad Request: ' + property + ' should be integer';
                res.status(400)
                    .send('Bad Request: ' + property + ' should be integer');
                return
            }
        }

        if (!validPropertyExists) {
            res.statusMessage = 'Bad Request: no valid fields provided';
            res.status(400)
                .send();
            return
        }

        let date = moment(petitionData['closingDate']);
        console.log(date.isValid());
        if (!date.isValid()) {
            res.statusMessage = 'Internal Server Error';
            res.status(500).send();
        }

        if (moment(petitionData['closingDate']).isBefore(new Date())) {
            res.statusMessage = 'Bad Request: closing date must be in the future';
            res.status(400).send();
            return
        }

        let categoryIdExists = await Category.checkCategoryId(petitionData['categoryId']);
        if (!categoryIdExists && petitionData['categoryId']) {
            res.statusMessage = 'Internal Server Error';
            res.status(500).send();
            return
        }

        let affectedRows = await Petition.alter(petitionId, petitionData);
        res.statusMessage = 'OK';
        res.status(200)
            .send("Affected rows: " + affectedRows);
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR updating petition ${err}`)
    }
};


exports.remove = async function (req, res) {
    const authToken = req.headers['x-authorization'];
    const petitionId = req.params.id;
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        let isValidPetition = await Petition.validatePetition(petitionId);
        if (!isValidPetition) {
            console.log('Petition provided is not a valid petition!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("Petition Not Found");
            return
        }

        const userId = await User.getUserIdFromToken(authToken);
        const isMyUser = await User.checkIfIsUserIdLoggedIn(userId, authToken);
        if (!isMyUser) {
            console.log('I am not logged in as user id from params!');
            res.statusMessage = 'Forbidden';
            res.status(403).send();
            return
        }

        const petitionIsBelongsToUser = await Petition.checkIfPetitionBelongsToUser(petitionId, userId);
        if (!petitionIsBelongsToUser) {
            console.log(`This is not my petition! I can't modify it!`);
            res.statusMessage = 'Forbidden';
            res.status(403).send();
            return
        }

        // Only accessible to the author of the petition. All signatures for the petition will also be deleted.

        await Signature.deleteByPetitionId(petitionId);
        let affectedRows = await Petition.deleteOne(petitionId, userId);
        res.statusMessage = 'OK';
        res.status(200)
            .send("Deleted row: " + affectedRows);
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR deleting petition ${err}`)
    }
};


exports.readPhoto = async function (req, res) {
    const petitionId = req.params.id;
    try {
        const isValidPetition = await Petition.validatePetition(petitionId);
        if (!isValidPetition) {
            console.log('Petition provided is not a valid petition!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send('Petition Not Found');
            return
        }

        const filename = await Petition.getPetitionPhotoFilename(petitionId);
        if (!filename) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send('Petition does not have photo');
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
    const petitionId = req.params.id;
    const authToken = req.headers['x-authorization'];
    try {
        let authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        // if petition not valid (like petition dont exist) 404
        const isValidPetition = await Petition.validatePetition(petitionId);
        if (!isValidPetition) {
            console.log('Petition provided is not a valid petition!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("Petition Not Found");
            return
        }

        const userId = await User.getUserIdFromToken(authToken);
        const authorId = await Petition.getAuthor(petitionId);
        if (userId !== authorId) {
            console.log('Petition author id does not match User ID from Auth Token');
            res.statusMessage = 'Forbidden';
            res.status(403).send('Auth token does not match User Id');
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

        let filename = `petition_${petitionId}.${format}`;
        await fs.writeFile('./storage/default/' + filename, req.body, 'binary', () => {});

        let currentPhoto = await Petition.getUserPhotoFilename(petitionId);
        await Petition.insertPhoto(petitionId, filename);
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
