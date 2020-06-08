const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const User = require('../schemas/user');
const Recipe = require('../schemas/recipe');
const indicative = require('indicative');
const util = require('util');

const userValidator = {
    name: 'string',
    loginName: 'required|string|max:15',
    password: 'required|string|min:8',
    gender: 'in:male, female, other',
    role: 'in:admin, user',
    description: 'string|max:512',
    status: 'in:active, suspended, deactivated'
}

const recipeValidator = {
    name: 'string|max:80',
    shortDesc: 'string|max:256',
    fullDesc: 'string|max:2048',
    timeToCook: 'number',
    ingredients: 'array',
    tags: 'array'
}

const router = express.Router();

router.get("/", function (req, res) {
    req.app.locals.db.collection('users').find().toArray().then(users => {
        res.json(users);
    });
});

router.get("/:userId", async function (req, res) {
    try {
        const query = { id: new ObjectID(req.params.userId) };
        const user = await req.app.locals.db.collection('users').findOne(query);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
            return res.status(200).json(user);
        }
    } catch (err) {
        console.error(err);

        return res.status(400).json({
            message: `An error occured:: ${err.message}`,
        });
    }
});

router.post("/", async function (req, res) {
    const user = req.body;
    indicative.validator.validate(user, userValidator).then(() => {
        try {
            const newUser = new User(user.name, user.loginName, user.password, user.gender,
                user.role, user.picture, user.description, user.status);

            req.app.locals.db.collection('users').insertOne(newUser).then(r => {
                if (r.result.ok && r.insertedCount === 1) {
                    console.log(`Created user: ${newUser}`);
                    res.status(201).location(`/${newUser.id}`).json(newUser);
                } else {
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                }
            }).catch(err => {
                console.log("Error: Update unsuccessfull.");
                sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
            })
        } catch (err) {
            console.error(err);

            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid user data: ${util.inspect(errors)}`);
    });
});

router.put("/:userId", async function (req, res) {
    const userUpdates = req.body;
    const id = new ObjectID(req.params.userId);
    indicative.validator.validate(userUpdates, userValidator).then(async () => {
        try {
            const query = { id: id }
            const user = await req.app.locals.db.collection('users').findOne(query);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            } else {
                try {
                    const newUser = new User(userUpdates.name, userUpdates.loginName, userUpdates.password, userUpdates.gender,
                        userUpdates.role, userUpdates.picture, userUpdates.description, userUpdates.status);
                    newUser.id = user.id;
                    newUser.modifyDate = Date.now();
                    newUser.registryDate = user.registryDate;
                    const newValues = { $set: newUser };
                    req.app.locals.db.collection('users').updateOne(query, newValues).then(r => {
                        if (r.result.ok) {
                            return res.status(200).json(newUser);
                        } else {
                            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                        }
                    }).catch(err => {
                        console.log("Error: Update unsuccessfull.");
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    })
                } catch (err) {
                    console.error(err);
                    return res.status(400).json({
                        message: `An error occured:: ${err.message}`,
                    });
                }
            }
        } catch (err) {
            console.error(err);
            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid user data: ${util.inspect(errors)}`);
    });
});

router.delete("/:userId", async function (req, res) {
    try {
        const query = { id: new ObjectID(req.params.userId) }
        const user = await req.app.locals.db.collection('users').findOne(query);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
            req.app.locals.db.collection('users').deleteOne(query).then(r => {
                if (r.result.ok) {
                    return res.status(200).json({
                        message: 'User deleted succesfully'
                    });
                } else {
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                }
            }).catch(err => {
                console.log("Error: Update unsuccessfull.");
                sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
            })
        }
    } catch (err) {
        return res.status(400).json({
            message: "An error occured:",
        });
    }
});

router.get("/:userId/recipes", async (req, res) => {
    try {
        const id = new ObjectID(req.params.userId);
        const query = { id: id }
        const user = await req.app.locals.db.collection('users').findOne(query);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
            const recipes = await req.app.locals.db.collection('recipes').find({ userId: id }).toArray();
            if (!recipes) {
                return res.status(404).json({
                    message: "No recipes found",
                });
            } else {
                return res.status(200).json(recipes);
            }
        }
    } catch (err) {
        return res.status(400).json({
            message: `An error occured:: ${err.message}`,
        });
    }
});

