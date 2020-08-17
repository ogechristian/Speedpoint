/*
Speedpoint.core.js
Property of Agbagwu Christian Oge
Sharepoint Developer
Contact +2348162763300
*/
//Intellectual property of agabagwu christian 
//sharepoint jsom developer 
//
var Speed = Speed || {};

/**
 * This is the SpeedPoint Function declaration.
 * This initiates a speedpoint object and ensures the context of the object is set based on the parameters passed for the speed object.
 * This is used internally by the speedpoint object to intiate sharepoint async request based on the context
 * @param {String} [cxt="Current Context URL"] the ctx param can contain the url of the site you want to target, if this parameter is ommited
 * then the current page site url is used by default.
 * @param {bool} [bolval=false] setting this to true while passing a url in the first parameter indicates that an APPcontext is created, if no 
 * boolean value is passed the default value is false, which means a normal site context is created
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * @example
 * // returns a normal context related to the site passed in the ctx parameter
 * // absoulte urls can be used also
 * var speedCtx = new Speed("http://captsource.com");
 * @example
 * // returns an app context related to the site passed in the ctx parameter (the host URL).This is used to create a context used for cross domain 
 * // request from an App to the SharePoint on Premise site. Here the host url is passed (the URl where your List for cross domain request resides)
 * var speedAppCtx = new Speed("http://captsource.com",true);
 */
function Speed(cxt, bolval) {
    this.errors = [];
    this.stylePlace = false;
    this.dynamicVariable = 'speed';
    this.url = cxt;
    this.optional = (typeof bolval === 'undefined') ? false : bolval;
    this.errorHandler = this.onQueryFailed;
    this.tempCallbacks = {};
    this.htmlDictionary = {};
    this.peopleDictionary = {
        count: 0,
        total: 0,
        picker: {}
    };
    this.filesDictionary = {};
    this.intervalRefDictionary = {};
    this.currencySettings = {};
    this.appliedEvents = {
        normal: [],
        numeric: [],
        attachments: []
    };

    this.asyncDictionary = {
        totalcalls: 0,
        expectedcalls: 0,
        callbackwhendependenciesLoaded: false,
        alldependenciesLoadedDef: null
    };

    if (typeof window.speedGlobal === 'undefined') {
        window.speedGlobal = [];
    }

    /**
     * Properties for the table to be created
     */
    this.DataForTable = {
        tabledata: [],
        tablegroupName: "",
        noOfPages: 0,
        currentPage: 1,
        pagesize: 30,
        paginateSize: 5,
        currentPos: 1,
        lastPageItem: 0,
        activeClass: "",
        tablecontentId: "",
        includeSN: true,
        modifyTR: false,
        context: this,
        lazyLoadInitiated: false,
        tdClick: {},
        customPaginate: false,
        customBlock: "",
        paginationbId: "noOfPages",
        paginationuId: "noOfPagesUp",
        onpageBeforeclick: null,
        onpageAfterclick: null,
        //this is responsible for paginating the table
        paginateLinks: function (srt, end, settings) {
            $("#" + settings.paginationbId).empty();
            $("#" + settings.paginationuId).empty();
            if (end > settings.noOfPages) {
                end = settings.noOfPages;
            }
            $("#" + settings.paginationbId).append("<li> <a class='" + settings.tablecontentId + "-moveback'><<</a> </li>");
            $("#" + settings.paginationuId).append("<li> <a class='" + settings.tablecontentId + "-moveback'><<</a> </li>");
            for (srt; srt <= end; srt++) {

                if (srt == settings.activeClass) {
                    $("#" + settings.paginationbId).append("<li class=\"lin" + srt + " active\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                    $("#" + settings.paginationuId).append("<li class=\"lin" + srt + " active\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                } else {
                    $("#" + settings.paginationbId).append("<li class=\"lin" + srt + "\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                    $("#" + settings.paginationuId).append("<li class=\"lin" + srt + "\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                }
            }
            $("#" + settings.paginationbId).append("<li> <a class='" + settings.tablecontentId + "-movefront'>>></a> </li>");
            $("#" + settings.paginationuId).append("<li> <a class='" + settings.tablecontentId + "-movefront'>>></a> </li>");
            $("." + settings.tablecontentId).click(function () {
                settings.nextItems($(this).text(), settings);
            });

            $("." + settings.tablecontentId + "-moveback").click(function () {
                settings.moveLinks("back", settings);
            });

            $("." + settings.tablecontentId + "-movefront").click(function () {
                settings.moveLinks("front", settings);
            });
        },
        //this is responsible for showing the next items the table
        nextItems: function (id, settings) {
            if (settings.tabledata.length != 0) {
                //perform actions before the items get arragnge clicks
                try {
                    settings.onpageBeforeclick();
                } catch (e) {}

                $(".lin" + settings.activeClass).removeClass('active');
                $(".lin" + id).addClass('active');
                settings.activeClass = id;
                $('#' + settings.tablecontentId).empty();
                var old = id - 1;
                var total = settings.tabledata.length;
                var previousItem = old * settings.pagesize;
                var nextPageItem = id * settings.pagesize;
                if (nextPageItem > total) {
                    nextPageItem = total;
                }
                var str = "";
                var tableControls = settings.context.getControls(true, settings.tablegroupName);
                for (previousItem; previousItem < nextPageItem; previousItem++) {
                    if (!settings.customPaginate) {
                        if (settings.modifyTR) {
                            str += settings.context.DataForTable.trExpression(previousItem);
                        } else {
                            str += "<tr>";
                        }
                        if (settings.includeSN) {
                            str += "<td>" + (previousItem + 1) + "</td>";
                        }
                        for (var propName in settings.tabledata[previousItem]) {
                            if ($.inArray(propName, tableControls) >= 0) {
                                var groupName = $("[speed-table-data='" + propName + "']").attr("speed-table-group");
                                groupName = (typeof groupName !== "undefined") ? groupName : "SP-NOTApplicable";
                                var useTD = $("[speed-table-data='" + propName + "']").attr("speed-table-includetd");
                                useTD = (typeof useTD !== "undefined") ? (useTD === "true") : true;
                                if (settings.propertiesHandler.hasOwnProperty(propName)) {
                                    if (useTD) {
                                        str += "<td>" + settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem) + "</td>";
                                    } else
                                        str += settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem);
                                } else if (settings.propertiesHandler.hasOwnProperty(groupName)) {
                                    if (useTD) {
                                        str += "<td>" + settings.propertiesHandler[groupName](settings.tabledata[previousItem], previousItem, propName) + "</td>";
                                    } else
                                        str += settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem, propName);
                                } else
                                    str += "<td>" + settings.tabledata[previousItem][propName] + "</td>";
                            }
                        }
                        str += "</tr>";
                    } else {
                        var innerElement = settings.customBlock;
                        for (var propName in settings.tabledata[previousItem]) {
                            try {
                                var stringToFind = "{{" + propName + "}}";
                                var regex = new RegExp(stringToFind, "g");
                                innerElement = innerElement.replace(regex, settings.tabledata[previousItem][propName]);
                            } catch (e) {}
                        }
                        str += innerElement;
                    }
                }
                $('#' + settings.tablecontentId).append(str);

                //perform actions after the items get arragnge clicks
                try {
                    settings.onpageAfterclick();
                } catch (e) {}
            }
        },
        //this is responsible for moving to the new set of links
        moveLinks: function (id, settings) {
            if (id == "front") {
                settings.currentPos = settings.currentPos + settings.paginateSize;
                var startPos = settings.currentPos;
                var endPos = startPos + settings.paginateSize - 1;
                if (endPos >= settings.noOfPages) {
                    endPos = settings.noOfPages;
                }
                settings.paginateLinks(startPos, endPos, settings);
                $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-moveback").show();
                $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-moveback").show();
                if (endPos >= settings.noOfPages) {
                    $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-movefront").hide();
                    $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-movefront").hide();
                }
            } else {
                settings.currentPos = settings.currentPos - settings.paginateSize;
                var startPos = settings.currentPos;
                var endPos = startPos + settings.paginateSize - 1;
                if (startPos <= 1) {
                    startPos = 1;
                    currentPos = 1;
                }
                settings.paginateLinks(startPos, endPos, settings);
                $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-movefront").show();
                $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-movefront").show();
                if (startPos <= 1) {
                    $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-moveback").hide();
                    $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-moveback").hide();
                }
            }
        },
        propertiesHandler: {}
    }

    /* ============================== Validation Section ============================*/
    //Extendable validation logic properties. This is where custom validation logic can be introduced to speedpoint

    this.validationProperties = {
        "number": {
            type: "number",
            extend: {},
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (value.trim() == "") {
                    return false;
                } else if (isNaN(value)) {
                    return false;
                } else
                    return true;
            }
        },
        "radio": {
            type: "radio",
            extend: {

            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (typeof value === "undefined" || value === "") {
                    return false;
                } else
                    return true;
            }
        },
        "checkbox": {
            type: "checkbox",
            extend: {
                multivalue: function (value, id) {
                    var boolT = value;
                    if (!value) {
                        var elementProperties = document.getElementById(id);
                        var attributeValue = elementProperties.getAttribute("speed-bind-validate");
                        var element = document.querySelectorAll("[speed-bind-validate='" + attributeValue + "']");
                        for (var i = 0; i <= (element.length - 1); i++) {
                            if (element[i].type == "checkbox") {
                                if (element[i].checked) {
                                    boolT = true;
                                    break
                                }
                            } else {
                                $spcontext.debugHandler("1113", this.type, id, "multivalue");
                                boolT = false;
                                break;
                            }
                        }

                    }
                    return boolT;
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else {
                    return value;
                }
            }
        },
        "file": {
            type: "file",
            extend: {
                File: function (value) {
                    var rg1 = /^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
                    var rg2 = /^\./; // cannot start with dot (.)
                    var rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
                    return rg1.test(value) && !rg2.test(value) && !rg3.test(value);
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value);
                    } catch (e) {
                        $spcontext.debugHandler("1114", this.type, id, extension);
                    }
                } else {
                    return this.extend["File"](value);
                }
            }
        },
        "email": {
            type: "email",
            extend: {
                Email: function (value) {
                    var patt = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else {
                    return this.extend["Email"](value);
                }
            }
        },
        "text": {
            type: "text",
            extend: {
                IP: function (value) {
                    var patt = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                },
                Email: function (value) {
                    var patt = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (value.trim() === "") {
                    return false;
                } else
                    return true;
            }
        }
    }

    if (!this.checkScriptDuplicates('jquery'))
        console.warn("SpeedPoint requires jquery, please add jquery to the dom...");
}

/* ============================== Set Up Section ============================*/
//App context has been introduced in sharepoint async calls to support Cross Domain CRUD requests
Speed.prototype.initiate = function () {
    if (typeof this.url === 'undefined') {
        var context = new SP.ClientContext.get_current();
        return context;
    } else {
        if (typeof this.url !== 'undefined' && this.optional) {
            var context = new SP.ClientContext.get_current();
            var appContextSite = new SP.AppContextSite(context, this.url);
            return appContextSite;
        } else {
            var context = new SP.ClientContext(this.url);
            return context;
        }
    }
};

/**
 * The loadDependency function dynamically adds the dependency scripts required to make sharepoint JSOM calls. This is similar to jquerys document .ready 
 * but in this case sharepoint dependencies are loaded
 * @param {callBack} callBack  the callback function when all the file have successfully been added to the DOM
 * @param {object} properties an object that specifies the type of additional scripts to be included to the DOM
 * @param {string} [scriptbase = "root site url"] the url of the site the script will be called from. by default the root site url is used
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //this code loads only SP.js and its dependencies ..so no need to reference this at the page level
 * //note that the properties parameter is null in this case
 * speedCtx.loadSPDependencies(function(){
 *     console.log("finished Loading files");
 * },null);
 * 
 *  @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //this code loads only SP.js,SP.RequestExecutor.js,SP.UserProfiles.js,clientpeoplepicker.js and its dependencies .. so no need to reference this at the page level
 * //note that the properties parameter is contains an object with the keys of the scripts we want set to true in this case
 * speedCtx.loadSPDependencies(function(){
 *     console.log("finished Loading files");
 * },{requestExecutor: true, clientPeoplePicker: true, userProfile: true});
 */
Speed.prototype.loadSPDependencies = function (callBack, properties, scriptbase) {
    properties = (typeof properties !== "undefined") ? properties : {};
    scriptbase = (typeof scriptbase == "undefined" || scriptbase == null) ? "/_layouts/15/" : (scriptbase + "/_layouts/15/");
    if (typeof properties !== "undefined" &&
        (!this.checkScriptDuplicates("SP.RequestExecutor.js") || !this.checkScriptDuplicates("clientpeoplepicker.js"))) {
        //Load scripts without SP.js dependency
        if (!this.checkScriptDuplicates("SP.RequestExecutor.js") && typeof properties.requestExecutor !== "undefined" &&
            properties.requestExecutor) {
            $.getScript(scriptbase + "SP.RequestExecutor.js");
        }

        if (typeof properties.clientPeoplePicker !== "undefined" && properties.clientPeoplePicker) {
            //load all client peoplepicker js dependencies 
            $.getScript(scriptbase + "clienttemplates.js",
                $.getScript(scriptbase + "clientforms.js",
                    $.getScript(scriptbase + "autofill.js",
                        $.getScript(scriptbase + "clientpeoplepicker.js", function () {
                            setTimeout(workflowScripts, 1000);
                        })
                    )
                )
            );
        } else {
            setTimeout(function () {
                workflowScripts();
            }, 1000);
        }
    } else {
        workflowScripts();
    }

    function workflowScripts() {
        SP.SOD.executeOrDelayUntilScriptLoaded(function () {
            //Load scripts with SP.js dependency
            var methodSet = '';
            if (properties.userProfile !== "undefined") {
                if (properties.userProfile) {
                    RegisterSodDep('callBack', "SP.UserProfiles.js");
                    $.getScript(scriptbase + "SP.UserProfiles.js");
                    methodSet = 'SP.UserProfiles.js';
                }
            }

            if (properties.search !== "undefined") {
                if (properties.search) {
                    RegisterSodDep('callBack', "SP.Search.js");
                    $.getScript(scriptbase + "SP.Search.js");
                    methodSet = 'SP.Search.js';
                }
            }

            if (methodSet !== "") {
                SP.SOD.executeOrDelayUntilScriptLoaded(callBack, methodSet);
            } else if (typeof properties.userProfile === "undefined" && typeof properties.search === "undefined") {
                callBack();
            }
        }, "sp.js");
        SP.SOD.executeFunc("sp.js", 'SP.ClientContext', null);
    }
}

Speed.prototype.asyncManager = function () {
    this.asyncDictionary.totalcalls++;

    if (this.asyncDictionary.callbackwhendependenciesLoaded && typeof this.asyncDictionary.alldependenciesLoadedDef === "function") {
        if (this.asyncDictionary.totalcalls == this.asyncDictionary.expectedcalls) {
            this.asyncDictionary.alldependenciesLoadedDef();
        }
    }
}

/* ============================== Caml Builder Section ============================*/
/**
 * The Caml Builder creates a caml query string which is used to retrieve items  with list/library getItem
 * Passing an array with only settings object set as the parameter returns all items in a list 
 * specified with respect to the settings passed (The Settings object is the first parameter).
 * @param {array} [cal=[]] the array of objects to be used 
 * @returns {String} a caml query string used in conjunction with the getItem method 
 */
Speed.prototype.camlBuilder = function (cal) {
    var count = 0;
    var noOfFields = [];
    var noOfUsed = 0;
    var andCount = 0;
    var Arr = [];
    if (typeof cal !== 'undefined' && cal.length > 1) {
        var usedtottal = cal.length - 1;
        for (var i = 1; i <= usedtottal; i++) {
            noOfFields.push(cal[i].val);
            if (cal[i].val != '') {
                noOfUsed++;
                Arr.push(cal[i]);
            }
        }
        var total = Arr.length - 1;
        if (typeof cal[0].evaluator == 'undefined') cal[0].evaluator = 'And';
        var queryString = '<View><Query>';
        if (this.CheckNoofUsedFields(noOfFields, 'one')) {
            queryString += '<Where>';
            for (var i = 0; i <= total; i++) {
                if (!this.CheckNoofUsedFields(noOfFields, 'onlyone') && (count == 0 || total - i >= 1)) {
                    if (typeof Arr[i].evaluator != 'undefined') {
                        queryString += '<' + Arr[i].evaluator + '>';
                    } else
                        queryString += '<' + cal[0].evaluator + '>';
                    andCount++;
                }
                if (typeof Arr[i].support != 'undefined')
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\' " + Arr[i].support.title + "=\'" + Arr[i].support.value + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                else if (typeof Arr[i].lookup != 'undefined')
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\' " + Arr[i].lookup.title + "=\'" + Arr[i].lookup.value + "\' /><Value Type=\'" + Arr[i].type + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                else if (Arr[i].operator === "IsNull" || Arr[i].operator === "IsNotNull") {
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/></" + Arr[i].operator + ">";
                } else
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                count++;
            }
            for (var x = (andCount - 1); x >= 0; x--) {
                if (typeof Arr[x].evaluator != 'undefined')
                    queryString += '</' + Arr[x].evaluator + '>';
                else
                    queryString += '</' + cal[0].evaluator + '>';
            }
            queryString += '</Where>';
        }
        if (typeof cal[0].ascending != 'undefined' && typeof cal[0].orderby != 'undefined')
            queryString += '<OrderBy><FieldRef Name=\'' + cal[0].orderby + '\' Ascending="' + cal[0].ascending + '" /></OrderBy>';
        queryString += '</Query>';

        if (typeof cal[0].rowlimit != 'undefined')
            queryString += '<RowLimit>' + cal[0].rowlimit + '</RowLimit>';
        queryString += '</View>';
    } else {
        var queryString = '<View><Query>';
        if (typeof cal != 'undefined') {
            if (typeof cal[0].ascending != 'undefined' && typeof cal[0].orderby != 'undefined')
                queryString += '<OrderBy><FieldRef Name=\'' + cal[0].orderby + '\' Ascending="' + cal[0].ascending + '" /></OrderBy>';
        }
        queryString += '</Query>';
        if (typeof cal != 'undefined') {
            if (typeof cal[0].rowlimit != 'undefined')
                queryString += '<RowLimit>' + cal[0].rowlimit + '</RowLimit>';
        }
        queryString += '</View>';
    }
    return queryString;
};

//-----------------required function for caml builder -------------------
Speed.prototype.CheckNoofUsedFields = function (Arr, val) {
    if (val == 'one') {
        var oneE = false;
        for (var x in Arr) {
            if (this.checkNull(Arr[x]) != '')
                oneE = true;
        }
        return oneE;
    }
    if (val == 'onlyone') {
        var count = 0;
        var oneE = false;
        for (var y = 0; y <= Arr.length - 1; y++) {
            if (this.checkNull(Arr[y]) != '')
                count++;
        }
        if (count == 1) {
            oneE = true;
        }
        return oneE;
    }
};

Speed.prototype.validationReturn = function (id, msg, addErrors, callback) {
    var optid = (typeof id === 'undefined') ? '' : id;
    var emptyField = {};
    emptyField.id = id;
    emptyField.msg = msg;

    if (addErrors) {
        this.errors.push(emptyField);
    }

    if (typeof callback === "function") {
        callback(id, msg);
    }

    if (optid != '') {
        $("#" + optid).addClass("speedhtmlerr");
    }
}

//------------validate a field -----------------
/**
 * The validateField function is used for validating a field or custom value
 * @param {object} elementObj the validation object to be passed
 */
Speed.prototype.validateField = function (elementObj) {
    if (typeof elementObj.id === "undefined")
        elementObj.id = "";
    if (typeof elementObj.staticValue === "undefined")
        elementObj.staticValue = null;
    if (typeof elementObj.msg === "undefined")
        elementObj.msg = "";
    if (typeof elementObj.extension === "undefined")
        elementObj.extension = "";
    if (typeof elementObj.elementType === "undefined")
        elementObj.elementType = "";
    if (typeof elementObj.useElementProperties === "undefined")
        elementObj.useElementProperties = true;
    if (typeof elementObj.styleElement === "undefined")
        elementObj.styleElement = true;
    if (typeof elementObj.addErrors === "undefined")
        elementObj.addErrors = true;
    if (typeof elementObj.removeHtmlErrors === "undefined")
        elementObj.removeHtmlErrors = false;

    var valueToValidate = "";
    var elementType = "text";
    var elementVisible = true;
    if (elementObj.useElementProperties) {

        if (elementObj.id !== null) {
            var elementProperties = document.getElementById(elementObj.id);
            if (elementProperties.tagName.toLowerCase() === "textarea" || elementProperties.tagName.toLowerCase() === "select") {} else
                elementType = elementProperties.type.toLowerCase();

            try {
                if (elementProperties.type === "checkbox")
                    valueToValidate = elementProperties.checked;
                else if (elementProperties.type === "radio") {
                    valueToValidate = $("input[name='" + elementProperties.name + "']:checked").val();
                    valueToValidate = (typeof valueToValidate === "undefined") ? "" : valueToValidate;
                } else
                    valueToValidate = elementProperties.value.trim();

                valueToValidate = this.checkNull(valueToValidate);
            } catch (e) {}
            elementVisible = (elementProperties.style.display.toLowerCase() === "none") ? false : true;
        } else {
            $spcontext.debugHandler("1112", "", "", "");
        }


    } else {
        valueToValidate = this.checkNull(elementObj.staticValue);
        elementType = elementObj.elementType;
    }

    //===============================================================
    var passValidation = this.validationProperties[elementType].validate(valueToValidate, elementObj.extension, elementObj.id);
    if (!passValidation && elementVisible)
        this.validationReturn(elementObj.id, elementObj.msg, elementObj.addErrors, elementObj.triggerCallback);
    else if (passValidation && elementObj.removeHtmlErrors) {
        $("#" + elementObj.id).siblings(".temp-speedmsg").remove();
        $("#" + elementObj.id).removeClass("speedhtmlerr");
        if (elementObj.elementType === "radio") {
            var radioname = document.getElementById(elementObj.id).name;
            $("input[name='" + radioname + "']").removeClass("speedhtmlerr");
        }
    }
    if (elementObj.styleElement && !this.stylePlace) this.styleValidatedClass();
};

