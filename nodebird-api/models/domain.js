const Sequelize = require('sequelize');

module.exports = class Domain extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      // 도메인 주소
      host: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      // 유료, 무료 사용자 구분
      type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      clientSecret: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      frontSecret: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      validate: {
        unknownType() {
          if(this.type !== 'free' && this.type !== 'premium') {
            throw new Error('type 컬럼은 free거나 premium이어야 합니다.');
          }
        }
      },
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Domain.belongsTo(db.User);
  }
};