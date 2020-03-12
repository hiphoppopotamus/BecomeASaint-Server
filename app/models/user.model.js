const db = require('../../config/db');

exports.login = async function (email, password, token) {
    const connection = await db.getPool().getConnection();
    let query = 'UPDATE User SET auth_token = ? WHERE email = ?';
    let values = [
        [ token ],
        [ email ]
    ];

    // maybe do if rows none then break;
    let [rows] = await connection.query(query, values);

    query = 'SELECT user_id as userId, auth_token as token FROM User WHERE email = ? AND password = ?';
    values = [
        [ email ],
        [ password ]
    ];

    [rows] = await connection.query(query, values);

    return rows[0];
};

exports.logout = async function (authToken) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM User WHERE auth_token = ?';
    let [rows] = await connection.query(query, [authToken]);
    let isLoggedOut = false;

    if (rows[0] !== undefined) {
        let userId = rows[0].user_id;
        query = 'UPDATE User SET auth_token = null WHERE user_id = ?';
        await connection.query(query, [userId]);
        isLoggedOut = true;
    }

    return isLoggedOut;
};


exports.insert = async function (user_data) {
    const connection = await db.getPool().getConnection();

    let values = [
        [user_data['name'].toString()],
        [user_data['email'].toString()],
        [user_data['password'].toString()]
    ];

    let insertQuery = 'INSERT INTO User (name, email, password';
    let valuesQuery = ') VALUES (?, ?, ?';

    if (user_data['city'] !== undefined) {
        values.push([user_data['city'].toString()]);
        insertQuery += ', city';
        valuesQuery += ', ?';
    }

    if (user_data['country'] !== undefined) {
        values.push([user_data['country'].toString()]);
        insertQuery += ', country';
        valuesQuery += ', ?';
    }

    let query = insertQuery + valuesQuery + ')';
    //try catch for this?
    const [ rows, _ ] = await connection.query(query, values);
    return rows;
};