/**
 * The clearErrors function empties the speed error array variable
 */
Speed.prototype.clearValidation = function () {
    this.errors = [];
    $(":input,div,table,tr").removeClass("speedhtmlerr");
}

/**
 * The styleErrors function places your custom or speepoint default styles in the header of your html document
 * @param {string} [mystyle= "<style></style>"] the style string to be passed
 */
Speed.prototype.styleValidatedClass = function (mystyle) {
    var styleDefinition = "<style>" +
        ".speedhtmlerr {border-style : solid !important;border-color:red !important;border-width:1px} " +
        "p.temp-speedmsg {color:red !important; font-weight:bold; margin:0; padding: 0}" +
        "input[type=checkbox].speedhtmlerr, input[type=radio].speedhtmlerr{outline: 2px solid red;}" +
        "table.speedhtmlerr thead tr th {border-top: 2px solid red !important;border-bottom: 2px solid red !important; }" +
        "table.speedhtmlerr thead tr th:first-child { border-left: 2px solid red!important; }" +
        "table.speedhtmlerr thead tr th:last-child { border-right: 2px solid red!important; }" +
        "</style>";
    if (!this.stylePlace) {
        if (typeof mystyle === 'undefined')
            $("head").append(styleDefinition);
        else {
            $("head").append(mystyle);
        }
        this.stylePlace = true;
    }
}

/**
 * The checkPassedValidation function returns true if the speed errors array is empty and false if it isnt
 * @returns {bool} indicates if objects are present in the speed errors array
 */
//------------check if the validation was succesful -------------
Speed.prototype.checkPassedValidation = function () {
    if (this.errors.length == 0) {
        return true;
    } else
        return false;
};

/**
 * The bind function obtains all speed-bind & speed-bind-validate html attributes and obtains the value and validate the input tag
 * and returns them as an object that can be passed to the createItems or updateItems 
 * @param {object} [listObjects={}] this parameter allows the bind method to use an already existing object instead of a new object returned by default
 * @param {bool} [staticBind= true] this parameter includes or neglect values from html attributes with the speed-bind attribute.default value is true
 * @returns {object} this object return contains key-value properties
 */
//========================== SpeedPoint Binding Section =======================
Speed.prototype.bind = function (listObjects, staticBind) {
    speedPointContext = this;
    this.clearValidation();
    //var bindStaticFields = (typeof staticBind === 'undefined') ? true : staticBind;
    var returnObject = {}
    if (typeof listObjects !== "undefined" && listObjects != null) {
        returnObject = listObjects;
    }
    //decides if u want to bind static fields to objects
    //set this option to false if the static fields already contains the same values with the object

    var element = document.querySelectorAll("[speed-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-bind");
        var omitControl = (element[i].getAttribute("speed-as-static") === null) ? false : (element[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (!omitControl) {
            if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea") {
                if (element[i].type == "checkbox") {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    if (multivalue) {
                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify([]);
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(element[i].getAttribute("sptype-label")) : element[i].getAttribute("sptype-label"),
                            value: element[i].checked
                        }
                        propertyValues.push(checkvalue);
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = element[i].checked;
                    }
                } else if (element[i].type == "radio") {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var name = (element[i].getAttribute("name") === null) ? "" : element[i].getAttribute("name");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (element[i].getAttribute("sptype-overide-validation") === null) ? false : (element[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }

                        var propertyValues = JSON.parse(returnObject[property]);
                        returnObject[property] = $("input[name='" + name + "']:checked").val();

                        var setProperty = element[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = $("input[name='" + name + "']:checked").val();
                    }
                } else {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    if (multivalue) {
                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var currencyUsed = element[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            returnObject[property] = element[i].value;
                        } else {
                            var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(element[i].value, currencyUsed, rawValue)
                        }

                        /*var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(element[i].getAttribute("sptype-label")) : element[i].getAttribute("sptype-label"),
                            value: returnObject[property]
                        }*/
                        var setProperty = element[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        var currencyUsed = element[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            returnObject[property] = element[i].value;
                        } else {
                            var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(element[i].value, currencyUsed, rawValue)
                        }
                    }

                }
            } else
                returnObject[property] = element[i].innerText;
        }
    }

    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (elementValidate.length - 1); i++) {
        var property = elementValidate[i].getAttribute("speed-bind-validate");
        var msg = elementValidate[i].getAttribute("speed-validate-msg");
        var onValidation = (elementValidate[i].getAttribute("speed-validate-mode") === null) ? true : (elementValidate[i].getAttribute("speed-validate-mode") === "true");
        var inputtype = elementValidate[i].getAttribute("speed-validate-type");
        var inputid = elementValidate[i].getAttribute("id");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
        var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
        var omitControl = (elementValidate[i].getAttribute("speed-as-static") === null) ? false : (elementValidate[i].getAttribute("speed-as-static").toLowerCase() === "true");

        if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "select" || elementValidate[i].tagName.toLowerCase() == "textarea") {
            if (!omitControl) {
                if (elementValidate[i].type == "checkbox") {
                    var multivalue = (elementValidate[i].getAttribute("sptype") === null) ? false : (elementValidate[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (elementValidate[i].getAttribute("spjsonlabel") === null) ? false : (elementValidate[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (elementValidate[i].getAttribute("sptype-overide-validation") === null) ? true : (elementValidate[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify([]);
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(elementValidate[i].getAttribute("sptype-label")) : elementValidate[i].getAttribute("sptype-label"),
                            value: elementValidate[i].checked
                        }
                        propertyValues.push(checkvalue);
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = elementValidate[i].checked;
                    }
                } else if (elementValidate[i].type == "radio") {
                    var multivalue = (elementValidate[i].getAttribute("sptype") === null) ? false : (elementValidate[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var name = (elementValidate[i].getAttribute("name") === null) ? "" : elementValidate[i].getAttribute("name");
                    var jsonlabel = (elementValidate[i].getAttribute("spjsonlabel") === null) ? false : (elementValidate[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (elementValidate[i].getAttribute("sptype-overide-validation") === null) ? false : (elementValidate[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }

                        var propertyValues = JSON.parse(returnObject[property]);
                        returnObject[property] = $("input[name='" + name + "']:checked").val();

                        var setProperty = elementValidate[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = $("input[name='" + name + "']:checked").val();
                    }
                } else {
                    var multivalue = (elementValidate[i].getAttribute("sptype") === null) ? false : (elementValidate[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (elementValidate[i].getAttribute("spjsonlabel") === null) ? false : (elementValidate[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (elementValidate[i].getAttribute("sptype-overide-validation") === null) ? false : (elementValidate[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var currencyUsed = elementValidate[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            returnObject[property] = elementValidate[i].value;
                        } else {
                            var rawValue = (elementValidate[i].getAttribute("speed-currency-numeric") === null) ? false : (elementValidate[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(elementValidate[i].value, currencyUsed, rawValue)
                        }

                        var setProperty = elementValidate[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        var currencyUsed = elementValidate[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            returnObject[property] = elementValidate[i].value;
                        } else {
                            var rawValue = (elementValidate[i].getAttribute("speed-currency-numeric") === null) ? false : (elementValidate[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(elementValidate[i].value, currencyUsed, rawValue)
                        }
                    }

                }
            }
            if (onValidation) {
                this.validateField({
                    id: inputid,
                    msg: validationMessage,
                    extension: validationtype
                });
            }
        }
    }

    //bind people picker
    var elementPeople = document.querySelectorAll("[speed-bind-people]");
    for (var i = 0; i <= (elementPeople.length - 1); i++) {
        var property = elementPeople[i].getAttribute("speed-bind-people");
        var msg = elementPeople[i].getAttribute("speed-validate-msg");

        var useJson = (elementPeople[i].getAttribute("speed-JSON") !== null) ? (elementPeople[i].getAttribute("speed-JSON").toLowerCase() === "true") : false;

        var validate = (elementPeople[i].getAttribute("speed-people-validate") !== null) ? (elementPeople[i].getAttribute("speed-people-validate").toLowerCase() === "true") : false;
        var omitControl = (elementPeople[i].getAttribute("speed-as-static") === null) ? false : (elementPeople[i].getAttribute("speed-as-static").toLowerCase() === "true");
        var inputid = elementPeople[i].getAttribute("id");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
        var validationtype = "text";
        var pickerID = inputid + '_TopSpan';
        if (SPClientPeoplePicker !== null) {
            var peopleDict = SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID];

            var userObject = this.getUsersFromPicker(peopleDict);
            if (userObject !== null) {
                if (userObject.length !== 0) {
                    if (useJson) {
                        if (!omitControl) {
                            returnObject[property] = JSON.stringify(userObject);
                        }
                    } else {
                        if (userObject.length == 1) {
                            if (!omitControl) {
                                returnObject[property] = SP.FieldUserValue.fromUser(userObject[0].Key);
                            }
                        } else {
                            if (peopleDict.AllowMultipleUsers) {
                                var tempArray = [];
                                for (var a = 0; a <= (userObject.length - 1); a++) {
                                    tempArray.push(SP.FieldUserValue.fromUser(userObject[a].Key));
                                }
                                if (!omitControl)
                                    returnObject[property] = tempArray;
                            } else {
                                if (!omitControl) {
                                    returnObject[property] = null;
                                }
                                if (validate)
                                    this.validateField({
                                        id: pickerID,
                                        staticValue: "",
                                        msg: validationMessage,
                                        elementType: "text",
                                        useElementProperties: false
                                    });
                            }
                        }
                    }
                } else {
                    if (!omitControl) {
                        returnObject[property] = null;
                    }
                    if (validate)
                        this.validateField({
                            id: pickerID,
                            staticValue: "",
                            msg: validationMessage,
                            elementType: "text",
                            useElementProperties: false
                        });
                }
            }

        }
    }

    //Speed bind and table to array
    var elementValidate = document.querySelectorAll("[speed-bind-table]");
    for (var i = 0; i <= (elementValidate.length - 1); i++) {
        var property = elementValidate[i].getAttribute("speed-bind-table");
        var strignify = (elementValidate[i].getAttribute("speed-JSON") !== null) ? (elementValidate[i].getAttribute("speed-JSON").toLowerCase() === "true") : true;
        var inputid = elementValidate[i].getAttribute("id");

        var omitControl = (elementValidate[i].getAttribute("speed-as-static") === null) ? false : (elementValidate[i].getAttribute("speed-as-static").toLowerCase() === "true");

        var validate = (elementValidate[i].getAttribute("speed-table-validate") === null) ? true : (elementValidate[i].getAttribute("speed-table-validate").toLowerCase() === "true");
        var msg = elementValidate[i].getAttribute("speed-validate-msg");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please enter a data" : msg;
        var fieldVisible = (elementValidate[i].style.display.toLowerCase() === "none") ? false : true;

        var objproperties = [];
        $("#" + inputid + " > thead > tr > th").each(function () {
            if (this.getAttribute("speed-array-prop") !== null)
                objproperties.push(this.getAttribute("speed-array-prop"));
        });

        var arrayValue = [];
        $("#" + inputid + " > tbody > tr").each(function () {
            var rowId = this.id;
            var objCount = 0;
            var objValue = {};
            $("#" + rowId + " td").each(function (a) {
                var inputTag = $(this).children()[0];
                var hasInclude = $(inputTag).hasClass("speed-table-include");
                if (hasInclude) {
                    if (inputTag.tagName.toLowerCase() == "input" || inputTag.tagName.toLowerCase() == "select" || inputTag.tagName.toLowerCase() == "textarea") {
                        if (inputTag.type == "checkbox")
                            objValue[objproperties[objCount]] = inputTag.checked;
                        else {
                            //objValue[objproperties[objCount]] = inputTag.value;
                            var currencyUsed = inputTag.getAttribute("speed-bind-currency");
                            if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                objValue[objproperties[objCount]] = inputTag.value;
                            } else {
                                var rawValue = (inputTag.getAttribute("speed-currency-numeric") === null) ? false : (inputTag.getAttribute("speed-currency-numeric").toLowerCase() === "true");
                                objValue[objproperties[objCount]] = speedPointContext.stripCurrencyToNumber(inputTag.value, currencyUsed, rawValue);
                            }
                        }
                    } else
                        objValue[objproperties[objCount]] = inputTag.innerText;

                    objCount++;
                }
            });
            arrayValue.push(objValue);
        });

        if (validate && fieldVisible && arrayValue.length === 0 && !omitControl) {
            this.validateField({
                id: inputid,
                staticValue: "",
                msg: validationMessage,
                elementType: "text",
                useElementProperties: false
            });
        }

        if (strignify) {
            if (!omitControl) {
                returnObject[property] = JSON.stringify(arrayValue);
            }
        } else {
            if (!omitControl) {
                returnObject[property] = arrayValue;
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");

    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-file-validate");
        var inputid = element[i].id;
        var msg = element[i].getAttribute("speed-validate-msg");
        var onValidation = (element[i].getAttribute("speed-validate-mode") === null) ? true : (element[i].getAttribute("speed-validate-mode") === "true");
        var validationMessage = (msg == null || msg == "" || typeof msg == "undefined") ? "Please select a file" : msg;
        var fieldNotVisible = (element[i].style.display.toLowerCase() === "none");
        if (typeof this.filesDictionary[property] === "undefined" && !fieldNotVisible && onValidation) {
            this.validateField({
                id: inputid,
                staticValue: "",
                msg: validationMessage,
                elementType: "text",
                useElementProperties: false
            });
        } else if (typeof this.filesDictionary[property] !== "undefined") {
            if (this.filesDictionary[property].length === 0 && !fieldNotVisible && onValidation) {
                this.validateField({
                    id: inputid,
                    staticValue: "",
                    msg: validationMessage,
                    elementType: "text",
                    useElementProperties: false
                });
            }
        }
    }

    return returnObject;
}

/**
 * The getAttachmentControls function gets all speed-bind & speed-bind-validate html attributes names
 * @returns {Array} the Array return contains all controls names
 */
Speed.prototype.getAttachmentControls = function () {
    var returnArr = [];

    var element = document.querySelectorAll("[speed-file-bind]");

    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-bind");
        elementProp.id = element[i].id;
        elementProp.type = (element[i].getAttribute("type") === null) ? "" : element[i].getAttribute("type").toLowerCase();
        var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
        if (includeControl) {
            returnArr.push(elementProp);
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");

    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-validate");
        elementProp.id = element[i].id;
        elementProp.type = (element[i].getAttribute("type") === null) ? "" : element[i].getAttribute("type").toLowerCase();
        var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
        if (includeControl) {
            returnArr.push(elementProp);
        }
    }

    return returnArr;
};

/**
 * The getControls function gets all speed-bind & speed-bind-validate html attributes names
 * @returns {Array} the Array return contains all controls names
 */
Speed.prototype.getControls = function (onlyTables, tableGroupId) {
    var speedContext = this;
    var onlyTables = (typeof onlyTables === "undefined") ? false : onlyTables;
    var returnArr = [];

    if (!onlyTables) {
        //decides if u want to bind static fields to objects
        //set this option to false if the static fields already contains the same values with the object
        var element = document.querySelectorAll("[speed-bind]");
        var includeProperties = (typeof tableGroupId !== "undefined" && typeof tableGroupId === "boolean") ? tableGroupId : false;

        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-bind");
            var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "label") {
                            var elementtype = element[i].getAttribute("[sptype]");
                            try {
                                elementtype = elementtype.toLowerCase();
                            } catch (e) {}
                            if (elementtype !== "date") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Text\" />";
                                SPElementProperties.fieldType = SP.FieldText;
                            } else if (elementtype !== "multivalue") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                                SPElementProperties.fieldType = SP.FieldText;
                            } else {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"DateTime\" />";
                                SPElementProperties.fieldType = SP.FieldDateTime;
                            }
                        } else if (element[i].tagName.toLowerCase() == "textarea") {
                            SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                            SPElementProperties.fieldType = SP.FieldText;
                        }

                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        //Speed bind and validate html
        var elementValidate = document.querySelectorAll("[speed-bind-validate]");
        for (var i = 0; i <= (elementValidate.length - 1); i++) {
            var property = elementValidate[i].getAttribute("speed-bind-validate");
            var includeControl = (elementValidate[i].getAttribute("speed-include-control") === null) ? true : (elementValidate[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "select" || elementValidate[i].tagName.toLowerCase() == "label") {
                            var elementtype = elementValidate[i].getAttribute("sptype");
                            try {
                                elementtype = elementtype.toLowerCase();
                            } catch (e) {}
                            if (elementtype !== "date") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Text\" />";
                                SPElementProperties.fieldType = SP.FieldText;
                            } else if (elementtype !== "multivalue") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                                SPElementProperties.fieldType = SP.FieldText;
                            } else {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"DateTime\" />";
                                SPElementProperties.fieldType = SP.FieldDateTime;
                            }
                        } else if (elementValidate[i].tagName.toLowerCase() == "textarea") {
                            SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                            SPElementProperties.fieldType = SP.FieldMultiLineText;
                        }

                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        //Speed bind and people html
        var elementPeople = document.querySelectorAll("[speed-bind-people]");
        for (var i = 0; i <= (elementPeople.length - 1); i++) {
            var property = elementPeople[i].getAttribute("speed-bind-people");
            var includeControl = (elementPeople[i].getAttribute("speed-include-control") === null) ? true : (elementPeople[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"UserMulti\" UserSelectionMode=\"PeopleAndGroups\" Mult=\"TRUE\" />";
                        SPElementProperties.fieldType = SP.FieldUser;
                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        //Speed bind table assests
        var element = document.querySelectorAll("[speed-bind-table]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-bind-table");
            var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.ColumnName = property;
                        SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                        SPElementProperties.fieldType = SP.FieldMultiLineText;
                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;
                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        var element = document.querySelectorAll("[speed-MulitCheck-bind]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-MulitCheck-bind");
            var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    returnArr.push(property);
                }
            }
        }
    }

    if (onlyTables) {
        var element = document.querySelectorAll("[speed-table-data]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-table-data");
            //table group is used to split the Table controls if multiple tables are used
            var tablegroup = element[i].getAttribute("speed-table-group");
            //var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            var includeControl = (typeof tableGroupId === "undefined" || tableGroupId === "") ? true : (tablegroup === tableGroupId);
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0)
                    returnArr.push(property);

                //attach event listener on Table Click
                var elementEventData = speedContext.DataForTable.tdClick[property];
                if (typeof elementEventData === "undefined") {
                    speedContext.DataForTable.tdClick[property] = false;
                    element[i].addEventListener("click", function (evt) {
                        var mainProperty = evt.srcElement.getAttribute("speed-table-data");
                        speedContext.DataForTable.tdClick[mainProperty] = (speedContext.DataForTable.tdClick[mainProperty]) ? false : true;

                        speedContext.DataForTable.tabledata.sort(function (a, b) {
                            if (speedContext.DataForTable.tdClick[mainProperty]) {
                                if (a[mainProperty] < b[mainProperty]) {
                                    return -1;
                                }
                                if (a[mainProperty] > b[mainProperty]) {
                                    return 1;
                                }
                                return 0;
                            } else {
                                if (a[mainProperty] > b[mainProperty]) {
                                    return -1;
                                }
                                if (a[mainProperty] < b[mainProperty]) {
                                    return 1;
                                }
                                return 0;
                            }
                        });

                        speedContext.manualTable(speedContext.DataForTable.tabledata);
                    });
                }
            }
        }
    }
    return returnArr;
}

/**
 * The htmlBind function sets all speed-bind & speed-bind-validate html attributes with respect to the object passed key with their values
 * @param {object} listObjects this parameter provides the value for the attriutes
 */
Speed.prototype.htmlBind = function (listObjects) {
    var speedContext = this;
    for (var key in listObjects) {
        if (listObjects.hasOwnProperty(key)) {
            var element = document.querySelectorAll("[speed-bind='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    if (useAutoBinding) {
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                            if (element[i].type === "radio") {
                                if (listObjects[key] !== "")
                                    $("input:radio[name='" + element[i].name + "'][value='" + listObjects[key] + "']").prop('checked', true);
                            } else if (element[i].type !== "checkbox") {
                                var currencyUsed = element[i].getAttribute("speed-bind-currency");
                                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                    element[i].value = listObjects[key];
                                } else {
                                    element[i].value = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                                }
                            } else {
                                if (typeof listObjects[key] === "string") {
                                    if (listObjects[key] !== "")
                                        element[i].checked = (listObjects[key].toLowerCase() === "true");
                                } else {
                                    element[i].checked = listObjects[key];
                                }
                            }
                        } else if (element[i].tagName.toLowerCase() == "select") {
                            $("#" + element[i].id).val(listObjects[key]);
                        } else {
                            var currencyUsed = element[i].getAttribute("speed-bind-currency");
                            if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                element[i].innerHTML = listObjects[key];
                            } else {
                                element[i].innerHTML = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                            }
                        }

                    }
                }
            }

            //bind validated fields
            element = document.querySelectorAll("[speed-bind-validate='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    if (useAutoBinding) {
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                            if (element[i].type === "radio") {
                                if (listObjects[key] !== "")
                                    $("input:radio[name='" + element[i].name + "'][value='" + listObjects[key] + "']").prop('checked', true);
                            } else if (element[i].type !== "checkbox") {
                                var currencyUsed = element[i].getAttribute("speed-bind-currency");
                                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                    element[i].value = listObjects[key];
                                } else {
                                    element[i].value = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                                }
                            } else {
                                if (typeof listObjects[key] === "string") {
                                    if (listObjects[key] !== "")
                                        element[i].checked = (listObjects[key].toLowerCase() === "true");
                                } else {
                                    element[i].checked = listObjects[key];
                                }
                            }
                        } else if (element[i].tagName.toLowerCase() == "select") {
                            $("#" + element[i].id).val(listObjects[key]);
                        } else {
                            var currencyUsed = element[i].getAttribute("speed-bind-currency");
                            if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                element[i].innerHTML = listObjects[key];
                            } else {
                                element[i].innerHTML = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                            }
                        }
                    }
                }
            }

            //bind people fields
            element = document.querySelectorAll("[speed-bind-people='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    var SPbind = (element[i].getAttribute("speed-bind-topicker") !== null) ? (element[i].getAttribute("speed-bind-topicker").toLowerCase() === "true") : false;
                    if (useAutoBinding) {
                        var pickerID = element[i].id + '_TopSpan';
                        var pickerDefined = typeof SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID] !== "undefined";
                        var hasEmailProperty = false;
                        if ($.type(listObjects[key]) === "object") {
                            hasEmailProperty = (typeof listObjects[key].email !== "undefined");
                        } else if ($.type(listObjects[key]) === "array") {
                            hasEmailProperty = (typeof listObjects[key][0].email !== "undefined");
                        }

                        if (!SPbind || !pickerDefined) {
                            var hasValidate = (element[i].getAttribute("speed-people-validate") !== null) ? (element[i].getAttribute("speed-people-validate").toLowerCase() === "true") : false;
                            if (hasValidate) {
                                element[i].setAttribute("speed-people-validate", false);
                            }

                            if ($.type(listObjects[key]) === "object") {
                                element[i].innerHTML = "<p>" + listObjects[key].value + "</p>";
                            } else if ($.type(listObjects[key]) === "array") {
                                var str = "";
                                for (z = 0; z < listObjects[key].length; z++) {
                                    str += "<p>" + listObjects[key][z].value + "</p>";
                                }
                                element[i].innerHTML = str;
                            }
                        } else if (hasEmailProperty) {
                            var pickerObject = SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID];
                            if ($.type(listObjects[key]) === "object") {
                                $spcontext.setPeoplePickerValue(pickerObject, listObjects[key].email);
                            } else if ($.type(listObjects[key]) === "array") {
                                for (z = 0; z < listObjects[key].length; z++) {
                                    $spcontext.setPeoplePickerValue(pickerObject, listObjects[key][z].email);
                                }
                            }
                        }
                    }
                }
            }

            //bind Table
            var element = document.querySelectorAll("[speed-bind-table='" + key + "']");
            for (var i = 0; i <= (element.length - 1); i++) {

                var inputid = element[i].getAttribute("id");
                var parse = (element[i].getAttribute("speed-data-type") == "JSON") ? true : false;
                var useSerialNo = (element[i].getAttribute("speed-serialno") !== null) ? (element[i].getAttribute("speed-serialno").toLowerCase() === "true") : false;
                var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                if (useAutoBinding) {
                    var columnValue = [];

                    var colproperties = [];
                    $("#" + inputid + " > thead > tr > th").each(function () {
                        if (this.getAttribute("speed-array-prop") !== null)
                            colproperties.push(this.getAttribute("speed-array-prop"));
                    });

                    if (parse) {
                        columnValue = speedContext.JSONToObject(listObjects[key]);
                    } else {
                        columnValue = listObjects[key];
                    }

                    for (var x = 0; x <= (columnValue.length - 1); x++) {
                        var str = "<tr id='spbindtr" + x + "'>";
                        if (useSerialNo) str += "<td><label class='speed-serialno'>" + (x + 1) + "</label></td>";
                        for (var y = 0; y < colproperties.length; y++) {
                            str += "<td><label class='speed-table-include'>" + columnValue[x][colproperties[y]] + "</label></td>";
                        }
                        str += "</tr>";
                        $("#" + inputid + " > tbody").append(str);
                    }
                }

            }

            var element = document.querySelectorAll("[speed-MulitCheck-bind='" + key + "']");
            for (var i = 0; i <= (element.length - 1); i++) {
                var checkValues = speedContext.JSONToObject(listObjects[key]);
                var elementProp = {};
                elementProp.property = element[i].getAttribute("speed-MulitCheck-bind");
                elementProp.id = element[i].id;
                if (element[i].tagName.toLowerCase() === "div" || element[i].tagName.toLowerCase() === "p") {
                    if ($.type(checkValues) === "array") {
                        //var multivalues = checkValues[elementProp.property];
                        //if (typeof multivalues !== "undefined") {
                        for (var x = 0; x < checkValues.length; x++) {
                            var check = "";
                            if (checkValues[x].value === "true" || checkValues[x].value) {
                                check = "checked";
                            }
                            var str = "<label class='speed-multi-check'><input id='" + $spcontext.uniqueIdGenerator() + "' " +
                                "type='checkbox' href='" + checkValues[x] + "' " + check + " sptype-label='" + checkValues[x].label + "'>" + checkValues[x].label + "</label>";
                            $(element[i]).append(str);
                        }
                        //}
                    }
                }
            }
        }
    }
}

