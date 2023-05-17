// check if user is guest

const Trade = require('../models/item')

exports.isGuest = (req, res, next) => {
    if(!req.session.user) {
        return next();
    } else {
        req.flash('error', 'You are logged in already');
        return res.redirect('/users/profile');
    }
};

// check if user is authenticated
exports.isLoggedIn = (req, res, next) => {
    if(req.session.user) {
        return next();
    } else {
        req.flash('error', 'You need to login first');
        return res.redirect('/users/login');
    }   
};

// check if user is creator of trade
exports.isAuthor = (req, res, next) => {
    let id = req.params.id;
    Trade.findById(id)
    .then(trade => {
        if(trade) {
            if(trade.createdBy == req.session.user){
                return next();
            } else {
                console.log("Entered else part");
                req.flash('error', 'Unauthroized to access the resource');
                let err = new Error('Unauthroized to access the resource');
                err.status = 401;
                res.redirect('back');
                return next(err);
            }
        }
    })
};