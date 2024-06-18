import type { RowDataPacket, ResultSetHeader } from "mysql2";
import myConn from "./myConn";

const tbl = (tblName: string) => {
    return {
        drop: async () => {
            try {
                const sql = `DROP TABLE IF EXISTS ${tblName}`;
                const [rs] = await myConn.query(sql);
                return rs;
            } catch (err) {
                console.log(`drop table ${tblName} error: ${err.message}`)
                return null;
            }
        },
        clear: async () => {
            try {
                const sql = `DELETE FROM ${tblName}`;
                const [rs] = await myConn.query(sql);
                return rs;
            } catch (err) {
                console.log(`clear table ${tblName} error: ${err.message}`)
                return null;
            }
        },
        delete: async (column: string, query: string) => {
            try {
                const sql = `DELETE FROM ${tblName} WHERE ?? = ?`;
                const [rs] = await myConn.query<ResultSetHeader>(sql, [column, query]);
                return rs;
            } catch (err) {
                console.log(`delete ${query} from ${tblName}-${column} error: ${err}`)
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

                const sql = `INSERT INTO ${tblName} (${insertFields}) VALUES (${insertPlaceholders})`;

                console.log('Generated SQL:', sql);
                console.log('Values:', values);

                const [rs] = await myConn.query<ResultSetHeader>(sql, [...values]);
                console.log('insert sql 傳回結果:', rs);
                console.log({ count: rs.affectedRows, insertedId: rs.insertId });
                return { count: rs.affectedRows, insertedId: rs.insertId }
            } catch (err) {
                console.log(data)
                console.log(`insert ${tblName} error: ${err.message}`);
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

                const sql = `INSERT INTO ${tblName} (${insertFields}) VALUES (${insertPlaceholders})
                            ON DUPLICATE KEY UPDATE ${updateFields}`;

                const [rs] = await myConn.query<ResultSetHeader>(sql, values);
                console.log({ count: rs.affectedRows, upsertedId: rs.insertId });
                return { count: rs.affectedRows, upsertedId: rs.insertId }
            } catch (err) {
                console.log(`upsert ${tblName} error: ${err.message}`);
                return null;
            }
        },
        getAll: async () => {
            try {
                const sql = `SELECT * FROM ${tblName}`;
                const [rs] = await myConn.query<RowDataPacket[]>(sql);
                return rs;
            } catch (err) {
                console.log(`getAll from ${tblName} error: ${err}`)
                return null;
            }
        },
        get: async (column: string, query: string) => {
            try {
                const sql = `SELECT * FROM ${tblName} WHERE ?? = ?`;
                const [rs] = await myConn.query<RowDataPacket[]>(sql, [column, query]);
                return rs[0];
            } catch (err) {
                console.log(`get ${query} from ${tblName}-${column} error: ${err}`)
                return null;
            }
        },

    };
};

export default tbl;