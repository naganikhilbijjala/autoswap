const model = require('../models/item');
const transaction = require('../models/transaction');
const user = require('../models/user');

exports.index = (req, res) => {
    let trades = model.find()
    .then(trades => res.render('./trade/index', {trades}))
    .catch(err => console.log(err));
}

exports.new = (req, res) => {
    res.render('./trade/new');
}

exports.create = (req, res, next) => {
    let item = new model(req.body);
    item.createdBy = req.session.user;
    item.status = "Available";
    item.save()
    .then((item) =>{
        req.flash("success", "Trade item has been created successfully")
        res.redirect('/trades')
    })
    .catch(err => {
        if(err.name === "ValidationError"){
            err.status = 400;
            req.flash('error', err.message);
            res.redirect('back');
        }
        next(err);
    });
}

exports.show = (req, res, next) => {
    let id = req.params.id;
    let userId = req.session.user;
    model.findById(id).populate('createdBy', 'firstName lastName')
    .then(trade => {
        if(trade){
            let isWatchedTrade;
            if(userId){
                user.findById(userId)
                .then(user => {
                    watchedTrades = user.watchedTrades;
                    isWatchedTrade = watchedTrades.includes(id);
                    return res.render('./trade/show', {trade, isWatchedTrade});
                })
                .catch(err => next(err));
            } else {
                isWatchedTrade = false;
                return res.render('./trade/show', {trade, isWatchedTrade});
            }
        } else {
            let err = new Error("Cannot find the trade item with id " + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
};

exports.edit = (req, res, next) => {
    let id = req.params.id;
    model.findById(id)
    .then(trade => {
        if(trade){
            return res.render('./trade/edit', {trade});
        }else{
            let err = new Error("Cannot find the trade item with id " + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
}

exports.update = (req, res, next) => {
    let trade = req.body;
    let id = req.params.id;
    model.findByIdAndUpdate(id, trade, {useFindAndModify: false, runValidators: true})
    .then(trade => {
        if(trade){
            return  res.redirect('/trades/'+id);
        }else{
            let err = new Error("Cannot find the trade item with id " + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err =>{
        if(err.name === "ValidationError"){
            err.status = 400;
            req.flash("error", err.message)
            return res.redirect("/back")
        }
        next(err);
    });
}

exports.delete = (req, res, next) => {
    let tradeId = req.params.id;
    console.log("Trade id is "+ tradeId);
    console.log("Entered the delete route");
    transaction.findOne({ $or: [{ myItem: tradeId }, { theirItem: tradeId }] })
    .then(transactionResult => {
        console.log("Entered the transactionResult part " + transactionResult);
        if(transactionResult){
            console.log("Entered the if condition");
            console.log("tradeId " + tradeId);
            console.log("transactionResult.myItem " + transactionResult.myItem);
            if((transactionResult.myItem == tradeId) || (transactionResult.theirItem == tradeId)){
                Promise.all([model.findOneAndUpdate({_id:transactionResult.myItem},{status:'Available', isOffered:false}), model.findOneAndUpdate({_id:transactionResult.theirItem},{status:'Available', isOffered:false})])
                .then(result => {
                    console.log("Trade id of item getting deleted " + tradeId);
                    console.log(result);
                    model.findOneAndDelete({_id:tradeId})
                    .then(trade => {
                        if(trade){
                            transaction.findOneAndDelete({_id:transactionResult._id})
                            .then(transactionDeleted => {
                                return res.redirect('/users/profile');
                            })
                        }else{
                            let err = new Error("Cannot find the trade item with id "+ tradeId);
                            err.status = 404;
                            next(err);
                        }
                    })
                })
                .catch(err => next(err));
            }
        }else{
            console.log("Entered the else part");
            model.findByIdAndDelete({_id:tradeId}, {useFindAndModify: false})
            .then(trade => {
                if(trade){
                    return res.redirect('/users/profile');
                }else{
                    let err = new Error("Cannot find the trade item with id "+ id);
                    err.status = 404;
                    next(err);
                }
            })
            .catch(err => next(err));
            }
        }
    )
}