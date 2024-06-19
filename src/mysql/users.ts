import type { RowDataPacket, ResultSetHeader } from "mysql2";
import myConn from "./myConn";

export interface IUserLogin {
    email: string;
    password: string;
}

export interface IUserRegister extends IUserLogin {
    name: string;
    roles: string;
}

export interface IUserNoId extends IUserRegister {
    hashed_password: string;
    activation_secret: string;
    status: string;
    phone: string;
}

export interface IUser extends IUserNoId {
    id: number;
}

const tblUsers = {
    tblName: 'users',
    create: async () => {
        try {
            const sql = `
          CREATE TABLE IF NOT EXISTS ${tblUsers.tblName} (
            id int(11) NOT NULL AUTO_INCREMENT COMMENT '代號',
            email varchar(50) NOT NULL COMMENT 'email',
            hashedPassword varchar(256) DEFAULT NULL COMMENT '密碼',
            roles varchar(256) DEFAULT NULL COMMENT '角色 member, admin, manager, accounting, it, hr',
            activationSecret varchar(12) DEFAULT NULL COMMENT '啟用碼',
            status varchar(10) DEFAULT NULL COMMENT '狀態 active/in-active',
            phone varchar(20) DEFAULT NULL COMMENT '電話',
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `;
            const [rs] = await myConn.query(sql);
            return rs;
        } catch (err) {
            console.log(`create table ${tblUsers.tblName} error: ${err}`)
            return null;
        }
    },

    drop: async () => {
        try {
            const sql = `DROP TABLE IF EXISTS ${tblUsers.tblName}`;
            const [rs] = await myConn.query(sql);
            return rs;
        } catch (err) {
            console.log(`drop table ${tblUsers.tblName} error: ${err.message}`)
            return null;
        }
    },
    clear: async () => {
        try {
            const sql = `DELETE FROM ${tblUsers.tblName}`;
            const [rs] = await myConn.query(sql);
            return rs;
        } catch (err) {
            console.log(`clear table ${tblUsers.tblName} error: ${err.message}`)
            return null;
        }
    },
    insert: async (data) => {
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            
            const insertFields = keys.join(', ');
            const insertPlaceholders = keys.map(() => '?').join(', ');
            const updateFields = keys.map(key => `${key} = VALUES(${key})`).join(', ');
    
            const sql = `INSERT INTO ${tblUsers.tblName} (${insertFields}) VALUES (${insertPlaceholders})`;
            
            console.log('Generated SQL:', sql);
            console.log('Values:', values);

            const [rs] = await myConn.query<ResultSetHeader>(sql, [...values]);
            console.log('insert sql 傳回結果:', rs);
            console.log({ count: rs.affectedRows, insertedId: rs.insertId });
            return { count: rs.affectedRows, insertedId: rs.insertId }
        } catch (err) {
            console.log(data)
            console.log(`insert ${tblUsers.tblName} error: ${err.message}`);
            return null;
        }
    },
    
    upsert: async (data) => {
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            
            const insertFields = keys.join(', ');
            const insertPlaceholders = keys.map(() => '?').join(', ');
            const updateFields = keys.map(key => `${key} = VALUES(${key})`).join(', ');
    
            const sql = `INSERT INTO ${tblUsers.tblName} (${insertFields}) VALUES (${insertPlaceholders})
                         ON DUPLICATE KEY UPDATE ${updateFields}`;
    
            const [rs] = await myConn.query<ResultSetHeader>(sql, values);
            console.log({ count: rs.affectedRows, insertedId: rs.insertId });
            return { count: rs.affectedRows, insertedId: rs.insertId }
        } catch (err) {
            console.log(`upsert ${tblUsers.tblName} error: ${err.message}`);
            return null;
        }
    },
    getByEmail: async (email: string) => {
        try {
            const sql = `SELECT * FROM ${tblUsers.tblName} WHERE email = ?`;
            const [rs] = await myConn.query<RowDataPacket[]>(sql, [email]);
            return rs[0];
        } catch (err) {
            console.log(`getByEmail ${email} from ${tblUsers.tblName} error: ${err}`)
            return null;
        }
    },
    getActivationSecretByEmail: async (email: string) => {
        try {
            const sql = `SELECT activationSecret FROM ${tblUsers.tblName} WHERE email = ?`;
            const [rs] = await myConn.query<RowDataPacket[]>(sql, [email]);
            const user = rs[0];
            return user?.activationSecret;
        } catch (err) {
            console.log(`getActivationSecretByEmail ${email} from ${tblUsers.tblName} error: ${err}`);
            return null;
        }
    },

    getAll: async () => {
        try {
            const sql = `SELECT * FROM ${tblUsers.tblName}`;
            const [rs] = await myConn.query<RowDataPacket[]>(sql);
            return rs;
        } catch (err) {
            console.log(`getAll from ${tblUsers.tblName} error: ${err}`)
            return null;
        }
    },

    activation: async (email: string, code: string) => {
        try {
            console.log('activation', email, code);
            const user = await tblUsers.getByEmail(email);
            const activation_secret = user?.activation_secret;
            const status = user?.status;
            if ( status === 'active' ) {
                console.log(`User ${email} already activated`);
                return -1;
            }
            if ( activation_secret !== code ) {
                console.log(`User ${email} activation failed`);
                return 0;
            }
            const sql = ``;
            const [rs] = await myConn.query<ResultSetHeader>(sql, [
                email,
                activation_secret,
            ]);
        } catch (err) {
            console.log(`activation ${email} error: ${err.message}`);
            return null;
        }
    },
};

export default tblUsers;
