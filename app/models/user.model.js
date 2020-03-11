const db = require('../../config/db');

exports.login = async function (email, password) {
    const connection = await db.getPool().getConnection();

    let values = [
        [ email ],
        [ password ]
    ];

    let query = 'SELECT user_id as userId, auth_token as token FROM User WHERE email = ? AND password = ?';
    const [ rows, _ ] = await connection.query(query, values);
    // const jsonObj = {
    //     UserId: rows[0].us
    // }
    return rows[0];
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