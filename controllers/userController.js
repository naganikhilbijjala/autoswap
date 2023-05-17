const model = require('../models/user');
const trade = require('../models/item');
const transaction = require('../models/transaction');

exports.new = (req, res)=>{
    return res.render('./user/new');
};

exports.create = (req, res, next)=>{
    let user = new model(req.body);//create a new user document
    user.save()//insert the document to the database
    .then(user=>{
        req.flash('success', 'Successfully created account')
        res.redirect('/users/login');
    })
    .catch(err=>{
        if(err.name === 'ValidationError' ) {
            req.flash('error', err.message);  
            return res.redirect('back');
        }

        if(err.code === 11000) {
            req.flash('error', 'Email has been used');  
            return res.redirect('back');
        }
        
        next(err);
    });
};

exports.getUserLogin = (req, res, next) => {
    return res.render('./user/login');
}

exports.login = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password;
    model.findOne({ email: email })
    .then(user => {
        if (!user) {
            console.log('wrong email address');
            req.flash('error', 'wrong email address');  
            res.redirect('/users/login');
            } else {
            user.comparePassword(password)
            .then(result=>{
                if(result) {
                    req.session.user = user._id;
                    req.flash('success', 'Welcome back, '+user.firstName);
                    res.redirect('/users/profile');
            } else {
                req.flash('error', 'wrong password');      
                res.redirect('/users/login');
            }
            });     
        }     
    })
    .catch(err => next(err));
};

