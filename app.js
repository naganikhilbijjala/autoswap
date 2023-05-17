// require modules
const express = require('express');
const morgan = require('morgan');
const methodOverride = require("method-override");
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const tradeRoutes = require('./routes/tradeRoutes');
const userRoutes = require('./routes/userRoutes');


// create application
const app = express();


// configure application
let port = 3000;
let host = 'localhost';
app.set('view engine', 'ejs');


// connect to database
mongoose.connect('mongodb://localhost:27017/trade-project', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })
.then(() => {
        app.listen(port, host, () => {
        console.log("Server is running on port", port);
    })
})
.catch(err => console.log(err.message));

//mount middlware
app.use(
    session({
        secret: "ajfeirf90aeu9eroejfoefj",
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({mongoUrl: 'mongodb://localhost:27017/trade-project'}),
        cookie: {maxAge: 60*60*1000}
        })
);
app.use(flash());

app.use((req, res, next) => {
    //console.log(req.session);
    res.locals.user = req.session.user || null;
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessages = req.flash('success');
    next();
});

// mount middleware
app.use(express.static('public'));
app.use(express.urlencoded({extended: true})); // allows to parse data in request body
app.use(morgan('tiny')); // for logging
app.use(methodOverride('_method'));

app.use('/trades', tradeRoutes);

app.use('/users', userRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.use((req, res, next) => {
    let err = new Error("The server cannot locate " + req.url);
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    if(!err.status){
        err.status = 500;
        err.message = "Internal Server Error";
    }
    res.status(err.status);
    res.render('error', {error:err});
});
