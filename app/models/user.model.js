const db = require('../../config/db');
const bcrypt = require('bcrypt');

const saltRounds = 10;


exports.checkIfUserInDatabase = async function (email) {
    const connection = await db.getPool().getConnection();
    let query = `SELECT * FROM User WHERE email = ?`;
    let [rows] = await connection.query(query, email);
    let isInDatabase = false;

    if (rows[0] !== undefined) {
        isInDatabase = true;
    }

    connection.release();
    return isInDatabase;
};


exports.insert = async function (userData) {
    const connection = await db.getPool().getConnection();

    const plaintextPassword = userData['password'].toString();
    const hash = bcrypt.hashSync(plaintextPassword, saltRounds);

    let values = [
        [userData['name'].toString()],
        [userData['email'].toString()],
        [hash]
    ];

    let insertQuery = `INSERT INTO User (name, email, password`;
    let valuesQuery = `) VALUES (?, ?, ?`;

    if (userData['city'] !== undefined) {
        values.push([userData['city'].toString()]);
        insertQuery += ', city';
        valuesQuery += ', ?';
    }

    if (userData['country'] !== undefined) {
        values.push([userData['country'].toString()]);
        insertQuery += ', country';
        valuesQuery += ', ?';
    }

    let query = insertQuery + valuesQuery + ')';
    //try catch for this?
    let [rows] = await connection.query(query, values);
    let result = {
        "userId": rows.insertId
    };

    connection.release();
    return result;
};


exports.updateToken = async function (email, token) {
    const connection = await db.getPool().getConnection();
    const query = `UPDATE User SET auth_token = ? WHERE email = ?`;
    let values = [
        [ token ],
        [ email ]
    ];
    let [rows] = await connection.query(query, values);

    console.log(rows[0]);
    connection.release();
    return rows[0];
}


exports.login = async function (email, token) {
    const connection = await db.getPool().getConnection();
    const query = `SELECT user_id as userId, auth_token as token FROM User WHERE email = ?`;
    let [rows] = await connection.query(query, [email]);

    connection.release();
    return rows[0];
};


exports.logout = async function (authToken) {
    const connection = await db.getPool().getConnection();
    let query = `SELECT * FROM User WHERE auth_token = ?`;
    let [rows] = await connection.query(query, [authToken]);
    let isLoggedOut = false;

    if (rows[0] !== undefined) {
        let userId = rows[0].user_id;
        query = 'UPDATE User SET auth_token = null WHERE user_id = ?';
        await connection.query(query, [userId]);
        isLoggedOut = true;
    }

    connection.release();
    return isLoggedOut;
};


exports.validateUser = async function (userId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM User WHERE user_id = ?';
    let [rows] = await connection.query(query, [userId]);
    let isValidUser = false;

    if (rows[0] !== undefined) {
        isValidUser = true;
    }

    connection.release();
    return isValidUser;
};


exports.checkIfIsUserIdLoggedIn = async function (userId, authToken) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM User WHERE user_id = ? AND auth_token = ?';
    let values = [
        [ userId ],
        [ authToken ]
    ];
    let [rows] = await connection.query(query, values);
    let isMyUser = false;

    if (rows[0] !== undefined) {
        isMyUser = true;
    }

    connection.release();
    return isMyUser;
};


exports.getUser = async function (userId, isMyUser) {
    const connection = await db.getPool().getConnection();
    let query;
    if (isMyUser) {
        query = 'SELECT name, city, country, email ' +
                'FROM User ' +
                'WHERE user_id = ?';
    } else {
        query = 'SELECT name, city, country ' +
                'FROM User ' +
                'WHERE user_id = ?';
    }

    let [rows] = await connection.query(query, [userId]);
    connection.release();
    return rows[0];
};


exports.getUserIdFromToken = async function (authToken) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT user_id ' +
                'FROM User ' +
                'WHERE auth_token = ?';


    let [rows] = await connection.query(query, [authToken]);
    connection.release();
    return rows[0]['user_id'];
};


exports.checkIfEmailAlreadyInUse = async function (userId, email) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM User WHERE user_id != ? AND email = ?'
    let values = [
        [ userId ],
        [ email ]
    ];
    let [rows] = await connection.query(query, values);
    let emailIsInUse = false;

    if (rows[0] !== undefined) {
        emailIsInUse = true;
    }

    connection.release();
    return emailIsInUse;
};


exports.checkCurrentPassword = async function (identifier, currentPassword) {
    const connection = await db.getPool().getConnection();

    let hashQuery;
    if (typeof identifier === "number") {
        hashQuery = `SELECT password FROM User WHERE user_id = ?`;
    }

    if (typeof identifier === "string") {
        hashQuery = `SELECT password FROM User WHERE email = ?`;
    }

    let [hash] = await connection.query(hashQuery, [identifier]);
    let isCurrentPassword = bcrypt.compareSync(currentPassword, hash[0]['password']);

    connection.release();
    return isCurrentPassword;
};


exports.alter = async function (userId, userData) {
    const connection = await db.getPool().getConnection();
    let values = [];
    let updateQuery = 'UPDATE User SET ';
    let whereQuery = ' WHERE user_id = ?';
    let firstUpdated = true;

    for (let property in userData) {
        if (property === "currentPassword") {
            continue;
        }

        if (property === "password") {
            const plaintextPassword = userData[property].toString();
            userData[property] = bcrypt.hashSync(plaintextPassword, saltRounds);
        }

        if (firstUpdated) {
            values.push([userData[property].toString()]);
            updateQuery += property + " = ?";
            firstUpdated = false;
        } else {
            values.push([userData[property].toString()]);
            updateQuery += ", " + property + " = ?";
        }
    }

    let query = updateQuery + whereQuery;
    values.push([userId]);
    let [rows] = await connection.query(query, values);

    connection.release();
    return rows.affectedRows;
};


exports.checkIfAuthTokenExists = async function (authToken) {
    const connection = await db.getPool().getConnection();

    let query = 'SELECT * FROM User WHERE auth_token = ?';
    let [rows] = await connection.query(query, [authToken]);
    let tokenExists = false;

    if (rows[0]) {
        tokenExists = true;
    }

    connection.release();
    return tokenExists;
};


exports.getUserPhotoFilename = async function (userId) {
    const connection = await db.getPool().getConnection();

    let query = 'SELECT photo_filename as photoFilename FROM User WHERE user_id = ?';
    let [rows] = await connection.query(query, [userId]);

    connection.release();
    return rows[0]['photoFilename'];
};


exports.insertPhoto = async function (userId, filename) {
    const connection = await db.getPool().getConnection();
    let query = 'UPDATE User SET photo_filename = ? WHERE user_id = ?'
    let values = [
        [ filename ],
        [ userId ]
    ];

    let [rows] = await connection.query(query, values);

    connection.release();
    return rows.insertId;
};


exports.deletePhoto = async function (userId) {
    const connection = await db.getPool().getConnection();
    let query = 'UPDATE User SET photo_filename = NULL WHERE user_id = ?';

    let [rows] = await connection.query(query, [userId]);
    connection.release();
    console.log(rows);
    return rows;
};