/**
 * The resetBind function resets all speed-bind & speed-bind-validate html controls
 */
Speed.prototype.resetBind = function () {
    var speedContext = this;
    var element = document.querySelectorAll("[speed-bind]");
    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
            if (useAutoBinding) {
                if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                    if (element[i].type !== "checkbox") {
                        element[i].value = "";
                    } else {
                        element[i].checked = false;
                    }
                } else if (element[i].tagName.toLowerCase() == "select") {
                    $("#" + element[i].id).val("");
                } else
                    element[i].innerHTML = "";
            }
        }
    }

    //bind validated fields
    element = document.querySelectorAll("[speed-bind-validate]");
    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
            if (useAutoBinding) {
                if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                    if (element[i].type !== "checkbox") {
                        element[i].value = "";
                    } else {
                        element[i].checked = false;
                    }
                } else if (element[i].tagName.toLowerCase() == "select") {
                    $("#" + element[i].id).val("");
                } else
                    element[i].innerHTML = "";
            }
        }
    }

    //bind people fields
    element = document.querySelectorAll("[speed-bind-people]");
    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
            //var SPbind = (element[i].getAttribute("speed-bind-topicker") !== null) ? (element[i].getAttribute("speed-bind-topicker").toLowerCase() === "true") : false;
            if (useAutoBinding) {
                var pickerID = element[i].id + '_TopSpan';
                var pickerDefined = typeof SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID] !== "undefined";

                if (!pickerDefined) {
                    element[i].innerHTML = "";
                } else {
                    var pickerObject = SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID];
                    $spcontext.clearPicker(pickerObject);
                }
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-bind");
        elementProp.name = (typeof element[i].getAttribute("speed-file-name") === null) ? elementProp.property : element[i].getAttribute("speed-file-name");
        elementProp.id = element[i].id;
        if (element[i].tagName.toLowerCase() === "div" || element[i].tagName.toLowerCase() === "p") {
            $(element[i]).empty();
        } else if (element[i].tagName.toLowerCase() === "input" && element[i].type.toLowerCase() === "file") {
            speedContext.clearFileInput(elementProp.id);
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-validate");
        elementProp.name = (typeof element[i].getAttribute("speed-file-name") === null) ? elementProp.property : element[i].getAttribute("speed-file-name");
        elementProp.id = element[i].id;
        if (element[i].tagName.toLowerCase() === "input" && element[i].type.toLowerCase() === "file") {
            speedContext.clearFileInput(elementProp.id);
        }
    }
}

Speed.prototype.attachmentLinkBind = function (attachments) {
    if (!$.isEmptyObject(attachments)) {
        var element = document.querySelectorAll("[speed-file-bind]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var elementProp = {};
            elementProp.property = element[i].getAttribute("speed-file-bind");
            elementProp.propertyname = (typeof element[i].getAttribute("speed-property-asname") === null) ? false : element[i].getAttribute("speed-property-asname");
            elementProp.name = (typeof element[i].getAttribute("speed-file-name") === null) ? elementProp.property : element[i].getAttribute("speed-file-name");
            elementProp.id = element[i].id;
            if (element[i].tagName.toLowerCase() === "div" || element[i].tagName.toLowerCase() === "p") {
                if ($.type(attachments) === "object") {
                    var attachmentLinks = attachments[elementProp.property];
                    if (typeof attachmentLinks !== "undefined") {
                        for (var x = 0; x < attachmentLinks.length; x++) {
                            var displayName = elementProp.name;
                            if (!elementProp.propertyname) {
                                var splitedLinks = attachmentLinks[x].split("/");
                                var pos = splitedLinks.length - 1;
                                displayName = splitedLinks[pos];
                            }
                            $(element[i]).append("<p class='speed-attachment'><a target='_blank' href='" + attachmentLinks[x] + "'>" + displayName + "</p>");
                        }
                    }
                }
            }
        }
    }
}

//Directly bind list to html select
Speed.prototype.bindListDirectives = function (properties, onFailed, appContext) {
    var spContext = this;
    var element = document.querySelectorAll("[speed-list-repeat]");
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //Array
    var excemptList = (typeof properties["Except"] === 'undefined') ? [] : properties["Except"];
    //string
    var customquery = (typeof properties["SPQuery"] === 'undefined') ? this.camlBuilder() : properties["SPQuery"];
    //boolean
    var setEmptyOption = (typeof properties["EmptyOption"] === 'undefined') ? true : properties["EmptyOption"];

    var columns = (typeof properties["Columns"] === 'undefined') ? [] : properties["Columns"];

    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var listName = element[i].getAttribute("speed-list-repeat");
            var MessageValidation = element[i].getAttribute("speed-validate-msg");
            if (!spContext.htmlDictionary.hasOwnProperty(listName)) {

                var fullString = "";
                if (element[i].tagName.toLowerCase() === "select" || element[i].tagName.toLowerCase() === "div") {
                    var elementNodeText = element[i].innerHTML.trim();
                    columns = columns.concat(elementNodeText.stringExtractor());
                    fullString = elementNodeText;
                    if (typeof properties[listName] !== "undefined") {
                        if ((typeof properties[listName].onchange !== "undefined")) {
                            element[i].onchange = function (event) {
                                var eventList = document.getElementById(this.id).getAttribute("speed-list-repeat");
                                properties[eventList].onchange(event);
                            }
                        }
                    }
                }

                spContext.htmlDictionary[listName] = {
                    id: element[i].id,
                    tag: element[i].tagName.toLowerCase(),
                    columnList: columns,
                    text: fullString,
                    autoLoad: true,
                    customFunction: null,
                    run: false,
                    data: []
                }

                if (typeof properties[listName] !== "undefined") {
                    spContext.htmlDictionary[listName].autoLoad = (typeof properties[listName].autoLoad == "undefined") ? true : properties[listName].autoLoad;
                    spContext.htmlDictionary[listName].customFunction = (typeof properties[listName].customAfterLoadFunction == "undefined") ? null : properties[listName].customAfterLoadFunction;
                    customquery = (typeof properties[listName].query == "undefined") ? customquery : properties[listName].query;
                    columns = (typeof properties[listName].columns == "undefined") ? columns : columns.concat(properties[listName].columns);
                }

                var controlsDefinition = {
                    merge: false,
                    data: columns
                }

                //excempt list
                if ($.inArray(listName, excemptList) < 0 && !spContext.htmlDictionary[listName].run) {

                    $("#" + element[i].id).empty();
                    if (typeof properties[listName] !== "undefined") {
                        if (typeof properties[listName].customBeforeLoadFunction != "undefined" && typeof properties[listName].customBeforeLoadFunction == "function") {
                            properties[listName].customBeforeLoadFunction();
                        }
                    }

                    if (setEmptyOption) {
                        if (MessageValidation == "" || typeof MessageValidation === "undefined" || MessageValidation == null) {
                            $("#" + element[i].id).append("<option value=''>Please select a value</option>");
                        } else {
                            $("#" + element[i].id).append("<option value=''>" + MessageValidation + "</option>");
                        }
                    }

                    spContext.getListToItems(listName, customquery, controlsDefinition, false, null, function (listElements, listNameFromQuery) {
                        spContext.htmlDictionary[listNameFromQuery].data = listElements;
                        if (spContext.htmlDictionary[listNameFromQuery].autoLoad) {
                            for (var z = 0; z < listElements.length; z++) {
                                for (var propName in listElements[z]) {
                                    if (spContext.htmlDictionary[listNameFromQuery].tag === "select" || spContext.htmlDictionary[listNameFromQuery].tag === "div") {
                                        var valueToAppend = spContext.htmlDictionary[listNameFromQuery].text;
                                        var stringToFind = "{{" + propName + "}}";
                                        if (valueToAppend.indexOf(stringToFind) >= 0) {
                                            var regex = new RegExp(stringToFind, "g");
                                            valueToAppend = valueToAppend.replace(regex, listElements[z][propName]);
                                            $("#" + spContext.htmlDictionary[listNameFromQuery].id).append(valueToAppend);
                                        }
                                    }
                                }
                            }
                        }
                        if (typeof spContext.htmlDictionary[listNameFromQuery].customFunction !== "undefined") {
                            if (typeof spContext.htmlDictionary[listNameFromQuery].customFunction !== "undefined" &&
                                spContext.htmlDictionary[listNameFromQuery].customFunction != null &&
                                typeof spContext.htmlDictionary[listNameFromQuery].customFunction === "function") {
                                spContext.htmlDictionary[listNameFromQuery].customFunction(listElements, spContext.htmlDictionary[listName].id);
                            }
                        }
                        spContext.htmlDictionary[listNameFromQuery].run = true;
                    }, onFailedCall, appContext);
                }
            } else {
                var fullString = "";
                if (element[i].tagName.toLowerCase() === "select" || element[i].tagName.toLowerCase() === "div") {
                    var elementNodeText = element[i].innerHTML.trim();
                    fullString = elementNodeText;
                    if (typeof properties[listName] !== "undefined") {
                        if ((typeof properties[listName].onchange !== "undefined")) {
                            element[i].onchange = function (event) {
                                var eventList = document.getElementById(this.id).getAttribute("speed-list-repeat");
                                properties[eventList].onchange(event);
                            }
                        }
                    }
                }

                if (typeof properties[listName] !== "undefined") {
                    properties[listName].autoLoad = (typeof properties[listName].autoLoad == "undefined") ? true : properties[listName].autoLoad;
                    properties[listName].customFunction = (typeof properties[listName].customAfterLoadFunction == "undefined") ? null : properties[listName].customAfterLoadFunction;
                    customquery = (typeof properties[listName].query == "undefined") ? customquery : properties[listName].query;
                    properties[listName].element = element[i];
                }

                if (typeof properties[listName] !== "undefined") {
                    var intervalRef = setInterval(function () {
                        var refList = spContext.intervalRefDictionary[intervalRef].list;
                        var fullString = spContext.intervalRefDictionary[intervalRef].element.innerHTML.trim();
                        if (spContext.htmlDictionary[refList].run) {
                            $("#" + properties[refList].element.id).empty();
                            if (typeof properties[refList] !== "undefined") {
                                if (typeof properties[refList].customBeforeLoadFunction != "undefined" && typeof properties[refList].customBeforeLoadFunction == "function") {
                                    properties[refList].customBeforeLoadFunction();
                                }
                            }

                            if (setEmptyOption) {
                                if (MessageValidation == "" || typeof MessageValidation === "undefined" || MessageValidation == null) {
                                    $("#" + properties[refList].element.id).append("<option value=''>Please select a value</option>");
                                } else {
                                    $("#" + properties[refList].element.id).append("<option value=''>" + MessageValidation + "</option>");
                                }
                            }

                            if (properties[refList].autoLoad) {
                                var listElements = spContext.htmlDictionary[refList].data;
                                for (var z = 0; z < listElements.length; z++) {
                                    for (var propName in listElements[z]) {
                                        if (properties[refList].element.tagName.toLowerCase() === "select" || properties[refList].element.tagName.toLowerCase() === "div") {
                                            var valueToAppend = fullString;
                                            var stringToFind = "{{" + propName + "}}";
                                            if (valueToAppend.indexOf(stringToFind) >= 0) {
                                                var regex = new RegExp(stringToFind, "g");
                                                valueToAppend = valueToAppend.replace(regex, listElements[z][propName]);
                                                $("#" + properties[refList].element.id).append(valueToAppend);
                                            }
                                        }
                                    }
                                }
                            }
                            if (typeof properties[refList].customFunction !== "undefined") {
                                if (typeof properties[refList].customFunction !== "undefined" && properties[refList].customFunction != null &&
                                    typeof properties[refList].customFunction === "function") {
                                    properties[refList].customFunction(listElements, properties[refList].element.id);
                                }
                            }
                            clearInterval(intervalRef);
                        }

                    }, 1000);
                    spContext.intervalRefDictionary[intervalRef] = {
                        list: listName,
                        element: element[i]
                    };
                }

            }
        }
    }
}

/**
 * The applyValidationEvents function activates the event handlers for the html elements with the speed-bind-validate attribute
 */
Speed.prototype.applyValidationEvents = function () {
    var speedPointContext = this;
    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (elementValidate.length - 1); i++) {
        //var elementEventData = jQuery._data(elementValidate[i], "events");
        //elementEventData = (typeof elementEventData === "undefined") ? {} : elementEventData;
        if ($.inArray(elementValidate[i].id, speedPointContext.appliedEvents.normal) < 0) {
            var eventOn = (elementValidate[i].getAttribute("speed-event-switch") === null) ? true : (elementValidate[i].getAttribute("speed-event-switch") === "true");
            if (eventOn) {
                if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "textarea") {
                    if (elementValidate[i].type.toLowerCase() !== "checkbox" && elementValidate[i].type.toLowerCase() !== "radio") {
                        speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                        elementValidate[i].addEventListener("keyup", function () {
                            var msg = this.getAttribute("speed-validate-msg");
                            var inputtype = this.getAttribute("speed-validate-type");
                            var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
                            var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                            if (onValidation) {
                                speedPointContext.validateField({
                                    id: this.id,
                                    msg: validationMessage,
                                    extension: validationtype,
                                    addErrors: false,
                                    styleElement: true,
                                    removeHtmlErrors: true,
                                    triggerCallback: function (id, msg) {
                                        $("#" + id).siblings(".temp-speedmsg").remove();
                                        $("<p class='temp-speedmsg'>" + msg + "</p>").insertBefore("#" + id);
                                    }
                                });
                            }
                        });
                    } else if (elementValidate[i].type.toLowerCase() === "checkbox") {
                        speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                        elementValidate[i].addEventListener("change", function () {
                            var msg = this.getAttribute("speed-validate-msg");
                            var inputtype = this.getAttribute("speed-validate-type");
                            var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                            var multivalue = (this.getAttribute("sptype") === null) ? false : (this.getAttribute("sptype").toLowerCase() === "multivalue");
                            var overideValidation = (this.getAttribute("sptype-overide-validation") === null) ? true : (this.getAttribute("sptype-overide-validation") === "true");
                            if (overideValidation && multivalue) {
                                inputtype = "multivalue";
                            }
                            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please select a value" : msg;
                            var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                            if (onValidation) {
                                speedPointContext.validateField({
                                    id: this.id,
                                    msg: validationMessage,
                                    extension: validationtype,
                                    addErrors: false,
                                    styleElement: true,
                                    removeHtmlErrors: true,
                                });
                            }
                        });
                    } else if (elementValidate[i].type.toLowerCase() === "radio") {
                        speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                        elementValidate[i].addEventListener("change", function () {
                            var msg = this.getAttribute("speed-validate-msg");
                            var inputtype = this.getAttribute("speed-validate-type");
                            var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please select a value" : msg;
                            var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                            if (onValidation) {
                                speedPointContext.validateField({
                                    id: this.id,
                                    msg: validationMessage,
                                    extension: validationtype,
                                    addErrors: false,
                                    styleElement: true,
                                    removeHtmlErrors: true,
                                });
                            }
                        });
                    }

                } else if (elementValidate[i].tagName.toLowerCase() == "select") {
                    speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                    elementValidate[i].addEventListener("change", function () {
                        var msg = this.getAttribute("speed-validate-msg");
                        var inputtype = this.getAttribute("speed-validate-type");
                        var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please select a value" : msg;
                        var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                        if (onValidation) {
                            speedPointContext.validateField({
                                id: this.id,
                                msg: validationMessage,
                                extension: validationtype,
                                addErrors: false,
                                styleElement: true,
                                removeHtmlErrors: true,
                                triggerCallback: function (id, msg) {
                                    $("#" + id).siblings(".temp-speedmsg").remove();
                                    $("<p class='temp-speedmsg'>" + msg + "</p>").insertBefore("#" + id);
                                }
                            });
                        }
                    });
                }
            }
        }
    }

    var elementPeopleValidate = document.querySelectorAll("[speed-people-validate]");
    for (var i = 0; i <= (elementPeopleValidate.length - 1); i++) {
        var eventOn = (elementPeopleValidate[i].getAttribute("speed-event-switch") === null) ? true : (elementPeopleValidate[i].getAttribute("speed-event-switch") === "true");
        if (eventOn) {
            var elementId = elementPeopleValidate[i].id;
            var elementNode = document.getElementById(elementId);
            var msg = elementNode.getAttribute("speed-validate-msg");
            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
            var pickerID = elementId + '_TopSpan';
            var pickerHashLookupError = elementId + "_Error";

            var elementDictionary = SPClientPeoplePicker.SPClientPeoplePickerDict[(pickerID)];
            speedPointContext.tempCallbacks[pickerHashLookupError] = validationMessage;

            if (elementDictionary.OnValueChangedClientScript === null) {
                elementDictionary.OnValueChangedClientScript = function (elementDivId, userInfo) {
                    var parentId = elementDivId.slice(0, elementDivId.indexOf("_TopSpan"));
                    var HashLookupError = parentId + "_Error";
                    if (userInfo.length === 0) {
                        speedPointContext.validateField({
                            id: elementDivId,
                            staticValue: "",
                            msg: validationMessage,
                            elementType: "text",
                            useElementProperties: false
                        });
                        $("#" + parentId).siblings(".temp-speedmsg").remove();
                        $("<p class='temp-speedmsg'>" + speedPointContext.tempCallbacks[HashLookupError] + "</p>").insertBefore("#" + parentId);
                    } else {
                        $("#" + parentId).siblings(".temp-speedmsg").remove();
                        $("#" + elementDivId).removeClass("speedhtmlerr");
                    }

                    if (typeof speedPointContext.tempCallbacks[elementDivId] !== "undefined") {
                        speedPointContext.tempCallbacks[elementDivId](elementDivId, userInfo);
                    }
                }
            }
        }
    }
}

//========================= Numeric Implementation Section ======================
/**
 * The numericEvents function activates the event handlers for the html elements with the speed-bind-currency attribute
 */
