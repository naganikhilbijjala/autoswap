const express = require('express');
const controller = require('../controllers/tradeController');
const {isLoggedIn, isAuthor} = require('../middlewares/auth');
const {validateId, validateTradeItem, validateResult} = require('../middlewares/validator')


const router = express.Router();

// GET /trades: displays all cars available for trading
router.get('/', controller.index);

// GET /trades/new: send a html form for creating a new trade item
router.get('/new', isLoggedIn, controller.new);

// POST /trades: create a new trade item
router.post('/', isLoggedIn, validateTradeItem, validateResult, controller.create);

// GET /trades/:id: send item details of that id
router.get('/:id', validateId, controller.show);

// GET /trades/:id/edit: send the html form to edit the existing item
router.get('/:id/edit', validateId, isLoggedIn, isAuthor, controller.edit);

// PUT /trades/:id: update the trade item identified by id
router.put('/:id', validateId, isLoggedIn, validateTradeItem, validateResult, isAuthor, controller.update);

// DELETE /trades/:id delete the trade item identified by id
router.delete('/:id', validateId, isLoggedIn, isAuthor, controller.delete);


module.exports = router; // exporting because we need to use it in app.js file