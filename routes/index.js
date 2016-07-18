require('pmx').init();

module.exports = function (app, mainDb) {
    'use strict';

    // var newrelic = require('newrelic');

    var event = require('../helpers/eventstHandler')(app, mainDb);
    var RESPONSES = require('../constants/responses');
    var CONSTANTS = require('../constants/mainConstants');
    var fs = require('fs');
    var dbsNames = app.get('dbsNames');
    var dbsObject = mainDb.dbsObject;
    var models = require('../helpers/models.js')(dbsObject);
    var productRouter = require('./product')(models);
    var orderRouter = require('./order')(models, event);
    var invoiceRouter = require('./invoice')(models, event);
    var proformaRouter = require('./proforma')(models, event);
    var supplierRouter = require('./supplier')(models);
    var quotationRouter = require('./quotation')(models, event);
    var destinationRouter = require('./destination')(models);
    var incotermRouter = require('./incoterm')(models);
    var weeklySchedulerRouter = require('./weeklyScheduler')(models);
    var scheduledPayRouter = require('./scheduledPay')(models);
    var payrollComponentTypesRouter = require('./payrollComponentTypes')(models);
    var invoicingControlRouter = require('./invoicingControl')(models);
    var paymentTermRouter = require('./paymentTerm')(models);
    var deliverToTermRouter = require('./deliverTo')(models);
    var workflowRouter = require('./workflow')(models, event);
    var paymentRouter = require('./payment')(models, event);
    var paymentMethodRouter = require('./paymentMethod')(models);
    var periodRouter = require('./period')(models);
    var projectRouter = require('./project')(models, event);
    var employeeRouter = require('./employee')(event, models);
    var applicationRouter = require('./application')(event, models);
    var projectMemberRouter = require('./projectMember')(models, event);
    var departmentRouter = require('./department')(models, event);
    var revenueRouter = require('./revenue')(models);
    var wTrackRouter = require('./wTrack')(event, models);
    var opportunityRouter = require('./opportunity')(models, event);
    var leadsRouter = require('./leads')(models, event);
    var jobPositionRouter = require('./jobPosition')(models);
    var holidayRouter = require('./holiday')(event, models);
    var modulesRouter = require('./modules')(models);
    var monthHoursRouter = require('./monthHours')(event, models);
    var vacationRouter = require('./vacation')(event, models);
    var bonusTypeRouter = require('./bonusType')(models);
    var dashboardRouter = require('./dashboard')(models);
    var expensesInvoiceRouter = require('./expensesInvoice')(models, event);
    var dividendInvoiceRouter = require('./dividendInvoice')(models, event);
    var filterRouter = require('./filter')(models);
    var productCategoriesRouter = require('./productCategories')(models, event);
    var customersRouter = require('./customers')(models, event);
    var personsRouter = require('./person')(models, event);
    var capacityRouter = require('./capacity')(models);
    var payRollRouter = require('./payroll')(models);
    var importFileRouter = require('./importFile')(models);
    var paymentTypeRouter = require('./paymentType')(models);
    var payrollExprnsesRouter = require('./payrollExprnses')(models);
    var jobsRouter = require('./jobs')(models, event);
    var chartOfAccountRouter = require('./chartOfAccount')(models);
    var currencyRouter = require('./currency')(models);
    var prPositionRouter = require('./projectPosition')(models);
    var journalRouter = require('./journals')(models, event);
    var salaryReportRouter = require('./salaryReport')(models);
    var userRouter = require('./user')(event, models);
    var campaignRouter = require('./campaign')(models);
    var degreesRouter = require('./degrees')(models);
    var profilesRouter = require('./profiles')(models);
    var tasksRouter = require('./tasks')(models, event);
    var tagRouter = require('./tags')(models, event);
    var journalEntriesRouter = require('./journalEntries')(models, event);
    var writeOffRouter = require('./writeOff')(models, event);
    var payrollStructureTypesRouter = require('./payrollStructureTypes')(models);
    var cashTransferRouter = require('./cashTransfer')(models, event);

    var logger = require('../helpers/logger');
    var async = require('async');
    var ModulesHandler = require('../handlers/modules');
    var modulesHandler = new ModulesHandler(models);

    var sessionValidator = function (req, res, next) {
        var session = req.session;
        var month = 2678400000;

        if (session) {
            if (session.rememberMe) {
                session.cookie.maxAge = month;
            } else {
                session.cookie.maxAge = CONSTANTS.SESSION_TTL;
            }
        }

        next();
    };

    var tempFileCleaner = function (req, res, next) {
        res.on('finish', function () {
            if (req.files) {
                Object.keys(req.files).forEach(function (file) {
                    fs.unlink(req.files[file].path, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                    });
                });
            }
        });
        next();
    };

    require('../helpers/arrayExtender');

    app.use(sessionValidator);
    app.use(tempFileCleaner);

    app.set('logger', logger);

    // requestHandler = require('../requestHandler.js')(app, event, mainDb);

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });

    app.use('/filter', filterRouter);
    app.use('/products', productRouter);
    app.use('/orders', orderRouter);
    app.use('/invoices', invoiceRouter);
    app.use('/proforma', proformaRouter);
    app.use('/expensesInvoice', expensesInvoiceRouter);
    app.use('/dividendInvoice', dividendInvoiceRouter);
    app.use('/supplier', supplierRouter);
    app.use('/quotations', quotationRouter);
    app.use('/destination', destinationRouter);
    app.use('/incoterm', incotermRouter);
    app.use('/invoicingControl', invoicingControlRouter);
    app.use('/paymentTerm', paymentTermRouter);
    app.use('/deliverTo', deliverToTermRouter);
    app.use('/weeklyScheduler', weeklySchedulerRouter);
    app.use('/scheduledPay', scheduledPayRouter);
    app.use('/payrollComponentTypes', payrollComponentTypesRouter);
    app.use('/workflows', workflowRouter);
    app.use('/payments', paymentRouter);
    app.use('/period', periodRouter);
    app.use('/paymentMethod', paymentMethodRouter);
    app.use('/importFile', importFileRouter);
    app.use('/wTrack', wTrackRouter);
    app.use('/projects', projectRouter);
    app.use('/employees', employeeRouter);
    app.use('/applications', applicationRouter);
    app.use('/departments', departmentRouter);
    app.use('/revenue', revenueRouter);
    app.use('/salaryReport', salaryReportRouter);
    app.use('/opportunities', opportunityRouter);
    app.use('/leads', leadsRouter);
    app.use('/jobPositions', jobPositionRouter);
    app.use('/holiday', holidayRouter);
    app.use('/vacation', vacationRouter);
    app.use('/monthHours', monthHoursRouter);
    app.use('/modules', modulesRouter);
    app.use('/bonusType', bonusTypeRouter);
    app.use('/dashboard', dashboardRouter);
    app.use('/category', productCategoriesRouter);
    app.use('/customers', customersRouter);
    app.use('/companies', customersRouter);
    app.use('/persons', personsRouter);
    app.use('/capacity', capacityRouter);
    app.use('/payroll', payRollRouter);
    app.use('/jobs', jobsRouter);
    app.use('/paymentType', paymentTypeRouter);
    app.use('/payrollExprnses', payrollExprnsesRouter);
    app.use('/chartOfAccount', chartOfAccountRouter);
    app.use('/currency', currencyRouter);
    app.use('/projectPosition', prPositionRouter);
    app.use('/projectMember', projectMemberRouter);
    app.use('/journals', journalRouter);
    app.use('/journalEntries', journalEntriesRouter);
    app.use('/campaigns', campaignRouter);
    app.use('/degrees', degreesRouter);
    app.use('/profiles', profilesRouter);
    app.use('/tasks', tasksRouter);
    app.use('/tags', tagRouter);
    app.use('/users', userRouter);
    app.use('/writeOff', writeOffRouter);
    app.use('/payrollStructureTypes', payrollStructureTypesRouter);
    app.use('/cashTransfer', cashTransferRouter);

    app.get('/getDBS', function (req, res) {
        res.send(200, {dbsNames: dbsNames});
    });

    app.get('/currentDb', function (req, res, next) {
        if (req.session && req.session.lastDb) {
            res.status(200).send(req.session.lastDb);
        } else {
            res.status(401).send();
        }
    });

    app.get('/account/authenticated', function (req, res, next) {
        if (req.session && req.session.loggedIn) {
            res.send(200);
        } else {
            res.send(401);
        }
    });

    app.get('/download/:path', function (req, res) {
        var path = req.param('path');

        res.download(path);
    });

    app.get('/logout', function (req, res, next) {
        var session = req.session;

        if (session) {
            session.destroy(function (err) {
                if (err) {
                    return next(err);
                }
            });

        }
        res.clearCookie('lastDb');
        res.redirect('/#login');
    });

    function notFound(req, res, next) {
        res.status(404);

        if (req.accepts('html')) {
            return res.send(RESPONSES.PAGE_NOT_FOUND);
        }

        if (req.accepts('json')) {
            return res.json({error: RESPONSES.PAGE_NOT_FOUND});
        }

        res.type('txt');
        res.send(RESPONSES.PAGE_NOT_FOUND);

    }

    function errorHandler(err, req, res, next) {
        var status = err.status || 500;

        if (process.env.NODE_ENV === 'production') {
            if (status === 401) {
                logger.log('', err.message + '\n' + err.message);
            }
            res.status(status).send({error: err.message});
        } else {
            res.status(status).send({error: err.message + '\n' + err.stack});
            logger.error(err.message + '\n' + err.stack);
        }
    }

    // requestHandler.initScheduler();

    app.use(notFound);
    app.use(errorHandler);
};