Speed.prototype.numericEvents = function () {
    var speedPointContext = this;
    var elementCurrency = document.querySelectorAll("[speed-bind-currency]");
    for (var i = 0; i <= (elementCurrency.length - 1); i++) {
        for (var i = 0; i <= (elementCurrency.length - 1); i++) {
            //var elementEventData = jQuery._data(elementCurrency[i], "events");
            if ($.inArray(elementCurrency[i].id, speedPointContext.appliedEvents.numeric) < 0) {
                if (elementCurrency[i].tagName.toLowerCase() == "input" && elementCurrency[i].type.toLowerCase() === "text") {
                    speedPointContext.appliedEvents.numeric.push(elementCurrency[i].id);
                    elementCurrency[i].addEventListener("keydown", function (evt) {
                        //console.log(evt);
                        if (!isNaN(evt.key) && evt.key !== " ") {
                            var valueHolder = "";

                            //condition to check if the positioning of the input will be behind of at a position
                            if (evt.target.selectionStart === this.value.length) {
                                valueHolder = this.value + evt.key;
                            } else {
                                valueHolder = this.value.substr(0, evt.target.selectionStart) + evt.key + this.value.substr(evt.target.selectionStart);
                            }

                            var currency = this.getAttribute("speed-bind-currency");
                            var numberValue = speedPointContext.stripCurrencyToNumber(valueHolder, currency);
                            var passState = true;

                            //number condition not to allow more than 2decimal places
                            if (numberValue.toString().indexOf(".") > 0) {
                                var tempStr = numberValue.toString().split(".");
                                var decimalPt = tempStr[1];
                                if (decimalPt.length > 2) {
                                    passState = false;
                                    evt.preventDefault();
                                }
                            }

                            if (passState) {
                                var tempValue = speedPointContext.numberWithCommas(numberValue);
                                this.value = currency + tempValue;
                            }
                            evt.preventDefault();
                        } else if (speedPointContext.allowedKeys(evt)) {
                            if (evt.key.toLowerCase() === "backspace") {
                                var valueHolder = this.value.substring(0, this.value.length - 1);
                                var currency = this.getAttribute("speed-bind-currency");
                                var numberValue = speedPointContext.stripCurrencyToNumber(valueHolder, currency);
                                var tempValue = speedPointContext.numberWithCommas(numberValue);
                                if (tempValue === "")
                                    this.value = tempValue;
                                else {
                                    this.value = currency + tempValue;
                                }
                                evt.preventDefault();
                            } else if (evt.key == ".") {
                                if (this.value.toString().indexOf(evt.key) > 0) {
                                    evt.preventDefault();
                                }
                            }
                        } else {
                            evt.preventDefault();
                        }
                    });
                }
            }
        }
    }
}

/**
 * The allowedKeys function check the keys allowed for the numeric handler
 */
Speed.prototype.allowedKeys = function (evt) {
    if (evt.key.toLowerCase() === "backspace") {
        return true;
    }

    if (evt.key === ".") {
        return true;
    }

    if (evt.key.toLowerCase() === "arrowleft") {
        return true;
    }

    if (evt.key.toLowerCase() === "arrowright") {
        return true;
    }
}

/**
 * The stripCurrencyToNumber function check the keys allowed for the numeric handler
 */
Speed.prototype.stripCurrencyToNumber = function (value, currency, stringval) {
    var currencyfull = (typeof stringval === "undefined") ? false : stringval;
    var numberValue = value.replace(currency, "");
    numberValue = numberValue.replace(/,/g, "");
    if (currencyfull) numberValue = value;
    return numberValue;
}

/**
 * The numberWithCommas function returns numbers with comma seperation
 * @param {Int} numberToConvert the parameter supplies the number to add the commas to
 * @returns {String} the result output.
 */
Speed.prototype.numberWithCommas = function (numberToConvert) {
    return numberToConvert.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/* ============================== List Section ============================*/
/**
 * The createList function creates a list in the context used
 * @param {object} listProperties this parameter contains all the properties required for the creation of a sharepoint list
 * @param {callback} onSuccess this parameter is the call back function thats called when the list has successfully been created
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the list fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createList = function (listProperties, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var setuser = (typeof listProperties.userset === 'undefined') ? false : listProperties.userset;
    var setgroup = (typeof listProperties.groupset === 'undefined') ? false : listProperties.groupset;
    var context = this.initiate();
    var oWebsite = context.get_web();
    var listCreationInfo = new SP.ListCreationInformation();
    listCreationInfo.set_title(listProperties.title);
    listCreationInfo.set_description(listProperties.description);
    listCreationInfo.set_templateType(listProperties.templateType);
    window.speedGlobal.push(oWebsite.get_lists().add(listCreationInfo));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    if (setgroup) {
        var allGroups = oWebsite.get_siteGroups();
        context.load(allGroups);
        context.executeQueryAsync(
            function () {
                window.speedGlobal[total].breakRoleInheritance(false, true);
                var count = allGroups.get_count();
                for (var i = 0; i <= (parseInt(count) - 1); i++) {
                    var grp = allGroups.getItemAtIndex(i);
                    //provide your group name
                    for (var x in listProperties.group) {
                        if (grp.get_loginName() == listProperties.group[x].name) {
                            // All users , EveryOne , All Athenticated Users
                            //var userobj = oWebsite.ensureUser("c:0(.s|true");
                            var role = SP.RoleDefinitionBindingCollection.newObject(context);
                            role.add(oWebsite.get_roleDefinitions().getByType(listProperties.group[x].role));
                            window.speedGlobal[total].get_roleAssignments().add(grp, role);
                        }
                    }
                }
                context.load(window.speedGlobal[total]);
                context.executeQueryAsync(function () {
                    setTimeout(function () {
                        onSuccess();
                    }, 1000);
                }, Function.createDelegate(this, onFailedCall));
            }, Function.createDelegate(this, onFailedCall));
    } else if (setuser) {
        for (var x in listProperties.users) {
            var userobj = oWebsite.ensureUser(listProperties.users[x].login);
            var role = SP.RoleDefinitionBindingCollection.newObject(context);
            role.add(oWebsite.get_roleDefinitions().getByType(listProperties.users[x].role));
            window.speedGlobal[total].get_roleAssignments().add(userobj, role);
        }

        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, 1000);
        }, Function.createDelegate(this, onFailedCall));
    } else {
        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, 1000);
        }, Function.createDelegate(this, onFailedCall));
    }
}
//----------------------create fields for a list --------------------------
/**
 * The createColumnInList function creates columns for a specified list in the context used
 * @param {array} arr this parameter contains an array of column property objects used for the creation of the column in a specified list
 * @param {String} listName this parameter specifices the list which the columns are to be created
 * @param {callback} onSuccess this parameter is the call back function thats called when the column has successfully been created
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the list fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createColumnInList = function (arr, listName, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var genericList = context.get_web().get_lists().getByTitle(listName);
    $.each(arr, function (i, itemProperties) {
        window.speedGlobal.push(genericList.get_fields().addFieldAsXml(itemProperties.columnField, itemProperties.addToDefault, itemProperties.fieldOptions));
        var total = window.speedGlobal.length;
        total--;
        var field = context.castTo(window.speedGlobal[total], itemProperties.fieldType);
        if (typeof itemProperties.properties != "undefined") {
            itemProperties.properties(field);
        }
        field.update();
    });
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(genericList);
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess();
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The updateItems function updates rows for a specified list in the context used
 * @param {array} arr this parameter contains an array of key-values property objects used for the updating of the row in a specified list by the Id
 * this means Id must be part of the key-value properties to be Passed. key values must match the Columns in the list
 * @param {String} listName this parameter specifices the list which the rows are to be updated
 * @param {callback} onSuccess this parameter is the call back function thats called when the row has successfully been updated
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the row fails to update, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.updateItems = function (arr, listName, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    if (typeof arr != 'undefined') {
        if (arr.length != 0) {
            var context = this.initiate();
            var passwordList = context.get_web().get_lists().getByTitle(listName);
            if (typeof appContext !== 'undefined') {
                context = appContext.initiate();
            }
            context.load(passwordList);
            $.each(arr, function (i, itemProperties) {
                var items = [];
                items[i] = passwordList.getItemById(itemProperties.ID);
                for (var propName in itemProperties) {
                    if (propName.toLowerCase() == "id") {} else {
                        items[i].set_item(propName, itemProperties[propName]);
                    }
                }
                items[i].update();
            });
            context.executeQueryAsync(onSuccess, Function.createDelegate(this, onFailedCall));
        }
    }
};

/**
 * The createItems function creates rows for a specified list in the context used
 * @param {array} arr this parameter contains an array of key-values property objects used for the creation of the row in a specified list. key values must
 *  match the Columns in the list
 * @param {String} listName this parameter specifices the list which the rows are to be created
 * @param {callback} onSuccess this parameter is the call back function thats called when the row has successfully been created. ListItem information 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the row fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createItems = function (arr, listName, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    if (typeof arr != 'undefined') {
        if (arr.length != 0) {
            var listitemArr = [];
            var context = this.initiate();
            var reqList = context.get_web().get_lists().getByTitle(listName);
            if (typeof appContext !== 'undefined') {
                context = appContext.initiate();
            }
            $.each(arr, function (i, itemProperties) {
                var itemCreateInfo = new SP.ListItemCreationInformation();
                var listItem = reqList.addItem(itemCreateInfo);
                for (var propName in itemProperties) {
                    if (propName.toLowerCase() != "id") {
                        listItem.set_item(propName, itemProperties[propName]);
                    }
                }
                listItem.update();
                context.load(listItem);
                listitemArr.push(listItem);
            });
            context.executeQueryAsync(function () {
                setTimeout(function () {
                    onSuccess(listitemArr);
                }, 1000);
            }, Function.createDelegate(this, onFailedCall));
        }
    }
};

/**
 * The createItems function creates rows for a specified list in the context used
 * @param {String} listname this parameter specifices the list which the row is to be deleted
 * @param {Int} id this parameter specifices the id of the row which is to be deleted
 * @param {callback} onSuccess this parameter is the call back function thats called when the row has successfully been deleted
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the row fails to deleted, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.deleteItem = function (listname, id, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var oList = context.get_web().get_lists().getByTitle(listname);
    window.speedGlobal.push(oList.getItemById(id));
    var total = window.speedGlobal.length;
    total--;
    window.speedGlobal[total].deleteObject();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess();
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
};

/**
 * The getItem function retrieve rows for a specified list in the context used
 * @param {String} listName this parameter specifices the list which the rows are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {callback(enumerator)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved, SP.Item object is returned as
 * an argument to the callback function
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getItem = function (listName, caml, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var query = (typeof caml === '' || caml == null) ? this.camlBuilder() : caml;
    var context = this.initiate();
    var oList = context.get_web().get_lists().getByTitle(listName);
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(query);
    window.speedGlobal.push(oList.getItems(camlQuery));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(window.speedGlobal[total]);
    window.speedGlobal[total].ListName = listName;
    context.executeQueryAsync(function () {

        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
            SpeedContext.asyncManager(window.speedGlobal[total].ListName);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

//* ====================== Helper Functions ========================*//
/**
 * Exports a List to an Object. Only one list item object is returned based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {callback(Object)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * object is List Column  as key ,and data of the column is the data in the list
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToControl = function (listName, caml, controls, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var controlArray = this.getControls();
    var controlsData = [];
    if ($.type(controls) === "object") {
        controlsData = controls.data;
        if (!controls.merge) {
            controlArray = [];
        }
    } else {
        controlsData = controls;
    }
    var controlsToUse = ($.isArray(controlsData)) ? $.merge(controlArray, controlsData) : controlArray;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var oList = context.get_web().get_lists().getByTitle(listName);
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(caml);
    window.speedGlobal.push(oList.getItems(camlQuery));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }

    context.load(window.speedGlobal[total]);
    context.executeQueryAsync(function () {
        var objectToReturn = {};
        var items = window.speedGlobal[total].getItemAtIndex(0);

        if (typeof items !== "undefined") {
            for (var i = 0; i <= (controlsToUse.length - 1); i++) {
                var SPFieldType;
                var nopropinJSEngine = false;
                try {
                    SPFieldType = items.get_item(controlsToUse[i]).__proto__.constructor.__typeName.toLowerCase();
                } catch (ex) {
                    try {
                        nopropinJSEngine = true;
                        SPFieldType = $.type(items.get_item(controlsToUse[i]));
                    } catch (ex) {
                        SPFieldType = "string";
                    }
                }
                if (controlsToUse[i] === "SPItem") {
                    objectToReturn.SPItem = items;
                } else if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                    var objProp = {};
                    objProp.id = SpeedContext.checkNull(items.get_item(controlsToUse[i]).get_lookupId());
                    objProp.value = SpeedContext.checkNull(items.get_item(controlsToUse[i]).get_lookupValue());
                    if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                        try {
                            objProp.email = SpeedContext.checkNull(items.get_item(controlsToUse[i]).get_email());
                        } catch (e) {
                            objProp.email = "";
                        };
                    }
                    objectToReturn[controlsToUse[i]] = objProp;
                } else if (SPFieldType.toLowerCase() === "array") {
                    var multiUser = items.get_item(controlsToUse[i]);
                    var arrayToSave = [];
                    for (var j = 0; j <= (multiUser.length - 1); j++) {
                        var objectOfUsers = {};
                        objectOfUsers.id = multiUser[j].get_lookupId();
                        objectOfUsers.value = multiUser[j].get_lookupValue();
                        try {
                            objectOfUsers.email = multiUser[j].get_email();
                        } catch (e) {
                            objectOfUsers.email = "";
                        };
                        arrayToSave.push(objectOfUsers);
                    }
                    objectToReturn[controlsToUse[i]] = arrayToSave;
                } else
                    objectToReturn[controlsToUse[i]] = SpeedContext.checkNull(items.get_item(controlsToUse[i]));

            }
        }
        onSuccess(objectToReturn);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * Exports a List to an Array. All list items is returned based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {function} conditions this parameter includes special conditions for each object properties, condition must return an object 
 * @param {callback} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToItems = function (listName, caml, controls, tableonly, conditions, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var tableId = (typeof controls.tableid !== "") ? controls.tableid : "";
    var controlArray = [];
    var pageControls = (typeof controls.useTableControls === "undefined") ? true : controls.useTableControls;
    if (pageControls) {
        controlArray = this.getControls(tableonly, tableId);
    }
    var mergeControls = (typeof controls.merge === "undefined") ? true : controls.merge;
    if (mergeControls) {
        var controlsToUse = ($.isArray(controls.data)) ? $.merge(controlArray, controls.data) : controlArray;
    } else {
        var controlsToUse = controls.data;
    }
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;

    this.getItem(listName, caml, function (itemProperties) {
        var listItems = [];
        var listEnumerator = itemProperties.getEnumerator();
        while (listEnumerator.moveNext()) {
            var objectToReturn = {};
            for (var i = 0; i <= (controlsToUse.length - 1); i++) {
                var SPFieldType;
                var nopropinJSEngine = false;
                try {
                    SPFieldType = listEnumerator.get_current().get_item(controlsToUse[i]).__proto__.constructor.__typeName.toLowerCase();
                } catch (ex) {
                    try {
                        nopropinJSEngine = true;
                        SPFieldType = $.type(listEnumerator.get_current().get_item(controlsToUse[i]));
                    } catch (ex) {
                        SPFieldType = "string";
                    }
                }
                if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                    var objProp = {};
                    objProp.id = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupId());
                    objProp.value = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupValue());
                    if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                        try {
                            objProp.email = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_email());
                        } catch (e) {
                            objProp.email = "";
                        };
                    }

                    if (typeof conditions === "object" && conditions !== null) {
                        if (typeof conditions[controlsToUse[i]] !== "undefined") {
                            objProp = conditions[controlsToUse[i]](objProp);
                        }
                    }
                    objectToReturn[controlsToUse[i]] = objProp;
                } else if (SPFieldType.toLowerCase() === "array") {
                    var multiUser = listEnumerator.get_current().get_item(controlsToUse[i]);
                    var arrayToSave = [];
                    for (var j = 0; j <= (multiUser.length - 1); j++) {
                        var objectOfUsers = {};
                        objectOfUsers.id = multiUser[j].get_lookupId();
                        objectOfUsers.value = multiUser[j].get_lookupValue();
                        try {
                            objectOfUsers.email = multiUser[j].get_email();
                        } catch (e) {
                            objectOfUsers.email = "";
                        };
                        arrayToSave.push(objectOfUsers);
                    }

                    if (typeof conditions === "object" && conditions !== null) {
                        if (typeof conditions[controlsToUse[i]] !== "undefined") {
                            arrayToSave = conditions[controlsToUse[i]](arrayToSave);
                        }
                    }
                    objectToReturn[controlsToUse[i]] = arrayToSave;
                } else {
                    var columnValue = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]));
                    if (typeof conditions === "object" && conditions !== null) {
                        if (typeof conditions[controlsToUse[i]] !== "undefined") {
                            columnValue = conditions[controlsToUse[i]](columnValue);
                        }
                    }
                    objectToReturn[controlsToUse[i]] = columnValue;
                }
            }

            if (conditions !== null && typeof conditions === "function") {
                objectToReturn = conditions(objectToReturn);
            }

            //includes non empty objects
            if (!$.isEmptyObject(objectToReturn)) {
                listItems.push(objectToReturn);
            }
        }
        onSuccess(listItems, itemProperties.ListName);
    }, onFailedCall, appContext);
}

/**
 * Exports a List to an Array. All list items is returned based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {array} extraFields this parameter includes extra columns to be included into obtain columns on the form. 
 * @param {callback} onSuccess this parameter is the call back function thats called when the list and the columns have been created succssfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.formAppInitialization = function (listName, extraFields, callback, onFailed, appContext) {
    var spContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var extraFields = (typeof extraFields === "undefined") ? [] : extraFields;
    var listProperties = {};
    listProperties.title = listName;
    listProperties.templateType = SP.ListTemplateType.genericList;
    listProperties.description = "";
    var arr = spContext.getControls(false, true);
    if (extraFields.length !== 0) {
        arr = arr.concat(extraFields);
    }
    spContext.createList(listProperties, function () {
        //when list is created
        spContext.createColumnInList(arr, listProperties.title, callback, onFailedCall, appContext);
    }, function (sender, args) {
        //if list already exist
        spContext.createColumnInList(arr, listProperties.title, callback, onFailedCall, appContext);
    }, appContext);
}

/* ============================== General Section ============================*/
/**
 * The getParameterByName function gets the value of parameters in a query string url
 * @param {String} name parameter name
 * @param {String} url url to check for value
 * @returns {String} the parameter value.
 */
Speed.prototype.getParameterByName = function (name, url) {
    if (!url) url = window.location.href;
    url = url.toLowerCase(); // This is just to avoid case sensitiveness
    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase(); // This is just to avoid case sensitiveness for query parameter name
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * This method checks if a sript already exist in the page, if the script exist true is return else false is returned
 * @param {string} scriptToCheck any part of the script source you want to validate against
 * @return {bool} if the script exist true is returned 
 */
Speed.prototype.checkScriptDuplicates = function (scriptToCheck) {
    var scriptExist = false;
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src) {
            if (scripts[i].src.toLowerCase().indexOf(scriptToCheck.toLowerCase()) >= 0) {
                scriptExist = true;
                break;
            }
        }
    }
    return scriptExist;
}

/**
 * The uniqueIdGenerator function generates a unique id 
 * @returns {String} the result output.
 */
Speed.prototype.uniqueIdGenerator = function () {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now();
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

/**
 * The serverDate function gets the current sharepoint server date time
 * @returns {Date} the result output.
 */
Speed.prototype.serverDate = function (dateObj) {
    var datetoUse = (typeof dateObj === "undefined") ? new Date() : new Date(dateObj);
    return new Date(datetoUse.getTime() + _spPageContextInfo.clientServerTimeDelta);
}

//--------------------------------stringnify date------------------
/**
 * The stringnifyDate function converts a date object to string
 * @param {Object} [obj = {value: this.serverDate}] parameter supplies a settings object for converting to string. by default the server date is used
 * @returns {String} the result output.
 */
Speed.prototype.stringnifyDate = function (obj) {
    var monthDef = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function returnStrMonth(Month) {
        var num = Number(Month) - 1;
        return monthDef[num];
    }
    if (typeof obj == "undefined") obj = {};
    var reconstructDate = (typeof obj.reconstruct === 'undefined') ? false : obj.reconstruct
    if (typeof obj.value === 'undefined' || obj.value == "") {
        var str = this.serverDate();
    } else {
        if (reconstructDate) {
            var format = obj.format;
            var getDelimiter = format.slice(2, 3);
            var dateObj = obj.value.split(getDelimiter);
            //change format to used format mm dd yy
            obj.value = dateObj[1] + getDelimiter + dateObj[0] + getDelimiter + dateObj[2];
        }
        var str = new Date(obj.value);
    }

    if (typeof obj.includeTime == "undefined") var incTime = false;
    else
        var incTime = obj.includeTime;

    if (typeof obj.monthAsString == "undefined") var monthStr = false;
    else
        var monthStr = obj.monthAsString;

    if (typeof obj.timeSpace == "undefined") obj.timeSpace = true;

    obj.asId = (typeof obj.asId === 'undefined') ? false : obj.asId;

    var year = str.getFullYear();
    var month = str.getMonth() + 1;
    var day = str.getDate();
    var hour = str.getHours();
    var minute = str.getMinutes();
    var second = str.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        var hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        var minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        var second = '0' + second;
    }
    var inval = false;
    if (typeof obj.format != 'undefined') {
        var format = obj.format;
        var dayused, monthUsed, yearUsed = false;
        var getDelimiter = format.slice(2, 3);
        var firstField = format.slice(0, 2);
        var secondField = format.slice(3, 5);
        var thirdField = format.slice(6, 8);
        //var test = firstField + " : " + secondField + " : " + thirdField + " : " + getDelimiter;
        var finalStr = "";
        if (getDelimiter == "-" || getDelimiter == "/") {
            if (firstField.toLowerCase() == 'dd') {
                finalStr += day;
                dayused = true;
            } else if (firstField.toLowerCase() == 'mm') {
                if (monthStr)
                    finalStr += returnStrMonth(month);
                else
                    finalStr += month;
                monthUsed = true
            } else if (firstField.toLowerCase() == 'yy') {
                finalStr += year;
                yearUsed = true;
            }

            finalStr += getDelimiter;

            if (secondField.toLowerCase() == 'dd' && !dayused) {
                finalStr += day;
                dayused = true;
            } else if (secondField.toLowerCase() == 'mm' && !monthUsed) {
                if (monthStr)
                    finalStr += returnStrMonth(month);
                else
                    finalStr += month;
                monthUsed = true
            } else if (secondField.toLowerCase() == 'yy' && !yearUsed) {
                finalStr += year;
                yearUsed = true;
            }

            finalStr += getDelimiter;

            if (thirdField.toLowerCase() == 'dd' && !dayused) {
                finalStr += day;
                dayused = true;
            } else if (thirdField.toLowerCase() == 'mm' && !monthUsed) {
                if (monthStr)
                    finalStr += returnStrMonth(month);
                else
                    finalStr += month;
                monthUsed = true
            } else if (thirdField.toLowerCase() == 'yy' && !yearUsed) {
                finalStr += year;
                yearUsed = true;
            } else {
                finalStr = "Invalid Format";
                inval = true;
            }
        } else {
            var finalStr = "Invalid Format";
            inval = true;
        }
    } else {
        if (monthStr)
            month = returnStrMonth(month);
        var finalStr = day + '/' + month + '/' + year;
    }

    if (incTime && !inval) {
        if (obj.timeSpace)
            finalStr += '  ' + hour + ':' + minute + ':' + second;
        else
            finalStr += '_' + hour + '-' + minute + '-' + second;
    }

    if (obj.asId) {
        finalStr = finalStr.replace(/\//g, "");
        finalStr = finalStr.replace(/_/g, "");
        finalStr = finalStr.replace(/:/g, "");
        finalStr = finalStr.replace(/-/g, "");
        finalStr = finalStr.replace(/\s/g, "");
    }
    return finalStr;
};

/**
 * The checkNull function checks if a value is null. it returns the value if its not null and and empty string when it is
 * This is used to avoid unexpected result when retrieving values columns that are empty
 * @param {String} val parameter supplies a value to check for null
 * @returns {String} the result output.
 */
Speed.prototype.checkNull = function (val) {
    if (typeof val == "string")
        return val.toString(); //.replace(/(?:\r\n|\r|\n)/g, '<br />');
    else if (val != null) {
        return val;
    } else
        return '';
};

/**
 * The removeHtml function removes html for a string of elements.
 * this method is used for presenting only text values from rich text box columns in sharepoint lists
 * @param {String} val parameter supplies a string
 * @returns {String} the result output.
 */
Speed.prototype.removeHtml = function (val) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = val;
    return tmp.textContent || tmp.innerText || "";
}

