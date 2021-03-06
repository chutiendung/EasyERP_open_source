define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/main/MainView',
    'views/login/LoginView',
    'dataService',
    'helpers/eventsBinder',
    'custom',
    'common',
    'constants',
    'tracker'

], function (Backbone, _, $, mainView, loginView, dataService, eventsBinder, custom, common, CONSTANTS, tracker) {
    'use strict';
    var bindDefaultUIListeners = function () {
        $(document).on('keydown', '.ui-dialog', function (e) {
            if ($(e.target).get(0).tagName.toLowerCase() === 'textarea') {
                return;
            }
            switch (e.which) {
                case 27:
                    $('.edit-dialog').remove();
                    break;
                case 13:
                    $('.ui-dialog-buttonset .ui-button').eq(0).trigger('click');
                    break;
                default:
                    break;
            }
        });
        $(document).on('keypress', '.onlyNumber', function (e) {
            var charCode = (e.which) ? e.which : e.keyCode;

            return !(charCode > 31 && (charCode < 48 || charCode > 57));
        });

        $(window).on('resize', function (e) {
            $('#ui-datepicker-div').hide();
        });

        $(document).on('paste', '.onlyNumber', function (e) {
            return false;
        });

        $(document).on('click', function () {
            var currentContentType = self.contentType ? self.contentType.toUpperCase() : '';
            var contentTypes = {QUOTATIONS: 'Quotations', ORDERS: 'Orders', INVOICES: 'Invoices'};

            if (contentTypes[currentContentType]) {
                $('.list tbody').find('[data-id="false"]').remove();
            }

            $('.loginPanel').removeClass('open');
        });

        $('#wrapper').on('click', function () {
            $('.loginPanel').removeClass('open');
        });
    };

    var appRouter = Backbone.Router.extend({

        wrapperView: null,
        mainView   : null,
        topBarView : null,
        view       : null,

        routes: {
            home                                                                                            : 'any',
            'easyErp/Products/thumbnails(/c=:countPerPage)(/filter=:filter)'                                : 'goToProduct',
            'easyErp/import/list(/p=:page)(/c=:countPerPage)'                                               : 'goToImport',
            'login(?password=:password&dbId=:dbId&email=:email)'                                            : 'login',
            'easyErp/:contentType/kanban(/:parrentContentId)(/filter=:filter)'                              : 'goToKanban',
            'easyErp/:contentType/datelist(/c=:countPerPage)(/filter=:filter)'                              : 'goToDateList',
            'easyErp/:contentType/thumbnails(/c=:countPerPage)(/filter=:filter)'                            : 'goToThumbnails',
            'easyErp/:contentType/tform(/:modelId)(/p=:page)(/c=:countPerPage)(/filter=:filter)'            : 'goToTForm', // FixMe chenge to required Id after test
            'easyErp/:contentType/form(/:modelId)'                                                          : 'goToForm', // FixMe chenge to required Id after test
            'easyErp/:contentType/list(/pId=:parrentContentId)(/p=:page)(/c=:countPerPage)(/filter=:filter)': 'goToList',
            'easyErp/Revenue(/filter=:filter)'                                                              : 'revenue',
            'easyErp/settingsEmployee(/filter=:filter)'                                                     : 'settingsEmployee',
            'easyErp/Efficiency'                                                                            : 'hours',
            'easyErp/Attendance'                                                                            : 'attendance',
            'easyErp/Profiles'                                                                              : 'goToProfiles',
            'easyErp/productSettings'                                                                       : 'productSettings',
            'easyErp/organizationSettings'                                                                  : 'organizationSettings',
            'easyErp/myProfile'                                                                             : 'goToUserPages',
            'easyErp/Workflows'                                                                             : 'goToWorkflows',
            'easyErp/Accounts'                                                                              : 'goToAccounts',
            'easyErp/Dashboard'                                                                             : 'goToDashboard',
            'easyErp/reportsDashboard'                                                                      : 'goToReportsDashboard',
            'easyErp/payrollDashboard'                                                                      : 'goToPayrollDashboard',
            'easyErp/DashBoardVacation(/filter=:filter)'                                                    : 'dashBoardVacation',
            'easyErp/invoiceCharts(/filter=:filter)'                                                        : 'invoiceCharts',
            'easyErp/HrDashboard'                                                                           : 'hrDashboard',
            'easyErp/projectDashboard'                                                                      : 'goToProjectDashboard',
            'easyErp/customDashboardCharts/:modelId'                                                        : 'goToCustomDashboard',
            // 'easyErp/projectsDashboard'                                                                     : 'goToProjectsDashboard',
            // "easyErp/jobsDashboard(/filter=:filter)"                                                        : "goToJobsDashboard",
            'easyErp/:contentType'                                                                          : 'getList',
            '*any'                                                                                          : 'any'
        },

        initialize: function () {
            var self = this;

            this.on('all', function () {
                $('.ui-dialog').remove();
                $('#ui-datepicker-div').hide().remove();
            });
            this.on('updateOrgSettings', this.getOrgSettings, this);

            bindDefaultUIListeners();

            if (!App || !App.currentUser) {
                dataService.getData(CONSTANTS.URLS.CURRENT_USER, null, function (response) {
                    if (response && !response.error) {
                        App.currentUser = response.user;
                        if (!App.filtersObject) {
                            App.filtersObject = {};
                        }
                        App.filtersObject.savedFilters = response.savedFilters;
                        if (!App.organizationSettings) {
                            self.trigger('updateOrgSettings');
                        }
                    }
                });
            }
        },

        getOrgSettings: function () {
            dataService.getData('/organizationSettings', null, function (response) {
                if (response && !response.error) {
                    App.organizationSettings = response.data;
                    if (response.data && response.data.startDate) { //toDo enable StartDate of program
                        $.datepicker.setDefaults({
                            firstDay: 1,
                            minDate : new Date(response.data.startDate)
                        });
                    }

                }
            });
        },

        dashBoardVacation: function (filter) {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('DashBoard Vacation', {filter: filter});

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'DashBoard Vacation',
                message  : 'DashBoard Vacation',
                email    : currentUser.email,
                login    : currentUser.login
            });

            filter = filter || custom.retriveFromCash('DashVacation.filter');

            if (filter && typeof filter === 'string') {
                filter = decodeURIComponent(filter);
                filter = JSON.parse(filter);
            }

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderDash();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderDash();
            }

            function renderDash() {
                var startTime = new Date();
                var contentViewUrl = "views/vacationDashboard/index";
                var topBarViewUrl = "views/vacationDashboard/TopBarView";

                if (self.mainView === null) {
                    self.main("DashBoardVacation");
                } else {
                    self.mainView.updateMenu("DashBoardVacation");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, TopBarView) {
                    var contentview;
                    var topbarView;

                    custom.setCurrentVT('list');

                    topbarView = new TopBarView();
                    contentview = new contentView({
                        startTime: startTime,
                        filter   : filter
                    });
                    topbarView.bind('changeDateRange', contentview.changeDateRange, contentview);

                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        invoiceCharts: function (filter) {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Invoice Charts', {filter: filter});

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Invoice Charts',
                message  : 'Invoice Charts',
                email    : currentUser.email,
                login    : currentUser.login
            });

            if (filter) {
                filter = decodeURIComponent(filter);
                filter = JSON.parse(filter);
            }

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        render();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                render();
            }

            function render() {
                var startTime = new Date();
                var contentViewUrl = "views/invoiceCharts/index";
                var collectionUrl = 'collections/invoiceCharts/invoiceCharts';
                var topBarViewUrl = "views/invoiceCharts/TopBarView";

                if (self.mainView === null) {
                    self.main("invoiceCharts");
                } else {
                    self.mainView.updateMenu("invoiceCharts");
                }

                require([collectionUrl, contentViewUrl, topBarViewUrl], function (ChartCollection, contentView, TopBarView) {
                    var collection = new ChartCollection();
                    var contentview;
                    var topbarView;

                    custom.setCurrentVT('list');

                    collection.on('reset', renderChart);

                    function renderChart() {
                        topbarView = new TopBarView();
                        contentview = new contentView({
                            startTime : startTime,
                            filter    : filter,
                            collection: collection
                        });
                        topbarView.bind('changeDateRange', contentview.changeDateRange, contentview);

                        self.changeView(contentview);
                        self.changeTopBarView(topbarView);
                    }
                });
            }
        },

        goToCustomDashboard: function (modelId) {
            var self = this;
            var currentUser = App.currentUser || {};

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'CustomDashboard',
                message  : 'CustomDashboard',
                email    : currentUser.email,
                login    : currentUser.login
            });

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderDashboard(modelId, self);
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderDashboard(modelId, self);
            }

            function renderDashboard(modelId, context) {
                var self = context;
                var startTime = new Date();
                var topBarViewUrl = 'views/customDashboard/customDashboard/TopBarView';
                var contentViewUrl = 'views/customDashboard/customDashboard/ContentView';
                var contentModelUrl = 'models/CustomDashboardModel';

                if (context.mainView === null) {
                    context.main("customDashboardCharts");
                } else {
                    context.mainView.updateMenu("customDashboardCharts");
                }

                require([contentModelUrl, contentViewUrl, topBarViewUrl], function (contentModel, contentView, topBarView) {
                    var getModel = new contentModel();
                    var contentview;
                    var topbarView;

                    getModel.urlRoot = getModel.url() + modelId;
                    //custom.setCurrentVT('list');

                    getModel.fetch({
                        success: function (model) {

                            topbarView = new topBarView({
                                name: model.attributes[0].name,
                                description: model.attributes[0].description,
                                actionType: 'Content'
                            });

                            contentview = new contentView({
                                model: model,
                                startTime : startTime
                            });

                            eventsBinder.subscribeTopBarEvents(topbarView, contentview);
                            context.changeView(contentview);
                            context.changeTopBarView(topbarView);
                        },
                        error  : function (model, response) {
                            if (response.status === 401) {
                                Backbone.history.navigate('#login', {trigger: true});
                            }
                        }
                    });
                });
            }
        },

        hrDashboard: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('HR Dashboard');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'HR Dashboard',
                message  : 'HR Dashboard',
                email    : currentUser.email,
                login    : currentUser.login
            });

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderDash();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderDash();
            }

            function renderDash() {
                var startTime = new Date();
                var contentViewUrl = "views/hrDashboard/index";

                if (self.mainView === null) {
                    self.main("HrDashboard");
                } else {
                    self.mainView.updateMenu("HrDashboard");
                }

                require([contentViewUrl], function (contentView) {
                    var contentview;

                    custom.setCurrentVT('list');

                    contentview = new contentView({startTime: startTime});

                    self.changeView(contentview, true);
                });
            }
        },

        redirectTo: function () {
            if (App.requestedURL === null) {
                App.requestedURL = Backbone.history.fragment;
            }

            Backbone.history.fragment = '';
            Backbone.history.navigate('login', {trigger: true});
        },

        revenue: function (filter) {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Revenue', {filter: filter});

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Revenue',
                message  : 'Revenue',
                email    : currentUser.email,
                login    : currentUser.login
            });

            if (filter) {
                filter = decodeURIComponent(filter);
                filter = JSON.parse(filter);
            }

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderRevenue();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderRevenue();
            }

            function renderRevenue() {
                var startTime = new Date();
                var collectionUrl = 'collections/revenue/profit';
                var topBarViewUrl = 'views/Revenue/TopBarView';
                var contentViewUrl = 'views/Revenue/index';

                if (self.mainView === null) {
                    self.main('Revenue');
                } else {
                    self.mainView.updateMenu('Revenue');
                }

                require([collectionUrl, contentViewUrl, topBarViewUrl], function (ChartCollection, ContentView, TopBarView) {
                    var topbarView = new TopBarView({
                        startTime: startTime,
                        filter   : filter
                        // collection: collection
                    });
                    var contentview;

                    function render() {
                        contentview = new ContentView({
                            startTime: startTime,
                            filter   : filter
                            // collection: collection
                        });
                        topbarView.bind('changeDateRange', contentview.changeDateRange, contentview);

                        self.changeView(contentview);
                        self.changeTopBarView(topbarView);
                    }

                    topbarView.on('render', render);
                    topbarView.render();

                    custom.setCurrentVT('list');
                });
            }
        },

        settingsEmployee: function (filter) {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Settings Employee', {filter: filter});

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Settings Employee',
                message  : 'Settings Employee',
                email    : currentUser.email,
                login    : currentUser.login
            });

            if (filter) {
                filter = decodeURIComponent(filter);
                filter = JSON.parse(filter);
            }

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderSettingsEmployee();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderSettingsEmployee();
            }

            function renderSettingsEmployee() {
                var startTime = new Date();
                var topBarViewUrl = 'views/settingsEmployee/TopBarView';
                var contentViewUrl = 'views/settingsEmployee/index';

                if (self.mainView === null) {
                    self.main('settingsEmployee');
                } else {
                    self.mainView.updateMenu('settingsEmployee');
                }

                require([contentViewUrl, topBarViewUrl], function (ContentView, TopBarView) {
                    var topbarView = new TopBarView({
                        startTime: startTime,
                        filter   : filter
                    });
                    var contentview;

                    topbarView.render();

                    contentview = new ContentView({
                        startTime: startTime,
                        filter   : filter
                    });

                });
            }
        },

        hours: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Hours');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Hours',
                message  : 'Hours',
                email    : currentUser.email,
                login    : currentUser.login
            });

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderRevenue();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderRevenue();
            }

            function renderRevenue() {
                var startTime = new Date();
                var contentViewUrl = 'views/Hours/index';

                if (self.mainView === null) {
                    self.main('Efficiency');
                } else {
                    self.mainView.updateMenu('Efficiency');
                }

                require([contentViewUrl], function (contentView) {
                    var contentview;

                    custom.setCurrentVT('list');

                    contentview = new contentView({startTime: startTime});

                    self.changeView(contentview, true);
                });
            }
        },

        attendance: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Attendance');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Attendance',
                message  : 'Attendance',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    renderAttendance(self);
                } else {
                    self.redirectTo();
                }
            });

            function renderAttendance(context) {
                var contentViewUrl = 'views/Attendance/index';
                var topBarViewUrl = 'views/Attendance/TopBarView';
                var self = context;

                if (context.mainView === null) {
                    context.main('Attendance');
                } else {
                    context.mainView.updateMenu('Attendance');
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {
                    var contentview = new contentView();
                    var topBar = new topBarView({actionType: 'Content'});
                    self.changeView(contentview);
                    self.changeTopBarView(topBar);
                });
            }
        },

        goToImport: function (page, count) {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Import', {page: page, count: count});

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Import',
                message  : 'Import',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goImport(self);
                } else {
                    self.redirectTo();
                }
            });

            function goImport(context) {
                var startTime = new Date();

                if (context.mainView === null) {
                    context.main('import');
                } else {
                    context.mainView.updateMenu('import');
                }

                var contentViewUrl = 'views/Import/ContentView';

                require([contentViewUrl], function (contentView) {
                    var contentview = new contentView({startTime: startTime, page: page, count: count});
                    var url = '#easyErp/import/list';

                    if (page) {
                        url += '/p=' + page;
                    }

                    if (count) {
                        url += '/c=' + count;
                    }

                    custom.setCurrentVT('list');

                    context.changeView(contentview);
                    Backbone.history.navigate(url, {replace: true});
                });
            }
        },

        goToProfiles: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Profiles');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Profiles',
                message  : 'Profiles',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goProfile(self);
                } else {
                    self.redirectTo();
                }
            });

            function goProfile(context) {
                var startTime = new Date();
                if (context.mainView === null) {
                    context.main("Profiles");
                } else {
                    context.mainView.updateMenu("Profiles");
                }

                var contentViewUrl = 'views/Profiles/ContentView';
                var topBarViewUrl = 'views/Profiles/TopBarView';
                var collectionUrl = 'collections/Profiles/ProfilesCollection';

                var self = context;

                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, contentCollection) {
                    var collection = new contentCollection();

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('list');

                    function createViews() {
                        collection.unbind('reset');
                        var contentview = new contentView({collection: collection, startTime: startTime});
                        var url = '#easyErp/Profiles';
                        var topbarView = new topBarView({actionType: "Content"});

                        topbarView.bind('createEvent', contentview.createItem, contentview);
                        topbarView.bind('editEvent', contentview.editProfileDetails, contentview);
                        topbarView.bind('deleteEvent', contentview.deleteItems, contentview);

                        topbarView.bind('saveEvent', contentview.saveProfile, contentview);
                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);
                        Backbone.history.navigate(url, {replace: true});
                    }
                });
            }
        },

        organizationSettings: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Accounts');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Organization Profile',
                message  : 'Organization Profile',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goOrgSettings(self);
                } else {
                    self.redirectTo();
                }
            });

            function goOrgSettings(context) {
                var startTime = new Date();
                var contentViewUrl = 'views/orgSettings/ContentView';
                var topBarViewUrl = 'views/orgSettings/TopBarView';
                var self = context;

                if (context.mainView === null) {
                    context.main('organizationSettings');
                } else {
                    context.mainView.updateMenu('organizationSettings');
                }

                require([contentViewUrl, topBarViewUrl], function (ContentView, TopBarView) {

                    var contentview = new ContentView({startTime: startTime});
                    var topbarView = new TopBarView({actionType: 'Content'});
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);

                    contentview._events = _.extend({}, self._events);
                });
            }
        },

        goToAccounts: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Accounts');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Accounts',
                message  : 'Accounts',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goAccounts(self);
                } else {
                    self.redirectTo();
                }
            });

            function goAccounts(context) {
                var startTime = new Date();
                var contentViewUrl = "views/Accounting/ContentView";
                var topBarViewUrl = "views/Accounting/TopBarView";
                var self = context;

                if (context.mainView === null) {
                    context.main("Accounts");
                } else {
                    context.mainView.updateMenu("Accounts");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: "Content"});
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        productSettings: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('productSettings');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'productSettings',
                message  : 'productSettings',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goSettings(self);
                } else {
                    self.redirectTo();
                }
            });

            function goSettings(context) {
                var startTime = new Date();
                var contentViewUrl = 'views/settingsProduct/ContentView';
                var topBarViewUrl = 'views/settingsProduct/TopBarView';
                var collectionUrl = 'collections/Products/ProductCategories';
                var self = context;

                if (context.mainView === null) {
                    context.main("productSettings");
                } else {
                    context.mainView.updateMenu("productSettings");
                }

                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, contentCollection) {
                    var collection = new contentCollection();

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('list');

                    function createViews() {
                        collection.unbind('reset');

                        var url;
                        var contentview = new contentView({collection: collection, startTime: startTime});
                        var topbarView = new topBarView({actionType: 'Content'});

                        topbarView.bind('createEvent', contentview.createItem, contentview);
                        topbarView.bind('editEvent', contentview.editItem, contentview);
                        topbarView.bind('deleteEvent', contentview.deleteItems, contentview);
                        topbarView.bind('saveEvent', contentview.saveItem, contentview);

                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);

                        url = '#easyErp/productSettings';

                        Backbone.history.navigate(url, {replace: true});
                    }
                });
            }
        },

        goToProduct: function (countPerPage, filter) {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Products');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Products',
                message  : 'Products',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goProduct(self);
                } else {
                    self.redirectTo();
                }
            });

            function goProduct(context) {
                var startTime = new Date();
                var contentViewUrl = 'views/Products/IndexView';
                var topBarViewUrl = 'views/Products/category/TopBarView';
                var collectionUrl = 'collections/Products/ProductCategories';
                var self = context;
                var contentType = 'Products';

                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }

                if (countPerPage) {
                    countPerPage = parseInt(countPerPage, 10);

                    if (isNaN(countPerPage)) {
                        countPerPage = 0;
                    }
                }

                if (!filter) {

                    filter = custom.getSavedFilterForCT(contentType) || custom.getDefSavedFilterForCT(contentType);

                    if (filter) {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/c=' + countPerPage + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    }

                    filter = {
                        canBePurchased: {
                            key  : 'canBePurchased',
                            value: ['true']
                        }
                    };

                } else {
                    filter = JSON.parse(filter);
                }

                require([contentViewUrl, topBarViewUrl, collectionUrl], function (ContentView, TopBarView, ContentCollection) {
                    var collection = new ContentCollection();

                    App.filtersObject.filter = filter;

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('thumbnails');

                    function createViews() {
                        var url;
                        var contentView;
                        var topBarView;

                        collection.unbind('reset');

                        contentView = new ContentView({
                            collection  : collection,
                            startTime   : startTime,
                            countPerPage: countPerPage,
                            filter      : filter
                        });
                        topBarView = new TopBarView({actionType: 'Content'});

                        topBarView.bind('createEvent', contentView.createItem, contentView);
                        topBarView.bind('editEvent', contentView.editItem, contentView);
                        topBarView.bind('deleteEvent', contentView.deleteItems, contentView);
                        topBarView.bind('saveEvent', contentView.saveItem, contentView);

                        context.changeView(contentView);
                        context.changeTopBarView(topBarView);

                        url = '#easyErp/Products';

                        Backbone.history.navigate(url, {replace: true});
                    }
                });
            }
        },

        goToUserPages: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('UserPage');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'UserPage',
                message  : 'UserPage',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goMyProfile(self);
                } else {
                    self.redirectTo();
                }
            });

            function goMyProfile(context) {
                var startTime = new Date();
                var contentViewUrl = "views/myProfile/ContentView";
                var topBarViewUrl = "views/myProfile/TopBarView";
                var self = context;
                if (context.mainView === null) {
                    context.main("myProfile");
                } else {
                    context.mainView.updateMenu("myProfile");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    custom.setCurrentVT('list');
                    var url = '#easyErp/myProfile';
                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: "Content"});

                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);

                    Backbone.history.navigate(url, {replace: true});
                });
            }
        },

        goToPayrollDashboard: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Payroll Dashboard');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Payroll Dashboard',
                message  : 'Payroll Dashboard',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goDashboard(self);
                } else {
                    self.redirectTo();
                }
            });

            function goDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = 'views/payrollDashboard/ContentView';
                var topBarViewUrl = 'views/payrollDashboard/TopBarView';
                var self = context;

                if (context.mainView === null) {
                    context.main('payrollDashboard');
                } else {
                    context.mainView.updateMenu('payrollDashboard');
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {
                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: 'Content'});

                    custom.setCurrentVT('list');

                    topbarView.bind('backToSettingsEvent', contentview.backToSettings, contentview);

                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        goToReportsDashboard: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Reports Dashboard');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Reports Dashboard',
                message  : 'Reports Dashboard',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goDashboard(self);
                } else {
                    self.redirectTo();
                }
            });

            function goDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = 'views/reportsDashboard/ContentView';
                var topBarViewUrl = 'views/reportsDashboard/TopBarView';
                var self = context;

                if (context.mainView === null) {
                    context.main('reportsDashboard');
                } else {
                    context.mainView.updateMenu('reportsDashboard');
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {
                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: 'Content'});

                    custom.setCurrentVT('list');
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        goToDashboard: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Dashboard');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Dashboard',
                message  : 'Dashboard',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goDashboard(self);
                } else {
                    self.redirectTo();
                }
            });

            function goDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = "views/Dashboard/ContentView";
                var topBarViewUrl = "views/Dashboard/TopBarView";
                var self = context;

                if (context.mainView === null) {
                    context.main("Dashboard");
                } else {
                    context.mainView.updateMenu("Dashboard");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    custom.setCurrentVT('list');

                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: "Content"});
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        goToProjectsDashboard: function () {
            var self = this;

            // FlurryAgent.logEvent('Projects Dashboard');

            this.checkLogin(function (success) {
                if (success) {
                    goProjectDashboard(self);
                } else {
                    self.redirectTo();
                }
            });

            function goProjectDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = "views/projectsDashboard/ContentView";
                var topBarViewUrl = "views/projectsDashboard/TopBarView";
                var self = context;

                if (context.mainView === null) {
                    context.main("projectsDashboard");
                } else {
                    context.mainView.updateMenu("projectsDashboard");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    custom.setCurrentVT('list');

                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: "Content"});
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        goToProjectDashboard: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Project Dashboard');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Project Dashboard',
                message  : 'Project Dashboard',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goProjectDashboard(self);
                } else {
                    self.redirectTo();
                }
            });

            function goProjectDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = "views/projectDashboard/ContentView";
                var topBarViewUrl = "views/projectDashboard/TopBarView";
                var self = context;

                if (context.mainView === null) {
                    context.main("projectDashboard");
                } else {
                    context.mainView.updateMenu("projectDashboard");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    custom.setCurrentVT('list');

                    var contentview = new contentView({startTime: startTime});
                    var topbarView = new topBarView({actionType: "Content"});
                    self.changeView(contentview);
                    self.changeTopBarView(topbarView);
                });
            }
        },

        goToJobsDashboard: function (filter) {
            var self = this;
            if (filter) {
                filter = JSON.parse(filter);
            }

            this.checkLogin(function (success) {
                if (success) {
                    goProjectDashboard(self);
                } else {
                    self.redirectTo();
                }
            });

            function goProjectDashboard(context) {
                var startTime = new Date();
                var contentViewUrl = "views/jobsDashboard/ContentView";
                var topBarViewUrl = "views/jobsDashboard/TopBarView";
                var self = context;

                if (context.mainView === null) {
                    context.main("jobsDashboard");
                } else {
                    context.mainView.updateMenu("jobsDashboard");
                }

                require([contentViewUrl, topBarViewUrl], function (contentView, topBarView) {

                    custom.setCurrentVT('list');

                    var topbarView = new topBarView({
                        actionType: "Content"
                    });

                    var contentview = new contentView({
                        startTime: startTime,
                        filter   : filter
                    });

                    self.changeTopBarView(topbarView);

                    self.changeView(contentview);
                });
            }
        },

        goToWorkflows: function () {
            var self = this;
            var currentUser = App.currentUser || {};

            // FlurryAgent.logEvent('Workflows');

            tracker.track({
                date     : new Date(),
                eventType: 'userFlow',
                name     : 'Workflows',
                message  : 'Workflows',
                email    : currentUser.email,
                login    : currentUser.login
            });

            this.checkLogin(function (success) {
                if (success) {
                    goToWorkflows(self);
                } else {
                    self.redirectTo();
                }
            });

            function goToWorkflows(context) {
                var startTime = new Date();

                if (context.mainView === null) {
                    context.main("Workflows");
                } else {
                    context.mainView.updateMenu("Workflows");
                }

                var contentViewUrl = "views/Workflows/ContentView",
                    topBarViewUrl = "views/Workflows/TopBarView",
                    collectionUrl = "collections/Workflows/WorkflowsCollection";

                var self = context;

                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, contentCollection) {
                    var collection = new contentCollection();

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('list');

                    function createViews() {
                        collection.unbind('reset');
                        var contentview = new contentView({collection: collection, startTime: startTime});
                        var topbarView = new topBarView({actionType: "Content"});
                        var url = '#easyErp/Workflows';

                        topbarView.bind('createEvent', contentview.createItem, contentview);
                        topbarView.bind('editEvent', contentview.editWorkflowsDetails, contentview);
                        topbarView.bind('deleteEvent', contentview.deleteItems, contentview);
                        topbarView.bind('saveEvent', contentview.saveProfile, contentview);

                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);

                        Backbone.history.navigate(url, {replace: true});
                    }
                });
            }
        },

        checkDatabase: function (db) {
            App.weTrack = true;

            App.weTrack = true; //todo remove
            App.currentDb = db;
        },

        buildCollectionRoute: function (contentType) {
            if (!contentType) {
                throw new Error('Error building collection route. ContentType is undefined');
            }
            switch (contentType) {
                case 'Birthdays':
                    return 'collections/' + contentType + '/filterCollection';
                default:
                    return 'collections/' + contentType + '/filterCollection';
            }
        },

        goToList: function (contentType, parrentContentId, page, countPerPage, filter) {
            var self = this;

            this.checkLogin(function (success) {
                if (success) {
                    if (!App || !App.currentDb) {
                        dataService.getData('/currentDb', null, function (response) {
                            if (response && !response.error) {
                                self.checkDatabase(response);
                            } else {
                                console.log('can\'t fetch current db');
                            }

                            goList(self);
                        });
                    } else {
                        goList(self);
                    }
                } else {
                    self.redirectTo();
                }
            });

            function goList(context) {
                var self = context;
                var currentContentType = context.testContent(contentType);
                var currentUser = App.currentUser || {};
                var location = window.location.hash;
                var startTime = new Date();
                var message;
                var url;
                var contentViewUrl;
                var topBarViewUrl;
                var collectionUrl;
                var count;

                if (contentType !== currentContentType) {
                    contentType = currentContentType;
                    url = '#easyErp/' + contentType + '/list';

                    if (parrentContentId) {
                        url += '/' + parrentContentId;
                    }

                    message = contentType + ' List';

                    // FlurryAgent.logEvent(message);

                    tracker.track({
                        date     : new Date(),
                        eventType: 'userFlow',
                        name     : message,
                        message  : message,
                        email    : currentUser.email,
                        login    : currentUser.login
                    });

                    return Backbone.history.navigate(url, {replace: true});
                }

                message = contentType + ' List';

                // FlurryAgent.logEvent(message);

                tracker.track({
                    date     : new Date(),
                    eventType: 'userFlow',
                    name     : message,
                    message  : message,
                    email    : currentUser.email,
                    login    : currentUser.login
                });

                contentViewUrl = 'views/' + contentType + '/list/ListView';
                topBarViewUrl = 'views/' + contentType + '/TopBarView';
                collectionUrl = context.buildCollectionRoute(contentType);
                page = parseInt(page, 10);
                count = parseInt(countPerPage, 10);

                if (isNaN(page)) {
                    page = 1;
                }
                if (isNaN(count)) {
                    count = CONSTANTS.DEFAULT_ELEMENTS_PER_PAGE;
                }

                if (contentType === 'contractJobs') {
                    count = 10;
                }

                if (!filter) {

                    filter = custom.getSavedFilterForCT(contentType) || custom.getDefSavedFilterForCT(contentType);

                    if (filter) {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/c=' + countPerPage + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    }

                    if (contentType === 'salesProduct') {
                        filter = {
                            canBeSold: {
                                key  : 'canBeSold',
                                value: ['true']
                            }

                        };

                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    } else if (contentType === 'Product') {
                        filter = {
                            canBePurchased: {
                                key  : 'canBePurchased',
                                value: ['true']
                            }
                        };
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    }
                } else if (filter) {
                    filter = JSON.parse(filter);
                }

                // savedFilter = custom.savedFilters(contentType, filter);
                // savedFilter = filter;

                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }
                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, contentCollection) {
                    var collection;

                    App.filtersObject.filter = filter;

                    collection = new contentCollection({
                        viewType        : 'list',
                        page            : page,
                        reset           : true,
                        count           : count,
                        filter          : filter,
                        parrentContentId: parrentContentId,
                        contentType     : contentType,
                        showMore        : false
                    });

                    collection.bind('reset', _.bind(createViews, self));

                    custom.setCurrentVT('list');

                    function createViews() {
                        var topbarView;
                        var contentview;

                        collection.unbind('reset');
                        
                        topbarView = new topBarView({
                            actionType: 'Content',
                            collection: collection
                        });
                        
                        contentview = new contentView({
                            collection: collection,
                            startTime : startTime,
                            filter    : filter
                        });

                        eventsBinder.subscribeTopBarEvents(topbarView, contentview);
                        eventsBinder.subscribeCollectionEvents(collection, contentview);

                        collection.trigger('fetchFinished', {
                            totalRecords: collection.totalRecords,
                            currentPage : collection.currentPage,
                            pageSize    : collection.pageSize
                        });

                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);
                    }
                });
            }
        },

        goToDateList: function (contentType, countPerPage, filter) {
            var self = this;

            if (filter && typeof filter === 'string') {
                filter = decodeURIComponent(filter);
                filter = JSON.parse(filter);
            }

            if (!this.isAuth) {
                this.checkLogin(function (success) {
                    if (success) {
                        self.isAuth = true;
                        renderDateList();
                    } else {
                        self.redirectTo();
                    }
                });
            } else {
                renderDateList();
            }

            function renderDateList() {
                var startTime = new Date();
                var contentViewUrl = "views/" + contentType + "/dateList/ListView";
                var topBarViewUrl = "views/" + contentType + "/TopBarView";
                var collectionUrl = "collections/DealTasks/dateCollection";

                if (self.mainView === null) {
                    self.main(contentType);
                } else {
                    self.mainView.updateMenu(contentType);
                }

                require([contentViewUrl, topBarViewUrl, collectionUrl], function (ContentView, TopBarView, ContentCollection) {
                    var contentview;
                    var topbarView;
                    var collection;

                    App.filtersObject.filter = filter;

                    collection = new ContentCollection({
                        viewType: 'datelist',
                        reset   : true,
                        filter  : filter
                    });

                    collection.bind('reset', _.bind(createViews, self));

                    custom.setCurrentVT('dateList');

                    function createViews() {
                        collection.unbind('reset');
                        topbarView = new TopBarView({actionType: 'Content'});
                        contentview = new ContentView({
                            startTime : startTime,
                            collection: collection,
                            filter    : filter
                        });
                        eventsBinder.subscribeTopBarEvents(topbarView, contentview);
                        eventsBinder.subscribeCollectionEvents(collection, contentview)

                        self.changeView(contentview);
                        self.changeTopBarView(topbarView);
                    }

                });
            }
        },

        goToTForm: function (contentType, modelId, page, countPerPage, filter) {
            var self = this;

            this.checkLogin(function (success) {
                if (success) {
                    if (!App || !App.currentDb) {
                        dataService.getData('/currentDb', null, function (response) {
                            if (response && !response.error) {
                                self.checkDatabase(response);
                            } else {
                                console.log('can\'t fetch current db');
                            }

                            goTForm(self);
                        });
                    } else {
                        goTForm(self);
                    }
                } else {
                    self.redirectTo();
                }
            });

            function goTForm(context) {
                var self = context;
                var currentContentType = context.testContent(contentType);
                var location = window.location.hash;
                var startTime = new Date();
                var currentUser = App.currentUser || {};
                var url;
                var savedFilter;
                var startDate;
                var endDate;
                var contentViewUrl;
                var topBarViewUrl;
                var collectionUrl;
                var navigatePage;
                var count;

                var message = contentType + ' TForm';

                // FlurryAgent.logEvent(message);

                tracker.track({
                    date     : new Date(),
                    eventType: 'userFlow',
                    name     : message,
                    message  : message,
                    email    : currentUser.email,
                    login    : currentUser.login
                });

                contentViewUrl = 'views/' + contentType + '/form/ContentView';
                topBarViewUrl = 'views/' + contentType + '/TopBarView';
                collectionUrl = context.buildCollectionRoute(contentType);
                page = parseInt(page, 10);
                count = parseInt(countPerPage, 10);

                if (isNaN(page)) {
                    page = 1;
                }
                if (isNaN(count)) {
                    count = CONSTANTS.DEFAULT_ELEMENTS_PER_PAGE;
                }

                if (!filter) {

                    filter = custom.getSavedFilterForCT(contentType) || custom.getDefSavedFilterForCT(contentType);

                    if (filter) {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/c=' + countPerPage + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    }

                    if (contentType === 'salesProduct') {
                        filter = {
                            'canBeSold': {
                                key  : 'canBeSold',
                                value: ['true']
                            }

                        };

                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    } else if (contentType === 'Product') {
                        filter = {
                            canBePurchased: {
                                key  : 'canBePurchased',
                                value: ['true']
                            }
                        };
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    }
                } else if (filter) {
                    filter = JSON.parse(filter);
                }

                //savedFilter = custom.savedFilters(contentType, filter);
                //savedFilter = filter;

                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }
                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, contentCollection) {
                    var collection;

                    App.filtersObject.filter = filter;

                    collection = new contentCollection({
                        viewType   : 'tform',
                        page       : page,
                        reset      : true,
                        count      : count,
                        filter     : filter,
                        contentType: contentType,
                        showMore   : false
                    });

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('tform');

                    function createViews() {
                        var topbarView;
                        var contentview;

                        collection.unbind('reset');

                        topbarView = new topBarView({
                            actionType: 'Content',
                            collection: collection
                        });

                        contentview = new contentView({
                            collection: collection,
                            startTime : startTime,
                            viewType  : 'tform',
                            filter    : filter,
                            modelId   : modelId
                        });

                        eventsBinder.subscribeTopBarEvents(topbarView, contentview);
                        eventsBinder.subscribeCollectionEvents(collection, contentview);

                        collection.trigger('fetchFinished', {
                            totalRecords: collection.totalRecords,
                            currentPage : collection.currentPage,
                            pageSize    : collection.pageSize
                        });

                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);
                    }
                });
            }
        },

        goToForm: function (contentType, modelId) {
            var self = this;

            this.checkLogin(function (success) {
                if (success) {
                    if (!App || !App.currentDb) {
                        dataService.getData('/currentDb', null, function (response) {
                            if (response && !response.error) {
                                self.checkDatabase(response);
                            } else {
                                console.log('can\'t fetch current db');
                            }

                            goForm(self);
                        });
                    } else {
                        goForm(self);
                    }
                } else {
                    self.redirectTo();
                }
            });

            function goForm(context) {
                var currentContentType = context.testContent(contentType);
                var currentUser = App.currentUser || {};
                var self = context;
                var startTime = new Date();
                var contentFormModelUrl;
                var contentFormViewUrl;
                var topBarViewUrl;
                var message;
                var url;

                if (contentType !== currentContentType) {
                    contentType = currentContentType;
                    url = '#easyErp/' + contentType + '/form';

                    if (modelId) {
                        url += '/' + modelId;
                    }

                    Backbone.history.navigate(url, {replace: true});
                }

                message = contentType + ' Form';

                // FlurryAgent.logEvent(message);

                tracker.track({
                    date     : new Date(),
                    eventType: 'userFlow',
                    name     : message,
                    message  : message,
                    email    : currentUser.email,
                    login    : currentUser.login
                });

                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }

                if (contentType === 'PayrollExpenses') {
                    contentFormModelUrl = "collections/PayrollExpenses/oneMonthCollection";
                    contentFormViewUrl = "views/" + contentType + "/form/FormView";
                    topBarViewUrl = "views/" + contentType + "/TopBarView";
                } else if (contentType !== 'ownCompanies') {
                    contentFormModelUrl = "models/" + contentType + "Model";
                    contentFormViewUrl = "views/" + contentType + "/form/FormView";
                    topBarViewUrl = "views/" + contentType + "/TopBarView";
                } else {
                    contentFormModelUrl = "models/CompaniesModel";
                    contentFormViewUrl = "views/" + contentType + "/form/FormView";
                    topBarViewUrl = "views/" + contentType + "/TopBarView";
                }

                custom.setCurrentVT('form');

                require([contentFormModelUrl, contentFormViewUrl, topBarViewUrl], function (contentFormModel, contentFormView, topBarView) {
                    var getModel = new contentFormModel();

                    if (contentType === 'PayrollExpenses') {
                        getModel.url = function () {
                            return '/payroll/' + modelId;
                        };
                    }

                    // getModel.urlRoot = '/' + contentType + '/form';
                    getModel.urlRoot = getModel.url() + modelId;
                    getModel.fetch({
                        // data: {id: modelId},
                        success: function (model) {
                            var topbarView = new topBarView({actionType: "Content"});
                            var contentView = new contentFormView({model: model, startTime: startTime});

                            topbarView.bind('pay', contentView.newPayment, contentView);
                            topbarView.bind('deleteEvent', contentView.deleteItems, contentView);
                            topbarView.bind('editEvent', contentView.editItem, contentView);
                            topbarView.bind('saveEvent', contentView.saveItem, contentView);
                            topbarView.bind('copyEvent', contentView.copy, contentView);
                            topbarView.bind('generateEvent', contentView.generate, contentView);
                            topbarView.bind('createEvent', contentView.createItem, contentView);
                            topbarView.bind('recountEvent', contentView.recount, contentView);

                            contentView.render();
                            self.changeView(contentView);
                            self.changeTopBarView(topbarView);
                        },
                        error  : function (model, response) {
                            if (response.status === 401) {
                                Backbone.history.navigate('#login', {trigger: true});
                            }
                        }
                    });
                });
            }
        },

        goToKanban: function (contentType, parrentContentId, filter) {
            var self = this;

            this.checkLogin(function (success) {
                if (success) {
                    goKanban(self);
                } else {
                    self.redirectTo();
                }
            });

            function goKanban(context) {
                var currentContentType = context.testContent(contentType);
                var currentUser = App.currentUser || {};
                var self = context;
                var contentViewUrl;
                var topBarViewUrl;
                var collectionUrl;
                var message;

                if (contentType !== currentContentType) {
                    contentType = currentContentType;
                }

                message = contentType + ' Kanban';

                // FlurryAgent.logEvent(message);

                tracker.track({
                    date     : new Date(),
                    eventType: 'userFlow',
                    name     : message,
                    message  : message,
                    email    : currentUser.email,
                    login    : currentUser.login
                });

                contentViewUrl = 'views/' + contentType + '/kanban/KanbanView';
                topBarViewUrl = 'views/' + contentType + '/TopBarView';
                collectionUrl = 'collections/Workflows/WorkflowsCollection';

                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }

                custom.setCurrentVT('kanban');
                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, workflowsCollection) {
                    var startTime = new Date();

                    App.filtersObject.filter = JSON.parse(filter);

                    var collection = new workflowsCollection({id: contentType});

                    var url = 'easyErp/' + contentType + '/kanban';

                    collection.bind('reset', _.bind(createViews, self));

                    function createViews() {
                        var contentview = new contentView({
                            workflowCollection: collection,
                            startTime         : startTime,
                            parrentContentId  : parrentContentId
                        });
                        var topbarView = new topBarView({actionType: "Content"});

                        collection.unbind('reset');

                        topbarView.bind('createEvent', contentview.createItem, contentview);
                        topbarView.bind('editEvent', contentview.editItem, contentview);
                        topbarView.bind('editKanban', contentview.editKanban, contentview);

                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);

                        if (parrentContentId) {
                            url += '/' + parrentContentId;
                        }

                        url = encodeURI(url);

                        if (filter) {
                            url += '/filter=' + encodeURI(JSON.stringify(filter));
                        }

                        Backbone.history.navigate(url, {replace: true});
                    }
                });
            }
        },

        goToThumbnails: function (contentType, countPerPage, filter) {
            var self = this;

            this.checkLogin(function (success) {
                if (success) {
                    if (!App || !App.currentDb) {
                        dataService.getData('/currentDb', null, function (response) {
                            if (response && !response.error) {
                                self.checkDatabase(response);
                            } else {
                                console.log('can\'t fetch current db');
                            }

                            goThumbnails(self);
                        });
                    } else {
                        goThumbnails(self);
                    }
                } else {
                    self.redirectTo();
                }
            });

            function goThumbnails(context) {
                var self = context;
                var currentUser = App.currentUser || {};
                var location = window.location.hash;
                var currentContentType = context.testContent(contentType);
                var startTime = new Date();
                var viewType = custom.getCurrentVT({contentType: contentType}); // for default filter && defaultViewType
                var topBarViewUrl;
                var contentViewUrl;
                var collectionUrl;
                var message;
                var url;

                if (countPerPage) {
                    countPerPage = parseInt(countPerPage, 10);

                    if (isNaN(countPerPage)) {
                        countPerPage = 0;
                    }
                }

                if (contentType !== currentContentType) {
                    contentType = currentContentType;
                    url = '#easyErp/' + contentType + '/' + viewType;

                    Backbone.history.navigate(url, {replace: true});
                }

                topBarViewUrl = 'views/' + contentType + '/TopBarView';

                message = contentType + ' Thumbnails';

                // FlurryAgent.logEvent(message);

                tracker.track({
                    date     : new Date(),
                    eventType: 'userFlow',
                    name     : message,
                    message  : message,
                    email    : currentUser.email,
                    login    : currentUser.login
                });

                if (!filter) {

                    filter = custom.getSavedFilterForCT(contentType) || custom.getDefSavedFilterForCT(contentType);

                    if (filter) {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(location + '/c=' + countPerPage + '/filter=' + encodeURI(JSON.stringify(filter)), {replace: true});
                    }

                    if (contentType === 'salesProducts') {
                        filter = {
                            canBeSold: {
                                key  : 'canBeSold',
                                value: ['true']
                            }
                        };
                    } else if (contentType === 'Products') {
                        filter = {
                            canBePurchased: {
                                key  : 'canBePurchased',
                                value: ['true']
                            }
                        };
                    }
                } else {
                    filter = JSON.parse(filter);
                }

                // savedFilter = custom.savedFilters(contentType, filter);

                if (context.mainView === null) {
                    context.main(contentType);
                } else {
                    context.mainView.updateMenu(contentType);
                }

                contentViewUrl = 'views/' + contentType + '/thumbnails/ThumbnailsView';
                collectionUrl = context.buildCollectionRoute(contentType);

                require([contentViewUrl, topBarViewUrl, collectionUrl], function (contentView, topBarView, contentCollection) {
                    var collection;

                    App.filtersObject.filter = filter;

                    if (contentType !== 'Workflows') {
                        collection = new contentCollection({
                            viewType   : 'thumbnails',
                            reset      : true,
                            showMore   : false,
                            count      : countPerPage,
                            filter     : filter,
                            contentType: contentType
                        });
                    } else {
                        collection = new contentCollection();
                    }

                    collection.bind('reset', _.bind(createViews, self));
                    custom.setCurrentVT('thumbnails');

                    function createViews() {
                        var contentview = new contentView({
                            collection: collection,
                            startTime : startTime,
                            filter    : filter
                        });
                        var topbarView = new topBarView({actionType: 'Content', collection: collection});

                        collection.unbind('reset');
                        // var url = '#easyErp/' + contentType + '/thumbnails';
                        eventsBinder.subscribeCollectionEvents(collection, contentview);
                        eventsBinder.subscribeTopBarEvents(topbarView, contentview);

                        context.changeView(contentview);
                        context.changeTopBarView(topbarView);
                        // just for add showMore button if needed
                        collection.trigger('fetchFinished', {
                            totalRecords: collection.totalRecords,
                            currentPage : collection.currentPage,
                            pageSize    : collection.pageSize
                        });
                        // Backbone.history.navigate(url, { replace: true });
                    }
                });
            }
        },

        testContent: function (contentType) {
            if (!CONSTANTS[contentType.toUpperCase()]) {
                contentType = CONSTANTS.PERSONS;
            }

            return contentType;
        },

        getList: function (contentType) {
            var viewType;

            this.contentType = contentType;

            contentType = this.testContent(contentType);
            viewType = custom.getCurrentVT({contentType: contentType});

            Backbone.history.navigate('#easyErp/' + contentType + '/' + viewType, {trigger: true, replace: true});
        },

        changeWrapperView: function (wrapperView) {
            if (this.wrapperView) {
                this.wrapperView.undelegateEvents();
            }
            this.wrapperView = wrapperView;
        },

        changeTopBarView: function (topBarView) {
            if (this.topBarView) {
                this.topBarView.undelegateEvents();
            }
            this.topBarView = topBarView;
        },

        changeView: function (view, hideTopBar) {
            if (hideTopBar) {
                $('#top-bar').hide();
            } else {
                $('#top-bar').show();
            }

            if (this.view) {
                this.view.undelegateEvents();
            }

            $(document).trigger('resize');

            this.view = view;
        },

        main: function (contentType) {
            this.mainView = new mainView({contentType: contentType});
            this.changeWrapperView(this.mainView);
        },

        any: function () {
            this.mainView = new mainView();
            this.changeWrapperView(this.mainView);
        },

        login: function (password, dbId, email) {
            var url = '/getDBS';
            var self = this;

            dbId = dbId || '';
            email = email || '';
            password = password || '';

            this.mainView = null;

            $.ajax({
                url : url,
                type: 'GET',

                success: function (response) {
                    self.changeWrapperView(new loginView({
                        dbs      : response.dbsNames,
                        currentDb: dbId,
                        password : password,
                        login    : email
                    }));
                },

                error: function () {
                    self.changeWrapperView(new loginView());
                }
            });
        }
    });

    return appRouter;
});
