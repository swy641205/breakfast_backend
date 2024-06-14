import myConn from './mysql/myConn';

const tblUsers = {
  tblName: 'users',
  create: async () => {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS ${tblUsers.tblName} (
          id int(11) NOT NULL AUTO_INCREMENT COMMENT '代號',
          name varchar(30) NOT NULL COMMENT '姓名',
          email varchar(50) NOT NULL COMMENT 'email',
          status varchar(10) DEFAULT NULL COMMENT '狀態 active/in-active',
          password varchar(40) DEFAULT NULL COMMENT '明碼',
          hashed_password varchar(256) DEFAULT NULL COMMENT '密碼',
          roles varchar(256) DEFAULT NULL COMMENT '角色 member, admin, manager, accounting, it, hr',
          activation_secret varchar(12) DEFAULT NULL COMMENT '啟用碼',
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
      `;
      const [rs, fields] = await myConn.query(sql);
      console.log('tblUsers.create', rs);
      return rs;
    } catch (err) {
      return null;
    }
  }
};

export default tblUsers;