/**
 * The redirect function redirects to the specified page
 * @param {String} url the parameter supplies the url to redirect to
 * @param {bool} [opt= true] the parameter sets if the previous url is available in the history or not after redirecting
 */
Speed.prototype.redirect = function (url, opt) {
    var opt = (typeof opt === 'undefined') ? true : opt;
    if (opt)
        window.location = url;
    else
        location.replace(url);
};

/**
 * The xmlToJson function converts xml to json object
 * @param {String} xml the parameter supplies the xml for conversion
 * @returns {json} the json string.
 */
Speed.prototype.xmlToJson = function (xml) {
    // Create the return object
    var obj = {};
    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }
    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = this.xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(this.xmlToJson(item));
            }
        }
    }
    return obj;
}
//------------------------------
/**
 * The clearFileInput function clears file input selection for input of type='file' for all browsers
 * @param {string} elementId the parameter supplies the element ID
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //the selection for input of id fileid is cleared
 * speedCtx.clearFileInput("fileid");
 */
Speed.prototype.clearFileInput = function (elementid) {
    elementNode = document.getElementById(elementid);
    try {
        elementNode.value = null;
    } catch (ex) {}
    if (elementNode.value) {
        elementNode.parentNode.replaceChild(elementNode.cloneNode(true), elementNode);
    }
}

/**
 * The differenceBtwDates function get the difference between days hours mins 
 * @param {Date} first date to  make difference from
 * @param {Date} second date to  make difference from
 * @param {String} format for the difference
 * @returns {Int} the difference
 */
Speed.prototype.differenceBtwDates = function (date1, date2, dateFormat) {
    var formatToUse = (typeof dateFormat === "undefined") ? "hour" : dateFormat;
    date2 = (typeof date2 === "undefined") ? this.serverDate() : date2;
    //var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var timeDiff = date2.getTime() - date1.getTime();
    var divisor = 1000;
    if (formatToUse === "minutes") {
        divisor *= 60;
    }
    if (formatToUse === "hour") {
        divisor *= (60 * 60);
    }
    if (formatToUse === "day") {
        divisor *= (60 * 60 * 24);
    }

    var diffDays = Math.ceil(timeDiff / divisor);

    return diffDays;
}


/**
 * The differenceBtwDates function get the difference between days hours mins 
 * @param {Date} dateT date to add
 * @returns {Date} the new date
 */
Speed.prototype.addDaysToDate = function (dateT, addedTime, format) {
    var dat = new Date(dateT);
    var formatToUse = (typeof format === "undefined") ? "days" : format;
    if (formatToUse === "days")
        dat.setDate(dat.getDate() + addedTime);
    else if (formatToUse === "hours")
        dat = this.serverDate((dat.getTime() + addedTime * 60 * 60000));
    else if (formatToUse === "mins")
        dat = this.serverDate((dat.getTime() + addedTime * 60000));
    return dat;
}

/**
 * GLOBAL METHOD
 * String Object Extension to return a  name which excludes the other name properties  attached with sharepoint
 * @returns String  name of the user, excludes the other name properties  attached with sharepoint
 */
String.prototype.SPNameFromTitle = function () {
    var valueToReturn;
    try {
        valueToReturn = this.toString().split("[")[0];
    } catch (e) {
        valueToReturn = this.toString();
    }
    return valueToReturn;
}
/**
 * GLOBAL METHOD
 * String Object Extension to return a login name which excludes the domain name
 * @returns String login name of the user, excludes the domain name
 */
String.prototype.SPLoginFromFullLogin = function (fullpath) {
    fullpath = (typeof fullpath === "undefined") ? true : fullpath;
    var returnSplit = "";
    if (fullpath) {
        try {
            returnSplit = this.toString().split("\\")[1];
        } catch (e) {
            returnSplit = this.toString();
        }

        if (typeof returnSplit == "undefined") {
            returnSplit = this.toString().split("|")[2];
        }
    } else {
        try {
            returnSplit = this.toString().split("|")[1];
        } catch (e) {
            returnSplit = this.toString();
        }
    }

    return returnSplit;
}
/**
 * GLOBAL METHOD
 * String Object Extension to return a domain name which excludes the login name
 * @returns String Domain name of the organization, excludes the login name
 */
String.prototype.SPDomainFromFullLogin = function () {
    var returnSplit = "";
    try {
        returnSplit = this.toString().split("\\")[0];
    } catch (e) {
        returnSplit = this.toString();
    }
    return returnSplit;
}

/**
 * GLOBAL METHOD
 * String Object Extension to return a domain and login name which excludes the authentication type
 * @returns String Domain and login name of the organization, excludes the authentication type
 */
String.prototype.SPDomainLoginFromFullLogin = function () {
    var returnSplit = "";
    try {
        returnSplit = this.toString().split("|")[0];
    } catch (e) {
        returnSplit = this.toString();
    }
    return returnSplit;
}

/**
 * The JSONToObject function returns a valid object. this is used to ensure a string is of a proper object type before
 * using JSON.parse on the string.
 * @param {String} val this parameter is the value you want to validate
 * @param {String} [stringType = "Array"] this parameter indicated the object type you are expecting Array or object. 
 * Array is the default if nothing is passed to this parameter.
 * @returns {object} the result output.
 */
Speed.prototype.JSONToObject = function (val, stringType) {
    var returnObj;
    var typeToUse = (typeof stringType == "undefined") ? "array" : stringType;
    if (val == null || val === "") {
        if (typeToUse.toLowerCase() == "array")
            returnObj = "[]";
        else
            returnObj = "{}";
    }

    try {
        returnObj = JSON.parse(val);
    } catch (e) {
        if (typeToUse.toLowerCase() == "array")
            returnObj = [];
        else
            returnObj = {};
    }
    return returnObj;
}

/**
 * The deferenceObject function returns an object that isnt link to another reference object
 * @param {object} referenceObject this parameter is the object to detach the reference to other objects
 * @returns {object} the result output.
 */
Speed.prototype.deferenceObject = function (referenceObject) {
    return JSON.parse(JSON.stringify(referenceObject))
}

/**
 * The replaceSpecialkeysinString function returns the string passed while replacing the enter key with break
 * @param {string} stringVal this parameter is the object to detach the reference to other objects
 * @returns {string} the result output.
 */
Speed.prototype.replaceSpecialkeysinString = function (stringVal) {
    return stringVal.replace(/(?:\r\n|\r|\n)/g, '<br />');
}


/**
 * The dataUriFormImageSrc function returns the dataUri of an file from its file path
 * @param {array} url this parameter is the url of the file on the server or solution
 * @param {callback(datauri)} onSuccess this parameter is the call back function thats called when the file is successfully retrieved
 * the datauri is returned as an argument in the success callback 
 * @param {callback(sender)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the file fails to be retrieved
 */
Speed.prototype.dataUriFormImageSrc = function (url, callBack, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //get file extension
    var fileNameSplit = url.split(".");
    var fileExt = fileNameSplit.pop();
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open('GET', url, true);
    xmlHTTP.responseType = 'arraybuffer';
    xmlHTTP.onload = function (e) {
        if (this.status === 200) {
            var arr = new Uint8Array(this.response);
            var raw = String.fromCharCode.apply(null, arr);
            var b64 = btoa(raw);
            if (fileExt.toLowerCase() == 'png')
                var dataURL = "data:image/png;base64," + b64;
            else if (fileExt.toLowerCase() == 'jpg' || fileExt.toLowerCase() == 'jpeg')
                var dataURL = "data:image/jpeg;base64," + b64;
            callBack(dataURL);
        } else {
            var speedError = {};
            speedError.errorObject = this;
            if (this.responseType === "text" || this.responseType === "")
                speedError.msg = "status : " + this.status + " , " + this.responseText;
            else
                speedError.msg = "status : " + this.status;
            onFailedCall(speedError)
        }
    };
    xmlHTTP.send();
}

/** 
 * stringExtractor is used to get the value in between the curly braces
 */
String.prototype.stringExtractor = function () {
    var startCount = 0;
    var noOfObtained = 0;
    var textStartCount = 0;
    var textEndCount = 0;
    var valuesInArray = [];
    var stringToExtract = this.toString();
    for (var x = 0; x < stringToExtract.length; x++) {
        if (stringToExtract[x] === "{" && noOfObtained == 0) {
            startCount = x;
            noOfObtained++;
        } else if (stringToExtract[x] === "{" && noOfObtained == 1 && (startCount + 1) == x) {
            textStartCount = x + 1;
            startCount = 0;
            noOfObtained = 0;
        }

        if (stringToExtract[x] === "}" && noOfObtained == 0) {
            startCount = x;
            noOfObtained++;
        } else if (stringToExtract[x] === "}" && noOfObtained === 1 && (startCount + 1) === x) {
            textEndCount = x - 1;
            var value = stringToExtract.substring(textStartCount, textEndCount);
            textStartCount = 0;
            textEndCount = 0;
            startCount = 0;
            noOfObtained = 0;
            valuesInArray.push(value);
        }
    }
    return valuesInArray;
}

/*============================= Email Section =========================*/
/**
 * The sendSPEmail function sends email to to users sync with sharepoint userprfile (within the organisation)
 * @param {String} from the from address
 * @param {Array} to an array of email address the mail will be sent to 
 * @param {String} body the content of the email
 * @param {Array} [cc= []] the copy mails , an array of strings, these mail address will be in copy
 * @param {String} subject the subject of the mail
 * @param {callBack} callBack this parameter is the call back function thats called when the function is successful or failed
 * @param {String} [relative = "Currentpage url is used"] this parameter changes the location of the SP utility API
 */
Speed.prototype.sendSPEmail = function (mailProperties, callBack, relative) {
    //Get the relative url of the site
    var urlToUSe = (typeof relative === 'undefined') ? true : relative;
    var ccAddress = (typeof mailProperties.cc === "undefined") ? [] : mailProperties.cc;
    var bccAddress = (typeof mailProperties.bcc === "undefined") ? [] : mailProperties.bcc;
    var urlTemplate;
    if (urlToUSe) {
        urlTemplate = _spPageContextInfo.webServerRelativeUrl;
        urlTemplate = (urlTemplate === "/") ? "" : urlTemplate;
        urlTemplate = urlTemplate + "/_api/SP.Utilities.Utility.SendEmail";
    } else {
        urlTemplate = "/_api/SP.Utilities.Utility.SendEmail";
    }

    $.ajax({
        contentType: 'application/json',
        url: urlTemplate,
        type: "POST",
        data: JSON.stringify({
            'properties': {
                '__metadata': {
                    'type': 'SP.Utilities.EmailProperties'
                },
                'From': mailProperties.from,
                'To': {
                    'results': mailProperties.to
                },
                'CC': {
                    'results': ccAddress
                },
                'BCC': {
                    'results': bccAddress
                },
                'Body': mailProperties.body,
                'Subject': mailProperties.subject
            }
        }),
        headers: {
            "Accept": "application/json;odata=verbose",
            "content-type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        },
        success: function (data) {
            setTimeout(function () {
                callBack("success", data);
            }, 1500)
        },
        error: function (err) {
            setTimeout(function () {
                callBack("error", err);
            }, 1500)
        }
    });
}

/* ========================== SEARCH ==========================*/
/**
 * The search function retrieve all keywords pass in the share point platform
 * @param {String} keyword this parameter specifices key to search on
 * @param {object} properties this parameter settings for the search
 * @param {callback(enumerator)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved, SP.Item object is returned as
 * an argument to the callback function
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.search = function (keyword, properties, onSuccess, onFailed, appContext) {
    var properties = (onFailed == null) ? {} : properties;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();

    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }

    var keywordQuery = new Microsoft.SharePoint.Client.Search.Query.KeywordQuery(context);
    keywordQuery.set_queryText(keyword);
    if (typeof properties.people !== "undefined") {
        if (properties.people) {
            keywordQuery.set_sourceid = "B09A7990-05EA-4AF9-81EF-EDFAB16C4E31";
        }
    }
    var searchExecutor = new Microsoft.SharePoint.Client.Search.Query.SearchExecutor(context);

    var total = window.speedGlobal.length;
    total--;
    window.speedGlobal[total] = searchExecutor.executeQuery(keywordQuery);
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
        }, 1000);
    }, onFailedCall);
}

/* ============================== People Picker Section ============================*/
/**
 * The initializePeoplePicker function initializes a people picker
 * @import SP.clientpeoplepicker.js is required
 * @param {String} peoplePickerElementId this parameter specifices the div to be transform to a people picker
 * @param {String} properties this parameter specifices the properties of the people picker
 * @param {callback(SP.ClientPeopleDictionary)} setUpCall this parameter is the call back function thats called once the peoplepicker has been intialized,
 * it returns a SP.ClientPeopleDictionary as an argument
 * object to set eventhandler or retrieve values
 */
Speed.prototype.initializePeoplePicker = function (peoplePickerElementId, properties, setUpCall) {
    var princpalAccount = 'User,DL,SecGroup,SPGroup';
    var width;
    var multipleValues;
    var resolvePrincipalSource;
    var searchPrincipalSource;
    var maxSuggestions;
    var groupId;
    if (typeof properties === 'undefined') {
        resolvePrincipalSource = 15;
        searchPrincipalSource = 15;
        multipleValues = false;
        maxSuggestions = 50;
        width = "280px";
        groupId = "";
    } else {
        width = (typeof properties.width === 'undefined') ? '280px' : properties.width;
        resolvePrincipalSource = (typeof properties.resolvePrincipalSource === 'undefined') ? 15 : properties.resolvePrincipalSource;
        searchPrincipalSource = (typeof properties.searchPrincipalSource === 'undefined') ? 15 : properties.searchPrincipalSource;
        multipleValues = (typeof properties.multipleValues === 'undefined') ? false : properties.multipleValues;
        maxSuggestions = (typeof properties.maxSuggestions === 'undefined') ? 50 : properties.maxSuggestions;
        groupId = (typeof properties.spGroupId === 'undefined') ? "" : properties.spGroupId;
    }
    var schema = {};
    schema['PrincipalAccountType'] = princpalAccount;
    schema['SearchPrincipalSource'] = searchPrincipalSource;
    schema['ResolvePrincipalSource'] = resolvePrincipalSource;
    schema['AllowMultipleValues'] = multipleValues;
    schema['MaximumEntitySuggestions'] = maxSuggestions;
    schema['Width'] = width;

    if (groupId !== "") {
        schema['SharePointGroupID'] = groupId;
    }
    // Render and initialize the picker.
    // Pass the ID of the DOM element that contains the picker, an array of initial
    // PickerEntity objects to set the picker value, and a schema that defines
    // picker properties.
    SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
    if (typeof setUpCall !== "undefined") {
        setTimeout(function () {
            var createdUserObject = this.SPClientPeoplePicker.SPClientPeoplePickerDict[(peoplePickerElementId + '_TopSpan')];
            setUpCall(createdUserObject, peoplePickerElementId);
        }, 1000);
    }
};

/**
 * The getUsersFromPicker function gets users from a people picker synchronously
 * @import SP.clientpeoplepicker.js is required
 * @param {object} properties this parameter provides the people picker dictionary object to retrieve the users from
 * @param {callback({object})} callback this parameter is the call back function thats called when all the people pickers are created, the People dictionary object
 * is passed back as an argument
 */
Speed.prototype.createMultiplePeoplePicker = function (properties, callback) {
    var speedContext = this;
    var peoplepickerProperties = (typeof properties === "undefined") ? {} : properties;
    var elementPeople = document.querySelectorAll("[speed-bind-people]");
    speedContext.peopleDictionary.total = elementPeople.length;
    for (var i = 0; i <= (elementPeople.length - 1); i++) {
        var property = elementPeople[i].getAttribute("speed-bind-people");
        var elementId = elementPeople[i].id;

        var pickerProperties = (typeof peoplepickerProperties["All"] === "undefined") ? {} : peoplepickerProperties["All"];
        pickerProperties = (typeof peoplepickerProperties[property] === "undefined") ? pickerProperties : peoplepickerProperties[property];

        speedContext.initializePeoplePicker(elementId, pickerProperties, function (peoplepickerDictionary, elementId) {
            speedContext.peopleDictionary.count++;
            var elementProperty = document.getElementById(elementId).getAttribute("speed-bind-people");
            speedContext.peopleDictionary.picker[elementProperty] = peoplepickerDictionary;
            if (speedContext.peopleDictionary.count === speedContext.peopleDictionary.total && typeof callback === "function") {
                callback(speedContext.peopleDictionary.picker);
            }
        });
    }
}

/**
 * The getUsersFromPicker function gets users from a people picker synchronously
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} peoplePickerControl this parameter provides the people picker dictionary object to retrieve the users from
 * @returns {Array} returns an array of SP.User objects
 */
Speed.prototype.getUsersFromPicker = function (peoplePickerControl) {
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var people = peoplePickerControl;
    var userManager = null;
    try {
        userManager = people.GetAllUserInfo();
    } catch (e) {}
    return userManager;
}

/**
 * The getUsersFromPicker function gets users from a people picker Asynchronously
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} peoplePickerControl this parameter provides the people picker dictionary object to retrieve the users from
 * @param {callback([SP.Users])} onSuccess this parameter is the call back function thats called when the users details where retrieved successfully
 * and array of users is returned as an argument in the callback
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getUsersFromPickerAsync = function (peoplePickerControl, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var userDetails = [];
    var ctx = this.initiate();
    var people = peoplePickerControl;
    var userManager = people.GetAllUserInfo();
    if (!jQuery.isEmptyObject(userManager)) {
        // Get the first user's ID by using the login name.
        for (var x = 0; x <= (userManager.length - 1); x++) {
            window.speedGlobal.push(ctx.get_web().ensureUser(userManager[x].Key));
            var total = window.speedGlobal.length;
            total--;
            ctx.load(window.speedGlobal[total]);
            userDetails.push(window.speedGlobal[total]);
        }

        ctx.executeQueryAsync(
            setTimeout(function () {
                onSuccess(userDetails);
            }, 1500),
            Function.createDelegate(this, onFailedCall));
    } else onSuccess(null);
}

/**
 * The setPeoplePickerValue function sets a user value for a people picker
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} peoplePickerObj this parameter provides the people picker dictionary object which the user will be set
 * @param {String} userLogin this parameter provides the login of the user that will be set
 */
Speed.prototype.setPeoplePickerValue = function (peoplePickerObj, userLogin) {
    var peoplePicker = peoplePickerObj;
    var usrObj = {
        'Key': userLogin
    };
    peoplePicker.AddUnresolvedUser(usrObj, true);
}

/**
 * The clearPicker function clears the value of a people picker
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} people this parameter provides the people picker dictionary object which is to be cleared
 */
Speed.prototype.clearPicker = function (people) {
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var userManager = people.GetAllUserInfo();
    if (!jQuery.isEmptyObject(userManager)) {
        userManager.forEach(function (index) {
            people.DeleteProcessedUser(userManager[index]);
        });
    }
}

//==================================================================================================
/* ============================== User Section Section ============================*/

/**
 * The currentUserDetailsSync function gets current logged in user details synchronously
 * @returns {Object} returns an object with the following properties: id,fullLogin,login,isAdmin,email,title
 */
Speed.prototype.currentUserDetailsSync = function () {
    var CurrentInlineUserProperties = {};
    CurrentInlineUserProperties.id = _spPageContextInfo.userId;
    CurrentInlineUserProperties.fullLogin = _spPageContextInfo.userLoginName;
    CurrentInlineUserProperties.isAdmin = _spPageContextInfo.isSiteAdmin;
    try {
        //this block will work for o365
        CurrentInlineUserProperties.login = _spPageContextInfo.userLoginName;
        CurrentInlineUserProperties.email = _spPageContextInfo.userEmail;
        CurrentInlineUserProperties.title = _spPageContextInfo.userDisplayName;
    } catch (e) {
        //this block will parse is its onPremise
        CurrentInlineUserProperties.login = _spPageContextInfo.userLoginName.SPLoginFromFullLogin();
        CurrentInlineUserProperties.email = null;
        CurrentInlineUserProperties.title = null;
    }

    return CurrentInlineUserProperties;
};

/**
 * The currentUserDetails (Async) function gets current logged in user details Asynchronously
 * @param {callBack(SP.User)} callback this parameter is the call back function when the function is successful. a SP.User object is passed as an argument to this callback
 * this argument can be used to retrieve details of the current user
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */

Speed.prototype.currentUserDetails = function (callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var speedContextMaster = this.initiate();
    var speedUserMaster = speedContextMaster.get_web().get_currentUser();
    speedContextMaster.load(speedUserMaster);
    speedContextMaster.executeQueryAsync(function () {
        if (typeof callback !== 'undefined') {
            callback(speedUserMaster);
        }
    }, Function.createDelegate(this, onFailedCall));
};

/**
 * The getUserById function gets a user by its ID
 * @param {int} usId the user ID
 * @param {callBack(SP.User)} callback this parameter is the call back function when the function is successful , the callback contains an SP.User object as an argumnet
 * which contains the properties of the user
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getUserById = function (usId, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var ctxt = this.initiate();
    var ccbUser = ctxt.get_web().getUserById(usId);
    //runtime method
    ccbUser.retrieve();
    ctxt.load(ccbUser);
    ctxt.executeQueryAsync(function () {
        //set interval is used because userProperties might not be available is server resources is down
        var intervalCount = 0
        window.speedGlobal.push(intervalCount);
        var total = window.speedGlobal.length;
        total--;

        var intervalRef = setInterval(function () {
            try {
                var userId = ccbUser.get_id();
                clearInterval(intervalRef);
                callback(ccbUser);
            } catch (e) {
                window.speedGlobal[total] = parseInt(window.speedGlobal[total]) + 1;
                if (window.speedGlobal[total] == 10) {
                    clearInterval(intervalRef);
                    throw "User properties is not available check server resources";
                }
            }

        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The getUserById function gets a user by its login
 * @param {string} loginName the user login name
 * @param {callBack(SP.User)} onSuccess this parameter is the call back function when the function is successful, the callback contains an SP.User object as an argumnet
 * which contains the properties of the user
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getUserByLoginName = function (loginName, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var context = this.initiate();
    var userObject = context.get_web().ensureUser(loginName);
    //runtime method 
    userObject.retrieve();
    context.load(userObject);
    context.executeQueryAsync(function () {
        //set interval is used because userProperties might not be available is server resources is down
        var intervalCount = 0
        window.speedGlobal.push(intervalCount);
        var total = window.speedGlobal.length;
        total--;
        var intervalRef = setInterval(function () {
            try {
                var userId = userObject.get_id();
                clearInterval(intervalRef);
                onSuccess(userObject);
            } catch (e) {
                window.speedGlobal[total] = parseInt(window.speedGlobal[total]) + 1;
                if (window.speedGlobal[total] == 10) {
                    clearInterval(intervalRef);
                    throw "User properties is not available check server resources";
                }
            }
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The getCurrentUserProperties function gets the current user UserProfile Properties
 * @import SP.UserProfiles.js is required
 * @param {callback(SP.UserProfileProperties)} callback this parameter is the call back function when the function is successful, 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getCurrentUserProperties = function (callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
    var userProfileProperties = peopleManager.getMyProperties();
    clientContext.load(userProfileProperties);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(userProfileProperties);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
};

/**
 * The getSpecificUserProperties function gets a user UserProfile Properties by login name
 * @param {String} acctname the login of the user which you want to obtain its properties
 * @param {array} profilePropertyNames an array of strings containing the properties you want to retrieve
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful, it returns and array of values
 * in respect to the properties retrieved.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getSpecificUserProperties = function (acctname, profilePropertyNames, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var userProfileProperties = [];
    var clientContext = this.initiate();
    //Get Instance of People Manager Class
    var peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
    //Properties to fetch from the User Profile
    //var profilePropertyNames = ["AccountName","WorkEmail"];
    //Domain\Username of the user (If you are on SharePoint Online) 
    //var targetUser = "i:0#.f|membership|teyttetyt@yoursite.onmicrosoft.com";    
    //If you are on On-Premise:
    var targetUser = acctname; //domain\\username
    //Create new instance of UserProfilePropertiesForUser
    var userProfilePropertiesForUser = new SP.UserProfiles.UserProfilePropertiesForUser(clientContext, targetUser, profilePropertyNames);
    userProfileProperties = peopleManager.getUserProfilePropertiesFor(userProfilePropertiesForUser);
    clientContext.load(userProfilePropertiesForUser);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(userProfileProperties);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The createSPGroup function creates a sharepoint group
 * @param {String} title the name of the group you want to create
 * @param {object} properties the group properties object
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.createSPGroup = function (title, properties, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var assignDefinition = (typeof properties.assigndefinition !== 'undefined') ? properties.assigndefinition : false;
    var roleDefinition = (typeof properties.roledefinition !== 'undefined') ? properties.roledefinition : null;

    var allowMemberEdit = (typeof properties.allowMembersEdit !== 'undefined') ? properties.allowMembersEdit : false;
    var everyoneView = (typeof properties.everyone !== 'undefined') ? properties.everyone : false;

    var description = (typeof properties.description !== 'undefined') ? properties.description : "";

    var callbackFunction = (typeof properties === 'function') ? properties : callback;
    if (typeof properties === 'function' && typeof callback === 'function') {
        onFailedCall = callback;
    }
    //Load new Site
    var currentCTX = this.initiate();
    var currentWEB = currentCTX.get_web();

    //Get all groups in site
    var groupCollection = currentWEB.get_siteGroups();

    // Create Group information for Group
    var membersGRP = new SP.GroupCreationInformation();
    membersGRP.set_title(title);
    membersGRP.set_description(description);
    //add group
    var oMembersGRP = currentWEB.get_siteGroups().add(membersGRP);

    if (assignDefinition) {
        //Get Role Definition by name (http://msdn.microsoft.com/en-us/library/jj246687.aspx)
        //return SP.RoleDefinition object
        var rdContribute = currentWEB.get_roleDefinitions().getByType(roleDefinition);

        // Create a new RoleDefinitionBindingCollection.
        var collContribute = SP.RoleDefinitionBindingCollection.newObject(currentCTX);

        // Add the role to the collection.
        collContribute.add(rdContribute);

        // Get the RoleAssignmentCollection for the target web.
        var assignments = currentWEB.get_roleAssignments();

        // assign the group to the new RoleDefinitionBindingCollection.
        var roleAssignmentContribute = assignments.add(oMembersGRP, collContribute);
    }
    oMembersGRP.set_allowMembersEditMembership(allowMemberEdit);
    oMembersGRP.set_onlyAllowMembersViewMembership(everyoneView);
    oMembersGRP.update();
    currentCTX.load(oMembersGRP);
    //Execute Query
    currentCTX.executeQueryAsync(function () {
        setTimeout(function () {
            callbackFunction();
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}
//-----------reterieve all users in a group 2013+ ----------
/**
 * The retrieveAllUsersInGroup function gets all users in a sharepoint group
 * @param {String} group the group which users will be retrieved from
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful,an array of object with properties title,id,email,login. 
 * the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * the argument userArray in the callback contains the following properties:  title,id,email,login
 * speedCtx.retrieveAllUsersInGroup("HR Admin",function(userArray){
 *      //here we are just getting the jobtitle and department of the retrieved user
 *      for(var x = 0; x <= (userArray.length - 1); x++){
 *          var username = userArray[x].title;
 *      }
 * });
 */
Speed.prototype.retrieveAllUsersInGroup = function (group, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var users = [];
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    window.speedGlobal.push(oGroup.get_users());
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        var userEnumerator = window.speedGlobal[total].getEnumerator();
        while (userEnumerator.moveNext()) {
            var prop = {};
            var oUser = userEnumerator.get_current();
            prop.title = oUser.get_title();
            prop.id = oUser.get_id();
            prop.email = oUser.get_email();
            prop.login = oUser.get_loginName();
            users.push(prop);
        }
        callback(users);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The retrieveAllUsersInSite function gets all users in a the sharepoint site collection
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful,an array of object with properties title,id,email,login. 
 * the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.retrieveAllUsersInSite = function (callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collUsers = clientContext.get_web().get_siteUsers();
    window.speedGlobal.push(collUsers);
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        var users = [];
        var userEnumerator = window.speedGlobal[total].getEnumerator();
        while (userEnumerator.moveNext()) {
            var prop = {};
            var oUser = userEnumerator.get_current();
            prop.title = oUser.get_title();
            prop.id = oUser.get_id();
            prop.email = oUser.get_email();
            prop.login = oUser.get_loginName();
            users.push(prop);
        }

        callback(users);
    }, Function.createDelegate(this, onFailedCall));
}


