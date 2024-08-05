const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class DBManager {
    constructor(file) {
        this.db = new sqlite3.Database(file, (err) => {
            if (err) {
                console.error('Could not open database:', err.message);
            }
        });
    }

    async createToken(id) {
        const query = 'INSERT INTO tokens (id, token, refreshToken, expireIn) VALUES (?, ?, ?, ?)';
        const token = crypto.randomBytes(48).toString('hex').slice(0, 48);
        const refreshToken = crypto.randomBytes(48).toString('hex').slice(0, 48);
        const now = new Date(new Date().getTime() + 1 * 60 * 1000);
        const expireIn = new Date(now.getTime() + (1 - now.getTimezoneOffset() / 60) * 3600 * 1000).toISOString();
    
        try {
            await new Promise((resolve, reject) => {
                this.db.run(query, [id, token, refreshToken, expireIn], (err) => {
                    if (err) {
                        if (err.code === 'SQLITE_CONSTRAINT') {
                            return resolve(false);
                        }
                        return reject(err);
                    }
                    resolve(true);
                });
            });
            return { token, refreshToken, expireIn };
        } catch (error) {
            throw error;
        }
    }

    async createTokenByRefresh(refresh){
        let query = 'SELECT * FROM tokens WHERE refreshToken = ?';
        let available = await new Promise((resolve, reject) => {
            this.db.get(query, refresh, (err, rows) => {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return resolve(false);
                    }
                    return reject(err);
                }
                resolve(rows);
            });
        });
        if(available){
            query = 'DELETE FROM tokens WHERE refreshToken = ?';
            await new Promise((resolve, reject) => {
                this.db.run(query, refresh, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
            return await this.createToken(available.id)
        }else{
            return false
        }
    }

    async getAuthbyToken(token) {
        const query = 'SELECT id FROM tokens WHERE token = ?';
        return new Promise((resolve, reject) => {
            this.db.get(query, token, (err, row) => {
                if (err) {
                    return reject(err);
                }else{
                    resolve(row);
                }
                
            });
        });
    }    

    async validateToken(token){
        const query = 'SELECT * FROM tokens WHERE token = ?';
        let available = await new Promise((resolve, reject) => {
            this.db.get(query, [token], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
        if (available){
            var expireTime = new Date(available.expireIn);
            let now = new Date();
            var nowFormat = new Date(now.getTime() + (1 - now.getTimezoneOffset() / 60) * 3600 * 1000);

            if (nowFormat < expireTime){
                return true
            }else{
                return false
            }
        }else{
            return false
        }
    }

    async getOHD(token){
        const auth = await this.getAuthbyToken(token)
        let userQuery = 'SELECT * FROM users WHERE id = ?';

        const user = await new Promise((resolve, reject) => {
            this.db.get(userQuery, auth.id, (err, rows) => {
                if (err) {
                    return reject(err);
                }else{
                    resolve(rows);
                }
                
            });
        });

        return {
            boxes: 0,
            avatar: user.avatar,
            maxEnegry: 7000,
            correntEnergy: 6000,
            league: 0
        }
    }

    async getUser(id = null){
        const query = 'SELECT * FROM users WHERE id = ?';
        return await new Promise((resolve, reject) => {
            this.db.get(query, id, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    async createUser(id,name,refFrom){
        const query = 'INSERT INTO users (id, name, refFrom, avatar, tonAddres, createAt) VALUES (?, ?, ?, ?, ?, ?)';
        let ref = null
        if (refFrom){
            if (refFrom.split("_")[0] == "ref"){
                ref = refFrom.split("_")[1]
            }
        }
        return await new Promise((resolve, reject) => {
            this.db.run(query, [id,name,ref,0,null,new Date().toISOString()], (err) => {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return resolve(false);
                    }
                    return reject(err);
                }
                resolve(true);
            }); 
        });
    }


    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Could not close database:', err.message);
            }
        });
    }
}

module.exports = DBManager;
