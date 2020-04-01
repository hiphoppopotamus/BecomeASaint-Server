const db = require('../../config/db');


exports.getFilteredPetitions = async function (filters, sortBy, count, startIndex) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT p.petition_id AS petitionId, ' +
                       'p.title AS title, ' +
                       'c.name AS category, ' +
                       'u.name AS authorName, ' +
                       '(SELECT COUNT(*) ' +
                          'FROM Signature AS s ' +
                         'WHERE p.petition_id = s.petition_id) AS signatureCount ' +
                  'FROM Petition AS p ' +
            'INNER JOIN Category AS c ON p.category_id = c.category_id ' +
            'INNER JOIN User AS u ON p.author_id = u.user_id ';

    let value = [];
    let whereInserted = false;

    for (let term in filters) {
        if (!filters[term]) {
            continue;
        }

        if (!whereInserted) {
            query += 'WHERE ';
            whereInserted = true;
        } else {
            query += 'AND ';
        }

        if (term === 'searchTerm') {
            query += 'p.title LIKE ? ';
            value.push('%' + filters[term] + '%');
        } else if (term === 'categoryId') {
            query += 'p.category_id = ? ';
            value.push(filters[term]);
        } else if (term === 'authorId') {
            query += 'p.author_id = ? ';
            value.push(filters[term]);
        }
    }


    if (!sortBy) {
        query += 'ORDER BY signatureCount DESC, petitionId ASC';
    } else {
        if (sortBy === "ALPHABETICAL_ASC") {
            query += 'ORDER BY p.title ASC, petitionId ASC';
        } else if (sortBy === "ALPHABETICAL_DESC") {
            query += 'ORDER BY p.title DESC, petitionId ASC';
        } else if (sortBy === "SIGNATURES_ASC") {
            query += 'ORDER BY signatureCount ASC, petitionId ASC';
        } else if (sortBy === "SIGNATURES_DESC") {
            query += 'ORDER BY signatureCount DESC, petitionId ASC';
        }
    }

    let [petitionResults] = await connection.query(query, value);

    if (startIndex) {
        petitionResults = petitionResults.slice(startIndex);
    }

    if (count) {
        petitionResults = petitionResults.slice(0, count);
    }

    connection.release();
    return petitionResults
};


exports.insert = async function (petitionData, userId) {
    const connection = await db.getPool().getConnection();
    let values = [
        [petitionData['title'].toString()],
        [petitionData['description'].toString()],
        [userId],
        [petitionData['categoryId']],
        [new Date()],
        [petitionData['closingDate'].toString()]
    ];

    let query = 'INSERT INTO Petition (title, description, author_id, category_id, created_date, closing_date) ' +
                'VALUES (?, ?, ?, ?, ?, ?)';
    let [rows] = await connection.query(query, values);
    let response = {"petitionId" : rows.insertId};

    connection.release();
    return response;
};


exports.getOne = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT p.petition_id AS petitionId, p.title, p.description, p.author_id AS authorId, ' +
                       'u.name AS authorName, u.city AS authorCity, u.country AS authorCountry, ' +
                       '(SELECT COUNT(*) ' +
                          'FROM Signature AS s ' +
                         'WHERE p.petition_id = s.petition_id) AS signatureCount, ' +
                       'c.name as category, p.created_date as createdDate, p.closing_date as closingDate ' +
                  'FROM Petition AS p ' +
            'INNER JOIN User AS u ON p.author_id = u.user_id ' +
            'INNER JOIN Category AS c ON p.category_id = c.category_id ' +
            'WHERE petition_id = ?';
    let [rows] = await connection.query(query, [petitionId]);

    connection.release();
    return rows[0];
};


exports.validatePetition = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM Petition WHERE petition_id = ?';
    let [rows] = await connection.query(query, petitionId);
    let isValidPetition = false;

    if (rows[0] !== undefined) {
        isValidPetition = true;
    }

    connection.release();
    return isValidPetition;
};


exports.getAuthor = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT author_id FROM Petition WHERE petition_id = ?';
    let [rows] = await connection.query(query, petitionId);

    connection.release();
    return rows[0]['author_id'];
};


exports.checkIfPetitionBelongsToUser = async function (petitionId, userId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM Petition WHERE petition_id = ? AND author_id = ?';
    let values = [
        [petitionId],
        [userId]
    ];
    let [rows] = await connection.query(query, values);
    let isBelongsToUser = false;

    if (rows[0] !== undefined) {
        isBelongsToUser = true;
        console.log("Petition belongs to user " + userId)
    }

    connection.release();
    return isBelongsToUser;
};


exports.alter = async function (petitionId, petitionData) {
    const connection = await db.getPool().getConnection();
    let values = [];
    let updateQuery = 'UPDATE Petition SET ';
    let whereQuery = ' WHERE petition_id = ?';
    let validProperties = ['title', 'description', 'categoryId', 'closingDate']
    let firstUpdated = true;


    for (let property in petitionData) {
        if (!validProperties.includes(property)) {
            continue;
        }

        if (firstUpdated) {
            values.push([petitionData[property].toString()]);
            if (property === 'closingDate') {
                property = 'closing_date';
            } else if (property === 'categoryId') {
                property = 'category_id';
            }
            updateQuery += property + " = ?";
            firstUpdated = false;
        } else {
            values.push([petitionData[property].toString()]);
            if (property === 'closingDate') {
                property = 'closing_date';
            } else if (property === 'categoryId') {
                property = 'category_id';
            }
            updateQuery += ", " + property + " = ?";
        }
    }

    let query = updateQuery + whereQuery;
    values.push([petitionId]);
    let [rows] = await connection.query(query, values);

    connection.release();
    return rows.affectedRows;
};


exports.deleteOne = async function (petitionId, userId) {
    const connection = await db.getPool().getConnection();
    let query = 'DELETE FROM Petition WHERE petition_id = ? AND author_id = ?';
    let values = [
        [petitionId],
        [userId]
    ];
    let [rows] = await connection.query(query, values);

    connection.release();
    return rows.affectedRows;
};


exports.getPetitionPhotoFilename = async function (petitionId) {
    const connection = await db.getPool().getConnection();

    let query = 'SELECT photo_filename as photoFilename FROM Petition WHERE petition_id = ?';
    let [rows] = await connection.query(query, petitionId);

    connection.release();
    return rows[0]['photoFilename'];
};


exports.getUserPhotoFilename = async function (petitionId) {
    const connection = await db.getPool().getConnection();

    let query = 'SELECT photo_filename as photoFilename FROM Petition WHERE petition_id = ?';
    let [rows] = await connection.query(query, petitionId);

    connection.release();
    return rows[0]['photoFilename'];
};


exports.insertPhoto = async function (petitionId, filename) {
    const connection = await db.getPool().getConnection();
    let query = 'UPDATE Petition SET photo_filename = ? WHERE petition_id = ?';
    let values = [
        [ filename ],
        [ petitionId ]
    ];

    let [rows] = await connection.query(query, values);

    connection.release();
};