/**
 * The SPGroupDetails function gets information about a sharepoint group
 * @param {String} group the group to obtain details from
 * @param {callback(enumerator)} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.SPGroupDetails = function (group, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    window.speedGlobal.push(oGroup);
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(window.speedGlobal[total]);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

//-----------reterieve all users in a group 2013----------
/**
 * The allUsersInGroup function gets all users in a sharepoint group
 * @param {String} group the group which users will be retrieved from
 * @param {callback(enumerator)} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.allUsersInGroup = function (group, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    window.speedGlobal.push(oGroup.get_users());
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(window.speedGlobal[total]);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The allUsersInGroup2010 function gets all users in a sharepoint group. this function works for sharepoint 2010 but its not an optimized option.
 * @param {String} group the group which users will be retrieved from
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} an array of enumeration of the userCollection object.
 */
Speed.prototype.allUsersInGroup2010 = function (groupName, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var users = [];
    var context = this.initiate();
    var currentWeb = context.get_web();
    var allGroups = currentWeb.get_siteGroups();
    context.load(allGroups);
    context.executeQueryAsync(
        function () {
            var count = allGroups.get_count();
            for (var i = 0; i <= (parseInt(count) - 1); i++) {
                var grp = allGroups.getItemAtIndex(i);
                //provide your group name
                if (grp.get_loginName() == groupName) {
                    window.speedGlobal.push(grp.get_users());
                    var total = window.speedGlobal.length;
                    total--;
                    //load users of the group
                    context.load(window.speedGlobal[total]);
                    context.executeQueryAsync(function () {
                        callback(window.speedGlobal[total]);
                    }, Function.createDelegate(this, onFailedCall));
                }
            }
        }, Function.createDelegate(this, onFailedCall));
}

/**
 * The retrieveMultipleGroupUsers function gets all users in different sharepoint group.
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful
 * an array of object with properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.retrieveMultipleGroupUsers = function (groupCollection, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var users = [];
    var globalContextCount = [];
    if (typeof groupCollection !== 'undefined') {
        var groupFound = 0;
        var groupsAvail = false;
        var groupNames = (typeof groupCollection === "string") ? groupCollection.split(";") : groupCollection;
        for (var i = 0; i <= (groupNames.length - 1); i++) {
            groupsAvail = true;
            var clientContext = this.initiate();
            var collGroup = clientContext.get_web().get_siteGroups();
            var oGroup = collGroup.getByName(groupNames[i]);
            window.speedGlobal.push(oGroup.get_users());
            var total = window.speedGlobal.length;
            total--;
            globalContextCount.push(total);
            clientContext.load(window.speedGlobal[total]);
            clientContext.executeQueryAsync(function () {
                setTimeout(function () {
                    var totalToUse = globalContextCount[groupFound];
                    groupFound++;
                    var userEnumerator = window.speedGlobal[totalToUse].getEnumerator();
                    while (userEnumerator.moveNext()) {
                        var prop = {};
                        var oUser = userEnumerator.get_current();
                        prop.title = oUser.get_title();
                        prop.id = oUser.get_id();
                        prop.email = oUser.get_email();
                        prop.login = oUser.get_loginName();
                        var userExist = false
                        for (var y = 0; y <= (users.length - 1); y++) {
                            if (users[y].logon == prop.logon) {
                                userExist = true;
                                break;
                            }
                        }
                        if (!userExist) {
                            users.push(prop);
                        }
                    }
                    if (groupFound == groupNames.length)
                        callback(users);
                }, 1500);
            }, Function.createDelegate(this, onFailedCall));
        }
        //callback called if no group was foud
        if (groupFound == 0 && !groupsAvail) {
            callback(users);
        }
    } else {
        throw "group collection is undefined";
    }
}

/**
 * The isUserMemberOfGroup function checks if a user belongs to a set of groups (";") seperated. it also returns all users in different sharepoint group. 
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {object} userDetails this object contains properties that will be used for check only one of the following properties are needed
 * (id,email,login ) for the check while the returnCollection property (type bool) indicates if the users should be returned as the second argument, if false an empty object is returned
 * @param {callback(boolean,Object)} callback this parameter is the call back function when the function is successful.The following arguments are returned
 * Boolean value ,true means user belongs to the group collection, false means user doesnt belong to the group collection 
 * an object contains array of users in each group in the group collection, the Array contains properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * isUser is a boolean
 * the argument userArray in the callback contains the following properties:  title,id,email,login
 * speedCtx.isUserMemberOfGroup("HR Admin;Legal",{id : 24 , returnCollection : true},function(isUser,userArray){
 *      for(var x = 0; x <= (userArray["HR Admin].length - 1); x++){
 *          var username = userArray["HR Admin][x].title;
 *      }
 * });
 */
Speed.prototype.isUserMemberOfGroup = function (groupCollection, userDetails, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var returnUsers = (typeof userDetails.returnCollection === "undefined") ? true : userDetails.returnCollection;
    var emailCollection = (typeof userDetails.groupEmails === "undefined") ? false : userDetails.groupEmails;
    var boolVal = false;
    var globalContextCount = [];
    var usersArray = {};
    if (typeof groupCollection !== 'undefined') {
        var groupFound = 0;
        var groupsAvail = false;
        var groupNames = (typeof groupCollection === "string") ? groupCollection.split(";") : groupCollection;
        var clientContext = this.initiate();
        var collGroup = clientContext.get_web().get_siteGroups();
        for (var i = 0; i <= (groupNames.length - 1); i++) {
            if (boolVal) {
                break;
            }
            usersArray[groupNames[i]] = {};
            usersArray[groupNames[i]].belongs = false;
            usersArray[groupNames[i]].users = [];
            usersArray[groupNames[i]].emails = [];
            groupsAvail = true;
            var oGroup = collGroup.getByName(groupNames[i]);
            window.speedGlobal.push(oGroup.get_users());
            var total = window.speedGlobal.length;
            total--;
            globalContextCount.push(total);
            clientContext.load(window.speedGlobal[total]);
            clientContext.executeQueryAsync(function () {
                //========================
                var intervalCount = 0
                window.speedGlobal.push(intervalCount);
                var total = window.speedGlobal.length;
                total--;
                var intervalRef = setInterval(function () {
                    try {
                        var totalToUse = globalContextCount[groupFound];

                        var userEnumerator = window.speedGlobal[totalToUse].getEnumerator();
                        while (userEnumerator.moveNext()) {
                            var prop = {};
                            var oUser = userEnumerator.get_current();
                            prop.title = oUser.get_title();
                            prop.id = oUser.get_id();
                            prop.email = oUser.get_email();
                            prop.login = oUser.get_loginName();
                            if (typeof userDetails.login !== "undefined") {
                                if (prop.login === userDetails.login) {
                                    boolVal = true;
                                    usersArray[groupNames[groupFound]].belongs = true;
                                    if (!returnUsers)
                                        break;
                                }
                            } else if (typeof userDetails.id !== "undefined") {
                                if (prop.id === userDetails.id) {
                                    boolVal = true;
                                    usersArray[groupNames[groupFound]].belongs = true;
                                    if (!returnUsers)
                                        break;
                                }
                            } else if (typeof userDetails.email !== "undefined") {
                                if (prop.email === userDetails.email) {
                                    boolVal = true;
                                    usersArray[groupNames[groupFound]].belongs = true;
                                    if (!returnUsers)
                                        break;
                                }
                            }

                            if (returnUsers) {
                                usersArray[groupNames[groupFound]].users.push(prop);
                                if (emailCollection) {
                                    if (prop.email !== "" && $.inArray(prop.email, usersArray[groupNames[groupFound]].emails) < 0)
                                        usersArray[groupNames[groupFound]].emails.push(prop.email);
                                }
                            } else {
                                usersArray = {};
                            }
                        }
                        groupFound++;
                        clearInterval(intervalRef);
                        if (groupFound == groupNames.length || (boolVal && !returnUsers))
                            callback(boolVal, usersArray);
                    } catch (e) {
                        window.speedGlobal[total] = parseInt(window.speedGlobal[total]) + 1;
                        if (window.speedGlobal[total] == 10) {
                            clearInterval(intervalRef);
                            throw "User properties is not available check server resources";
                        }
                    }
                }, 1000);
            }, Function.createDelegate(this, onFailedCall));
        }
        //callback called if no group was foud
        if (groupFound == 0 && !groupsAvail) {
            callback(boolVal, usersArray);
        }
    } else {
        throw "group collection is undefined";
    }
}

/**
 * The isCurrentUserMemberOfGroup function checks if the current user belongs to a set of groups (";") seperated. 
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {callback(boolean)} callback this parameter is the call back function when the function is successful.
 * Boolean value ,true means user belongs to the group collection, false means user doesn't belong to the group collection 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.isCurrentUserMemberOfGroup = function (groupCollection, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    if (typeof groupCollection !== 'undefined') {
        var groupNames = (typeof groupCollection === "string") ? groupCollection.split(";") : groupCollection;
        var hashGroups = {};
        for (var i = 0; i <= (groupNames.length - 1); i++) {
            if (groupNames[i] !== "") {
                hashGroups[groupNames[i]] = i;
            }
        }

        var clientContext = this.initiate();
        var currentUser = clientContext.get_web().get_currentUser();
        clientContext.load(currentUser);

        var userGroups = currentUser.get_groups();
        clientContext.load(userGroups);
        clientContext.executeQueryAsync(function () {
            var isMember = false;
            var groupName = "";
            var groupsEnumerator = userGroups.getEnumerator();
            while (groupsEnumerator.moveNext()) {
                var group = groupsEnumerator.get_current();
                groupName = group.get_title();
                var hasValue = hashGroups[groupName];
                if (typeof hasValue !== "undefined") {
                    isMember = true;
                    break;
                }
            }

            if (!isMember) {
                groupName = groupCollection;
            }
            callback(isMember, groupName);
        }, onFailedCall);
    } else {
        throw "group collection is undefined";
    }
}

/**
 * The matchNameWithUserGroup function confirms if a user belong to a group by returning the Name of the Group in an array. 
 * @param {Array} groupCollection the groups which users will be retrieved from.
 * @param {boolean} allCollection only match one group.
 * @param {callback(array)} callback this parameter is the call back function when the function is successful.
 * Boolean value ,true means user belongs to the group collection, false means user doesn't belong to the group collection 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.matchNameWithUserGroup = function (groupCollection, allCollection, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    if (typeof groupCollection !== 'undefined') {
        var returnGroups = [];
        var clientContext = this.initiate();
        var currentUser = clientContext.get_web().get_currentUser();
        clientContext.load(currentUser);

        var userGroups = currentUser.get_groups();
        clientContext.load(userGroups);
        clientContext.executeQueryAsync(function () {
            var groupsEnumerator = userGroups.getEnumerator();
            while (groupsEnumerator.moveNext()) {
                var group = groupsEnumerator.get_current();
                var groupName = group.get_title();
                for (var i = 0; i < groupCollection.length; i++) {
                    if (groupCollection[i].toLowerCase() === groupName.toLowerCase()) {
                        returnGroups.push(groupCollection[i]);
                        break;
                    }
                }
                if (!allCollection && returnGroups.length === 1) {
                    break;
                }
            }
            callback(returnGroups);
        }, onFailedCall);
    } else {
        throw "group collection is undefined";
    }
}

/* ============================== Document Library Section ============================*/
/**
 * The convertDataURIToBinary function converts DataURI to Base64 byte
 * @param {string} dataURI this parameter provides datauri string
 * @returns {Array} returns an array of type base 64
 */