exports.watch = (req, res, next) => {
    let userId = req.session.user;
    let tradeId = req.params.id;
    console.log("User id is "+ userId);
    model.findByIdAndUpdate(userId, {$push: {watchedTrades: tradeId}})
    .then(user => {
        if(user){
            req.flash('success', 'The trade is added to watchList');
            return res.redirect('/users/profile');
        }else{
            let err = new Error("Cannot find the user with id " + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => {
        if(err.name === "ValidationError"){
            err.status = 400;
            req.flash("error", err.message)
            return res.redirect("/back")
        }
        next(err);
    });
}

exports.unwatch = (req, res, next) => {
    let userId = req.session.user;
    let tradeId = req.params.id;
    console.log("User id is "+ userId);
    model.findByIdAndUpdate(userId, {$pull: {watchedTrades: tradeId}})
    .then(user => {
        if(user){
            req.flash('success', 'The trade item is removed from watchList');
            return res.redirect('back');
        }else{
            let err = new Error("Cannot find the user with id " + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => {
        if(err.name === "ValidationError"){
            err.status = 400;
            req.flash("error", err.message)
            return res.redirect("/back")
        }
        next(err);
    });
}

exports.trade = (req, res, next) => {
    let id = req.session.user;
    let tradeId = req.params.id;
    trade.find({createdBy : id, status:'Available'})
    .then(trades => {
        res.render('./user/trade', {trades, tradeId});
    })
    .catch(err => next(err));
}

exports.makeOffer = (req, res, next) => {
    tradingCar = req.params.id;
    myCar = req.body.selectedTrade;
    userId = req.session.user;
    Promise.all([trade.findById(myCar), trade.findById(tradingCar)])
    .then(tradesList => {
        let update = {$set: {status: 'Offer Pending'}};
        var newTransaction = new transaction({
            myItem: myCar,
            theirItem: tradingCar,
            status: 'Offer Pending',
            createdBy: userId
        })
        newTransaction.save()
        .then(transaction => {
            trade.updateMany({_id: {$in: tradesList}}, update)
            .then(result => {
                trade.updateOne({_id:tradesList[1]._id},{isOffered:true})
                .then(result => {
                    req.flash("success", "Trade offer created successfully");
                    res.redirect('/users/profile');
                })
                .catch(err => next(err));
            })
            .catch(err => next(err));
            
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
}

exports.manage = (req, res, next) => {
    userId = req.session.user;
    tradeId = req.params.id;
    let myTransactions = [];
    transaction.find({ $or: [{ myItem: tradeId }, { theirItem: tradeId }] })
    .then(transactions =>{
        const promises = transactions.map(transaction => {
            return Promise.all([trade.findById(transaction.myItem), trade.findById(transaction.theirItem)])
            .then(results => {
                [item1, item2] = results;
                if(item1.createdBy==userId || item2.createdBy==userId){
                    let tradeId = item1._id;
                    isCancel = (userId==transaction.createdBy);
                    myTransactions.push([item1.name, item1.image, item2.name, item2.image, isCancel]);
                }
            })
            .catch(err => next(err));
        })
        Promise.all(promises).then(() => {
            res.render('./user/manage',{myTransactions, tradeId});
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));

}

exports.accept = (req, res, next) => {
    userId = req.session.user;
    tradeId = req.params.id;
    transaction.findOne({ $or: [{ myItem: tradeId }, { theirItem: tradeId }] })
    .then(transactionResult => {
        console.log(transactionResult);
        Promise.all([trade.findOneAndUpdate({_id:transactionResult.myItem},{status:'Traded'}), trade.findOneAndUpdate({_id:transactionResult.theirItem},{status:'Traded', isOffered:false})])
        .then(result => {
            transactionId = transactionResult._id;
            console.log("Transaction id is " + transactionId);
            transaction.findOneAndDelete({_id:transactionId})
            .then(deletedTransaction => {
                if(deletedTransaction){
                    console.log("Traded successfully");
                    req.flash("success", "You have successfully traded the car");
                    res.redirect('/users/profile');
                }
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
}

exports.reject = (req, res, next) => {
    userId = req.session.user;
    tradeId = req.params.id;
    transaction.findOne({ $or: [{ myItem: tradeId }, { theirItem: tradeId }] })
    .then(transactionResult => {
        if(transactionResult){
            if(transactionResult.status == "Offer Pending"){
                Promise.all([trade.findOneAndUpdate({_id:transactionResult.myItem},{status:'Available', isOffered:false}), trade.findOneAndUpdate({_id:transactionResult.theirItem},{status:'Available', isOffered:false})])
                .then(results => {
                    let transactionId = transactionResult._id;
                    transaction.findOneAndDelete({_id:transactionId})
                    .then(deletedTransaction => {
                        if(deletedTransaction){
                            req.flash('success', "Trade is rejected successfully");
                            res.redirect('/users/profile');
                        }
                    })
                    .catch(err => next(err));
                })
                .catch(err => next(err));
            }
        }else{
            let err = new Error("Status of the item is " + transactionResult.status + ".You can cancel only when status is \"Offer Pending\"");
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
}

exports.cancel = (req, res, next) => {
    userId = req.session.user;
    tradeId = req.params.id;
    transaction.findOne({ $or: [{ myItem: tradeId }, { theirItem: tradeId }] })
    .then(transactionResult => {
        if(transactionResult){
            if(transactionResult.status == "Offer Pending"){
                Promise.all([trade.findOneAndUpdate({_id:transactionResult.myItem},{status:'Available', isOffered:false}), trade.findOneAndUpdate({_id:transactionResult.theirItem},{status:'Available', isOffered:false})])
                .then(results => {
                    let transactionId = transactionResult._id;
                    transaction.findOneAndDelete({_id:transactionId})
                    .then(deletedTransaction => {
                        if(deletedTransaction){
                            req.flash('success', 'Trade cancelled successfully');
                            res.redirect('/users/profile');
                        }
                    })
                    .catch(err => next(err));
                })
                .catch(err => next(err));
            }
        }else{
            let err = new Error("Status of the item is " + transactionResult.status + ".You can cancel only when status is \"Offer Pending\"");
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
}

exports.profile = (req, res, next)=>{
    let id = req.session.user;
    Promise.all([model.findById(id), trade.find({createdBy : id}), trade.find({createdBy: {$ne: id}, isOffered:true})]) 
    .then(results => {
        const [user, trades, myOffers] = results;
        trade.find({_id: {$in: user.watchedTrades}})
        .then(watchedTrades => {
            res.render('./user/profile', {user, trades, watchedTrades, myOffers});
        })
        .catch(err=>next(err));
    })
    .catch(err=>next(err));
};


exports.logout = (req, res, next)=>{
    req.session.destroy(err=>{
        if(err) 
           return next(err);
       else
            res.redirect('/');  
    });
   
 };