const ObjectID = require('mongodb').ObjectID;

class User {
    constructor(name, loginName, password, gender, role, picture, description, status){
        this.id = new ObjectID();
        this.name = name;
        this.loginName = loginName;
        this.password = password;
        this.gender = gender;
        this.role = role;
        this.picture = picture;
        this.description = description;
        this.status = status;
        this.registryDate = Date.now();
        this.modifyDate = Date.now();
    }
}

module.exports = User;