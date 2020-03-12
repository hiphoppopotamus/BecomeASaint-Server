const db = require('../../config/db');


exports.checkIfUserInDatabase = async function (email) {
    const connection = await db.getPool().getConnection();
    let query = "SELECT * FROM User WHERE email = ?";
    let [rows] = await connection.query(query, email);
    let isInDatabase = false;

    if (rows[0] !== undefined) {
        isInDatabase = true;
    }

    connection.release();
    return isInDatabase;
}


exports.insert = async function (user_data) {
    const connection = await db.getPool().getConnection();

    console.log(user_data)

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
    let result = {
        "userId": rows.insertId
    };

    connection.release();
    return result;
};


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

    connection.release();
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


exports.checkIfIsMyUser = async function (userId, authToken) {
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
}

exports.checkCurrentPassword = async function (userId, currentPassword) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM User WHERE user_id = ? AND password = ?'
    let values = [
        [ userId ],
        [ currentPassword ]
    ];
    let [rows] = await connection.query(query, values);
    let isCurrentPassword = false;

    if (rows[0] !== undefined) {
        isCurrentPassword = true;
    }

    connection.release();
    return isCurrentPassword;
}


exports.alter = async function (userId, user_data) {
    const connection = await db.getPool().getConnection();

    console.log(user_data.toString());


    let values = [];
    let updateQuery = 'UPDATE User SET ';
    let whereQuery = ' WHERE user_id = ?';
    let firstUpdated = true;

    for (let property in user_data) {
        if (property === "currentPassword") {
            continue;
        }

        if (firstUpdated) {
            values.push([user_data[property].toString()]);
            updateQuery += property + " = ?";
            firstUpdated = false;
        } else {
            values.push([user_data[property].toString()]);
            updateQuery += ", " + property + " = ?";
        }
    }

    let query = updateQuery + whereQuery;
    values.push([userId]);
    const [rows] = await connection.query(query, values);

    connection.release();
    return rows.affectedRows;






    // if (user_data['name'] !== undefined) {
    //     values.push([user_data['name'].toString()]);
    //     updateQuery += ' name = ?';
    //     firstUpdated = user_data['name'];
    // } else if (user_data['email'] !== undefined) {
    //     values.push([user_data['email'].toString()]);
    //     updateQuery += ' email = ?';
    //     firstUpdated = user_data['email'];
    // } else if (user_data['password'] !== undefined) {
    //     values.push([user_data['password'].toString()]);
    //     updateQuery += ' password = ?';
    //     firstUpdated = user_data['password'];
    // } else if (user_data['city'] !== undefined) {
    //     values.push([user_data['city'].toString()]);
    //     updateQuery += ' city = ?';
    //     firstUpdated = user_data['city'];
    // } else if (user_data['country'] !== undefined) {
    //     values.push([user_data['country'].toString()]);
    //     updateQuery += ' country = ?';
    //     firstUpdated = user_data['country'];
    // } else if (user_data['currentPassword'] !== undefined) {
    //     values.push([user_data['currentPassword'].toString()]);
    //     updateQuery += ' currentPassword = ?';
    //     firstUpdated = user_data['currentPassword'];
    // }
    //
    // if (user_data['name'] !== undefined) {
    //     values.push([user_data['name'].toString()]);
    //     insertQuery += ', city';
    //     valuesQuery += ', ?';
    // }
    //
    // if (user_data['country'] !== undefined) {
    //     values.push([user_data['country'].toString()]);
    //     insertQuery += ', country';
    //     valuesQuery += ', ?';
    // }




}

// how to let above model insert