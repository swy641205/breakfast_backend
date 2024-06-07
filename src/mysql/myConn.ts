import mysql from 'mysql2/promise';

const myConn = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT as string),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8',
});

export default myConn;