const ObjectID = require('mongodb').ObjectID;

class Recipe {
    constructor(userId, name, shortDesc, fullDesc, timeToCook, ingredients, picture, tags){
        this.id = new ObjectID();
        this.userId = userId;
        this.name = name;
        this.shortDesc = shortDesc;
        this.fullDesc = fullDesc;
        this.timeToCook = timeToCook;
        this.ingredients = ingredients;
        this.picture = picture;
        this.tags = tags;
        this.postDate = Date.now();
        this.modifyDate = Date.now();
    }
}

module.exports = Recipe