Speed.prototype.convertDataURIToBinary = function (dataURI) {
    var BASE64_MARKER = ';base64,';
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

/**
 * The convertArrayBufferToBinary function converts Uint8Array to byte string
 * @param {string} data this parameter provides datauri string
 * @returns {string} the byte string used for chunk uploading
 */
Speed.prototype.convertArrayBufferToBinary = function (data) {
    var fileData = '';
    var byteArray = new Uint8Array(data);
    for (var i = 0; i < byteArray.byteLength; i++) {
        fileData += String.fromCharCode(byteArray[i]);
    }
    return fileData;
}

/**
 * The getItem function retrieve rows for a specified list in the context used
 * @param {String} listName this parameter specifices the list which the rows are to be retrieved
 * @param {String} albumLink this parameter specifices the folder url in the context where the documents are to be obtained 
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {callback(enumerator)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved, SP.Item object is returned as
 * an argument to the callback function
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getDocumentsInFolder = function (listName, albumLink, caml, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var camlQuery = SP.CamlQuery.createAllItemsQuery();
    camlQuery.set_folderServerRelativeUrl(albumLink);
    var query = (typeof caml === '' || caml == null) ? camlQuery : caml;
    var context = this.initiate();
    var oList = context.get_web().get_lists().getByTitle(listName);

    window.speedGlobal.push(oList.getItems(query));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(window.speedGlobal[total], 'Include(Title, ContentType, File)');
    //window.speedGlobal[total].ListName = listName;
    context.executeQueryAsync(function () {
        setTimeout(function () {
            var items = [];
            var ListEnumerator = window.speedGlobal[total].getEnumerator();
            while (ListEnumerator.moveNext()) {
                var documents = {};
                var currentItem = ListEnumerator.get_current();
                var _contentType = currentItem.get_contentType();
                if (_contentType.get_name() != 'Folder') {
                    var File = currentItem.get_file();
                    if (File != null) {
                        documents.title = currentItem.get_item('Title');
                        documents.url = File.get_serverRelativeUrl();
                    }
                }
                items.push(documents);
            }
            onSuccess(items);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

//------------------create a folder in document Libary---------
/**
 * The createFolder function creates a folder in a document library
 * @param {String} foldername the name of the folder that should be created
 * @param {String} library the title of the library which the folder will be created
 * @param {callback(folderCollection)} onSuccess this parameter is the call back function when the function is successful, a SP.FolderCollection object is returned
 * as an argument.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createFolder = function (foldername, library, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var docLib = context.get_web().get_lists().getByTitle(library);
    var itemCreateInfo = new SP.ListItemCreationInformation();
    itemCreateInfo.set_underlyingObjectType(SP.FileSystemObjectType.folder);
    itemCreateInfo.set_leafName(foldername);
    window.speedGlobal.push(docLib.addItem(itemCreateInfo));
    var total = window.speedGlobal.length;
    total--;
    window.speedGlobal[total].update();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(window.speedGlobal[total]);
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
        }, 1000)
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The createSubFolder function creates a folder and subfolders in a document library
 * @param {Array} foldernames an array of folder names. the order determines the order of the creation of subfolders
 * @param {String} library the title of the library which the folder will be created
 * @param {callback(number)} feedBack this parameter is the call back function to determine the upload rate based on percentage
 * @param {callback(folderCollection)} onSuccess this parameter is the call back function when the function is successful, a SP.FolderCollection object is returned
 * as an argument.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createSubFolder = function (foldernames, library, metadata, feedBack, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var docLib = context.get_web().get_lists().getByTitle(library);
    var rootFolder = docLib.get_rootFolder();
    var folderUrl = speedContext.initiate().get_url();
    folderUrl += "/" + library;
    checkFolderExists(rootFolder, folderUrl, foldernames, 0, metadata)

    function checkFolderExists(folderContext, urloffolder, folderNames, count, metadata) {
        speedContext.getFileFolderExists(urloffolder, 'folder', function () {
            urloffolder += "/" + folderNames[count];

            window.speedGlobal.push(folderContext.get_folders().add(folderNames[count]));
            var total = window.speedGlobal.length;
            total--;
            if (typeof appContext !== 'undefined') {
                context = appContext.initiate();
            }
            context.load(window.speedGlobal[total]);
            context.executeQueryAsync(function () {
                var folder = folderNames[count];
                if (typeof metadata[folder] !== "undefined") {
                    var itemCollection = window.speedGlobal[total].get_listItemAllFields();
                    for (var propName in metadata[folder]) {
                        if (propName.toLowerCase() != "id") {
                            itemCollection.set_item(propName, metadata[folder][propName]);
                        }
                    }
                    itemCollection.update();
                    context.load(itemCollection);
                    context.executeQueryAsync(function () {
                        setTimeout(function () {
                            if (count < (folderNames.length - 1)) {
                                var totalFolder = folderNames.length;
                                var newNumber = parseInt(count) + 1;
                                var completed = (newNumber / totalFolder) * 100;
                                feedBack(parseInt(completed));
                                count++;
                                checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata);
                            } else {
                                feedBack(100);
                                onSuccess(urloffolder);
                            }
                        }, 1000);
                    }, Function.createDelegate(this, onFailedCall));
                } else {
                    setTimeout(function () {
                        if (count < (folderNames.length - 1)) {
                            var totalFolder = folderNames.length;
                            var newNumber = parseInt(count) + 1;
                            var completed = (newNumber / totalFolder) * 100;
                            feedBack(parseInt(completed));
                            count++;
                            checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata);
                        } else {
                            feedBack(100);
                            onSuccess(urloffolder);
                        }
                    }, 1000);
                }
            }, Function.createDelegate(this, onFailedCall));
        }, function (sender, args) {
            urloffolder += "/" + folderNames[count];
            if (count < (folderNames.length - 1)) {
                var totalFolder = folderNames.length;
                var newNumber = parseInt(count) + 1;
                var completed = (newNumber / totalFolder) * 100;
                feedBack(parseInt(completed));
                count++;
                checkFolderExists(folderContext, urloffolder, folderNames, count, metadata);
            } else {
                feedBack(100);
                onSuccess(urloffolder);
            }
        });
    }
}

/**
 * The deleteFolderOrFile function deletes folder from Libary
 * @param {String} folderDocUrl the url of the folder or file that needs to be deleted
 * @param {callback} onSuccess this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.deleteFolderOrFile = function (folderDocUrl, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var context = this.initiate();
    var oWebsite = context.get_web();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(oWebsite);
    context.executeQueryAsync(function () {
        window.speedGlobal.push(oWebsite.getFolderByServerRelativeUrl(folderDocUrl));
        var total = window.speedGlobal.length;
        total--;
        window.speedGlobal[total].deleteObject();
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, 1000)
        }, Function.createDelegate(this, onFailedCall));
    }, Function.createDelegate(this, onFailedCall));
}
//------------------------upload file to documnet library---------------------
/**
 * The uploadFile function upload a file to a folder in a Libary or directly to a library itself
 * @param {String} nameOfFile the name of the file to be uploaded
 * @param {String} dataOfFile the dataURI of the file
 * @param {String} folder the folder where the file will be uploaded
 * @param {callback(SP.File)} onSuccess this parameter is the call back function when the upload is successful. The SP.File object is returned as an argument
 * when the upload is successful.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.uploadFile = function (nameOfFile, dataOfFile, folder, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var ctx2 = this.initiate();
    var fileNameSplit = nameOfFile.split(".");
    var filetype = fileNameSplit.pop();

    if (dataOfFile !== null) {
        if (filetype.toLowerCase() != "txt")
            var data = this.convertDataURIToBinary(dataOfFile);
        else
            var data = dataOfFile;
    }

    var attachmentFolder = ctx2.get_web().getFolderByServerRelativeUrl(folder);
    var fileCreateInfo = new SP.FileCreationInformation();
    fileCreateInfo.set_url(nameOfFile);
    fileCreateInfo.set_overwrite(true);
    fileCreateInfo.set_content(new SP.Base64EncodedByteArray());

    if (dataOfFile !== null) {
        for (var i = 0; i < data.length; ++i) {
            if (filetype.toLowerCase() != "txt")
                fileCreateInfo.get_content().append(data[i]);
            else
                fileCreateInfo.get_content().append(data.charCodeAt(i));
        }
    }

    window.speedGlobal.push(attachmentFolder.get_files().add(fileCreateInfo));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        ctx2 = appContext.initiate();
    }
    ctx2.load(window.speedGlobal[total]);
    ctx2.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
        }, 1000)
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The uploadLargeFile function upload a larger file (> 1.8mb) to a folder in a Libary or directly to a library itself.This is basically used to overcome the restrictions 
 * of file upload on o365 server.
 * @param {String} fileName the name of the file to be uploaded
 * @param {String} folderUrl the folder where the file will be uploaded
 * @param {Speed.filesDictionary} uploadedFile the file data and its properties. 
 * @param {callback(SP.File)} onSuccess this parameter is the call back function when the upload is successful. The SP.File object is returned as an argument
 * when the upload is successful.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.uploadLargeFile = function (fileName, folderUrl, uploadedFile, onSuccess, onFailed, webAbsoluteUrl, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //upload dummy file
    this.uploadFile(fileName, "", folderUrl, function (filedetails) {
        speedContext.prepareChunkFile(uploadedFile, filedetails, 0, onSuccess, onFailedCall, webAbsoluteUrl);
    }, onFailedCall, appContext);
}

//=========================upload multiple files ===============================
/**
 * The uploadMultipleFiles function upload files to a folder in a Libary or directly to a library itself
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {String} folderUrl the folder url where the files will be uploaded to
 * @param {String} fileCount the index of the file object to start in the array
 * @param {callback(percentCompleted,SP.File)} feedBack the feedback function is called after each file has been uploaded successfully. It returns to arguments, the 
 * first argument show the percentage of files that have been uploaded successfully, while the second argument contains the SP.FIle object of the currently uploaded file.
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.uploadMultipleFiles = function (fileArr, folderUrl, fileCount, feedBack, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var speedContext = this;
    speedContext.uploadFile(fileArr[fileCount].dataName, fileArr[fileCount].dataURI, folderUrl, function (fileDetails) {
        var totalFiles = fileArr.length;
        var newNumber = parseInt(fileCount) + 1;
        var completed = (newNumber / totalFiles) * 100;
        feedBack(parseInt(completed), fileDetails);
        if (completed == 100) {
            onSuccess();
        } else {
            speedContext.uploadMultipleFiles(fileArr, folderUrl, newNumber, feedBack, onSuccess, onFailed, appContext);
        }
    }, onFailedCall, appContext);
}

/**
 * The uploadMultipleLargeFile function uploads large files to a folder in a Libary or directly to a library itself. The Method is optimized as it uses the 
 * uploadLargeFile method only if the file is greater than 1.8MB
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {String} folderUrl the folder url where the files will be uploaded to
 * @param {String} fileCount the index of the file object to start in the array
 * @param {callback(percentCompleted,SP.File)} feedBack the feedback function is called after each file has been uploaded successfully. It returns to arguments, the 
 * first argument show the percentage of files that have been uploaded successfully, while the second argument contains the SP.FIle object of the currently uploaded file.
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.uploadMultipleLargeFile = function (fileArr, folderUrl, fileCount, feedBack, onSuccess, onFailed, webAbsoluteUrl, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var speedContext = this;
    if (fileArr[fileCount].dataType.toLowerCase() === "arraybuffer") {
        speedContext.uploadLargeFile(fileArr[fileCount].dataName, folderUrl, fileArr[fileCount], function (fileDetails) {
            var totalFiles = fileArr.length;
            var newNumber = parseInt(fileCount) + 1;
            var completed = (newNumber / totalFiles) * 100;
            feedBack(parseInt(completed), fileDetails);
            if (completed == 100) {
                onSuccess();
            } else {
                speedContext.uploadMultipleLargeFile(fileArr, folderUrl, newNumber, feedBack, onSuccess, onFailed, webAbsoluteUrl, appContext);
            }
        }, onFailedCall, webAbsoluteUrl);
    } else {
        speedContext.uploadFile(fileArr[fileCount].dataName, fileArr[fileCount].dataURI, folderUrl, function (fileDetails) {
            var totalFiles = fileArr.length;
            var newNumber = parseInt(fileCount) + 1;
            var completed = (newNumber / totalFiles) * 100;
            feedBack(parseInt(completed), fileDetails);
            if (completed == 100) {
                onSuccess();
            } else {
                speedContext.uploadMultipleLargeFile(fileArr, folderUrl, newNumber, feedBack, onSuccess, onFailed, webAbsoluteUrl, appContext);
            }
        }, onFailedCall, appContext);
    }
}

/**
 * The uploadFileChunk function uploads part of a large file to a folder in a Libary or directly to a library itself.
 * @param {String} id the GUID of the upload session
 * @param {String} fileUrl the file url on sharepoint
 * @param {object} chunk settings for the upload method to be called
 * @param {Bytes} data parts of the data to be uploaded on the current session 
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.uploadFileChunk = function (id, fileUrl, chunk, data, onSuccess, onFailed, webAbsoluteUrl) {
    var siteContextToUse = (typeof webAbsoluteUrl === "undefined" || webAbsoluteUrl == null) ? _spPageContextInfo.webAbsoluteUrl : webAbsoluteUrl
    var offset = chunk.offset === 0 ? '' : ',fileOffset=' + chunk.offset;
    //parameterising the components of this endpoint avoids the max url length problem in SP (Querystring parameters are not included in this length)  
    var endpoint = siteContextToUse + "/_api/web/getfilebyserverrelativeurl('" + fileUrl + "')/" + chunk.method + "(uploadId=guid'" + id + "'" + offset + ")";

    var headers = {
        "Accept": "application/json; odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val()
    };

    $.ajax({
        url: endpoint,
        async: true,
        method: "POST",
        headers: headers,
        data: data,
        binaryStringRequestBody: true,
        processData: false,
        success: function () {
            onSuccess();
        },
        error: function (responseText) {
            onFailed(responseText);
        }
    });
}

/**
 * The uploadFileChunk function uploads part of a large file to a folder in a Libary or directly to a library itself.
 * @param {Speed.filesDictionary} fileProperties the details of the file in the file dictionary object
 * @param {SP.File} filedetails the uploaded file properties
 * @param {String} index the file position in the file dictionary array 
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.prepareChunkFile = function (fileProperties, filedetails, index, onSuccess, onFailed, webAbsoluteUrl) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var arrayBuffer = fileProperties.chunks[index].method === 'finishupload' ? fileProperties.dataURI.slice(fileProperties.chunks[index].offset) :
        fileProperties.dataURI.slice(fileProperties.chunks[index].offset, fileProperties.chunks[index].offset + fileProperties.chunks[index].length);

    var chunkData = arrayBuffer;

    var fileUrl = filedetails.get_serverRelativeUrl();
    speedContext.uploadFileChunk(fileProperties.GUID, fileUrl, fileProperties.chunks[index], chunkData, function () {
        index += 1;
        if (index < fileProperties.chunks.length)
            speedContext.prepareChunkFile(fileProperties, filedetails, index, onSuccess, onFailed, webAbsoluteUrl);
        else {
            onSuccess(filedetails);
        }
    }, onFailedCall, webAbsoluteUrl);
}


/**
 * Grab All Attcahments
 */
Speed.prototype.grabAllAttachments = function () {
    var returnArray = [];
    var files = this.filesDictionary;
    for (var x in files) {
        for (var y = 0; y < files[x].length; y++) {
            if (typeof files[x][y] === 'object') {
                returnArray.push(files[x][y]);
            }
        }
    }
    return returnArray;
}

/**
 * The uploadFile function upload a file to a folder in a Libary or directly to a library itself
 * @param {String} sourceUrl the url of the source library where the files to be moved resides
 * @param {String} destinationUrl the url of the destination library where the files will be moved to
 * @param {callback} onSuccess this parameter is the call back function when the upload is successful. The SP.File object is returned as an argument
 * when the upload is successful.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.moveFilesToFolder = function (sourceUrl, destinationUrl, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var web = context.get_web();

    window.speedGlobal.push(web.getFolderByServerRelativeUrl(sourceUrl));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(window.speedGlobal[total], 'Files');
    context.executeQueryAsync(function () {
        var files = window.speedGlobal[total].get_files();
        var e = files.getEnumerator();
        while (e.moveNext()) {
            var file = e.get_current();
            var destLibUrl = destinationUrl + "/" + file.get_name();
            file.moveTo(destLibUrl, SP.MoveOperations.overwrite);
        }
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, 1000)
        }, Function.createDelegate(this, onFailedCall));
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The addAttachmentToItem function uploads a files to the attachment folder of a list item
 * @param {String} itemID the ID of the Item the file will be uploaded to
 * @param {String} listName the name of the list the item belongs to
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {callback(percentCompleted,SP.File)} feedBack the feedback function is called after each file has been uploaded successfully. It returns to arguments, the 
 * first argument show the percentage of files that have been uploaded successfully, while the second argument contains the SP.FIle object of the currently uploaded file.
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * 
 * speedCtx.addAttachmentToItem("1","Documents",[{dataName: "testdoc.doc", dataURI: 'data64string' ],function(uploadStatus,fileDetails){
 *      console.log(uploadStatus + "%");
 * },function(){
 *      console.log("All files uploaded successfully");
 * });
 */
Speed.prototype.addAttachmentToItem = function (itemID, listName, fileArr, feedback, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var web = context.get_web();
    var list = web.get_lists().getByTitle(listName);
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(list, 'RootFolder');
    var item = list.getItemById(itemID);
    context.load(item);
    context.executeQueryAsync(function () {
        if (!item.get_fieldValues()['Attachments']) {
            var attachmentRootFolderUrl = String.format('{0}/Attachments', list.get_rootFolder().get_serverRelativeUrl());
            var attachmentsRootFolder = context.get_web().getFolderByServerRelativeUrl(attachmentRootFolderUrl);
            //var attachmentsFolder = attachmentsRootFolder.get_folders().add(itemID);
            var attachmentsFolder = attachmentsRootFolder.get_folders().add('_' + itemID);
            attachmentsFolder.moveTo(attachmentRootFolderUrl + '/' + itemID);
        } else {
            //
            var attachmentRootFolderUrl = String.format('{0}/Attachments/{1}', list.get_rootFolder().get_serverRelativeUrl(), itemID);
            var attachmentsFolder = context.get_web().getFolderByServerRelativeUrl(attachmentRootFolderUrl);
        }
        context.load(attachmentsFolder);
        context.executeQueryAsync(function () {
            var folderUrl = attachmentsFolder.get_serverRelativeUrl();
            var fileCount = 0;
            speedContext.uploadMultipleFiles(fileArr, folderUrl, fileCount, feedback, onSuccess, onFailed, appContext);
        }, Function.createDelegate(this, onFailedCall));
    }, Function.createDelegate(this, onFailedCall));
};

//=============================read data from text file ========================
/**
 * The readFile function reads content of a file
 * @param {String} fileurl the url of the file you want to read the contents
 * @param {callback(data)} onSuccess this parameter is the call back function when the file is successfully read, the data of the file is returned as an argument
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.readFile = function (fileurl, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var ctx = this.initiate();
    var oWebsite = ctx.get_web();
    if (typeof appContext !== 'undefined') {
        ctx = appContext.initiate();
    }
    ctx.load(oWebsite);
    ctx.executeQueryAsync(function () {
        var fileUrl = fileurl;
        try {
            $.ajax({
                url: fileUrl,
                type: "GET"
            }).done(onSuccess).fail(onFailedCall);
        } catch (e) {
            $.ajax({
                url: fileUrl,
                type: "GET"
            }).done(onSuccess).error(onFailedCall);
        }
    }, onFailedCall);
}

/**
 * The readFile function reads content of a file
 * @param {String} elementId the id of the element to apply the event handler on
 * @param {String} properties the settings for the file to be uploaded
 * @param {callback(data)} onSuccess this parameter is the call back function when the a file is selected
 * @param {callback(error)} onFailed this parameter is the call back function thats called when the function fails
 */
Speed.prototype.applyAttachmentEvent = function (properties, onSuccess, onFailed) {
    var speedContext = this;

    var attachments = this.getAttachmentControls();
    for (var z = 0; z < attachments.length; z++) {
        var elementId = attachments[z].id;
        var tagName = attachments[z].type;

        if (tagName === "file" && $.inArray(elementId, speedContext.appliedEvents.attachments) < 0) {
            speedContext.appliedEvents.attachments.push(elementId);
            document.getElementById(elementId).addEventListener('change', function (evt) {
                var elementId = this.id;
                var fileCount = 0;
                var maxFileSize = (typeof properties.maxSize !== "undefined") ? properties.maxSize : 5100;
                var acceptedFiles = ["png", "jpeg", "jpg", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv"];
                var overrideDefaultFiles = (typeof properties.overrideDefaultFiles === "undefined") ? false : properties.overrideDefaultFiles;
                if (overrideDefaultFiles) {
                    var elementBindProperty = (document.getElementById(elementId).getAttribute("speed-file-bind") === null) ?
                        document.getElementById(elementId).getAttribute("speed-file-validate") : document.getElementById(elementId).getAttribute("speed-file-bind");

                    acceptedFiles = properties.fileExtensions;
                    if (typeof properties.fileExtensions !== "undefined") {
                        if (typeof properties.fileExtensions[elementBindProperty] !== "undefined" && typeof properties.fileExtensions[elementBindProperty] !== null) {
                            acceptedFiles = properties.fileExtensions[elementBindProperty];
                        }
                    }
                } else {
                    var extensions = properties.fileExtensions;
                    var elementBindProperty = (document.getElementById(elementId).getAttribute("speed-file-bind") === null) ?
                        document.getElementById(elementId).getAttribute("speed-file-validate") : document.getElementById(elementId).getAttribute("speed-file-bind");
                    if (typeof properties.fileExtensions !== "undefined") {
                        if (typeof properties.fileExtensions[elementBindProperty] !== "undefined" && typeof properties.fileExtensions[elementBindProperty] !== null) {
                            extensions = properties.fileExtensions[elementBindProperty];
                        }
                    }
                    acceptedFiles = (typeof properties.fileExtensions === "undefined") ? acceptedFiles : (acceptedFiles.concat(extensions));
                }

                //element file type
                try {
                    acceptedFiles = (document.getElementById(elementId).getAttribute("speed-file-type") === null) ?
                        acceptedFiles : document.getElementById(elementId).getAttribute("speed-file-type").split(",");
                } catch (e) {

                }

                var useDynamicName = (typeof properties.dynamicNaming === "undefined") ? true : properties.dynamicNaming;

                var appendFiles = (typeof properties.appendFiles === "undefined") ? false : properties.appendFiles;

                var useCancelToClear = (typeof properties.cancelClear === "undefined") ? true : properties.cancelClear;

                var useFileName = (typeof properties.fileNameasName === "undefined") ? false : properties.fileNameasName;

                var eachFileProperties = (typeof properties.fileProperties !== "undefined") ? properties.fileProperties : {};

                properties.o365 = (typeof properties.o365 !== "undefined") ? properties.o365 : false;
                //when event is clicked 
                if (window.File && window.FileReader && window.FileList && window.Blob) {
                    // Great success! All the File APIs are supported.

                    var files = evt.target.files; // FileList object
                    var filesId = evt.target.id;
                    var totalFilesPerClick = files.length;

                    //remove speederror class
                    $("#" + filesId).removeClass("speedhtmlerr");
                    // Loop through the FileList 
                    for (var i = 0, f; f = files[i]; i++) {
                        var reader = new FileReader();
                        reader.onload = (function (theFile) {
                            return function (e) {
                                // Render thumbnail.
                                var fileSize = theFile.size / 1000;
                                var fileType = theFile.type;
                                var fileNameSplit = theFile.name.split(".");
                                var fileExt = fileNameSplit.pop();
                                if ($.inArray(fileExt.toLowerCase(), acceptedFiles) >= 0) {
                                    if (fileSize < maxFileSize) {
                                        fileCount++;

                                        var elementBindProperty = (document.getElementById(filesId).getAttribute("speed-file-bind") === null) ?
                                            document.getElementById(filesId).getAttribute("speed-file-validate") : document.getElementById(filesId).getAttribute("speed-file-bind");

                                        var defaultName = (typeof properties.dataNameDefault === "undefined") ? elementBindProperty : properties.dataNameDefault;
                                        defaultName = (typeof eachFileProperties[elementBindProperty] === "undefined") ? defaultName : eachFileProperties[elementBindProperty].name;

                                        if (appendFiles && typeof speedContext.filesDictionary[elementBindProperty] !== "undefined") {
                                            fileCount = speedContext.filesDictionary[elementBindProperty].length + 1;
                                        }

                                        var fileObject = {};
                                        fileObject.dataURI = e.target.result;
                                        fileObject.dataName = (!useDynamicName) ? (defaultName + "." + fileExt) :
                                            (defaultName + "-" + fileCount + "-" + speedContext.stringnifyDate({
                                                includeTime: true,
                                                timeSpace: false,
                                                format: "dd-mm-yy"
                                            }) + "." + fileExt);
                                        fileObject.filename = theFile.name;
                                        var fileNameIsValid = true;
                                        if (useFileName) {
                                            var validationResult = speedContext.validationProperties.file.validate(fileObject.filename, "File", filesId);
                                            if (!validationResult) {
                                                fileNameIsValid = false;
                                            } else {
                                                fileObject.dataName = fileObject.filename;
                                            }
                                        }

                                        fileObject.extension = fileExt.toLowerCase();
                                        fileObject.id = filesId;
                                        fileObject.property = elementBindProperty;
                                        fileObject.dataType = "string";
                                        if (typeof e.target.result !== "string") {
                                            var offset = 0;
                                            var total = theFile.size;
                                            var length = 1000000 > total ? total : 1000000;
                                            var chunks = [];

                                            while (offset < total) {
                                                if (offset + length > total)
                                                    length = total - offset;
                                                chunks.push({
                                                    offset: offset,
                                                    length: length,
                                                    method: speedContext.getChunkUploadMethod(offset, length, total)
                                                });
                                                offset += length;
                                            }
                                            if (chunks.length > 0) {
                                                fileObject.GUID = speedContext.uniqueIdGenerator();
                                                fileObject.dataType = "ArrayBuffer";
                                                fileObject.chunks = chunks;
                                            }
                                        }

                                        if (fileCount === 1 && !appendFiles) {
                                            speedContext.filesDictionary[elementBindProperty] = [];
                                        } else if (typeof speedContext.filesDictionary[elementBindProperty] === "undefined") {
                                            speedContext.filesDictionary[elementBindProperty] = [];
                                        }

                                        if (totalFilesPerClick === i && fileNameIsValid) {
                                            speedContext.filesDictionary[elementBindProperty].push(fileObject);
                                            onSuccess(elementBindProperty, speedContext.filesDictionary[elementBindProperty], filesId);
                                        }

                                        if (!fileNameIsValid) {
                                            var errorProp = {
                                                msg: "your item has an invalid file name",
                                                type: "invalidfile",
                                                elementid: filesId
                                            };
                                            onFailed(errorProp);
                                            speedContext.clearFileInput(filesId);
                                        }
                                    } else {
                                        var errorProp = {
                                            msg: "your item is greater than " + maxFileSize + " and will not be included",
                                            type: "size",
                                            elementid: filesId
                                        };
                                        onFailed(errorProp);
                                        speedContext.clearFileInput(filesId);
                                    }
                                } else {
                                    var errorProp = {
                                        msg: "One of your items file and will not be included because the format isnt accepted",
                                        type: "format",
                                        elementid: filesId
                                    };
                                    onFailed(errorProp);
                                    speedContext.clearFileInput(filesId);
                                }
                            };
                        })(f);
                        //if file size is greater than 1.8MB and on o365 Platform
                        if (files[i].size > 1487436.8 && properties.o365) {
                            reader.readAsArrayBuffer(f);
                        } else {
                            reader.readAsDataURL(f);
                        }
                    }

                    if (files.length === 0 && useCancelToClear) {
                        var elementBindProperty = (document.getElementById(filesId).getAttribute("speed-file-bind") === null) ?
                            document.getElementById(filesId).getAttribute("speed-file-validate") : document.getElementById(filesId).getAttribute("speed-file-bind");
                        speedContext.filesDictionary[elementBindProperty] = [];
                        onSuccess(elementBindProperty, speedContext.filesDictionary[elementBindProperty]);
                    }
                } else {
                    onFailed('The File APIs are not fully supported in this browser.');
                }
            }, false);
        }
    }

}


Speed.prototype.getChunkUploadMethod = function (offset, length, total) {
    if (offset + length + 1 > total) {
        return 'finishupload';
    } else if (offset === 0) {
        return 'startupload';
    } else if (offset < total) {
        return 'continueupload';
    }
    return null;
}

//------------------------check if file exist in documnet library---------------------
/**
 * The getFileExists function checks if a file exist on sharepoint
 * @param {String} fileurl the url of the file to check
 * @param {callback(state)} onSuccess this parameter is the call back function when the call was successful, a boolean value is returned as an argument.
 * true if the file exist and false if the file doesn't
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getFileFolderExists = function (fileFolderUrl, fileorfolder, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var ctx = this.initiate();
    if (fileorfolder.toLowerCase() === "file") {
        var file = ctx.get_web().getFileByServerRelativeUrl(fileFolderUrl);
    } else {
        var file = ctx.get_web().getFolderByServerRelativeUrl(fileFolderUrl);
    }

    if (typeof appContext !== 'undefined') {
        ctx = appContext.initiate();
    }
    ctx.load(file);
    ctx.executeQueryAsync(function () {
        onSuccess(true);
    }, onFailedCall);
}

/**
 * The logWriter function upload or updates a text file in a Libary, this is used for keeping logs
 * @param {string} fileName the name of the log file
 * @param {string} logContent the content of the log file
 * @param {string} library the library where the log file will be saved
 * @param {String} libraryUrl the library url where the files will be uploaded to 
 * @param {int} logLimit the log file size limit before another log is created
 * @param {callback} callback this parameter is the call back function when the logis successfully written to the document library
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.logWriter = function (logContent, library, logLimit, callback, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var query = [{
        orderby: "ID",
        rowlimit: 1,
        ascending: "FALSE"
    }];
    speedContext.getItem(library, speedContext.camlBuilder(query), function (speedlog) {
        var logsCount = 0;
        var listEnumerator = speedlog.getEnumerator();
        var itemDetails = {};
        while (listEnumerator.moveNext()) {
            logsCount++;
            itemDetails.name = listEnumerator.get_current().get_item('FileLeafRef');
            itemDetails.url = listEnumerator.get_current().get_item('FileRef');
            itemDetails.size = listEnumerator.get_current().get_item('File_x0020_Size');
        }
        var libraryUrl = speedlog.get_context().get_url();
        libraryUrl += "/" + library;
        if (logsCount == 0 || itemDetails.size > logLimit) {
            //this logs of file if no log text file is present or if the log is greater than limit passed
            var fileName = "SPeedPointErrorLogs-" + speedContext.stringnifyDate({
                includeTime: true,
                timeSpace: false,
                format: "dd-mm-yy"
            }) + ".txt";
            speedContext.uploadFile(fileName, logContent, libraryUrl, callback, onFailed, appContext);
        } else {
            speedContext.readFile(itemDetails.url, function (data) {
                data += logContent;
                speedContext.uploadFile(itemDetails.name, data, libraryUrl, callback, onFailed, appContext);
            }, function (err) {
                setTimeout(function () {
                    onFailedCall(err);
                }, 1000);
            })
        }
    }, Function.createDelegate(this, onFailedCall));
}

/* ============================== Debugging Section  ============================*/
/**
 * The onQueryFailed function is the async function for all sharepoint related methods when those methods fail,
 * this method can be overridden when calling sharepoint methods by passing the name of your custom function in the onFailed parameter
 * @param {object} sender 
 * @param {object} args this object contains information about the error
 */
Speed.prototype.onQueryFailed = function (sender, args) {
    try {
        console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
    } catch (e) {
        console.log('Request failed. ' + sender.msg);
    }
}

//work in progress
//onpremise or inpage use only ..App Model Doesnt Cache
Speed.prototype.scriptCacheDebugger = function (scriptToCheck, callBack) {
    if (window["localStorage"]) {
        var scriptTag = null;
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].src) {
                if (scripts[i].src.toLowerCase().indexOf(scriptToCheck.toLowerCase()) >= 0) {
                    scriptTag = scripts[i];
                    break;
                }
            }
        }
        var returnObject = {};
        var lastFileSize = localStorage.getItem("speed" + scriptToCheck + "size");
        var lastFileVersion = localStorage.getItem("speed" + scriptToCheck + "version");
        if (scriptTag !== null) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', scriptTag.src, true);
            xhr.responseType = 'text';
            xhr.onload = function (e) {
                if (this.status == 200) {
                    // Note: .response instead of .responseText
                    var fileInBytes = this.getResponseHeader('Content-Length');
                    if (lastFileSize !== null) {
                        if (fileInBytes.toString() !== lastFileSize) {
                            returnObject.fileChanged = true;
                            returnObject.previousSize = lastFileSize;
                            returnObject.currentSize = fileInBytes;
                            var versionNo = lastFileVersion;
                            versionNo = versionNo.replace(/\./g, '');
                            versionNo = parseInt(versionNo) + 1;
                            versionNo = versionNo.toString();
                            var newVersionNo = "";
                            for (var x = 0; x <= (versionNo.length - 1); x++) {
                                if ((versionNo.length - 1) == x)
                                    newVersionNo += versionNo[x];
                                else
                                    newVersionNo += versionNo[x] + ".";
                            }
                            returnObject.version = newVersionNo;

                            localStorage.setItem("speed" + scriptToCheck + "size", fileInBytes);
                            localStorage.setItem("speed" + scriptToCheck + "version", newVersionNo);
                        } else {
                            returnObject.fileChanged = false;
                            returnObject.previousSize = fileInBytes;
                            returnObject.currentSize = fileInBytes;
                            returnObject.version = lastFileVersion;
                        }
                    } else {
                        localStorage.setItem("speed" + scriptToCheck + "size", fileInBytes);
                        localStorage.setItem("speed" + scriptToCheck + "version", "1.0.0.0");
                        returnObject.fileChanged = false;
                        returnObject.previousSize = fileInBytes;
                        returnObject.currentSize = fileInBytes;
                        returnObject.version = "1.0.0.0";
                    }
                    if (typeof callBack !== "undefined") {
                        callBack(returnObject);
                    }
                }
            };
            xhr.send();
        }
    } else {
        console.warn("Script debugger function only works with local storage.....");
    }
}

