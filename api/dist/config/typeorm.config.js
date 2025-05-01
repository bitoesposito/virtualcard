"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
const dotenv_1 = require("dotenv");
const users_entity_1 = require("../users/users.entity");
(0, dotenv_1.config)();
exports.typeOrmConfig = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [users_entity_1.User],
    synchronize: false,
    logging: true,
    migrations: ['dist/database/migrations/*.js'],
    migrationsTableName: 'migrations',
};
//# sourceMappingURL=typeorm.config.js.map