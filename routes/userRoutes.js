const express = require('express');
const controller = require('../controllers/userController');
const {isGuest, isLoggedIn} = require('../middlewares/auth');
const {logInLimiter} = require('../middlewares/rateLimiters');
const {validateId, validateLogIn, validateResult, validateSignUp} = require('../middlewares/validator');
const { route } = require('./tradeRoutes');

const router = express.Router();

//GET /users/new: send html form for creating a new user account

// We are first calling isGuest function (middleware) before calling the controller function
router.get('/new', isGuest, controller.new);

//POST /users: create a new user account

router.post('/', isGuest, validateSignUp, validateResult, controller.create);

//GET /users/login: send html for logging in
router.get('/login', isGuest, controller.getUserLogin);

//POST /users/login: authenticate user's login
router.post('/login', logInLimiter, isGuest, validateLogIn, validateResult, controller.login);

// PUT /users/watch/:id: add the item to watchlist
router.put('/watch/:id', validateId, isLoggedIn, controller.watch);

// PUT /users/uwatch/:id: remove the item from watchlist
router.put('/unwatch/:id', validateId, isLoggedIn, controller.unwatch);

// GET /users/trade/:id: get the list of items page to select one item to trade
router.get('/trade/:id', validateId, isLoggedIn, controller.trade)

// POST /users/trade/:id trade the item by changing the status to offer
router.post('/trade/:id', validateId, isLoggedIn, controller.makeOffer);

// GET /users/trade/offer/:id mangage offer page
router.get('/trade/offer/:id', validateId, isLoggedIn, controller.manage);

// GET /users/trade/accept/:id accept the offer
router.get('/trade/accept/:id', validateId, isLoggedIn, controller.accept);

// GET /users/trade/reject/:id reject the offer
router.get('/trade/reject/:id', validateId, isLoggedIn, controller.reject);

// GET /users/trade/cancel/:id cancel the offer
router.get('/trade/cancel/:id', validateId, isLoggedIn, controller.cancel);

//GET /users/profile: send user's profile page
router.get('/profile', isLoggedIn, controller.profile);

//GET /users/logout: logout a user
router.get('/logout', isLoggedIn, controller.logout);

module.exports = router;