router.post("/:userId/recipes", async function (req, res) {
    const recipe = req.body;
    indicative.validator.validate(recipe, recipeValidator).then(async () => {
        try {
            const id = new ObjectID(req.params.userId);
            const query = { id: id }
            const user = await req.app.locals.db.collection('users').findOne(query);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            } else {
                const newRecipe = new Recipe(user.id, recipe.name, recipe.shortDesc, recipe.fullDesc, recipe.timeToCook,
                    recipe.ingredients, recipe.picture, recipe.tags);

                req.app.locals.db.collection('recipes').insertOne(newRecipe).then(r => {
                    if (r.result.ok && r.insertedCount === 1) {
                        console.log(`Inserted recipe: ${newRecipe}`);
                        res.status(201).location(`/${newRecipe.id}`).json(newRecipe);
                    } else {
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    }
                }).catch(err => {
                    console.log("Error: Update unsuccessfull.");
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                })
            }
        } catch (err) {
            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid user data: ${util.inspect(errors)}`);
    });
});

router.get("/:userId/recipes/:recipeId", async function (req, res) {
    try {
        const userId = new ObjectID(req.params.userId);
        const recipeId = new ObjectID(req.params.recipeId);
        const query = { id: userId };
        const query2 = { id: recipeId };
        const user = await req.app.locals.db.collection('users').findOne(query);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
            const recipe = await req.app.locals.db.collection('recipes').findOne(query2);
            if (!recipe) {
                return res.status(404).json({
                    message: "Recipe not found",
                });
            } else {
                return res.status(200).json(recipe);
            }
        }
    } catch (err) {
        return res.status(400).json({
            message: `An error occured:: ${err.message}`,
        });
    }
});

router.put("/:userId/recipes/:recipeId", async function (req, res) {
    const recipeUpdates = req.body;
    indicative.validator.validate(recipeUpdates, recipeValidator).then(async () => {
        try {
            const userId = new ObjectID(req.params.userId);
            const recipeId = new ObjectID(req.params.recipeId);
            const query = { id: userId };
            const query2 = { id: recipeId };
            const user = await req.app.locals.db.collection('users').findOne(query);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            } else {
                const recipe = await req.app.locals.db.collection('recipes').findOne(query2);
                if (!recipe) {
                    return res.status(404).json({ message: "Recipe not found" });
                } else {
                    try {
                        const newRecipe = new Recipe(user.id, recipeUpdates.name, recipeUpdates.shortDesc, recipeUpdates.fullDesc,
                            recipeUpdates.timeToCook, recipeUpdates.ingredients, recipeUpdates.picture, recipeUpdates.tags);
                        newRecipe.id = recipe.id;
                        newRecipe.modifyDate = Date.now();
                        newRecipe.postDate = recipe.postDate;
                        const newValues = { $set: newRecipe };
                        req.app.locals.db.collection('recipes').updateOne(query2, newValues).then(r => {
                            if (r.result.ok) {
                                return res.status(200).json(newRecipe);
                            } else {
                                sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                            }
                        }).catch(err => {
                            console.log("Error: Update unsuccessfull.");
                            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                        })
                    } catch (err) {
                        console.error(err);
                        return res.status(400).json({
                            message: `An error occured:: ${err.message}`,
                        });
                    }
                }
            }
        } catch (err) {
            console.error(err);
            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid user data: ${util.inspect(errors)}`);
    });
});

router.delete("/:userId/recipes/:recipeId", async function (req, res) {
    try {
        const userId = new ObjectID(req.params.userId);
        const recipeId = new ObjectID(req.params.recipeId);
        const query = { id: userId };
        const query2 = { id: recipeId };
        const user = await req.app.locals.db.collection('users').findOne(query);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
            req.app.locals.db.collection('recipes').deleteOne(query2).then(r => {
                if (r.result.ok) {
                    return res.status(200).json({
                        message: 'Recipe deleted succesfully'
                    });
                } else {
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                }
            }).catch(err => {
                console.log("Error: Update unsuccessfull.");
                sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
            })
        }
    } catch (err) {
        return res.status(400).json({
            message: "An error occured"
        });
    }
});

sendErrorResponse = function (req, res, status, message, err) {
    if (req.get('env') !== 'development') {
        err = undefined;
    }
    res.status(status).json({
        code: status,
        message,
        error: err
    })
}

module.exports = router;