Speed.prototype.debugHandler = function (code, type, id, extension) {
    var errorDefinitions = {
        "1111": function () {
            var errorMsg = "validation failed, there is no custom extended function '" + extension + "' created for this element with " +
                " ID '" + id + "' of type: '" + type + "'  to handle this validation..";
            return errorMsg;
        },
        "1112": function () {
            var errorMsg = "validation failed, there is no id for this element";
            return errorMsg;
        },
        "1113": function () {
            var errorMsg = "validation failed, the extension '" + extension + "' for this element " +
                " ID '" + id + "' of type: '" + type + "'  is invalid as multivalue extension only works for checkbox(s)";
            return errorMsg;
        },
        "1114": function () {
            var errorMsg = "validation failed, invalid file name for the attached document";
            return errorMsg;
        }
    }
    var msg = errorDefinitions[code]();
    console.log(msg);
}

/* ============================== Table Section ============================*/
/**
 * Exports a List to an Table. Creates the TBody content of a list based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {Function} conditions this parameter includes special conditions for each object properties, condition must return an object. look up getListToItems to see
 *  definition of this parameter
 * @param {callback(itemsData)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved.the items reterived 
 *  is passed as an argument of type Array
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = Object] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToTable = function (listName, caml, controls, conditions, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var resetDataTable = (typeof controls.resetTable === "undefined") ? true : controls.resetTable;
    if (resetDataTable) {
        SpeedContext.DataForTable.tabledata = [];
    }
    SpeedContext.DataForTable.lastPageItem = SpeedContext.DataForTable.currentPage * SpeedContext.DataForTable.pagesize;
    SpeedContext.getListToItems(listName, caml, controls, true, conditions, function (requestItems) {
        //gets only table controls
        var tableId = (typeof controls.tableid !== "") ? controls.tableid : "";
        var tableControls = SpeedContext.getControls(true, tableId);
        SpeedContext.DataForTable.tabledata = SpeedContext.DataForTable.tabledata.concat(requestItems);
        var Arr = SpeedContext.DataForTable.tabledata;
        if (Arr.length != 0) {
            $('#' + SpeedContext.DataForTable.tablecontentId).empty();
            SpeedContext.DataForTable.activeClass = 1;
            var total = Arr.length;
            SpeedContext.DataForTable.noOfPages = Math.ceil(Arr.length / SpeedContext.DataForTable.pagesize);
            if (total < SpeedContext.DataForTable.lastPageItem) {
                SpeedContext.DataForTable.lastPageItem = total;
            }
            var str = "";
            for (x = 0; x < SpeedContext.DataForTable.lastPageItem; x++) {
                if (SpeedContext.DataForTable.modifyTR) {
                    str += SpeedContext.DataForTable.trExpression(x);
                } else {
                    str += "<tr>";
                }
                if (SpeedContext.DataForTable.includeSN) {
                    str += "<td>" + (x + 1) + "</td>";
                }

                for (var y = 0; y < tableControls.length; y++) {
                    var propName = tableControls[y];
                    var groupName = $("[speed-table-data='" + propName + "']").attr("speed-table-group");
                    groupName = (typeof groupName !== "undefined") ? groupName : "SP-NOTApplicable";

                    var useTD = $("[speed-table-data='" + propName + "']").attr("speed-table-includetd");
                    useTD = (typeof useTD !== "undefined") ? (useTD === "true") : true;

                    if (Arr[x][propName] !== "undefined") {
                        if (SpeedContext.DataForTable.propertiesHandler.hasOwnProperty(propName)) {
                            if (useTD) {
                                str += "<td>" + SpeedContext.DataForTable.propertiesHandler[propName](Arr[x], x) + "</td>";
                            } else {
                                str += SpeedContext.DataForTable.propertiesHandler[propName](Arr[x], x);
                            }
                        } else if (SpeedContext.DataForTable.propertiesHandler.hasOwnProperty(groupName)) {
                            if (useTD) {
                                str += "<td>" + SpeedContext.DataForTable.propertiesHandler[groupName](Arr[x], x, propName) + "</td>";
                            } else {
                                str += SpeedContext.DataForTable.propertiesHandler[propName](Arr[x], x, propName);
                            }

                        } else
                            str += "<td>" + Arr[x][propName] + "</td>";
                    } else {
                        str += "<td></td>";
                    }
                }
                str += "</tr>";
            }
            $('#' + SpeedContext.DataForTable.tablecontentId).append(str);
            SpeedContext.DataForTable.paginateLinks(1, SpeedContext.DataForTable.paginateSize, SpeedContext.DataForTable);
            $("#" + SpeedContext.DataForTable.paginationbId + " li a." + SpeedContext.DataForTable.tablecontentId + "-moveback").hide();
            $("#" + SpeedContext.DataForTable.paginationuId + " li a." + SpeedContext.DataForTable.tablecontentId + "-moveback").hide();
            if (SpeedContext.DataForTable.noOfPages <= SpeedContext.DataForTable.paginateSize) {
                $("#" + SpeedContext.DataForTable.paginationbId + " li a." + SpeedContext.DataForTable.tablecontentId + "-movefront").hide();
                $("#" + SpeedContext.DataForTable.paginationuId + " li a." + SpeedContext.DataForTable.tablecontentId + "-movefront").hide();
            }
        } else {
            $('#' + SpeedContext.DataForTable.tablecontentId).empty();
        }
        onSuccess(SpeedContext.DataForTable.tabledata);
    }, onFailed, appContext);
}

/**
 * Exports a Array to a Table. Creates the TBody content of the array passed
 * @param {String} tableData this parameter specifices the data to create the table
 */
Speed.prototype.manualTable = function (tableData, condition) {
    this.DataForTable.lastPageItem = this.DataForTable.currentPage * this.DataForTable.pagesize;
    var tableControls = this.getControls(true, "");
    this.DataForTable.tabledata = tableData;
    if (this.DataForTable.tabledata.length != 0) {
        $('#' + this.DataForTable.tablecontentId).empty();
        this.DataForTable.activeClass = 1;
        var total = this.DataForTable.tabledata.length;
        this.DataForTable.noOfPages = Math.ceil(total / this.DataForTable.pagesize);
        if (total < this.DataForTable.lastPageItem) {
            this.DataForTable.lastPageItem = total;
        }
        var str = "";
        for (x = 0; x < this.DataForTable.lastPageItem; x++) {

            if (typeof condition === "function") {
                this.DataForTable.tabledata[x] = condition(this.DataForTable.tabledata[x], x);
            }

            if (this.DataForTable.modifyTR) {
                str += this.DataForTable.trExpression(x);
            } else {
                str += "<tr>";
            }
            if (this.DataForTable.includeSN) {
                str += "<td>" + (x + 1) + "</td>";
            }

            for (var y = 0; y < tableControls.length; y++) {
                var propName = tableControls[y];
                var groupName = $("[speed-table-data='" + propName + "']").attr("speed-table-group");
                groupName = (typeof groupName !== "undefined") ? groupName : "SP-NOTApplicable";

                var useTD = $("[speed-table-data='" + propName + "']").attr("speed-table-includetd");
                useTD = (typeof useTD !== "undefined") ? (useTD === "true") : true;

                if (this.DataForTable.tabledata[x][propName] !== "undefined") {
                    if (this.DataForTable.propertiesHandler.hasOwnProperty(propName)) {
                        if (useTD) {
                            str += "<td>" + this.DataForTable.propertiesHandler[propName](this.DataForTable.tabledata[x], x) + "</td>";
                        } else {
                            str += this.DataForTable.propertiesHandler[propName](this.DataForTable.tabledata[x], x);
                        }
                    } else if (this.DataForTable.propertiesHandler.hasOwnProperty(groupName)) {
                        if (useTD) {
                            str += "<td>" + this.DataForTable.propertiesHandler[propName](this.DataForTable.tabledata[x], x, propName) + "</td>";
                        } else {
                            str += this.DataForTable.propertiesHandler[propName](this.DataForTable.tabledata[x], x, propName);
                        }
                    } else
                        str += "<td>" + this.DataForTable.tabledata[x][propName] + "</td>";
                } else {
                    str += "<td></td>";
                }
            }
            str += "</tr>";
        }
        $('#' + this.DataForTable.tablecontentId).append(str);
        this.DataForTable.paginateLinks(1, this.DataForTable.paginateSize, this.DataForTable);
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        if (this.DataForTable.noOfPages <= this.DataForTable.paginateSize) {
            $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
            $("#" + this.DataForTable.paginationuId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
        }
    } else {
        $('#' + this.DataForTable.tablecontentId).empty();
    }
}

/**
 * Exports a Array to a Custom Element Pagination.
 * @param {String} tableData this parameter specifices the data to create the table
 */
Speed.prototype.customElementPagination = function (tableData, blockElement) {
    this.DataForTable.lastPageItem = this.DataForTable.currentPage * this.DataForTable.pagesize;
    this.DataForTable.tabledata = tableData;
    this.DataForTable.customPaginate = true;
    this.DataForTable.customBlock = blockElement;
    var Arr = this.DataForTable.tabledata;
    if (Arr.length != 0) {
        $('#' + this.DataForTable.tablecontentId).empty();
        this.DataForTable.activeClass = 1;
        var total = Arr.length;
        this.DataForTable.noOfPages = Math.ceil(Arr.length / this.DataForTable.pagesize);
        if (total < this.DataForTable.lastPageItem) {
            this.DataForTable.lastPageItem = total;
        }
        var str = "";
        for (x = 0; x < this.DataForTable.lastPageItem; x++) {
            var innerElement = blockElement;
            for (var propName in Arr[x]) {
                try {
                    var stringToFind = "{{" + propName + "}}";
                    var regex = new RegExp(stringToFind, "g");
                    innerElement = innerElement.replace(regex, Arr[x][propName]);
                } catch (e) {}
            }
            str += innerElement;
        }
        $('#' + this.DataForTable.tablecontentId).append(str);
        this.DataForTable.paginateLinks(1, this.DataForTable.paginateSize, this.DataForTable);
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        if (this.DataForTable.noOfPages <= this.DataForTable.paginateSize) {
            $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
            $("#" + this.DataForTable.paginationuId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
        }
    } else {
        $('#' + this.DataForTable.tablecontentId).empty();
    }
}

/**
 * IE SHIMS (10 && 11)
 * Fix for file upload for large chunk files on Internet explorer 10 and 11
 */
if (!ArrayBuffer.prototype.slice) {
    //Returns a new ArrayBuffer whose contents are a copy of this ArrayBuffer's
    //bytes from `begin`, inclusive, up to `end`, exclusive
    ArrayBuffer.prototype.slice = function (begin, end) {
        //If `begin` is unspecified, Chrome assumes 0, so we do the same
        if (begin === void 0) {
            begin = 0;
        }

        //If `end` is unspecified, the new ArrayBuffer contains all
        //bytes from `begin` to the end of this ArrayBuffer.
        if (end === void 0) {
            end = this.byteLength;
        }

        //Chrome converts the values to integers via flooring
        begin = Math.floor(begin);
        end = Math.floor(end);

        //If either `begin` or `end` is negative, it refers to an
        //index from the end of the array, as opposed to from the beginning.
        if (begin < 0) {
            begin += this.byteLength;
        }
        if (end < 0) {
            end += this.byteLength;
        }

        //The range specified by the `begin` and `end` values is clamped to the 
        //valid index range for the current array.
        begin = Math.min(Math.max(0, begin), this.byteLength);
        end = Math.min(Math.max(0, end), this.byteLength);

        //If the computed length of the new ArrayBuffer would be negative, it 
        //is clamped to zero.
        if (end - begin <= 0) {
            return new ArrayBuffer(0);
        }

        var result = new ArrayBuffer(end - begin);
        var resultBytes = new Uint8Array(result);
        var sourceBytes = new Uint8Array(this, begin, end - begin);

        resultBytes.set(sourceBytes);

        return result;
    };
}

var $spcontext = new Speed();