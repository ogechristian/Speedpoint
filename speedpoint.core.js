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
    if (typeof window.speedGlobal === 'undefined')
        window.speedGlobal = [];
    if (!this.checkScriptDuplicates('jquery'))
        console.warn("SpeedPoint requires jquery, please add jquery to the dom...");
}

/* ============================== Set Up Section ============================*/
//App context has been introduced in sharepoint async calls to support Cross Domain CRUD requests
Speed.prototype.initiate = function () {
    if (typeof this.url === 'undefined') {
        var context = new SP.ClientContext.get_current();
        return context;
    }
    else {
        if (typeof this.url !== 'undefined' && this.optional) {
            var context = new SP.ClientContext.get_current();
            var appContextSite = new SP.AppContextSite(context, this.url);
            return appContextSite;
        }
        else {
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
    scriptbase = (typeof scriptbase == "undefined" || scriptbase == null) ? "/_layouts/15/" : (scriptbase + "/_layouts/15/");
    var duplicateExists = this.checkScriptDuplicates("sp.js");
    if (typeof properties !== "undefined" && properties !== null &&
            !this.checkScriptDuplicates("SP.UserProfiles.js") && !this.checkScriptDuplicates("clientpeoplepicker.js")) {

        if (!this.checkScriptDuplicates("SP.RequestExecutor.js") && typeof properties.requestExecutor !== "undefined" &&
            properties.requestExecutor) {
            $.getScript(scriptbase + "SP.RequestExecutor.js");
        }

        if (typeof properties.clientPeoplePicker !== "undefined" && properties.clientPeoplePicker) {
            //load all client peoplepicker js dependencies 
            $.getScript(scriptbase + "clienttemplates.js", 
                $.getScript(scriptbase + "clientforms.js", 
                    $.getScript(scriptbase + "autofill.js", 
                        $.getScript(scriptbase + "clientpeoplepicker.js", function (){setTimeout(workflowScripts, 1000);})
                    )
                )
            );
        }
        else {
            setTimeout(workflowScripts, 1000);
        }
    }
    else {
        workflowScripts();
    }

    function workflowScripts() {
        if (properties.userProfile) {
            SP.SOD.executeFunc("sp.js", 'SP.ClientContext', function () {
                $.getScript(scriptbase + "SP.UserProfiles.js");
                SP.SOD.executeOrDelayUntilScriptLoaded(callBack, 'SP.UserProfiles.js');
            });
            
        }
        else
            SP.SOD.executeFunc("sp.js", 'SP.ClientContext', callBack);
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
        for (var i = 1; i <= usedtottal ; i++) {
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
            for (var i = 0; i <= total ; i++) {
                if (!this.CheckNoofUsedFields(noOfFields, 'onlyone') && (count == 0 || total - i >= 1)) {
                    if (typeof Arr[i].evaluator != 'undefined') {
                        queryString += '<' + Arr[i].evaluator + '>';
                    }
                    else
                        queryString += '<' + cal[0].evaluator + '>';
                    andCount++;
                }
                if (typeof Arr[i].support != 'undefined')
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\' " + Arr[i].support.title + "=\'" + Arr[i].support.value + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                else if (typeof Arr[i].author != 'undefined')
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\' " + Arr[i].author.title + "=\'" + Arr[i].author.value + "\' /><Value Type=\'" + Arr[i].type + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                else
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                count++;
            }
            for (var x = (andCount - 1) ; x >= 0; x--) {
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
    }
    else {
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
        for (var y = 0; y <= Arr.length - 1 ; y++) {
            if (this.checkNull(Arr[y]) != '')
                count++;
        }
        if (count == 1) {
            oneE = true;
        }
        return oneE;
    }
};

/* ============================== Validation Section ============================*/
//Extendable validation logic properties. This is where custom validation logic can be introduced to speedpoint

Speed.prototype.validationProperties = {
    "number": {
        type: "number",
        extend: {},
        validate: function (value, extension) {
            if (extension !== "") {
                return this.extend[extension](value);
            }
            else if (value.trim() == "") {
                return false;
            }
            else if (isNaN(value)) {
                return false;
            }
            else
                return true;
        }
    },
    "checkbox": {
        type: "checkbox",
        extend: null,
        validate: function (value) {
            return value;
        }
    },
    "text": {
        type: "text",
        extend: {
            IP: function (value) {
                var patt = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
                if (!patt.test(value)) {
                    return false;
                }
                else
                    return true;
            },
            Email: function (value) {
                var patt = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                if (!patt.test(value)) {
                    return false;
                }
                else
                    return true;
            }
        },
        validate: function (value, extension) {
            if (extension !== "") {
                return this.extend[extension](value);
            }
            else if (value.trim() === "") {
                return false;
            }
            else
                return true;
        }
    }
}

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
        var elementProperties = document.getElementById(elementObj.id);
        if (elementProperties.tagName.toLowerCase() === "textarea" || elementProperties.tagName.toLowerCase() === "select") { }
        else
            elementType = elementProperties.type.toLowerCase();
        try {
            if (elementProperties.type === "checkbox")
                valueToValidate = elementProperties.checked;
            else
                valueToValidate = elementProperties.value.trim();
            valueToValidate = this.checkNull(valueToValidate);
        }
        catch (e) { }
        elementVisible = (elementProperties.style.display.toLowerCase() === "none") ? false : true;
    }
    else {
        valueToValidate = this.checkNull(elementObj.staticValue);
        elementType = elementObj.elementType;
    }

    //===============================================================
    var passValidation = this.validationProperties[elementType].validate(valueToValidate, elementObj.extension);
    if (!passValidation && elementVisible)
        this.validationReturn(elementObj.id, elementObj.msg, elementObj.addErrors, elementObj.triggerCallback);
    else if (passValidation && elementObj.removeHtmlErrors) {
        $("#" + elementObj.id).siblings(".temp-speedmsg").remove();
        $("#" + elementObj.id).removeClass("speedhtmlerr");
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
                            "p.temp-speedmsg {color:red !important; font-weight:bold; margin:0}" +
                         "</style>";
    if (!this.stylePlace) {
        if (typeof mystyle === 'undefined')
            $("head").append(styleDefinition);
        else {
            //-----work on this later -------
            $("head").append("<style>.speedhtmlerr" + mystyle + "</style>");
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
    }
    else
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
    var bindStaticFields = (typeof staticBind === 'undefined') ? true : staticBind;
    var returnObject = {}
    if (typeof listObjects !== "undefined" && listObjects != null) {
        returnObject = listObjects
    }
    //decides if u want to bind static fields to objects
    //set this option to false if the static fields already contains the same values with the object
    
    var element = document.querySelectorAll("[speed-bind]");
    for (var i = 0; i <= (element.length - 1) ; i++) {
        var property = element[i].getAttribute("speed-bind");
        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea") {
            if (element[i].type == "checkbox")
                returnObject[property] = element[i].checked;
            else
                returnObject[property] = element[i].value;
        }
        else if(!bindStaticFields && element[i].tagName.toLowerCase() == "label"){
            //dont reterive values from labels if static bind is turned off
        }
        else
            returnObject[property] = element[i].innerText;
    }


    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (elementValidate.length - 1) ; i++) {
        var property = elementValidate[i].getAttribute("speed-bind-validate");
        var msg = elementValidate[i].getAttribute("speed-validate-msg");
        var inputtype = elementValidate[i].getAttribute("speed-validate-type");
        var inputid = elementValidate[i].getAttribute("id");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
        var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
        if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "select" || elementValidate[i].tagName.toLowerCase() == "textarea") {
            if (elementValidate[i].type == "checkbox")
                returnObject[property] = elementValidate[i].checked;
            else
                returnObject[property] = elementValidate[i].value;
            this.validateField({ id: inputid, msg: validationMessage, extension: validationtype });
        }
    }

    //Speed bind and table to array
    var elementValidate = document.querySelectorAll("[speed-bind-table]");
    for (var i = 0; i <= (elementValidate.length - 1) ; i++) {
        var property = elementValidate[i].getAttribute("speed-bind-table");
        var strignify = elementValidate[i].getAttribute("speed-bind-JSON");
        var inputid = elementValidate[i].getAttribute("id");
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
                        else
                            objValue[objproperties[objCount]] = inputTag.value;
                    }
                    else
                        objValue[objproperties[objCount]] = inputTag.innerText;

                    objCount++;
                }
            });
            arrayValue.push(objValue);
        });
        if (strignify == "YES")
            returnObject[property] = JSON.stringify(arrayValue);
        else
        returnObject[property] = arrayValue;
    }

    return returnObject;
}

/**
 * The getControls function gets all speed-bind & speed-bind-validate html attributes names
  * @returns {Array} the Array return contains all controls names
 */
Speed.prototype.getControls = function (onlyTables) {
    var pickOnlyTable = (typeof onlyTable === "undefined") ? false : onlyTables
    var returnArr = [];

    if (!onlyTables) {
        //decides if u want to bind static fields to objects
        //set this option to false if the static fields already contains the same values with the object
        var element = document.querySelectorAll("[speed-bind]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-bind");
            if ($.inArray(property, returnArr) < 0)
                returnArr.push(property);
        }

        //Speed bind and validate html
        var elementValidate = document.querySelectorAll("[speed-bind-validate]");
        for (var i = 0; i <= (elementValidate.length - 1); i++) {
            var property = elementValidate[i].getAttribute("speed-bind-validate");
            if ($.inArray(property, returnArr) < 0)
                returnArr.push(property);
        }
    }

    if(onlyTables){
        var element = document.querySelectorAll("[speed-table-data]");
        for (var i = 0; i <= (element.length - 1) ; i++) {
            var property = element[i].getAttribute("speed-table-data");
            if ($.inArray(property, returnArr) < 0)
                returnArr.push(property);
        }
    }
    return returnArr;
}

/**
 * The htmlBind function sets all speed-bind & speed-bind-validate html attributes with respect to the object passed key with their values
 * @param {object} listObjects this parameter provides the value for the attriutes
 */
Speed.prototype.htmlBind = function (listObjects) {
    for (var key in listObjects) {
        if (listObjects.hasOwnProperty(key)) {
            var element = document.querySelectorAll("[speed-bind='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1) ; i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? element[i].getAttribute("speed-bind-auto") : "Yes";
                    if (useAutoBinding === "Yes") {
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                            if (element[i].type !== "checkbox")
                                element[i].value = listObjects[key];
                            else
                                element[i].checked = listObjects[key];
                        }
                        else if (element[i].tagName.toLowerCase() == "select") {
                            $("#" + element[i].id).val(listObjects[key]);
                        }
                        else
                            element[i].innerHTML = listObjects[key];
                    }
                }
            }
            else {
                element = document.querySelectorAll("[speed-bind-validate='" + key + "']");
                if (element.length > 0) {
                    for (var i = 0; i <= (element.length - 1) ; i++) {
                        var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? element[i].getAttribute("speed-bind-auto") : "Yes";
                        if (useAutoBinding === "Yes") {
                            if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                                if (element[i].type !== "checkbox")
                                    element[i].value = listObjects[key];
                                else
                                    element[i].checked = listObjects[key];
                            }
                            else if (element[i].tagName.toLowerCase() == "select") {
                                $("#" + element[i].id).val(listObjects[key]);
                            }
                            else
                                element[i].innerHTML = listObjects[key];
                        }
                    }
                }
            }
        }
    }
}

Speed.prototype.bindArrayToTable = function (speedContext,listObjects,parse, tableProperties) {
    for (var key in listObjects) {
        if (listObjects.hasOwnProperty(key)) {
            var element = document.querySelectorAll("[speed-bind-table='" + key + "']");
            for (var i = 0; i <= (element.length - 1) ; i++) {
                var inputid = element[i].getAttribute("id");
                var columnValue = [];
                if (parse) {
                    columnValue = JSON.parse(speedContext.formatStringJSON(listObjects[key]));
                }
                else {
                    columnValue = listObjects[key];
                }

                for (var x = 0; x <= (columnValue.length - 1) ; x++) {
                    var str = tableProperties(columnValue[x]);
                    $("#" + inputid + " > tbody").append(str);
                }
            }
        }
    }
}

/**
 * The applyValidationEvents function activates the event handlers for the html elements with the speed-bind-validate attribute
 * @param {object} speedPointContext this parameter is the speedpoint context
 */
Speed.prototype.applyValidationEvents = function (speedPointContext) {
    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (elementValidate.length - 1) ; i++) {
        var elementEventData = jQuery._data(elementValidate[i], "events");
        if (typeof elementEventData === "undefined") {
            if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "textarea") {
                elementValidate[i].addEventListener("keyup", function () {
                    var msg = this.getAttribute("speed-validate-msg");
                    var inputtype = this.getAttribute("speed-validate-type");
                    var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
                    var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                    speedPointContext.validateField(
                    {
                        id: this.id,
                        msg: validationMessage,
                        extension: validationtype,
                        addErrors: false,
                        styleElement: false,
                        removeHtmlErrors: true,
                        triggerCallback: function (id, msg) {
                            $("#" + id).siblings(".temp-speedmsg").remove();
                            $("<p class='temp-speedmsg'>" + msg + "</p>").insertBefore("#" + id);
                        }
                    });
                });
            }
            else if (elementValidate[i].tagName.toLowerCase() == "select") {
                elementValidate[i].addEventListener("change", function () {
                    var msg = this.getAttribute("speed-validate-msg");
                    var inputtype = this.getAttribute("speed-validate-type");
                    var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
                    var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                    speedPointContext.validateField(
                    {
                        id: this.id,
                        msg: validationMessage,
                        extension: validationtype,
                        addErrors: false,
                        styleElement: false,
                        removeHtmlErrors: true,
                        triggerCallback: function (id, msg) {
                            $("#" + id).siblings(".temp-speedmsg").remove();
                            $("<p class='temp-speedmsg'>" + msg + "</p>").insertBefore("#" + id);
                        }
                    });
                });
            }
        }
    }
}

/* ============================== List Section ============================*/
/**
 * The createList function creates a list in the context used
 * @param {object} listProperties this parameter contains all the properties required for the creation of a sharepoint list
 * @param {function} onSuccess this parameter is the call back function thats called when the list has successfully been created
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the list fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createList = function (listProperties, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
               for (var i = 0; i <= (parseInt(count) - 1) ; i++) {
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
               }
                , Function.createDelegate(this, onFailedCall));
           }, Function.createDelegate(this, onFailedCall));
    }
    else if (setuser) {
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
        }
         , Function.createDelegate(this, onFailedCall));
    }
    else {
        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, 1000);
        }
         , Function.createDelegate(this, onFailedCall));
    }
}
//----------------------create fields for a list --------------------------
/**
 * The createColumnInList function creates columns for a specified list in the context used
 * @param {array} arr this parameter contains an array of column property objects used for the creation of the column in a specified list
 * @param {String} listName this parameter specifices the list which the columns are to be created
 * @param {function} onSuccess this parameter is the call back function thats called when the column has successfully been created
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the list fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createColumnInList = function (arr, listName, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
    }
     , Function.createDelegate(this, onFailedCall));
}

/**
 * The updateItems function updates rows for a specified list in the context used
 * @param {array} arr this parameter contains an array of key-values property objects used for the updating of the row in a specified list by the Id
 * this means Id must be part of the key-value properties to be Passed. key values must match the Columns in the list
 * @param {String} listName this parameter specifices the list which the rows are to be updated
 * @param {function} onSuccess this parameter is the call back function thats called when the row has successfully been updated
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the row fails to update, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.updateItems = function (arr, listName, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
                    if (propName.toLowerCase() == "id") {
                    }
                    else {
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
 * @param {function} onSuccess this parameter is the call back function thats called when the row has successfully been created
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the row fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} the sharepoint list item creation object. this object is passed to the onSuccess function parameter and can be used from there
 */
Speed.prototype.createItems = function (arr, listName, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
    if (typeof arr != 'undefined') {
        if (arr.length != 0) {
            var listitemArr = [];
            var context = this.initiate();
            var reqList = context.get_web().get_lists().getByTitle(listName);
            if (typeof appContext !== 'undefined') {
                context = appContext.initiate();
            }
            $.each(arr, function (i, itemProperties) {
                //if(itemProperties.Existing == "No"){
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
                //}
            });
            context.executeQueryAsync(function () {
                setTimeout(function () {
                    onSuccess(listitemArr);
                }, 1000);
            }
            , Function.createDelegate(this, onFailedCall));
        }
    }
};

/**
 * The createItems function creates rows for a specified list in the context used
 * @param {String} listname this parameter specifices the list which the row is to be deleted
 * @param {Int} id this parameter specifices the id of the row which is to be deleted
 * @param {function} onSuccess this parameter is the call back function thats called when the row has successfully been deleted
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the row fails to deleted, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.deleteItem = function (listname, id, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
    }
    , Function.createDelegate(this, onFailedCall));
};

/**
 * The getItem function retrieve rows for a specified list in the context used
 * @param {String} listName this parameter specifices the list which the rows are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {function} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} the sharepoint list item object which can enumerated. this object is passed to the onSuccess function parameter and can be used
 * from there
 */
Speed.prototype.getItem = function (listName, caml, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
        }, 1000);
    }
        , Function.createDelegate(this, onFailedCall));
}

//* ====================== Helper Functions ========================*//
/**
 * Exports a List to an Object. Only one list item object is returned based on the query
 * @param {String} SpeedContext the speedpoint object
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {function} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} the sharepoint list item object which can enumerated. this object is passed to the onSuccess function parameter and can be used
 * from there
 */
Speed.prototype.getListToControl = function (SpeedContext, listName, caml, controls, onSuccess, onFailed, appContext) {
    var controlArray = this.getControls();
    var controlsToUse = ($.isArray(controls)) ? $.merge(controlArray, controls) : controlArray;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
        for (var i = 0; i <= (controlArray.length - 1) ; i++) {
            var SPFieldType;
            try {
                SPFieldType = items.get_item(controlArray[i]).__proto__.constructor.__typeName.toLowerCase();
            }
            catch (ex) {
                SPFieldType = "string";
            }
            if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue") {
                var objProp = {};
                objProp.id = SpeedContext.checkNull(items.get_item(controlArray[i]).get_lookupId());
                objProp.value = SpeedContext.checkNull(items.get_item(controlArray[i]).get_lookupValue());
                if (SPFieldType.toLowerCase() === "sp.fielduservalue") {
                    try {
                        objProp.email = SpeedContext.checkNull(items.get_item(controlArray[i]).get_email());
                    }
                    catch (e) {
                        objProp.email = "";
                     };
                }
                objectToReturn[controlArray[i]] = objProp;
            }
            else if (SPFieldType.toLowerCase() === "array") {
                var multiUser = items.get_item(controlArray[i]);
                var arrayToSave = [];
                for (var j = 0; j <= (multiUser.length - 1); j++) {
                    var objectOfUsers = {};
                    objectOfUsers.id = multiUser[j].get_lookupId();
                    objectOfUsers.value = multiUser[j].get_lookupValue();
                    try {
                        objectOfUsers.email = multiUser[j].get_email();
                    }
                    catch (e) {
                        objectOfUsers.email = "";
                     };
                    arrayToSave.push(objectOfUsers);
                }
                objectToReturn[controlArray[i]] = arrayToSave;
            }
            else
                objectToReturn[controlArray[i]] = SpeedContext.checkNull(items.get_item(controlArray[i]));

        }
        onSuccess(objectToReturn);
    }
    , Function.createDelegate(this, onFailedCall));
}

/**
 * Exports a List to an Array. All list items is returned based on the query
 * @param {String} SpeedContext the speedpoint object
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {function} conditions this parameter includes special conditions for each object properties, condition must return an object 
 * @param {function} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} the sharepoint list item object which can enumerated. this object is passed to the onSuccess function parameter and can be used
 * from there
 */
Speed.prototype.getListToItems = function (SpeedContext, listName, caml, controls,tableonly,conditions, onSuccess, onFailed, appContext) {
    var controlArray = this.getControls(tableonly);
    var controlsToUse = ($.isArray(controls)) ? $.merge(controlArray, controls) : controlArray;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
    
    this.getItem(listName,caml,function(itemProperties){
        var listItems = [];
        var listEnumerator = itemProperties.getEnumerator();
		while (listEnumerator.moveNext()) {
            var objectToReturn = {};
            for (var i = 0; i <= (controlsToUse.length - 1) ; i++) {
                var SPFieldType;
                try {
                    SPFieldType = listEnumerator.get_current().get_item(controlsToUse[i]).__proto__.constructor.__typeName.toLowerCase();
                }
                catch (ex) {
                    SPFieldType = "string";
                }
                if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue") {
                    var objProp = {};
                    objProp.id = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupId());
                    objProp.value = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupValue());
                    objectToReturn[controlsToUse[i]] = objProp;
                }
                else if (SPFieldType.toLowerCase() === "array") {
                    var multiUser = items.get_item(controlArray[i]);
                    var arrayToSave = [];
                    for (var j = 0; j <= (multiUser.length - 1); j++) {
                        var objectOfUsers = {};
                        objectOfUsers.id = multiUser[j].get_lookupId();
                        objectOfUsers.value = multiUser[j].get_lookupValue();
                        arrayToSave.push(objectOfUsers);
                    }
                    objectToReturn[controlArray[i]] = arrayToSave;
                }
                else{
                    objectToReturn[controlsToUse[i]] = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]));
                }
            }

            if (typeof conditions !== null && typeof conditions === "function") {
                objectToReturn = conditions(objectToReturn);
            }

            //includes non empty objects
            if (!$.isEmptyObject(objectToReturn)) {
                listItems.push(objectToReturn);
            }
        }
        onSuccess(listItems);
    },onFailedCall,appContext);
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
    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();// This is just to avoid case sensitiveness for query parameter name
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
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //returns a GUID number xxxxxxxx-xxxx-xxxxxxxx
 * var guid = speedctx.uniqueIdGenerator();
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
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //returns the date on the sharepoint server
 * var serverdate = speedctx.serverDate();
 */
Speed.prototype.serverDate = function () {
    return new Date(new Date().getTime() + _spPageContextInfo.clientServerTimeDelta);
}
//--------------------------------stringnify date------------------
/**
 * The stringnifyDate function converts a date object to string
 * @param {Object} [obj = {value: this.serverDate}] parameter supplies a settings object for converting to string. by default the server date is used
 * @returns {String} the result output.
 */
Speed.prototype.stringnifyDate = function (obj) {
    if (typeof obj == "undefined") obj = {};
    if (typeof obj.value === 'undefined' || obj.value == "") {
        var str = this.serverDate();
    }
    else
        var str = new Date(obj.value);

    if (typeof obj.includeTime == "undefined") var incTime = false;
    else
        var incTime = obj.includeTime;

    if (typeof obj.timeSpace == "undefined") obj.timeSpace = true;

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
            }
            else if (firstField.toLowerCase() == 'mm') {
                finalStr += month;
                monthUsed = true
            }
            else if (firstField.toLowerCase() == 'yy') {
                finalStr += year;
                yearUsed = true;
            }

            finalStr += getDelimiter;

            if (secondField.toLowerCase() == 'dd' && !dayused) {
                finalStr += day;
                dayused = true;
            }
            else if (secondField.toLowerCase() == 'mm' && !monthUsed) {
                finalStr += month;
                monthUsed = true
            }
            else if (secondField.toLowerCase() == 'yy' && !yearUsed) {
                finalStr += year;
                yearUsed = true;
            }

            finalStr += getDelimiter;

            if (thirdField.toLowerCase() == 'dd' && !dayused) {
                finalStr += day;
                dayused = true;
            }
            else if (thirdField.toLowerCase() == 'mm' && !monthUsed) {
                finalStr += month;
                monthUsed = true
            }
            else if (thirdField.toLowerCase() == 'yy' && !yearUsed) {
                finalStr += year;
                yearUsed = true;
            }
            else {
                finalStr = "Invalid Format";
                inval = true;
            }
        }
        else {
            var finalStr = "Invalid Format";
            inval = true;
        }
    }
    else {
        var finalStr = day + '/' + month + '/' + year;
    }

    if (incTime && !inval) {
        if (obj.timeSpace)
            finalStr += '  ' + hour + ':' + minute + ':' + second;
        else
            finalStr += '_' + hour + '-' + minute + '-' + second;
    }
    return finalStr;
};

/**
 * The checkNull function checks if a value is null. it returns the value if its not null and and empty string when it is
 * This is used to avoid unexpected result when retrieving values columns that are empty
 * @param {String} val parameter supplies a value to check for null
 * @returns {String} the result output.
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //returns an empty string "" since check value is null
 * var checkvalue = null
 * var returnedValue = speedctx.checkNull(checkvalue);
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //returns the string "Sam"
 * var checkvalue = "sam"
 * var returnedValue = speedctx.checkNull(checkvalue);
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //returns the object {text: "Sam"}
 * var checkvalue = {text: "Sam"}
 * var returnedValue = speedctx.checkNull(checkvalue);
 */
Speed.prototype.checkNull = function (val) {
    if(typeof val == "string")
        return val.toString().replace(/(?:\r\n|\r|\n)/g, '<br />');
    else if (val != null) {
        return val;
    }
    else
        return '';
};

/**
 * The removeHtml function removes html for a string of elements.
 * this method is used for presenting only text values from rich text box columns in sharepoint lists
 * @param {String} val parameter supplies a string
 * @returns {String} the result output.
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //returns the string "take me with speed..like the flash"
 * var checkvalue = "<div>take me with speed..</div><div>like the flash</div>
 * var returnedValue = speedctx.removeHtml(checkvalue);
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
 * The numberWithCommas function returns numbers with comma seperation
 * @param {Int} numberToConvert the parameter supplies the number to add the commas to
 * @returns {String} the result output.
 */
Speed.prototype.numberWithCommas = function (numberToConvert) {
    return numberToConvert.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

/**
 * The returnValidFileName function returns a valid file name or error codes (0) for invalid file extensions , 1 for mulitple fullstops
 * @param {String} val the parameter supplies the file name
 * @returns {String} the result output.
 */
Speed.prototype.returnValidFileName = function (val) {
    var returnStr;
    var result = val.replace(/_|#|\\|\/|-\ |\(|\)|\&|\@|\!|\$|\%|\^|\*|\+|\=|\[|\]|\{|\}|\'|\"|\<|\>|\?|/g, '');
    var meko = (result.match(/\./g) || []).length;
    if (meko == 1) {
        var splitedStr = result.split(".");
        if (splitedStr[1].length <= 4)
            returnStr = result;
        else
            returnStr = "0";
    }
    else
        returnStr = "1";
    return returnStr;
}
//------------------------------
/**
 * The clearFileInput function clears file input for all browsers
 * @param {node} elementObj the parameter supplies the element node
 */
Speed.prototype.clearFileInput = function (elementObj) {
    try {
        elementObj.value = null;
    }
    catch (ex) { }
    if (elementObj.value) {
        elementObj.parentNode.replaceChild(elementObj.cloneNode(true), elementObj);
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
    var formatToUse = (typeof dateFormat === "undefined") ? "day" : dateFormat;
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
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
 * GLOBAL METHOD
 * String Object Extension to return a  name which excludes the other name properties  attached with sharepoint
 * @returns String  name of the user, excludes the other name properties  attached with sharepoint
 */
String.prototype.SPNameFromTitle = function () {
    var valueToReturn;
    try {
        valueToReturn = this.toString().split("[")[0];
    }
    catch (e) {
        valueToReturn = this.toString();
    }
    return valueToReturn;
}
/**
 * GLOBAL METHOD
 * String Object Extension to return a login name which excludes the domain name
 * @returns String login name of the user, excludes the domain name
 */
String.prototype.SPLoginFromFullLogin = function () {
    var returnSplit = "";
    try {
        returnSplit = this.toString().split("\\")[1];
    }
    catch (e) {
        returnSplit = this.toString();
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
    }
    catch (e) {
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
    }
    catch (e) {
        returnSplit = this.toString();
    }
    return returnSplit;
}

Speed.prototype.formatStringJSON = function (val, stringType) {
    var typeToUse = (typeof stringType == "undefined") ? "Array" : stringType;
    if (val == null || val === "") {
        if (typeToUse == "Array")
            return "[]";
        else
            return "{}";
    }
    else {
        return val;
    }
}

/*============================= Email Section =========================*/
/**
 * The sendSPEmail function sends email to to users sync with sharepoint userprfile (within the organisation)
 * @param {String} from the from address
 * @param {String} to the to address 
 * @param {String} body the content of the email
 * @param {array} [cc= []] the copy mails , an array of strings
 * @param {String} subject the subject of the mail
 * @param {function} callBack this parameter is the call back function thats called when the function is successful or failed
 * @param {String} [relative = "Currentpage url is used"] this parameter changes the location of the SP utility API
 * @returns {string} this parameter is passed to the callBack function as the first parameter, the string indicates if the function call was successful
 * @returns {object} this parameter is passed to the callBack function as the second parameter, object provides the data for the send email call
 */
Speed.prototype.sendSPEmail = function (from, to, body, cc, subject, callBack, relative) {
    //Get the relative url of the site
    var urlToUSe = (typeof relative === 'undefined') ? true : relative;
    var ccAddress = (cc === null) ? [] : cc;
    var urlTemplate;
    if (urlToUSe) {
        urlTemplate = _spPageContextInfo.webServerRelativeUrl;
        urlTemplate = urlTemplate + "/_api/SP.Utilities.Utility.SendEmail";
    }
    else {
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
                'From': from,
                'To': {
                    'results': to
                },
                'CC': {
                    'results': ccAddress
                },
                'Body': body,
                'Subject': subject
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
/*
* Same Parameters with SendSPEmail but the to array contains string of the full login name
*/
Speed.prototype.sendSPEmailByLogin = function(from, to, body, cc, subject,onSuccess,relative) {
    //Get the relative url of the site
    var urlToUSe = (typeof relative === 'undefined') ? true : relative;
    var urlTemplate;
    if(urlToUSe){
        urlTemplate = _spPageContextInfo.webServerRelativeUrl;					        
        urlTemplate = urlTemplate + "/_api/SP.Utilities.Utility.SendEmail";
    }
    else{
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
					       'From': from,
					       'To': {
					           'results': to
					       },
					       'CC' : {
					           'results': cc
					       },
					       'Body': body,
					       'Subject': subject,
					       'AdditionalHeaders': {
		                        '__metadata': {  
		                            'type':'Collection(SP.KeyValue)'
		                         },
		                         'results':
		                         [ 
		                          {               
		                            "__metadata": {
		                            "type": 'SP.KeyValue'
		                            },
		                            "Key": "Content-Type",
		                            "Value": 'text\\html',
		                            "ValueType": "Edm.String"
		                           }
		                         ]
	                      	}
				    }
        }),
        headers: {
				"Accept": "application/json;odata=verbose",
				"content-type": "application/json;odata=verbose",
				"X-RequestDigest": $("#__REQUESTDIGEST").val()
        },
        success: function (data) {
				setTimeout(function () {
                    onSuccess("success",data);
                }, 1500)
        },
        error: function (err) {
				setTimeout(function () {
                    onSuccess("error",err);
                }, 1500)
        }
    });
}

/* ============================== People Picker Section ============================*/
/**
 * The initializePeoplePicker function initializes a people picker
 * @param {String} peoplePickerElementId this parameter specifices the div to be transform to a people picker
 * @param {String} properties this parameter specifices the properties of the people picker
 * @param {function} [setUpCall = function(){}] this parameter is the call back function thats called if you need to retrieve the people picker dictionary
 * object to set eventhandler or retrieve values
 * @returns {object} the sharepoint people picker dictionary object is passed to the setUpCall function as a parameter if the setup call is defined
 */
Speed.prototype.initializePeoplePicker = function (peoplePickerElementId, properties, setUpCall) {
    var princpalAccount = 'User,DL,SecGroup,SPGroup';
    var width;
    var multipleValues;
    var resolvePrincipalSource;
    var serachPrincipalSource;
    var maxSuggestions;
    if (typeof properties === 'undefined') {
        resolvePrincipalSource = 15;
        serachPrincipalSource = 15;
        multipleValues = false;
        maxSuggestions = 50;
        width = "280px";
    }
    else {
        width = (typeof properties.width === 'undefined') ? '280px' : properties.width;
        resolvePrincipalSource = (typeof properties.resolvePrincipalSource === 'undefined') ? 15 : properties.resolvePrincipalSource;
        serachPrincipalSource = (typeof properties.serachPrincipalSource === 'undefined') ? 15 : properties.serachPrincipalSource;
        multipleValues = (typeof properties.multipleValues === 'undefined') ? false : properties.multipleValues;
        maxSuggestions = (typeof properties.maxSuggestions === 'undefined') ? 50 : properties.maxSuggestions;
    }
    var schema = {};
    schema['PrincipalAccountType'] = princpalAccount;
    schema['SearchPrincipalSource'] = serachPrincipalSource;
    schema['ResolvePrincipalSource'] = resolvePrincipalSource;
    schema['AllowMultipleValues'] = multipleValues;
    schema['MaximumEntitySuggestions'] = maxSuggestions;
    schema['Width'] = width;
    // Render and initialize the picker.
    // Pass the ID of the DOM element that contains the picker, an array of initial
    // PickerEntity objects to set the picker value, and a schema that defines
    // picker properties.
    SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
    if (typeof setUpCall !== "undefined") {
        setTimeout(function () {
            var createdUserObject = this.SPClientPeoplePicker.SPClientPeoplePickerDict[(peoplePickerElementId + '_TopSpan')];
            setUpCall(createdUserObject);
        }, 1000);
    }
};

/* ============================== People Picker Section ============================*/
/**
 * The getUsersFromPicker function gets users from a people picker synchronously
 * @param {Object} peoplePickerControl this parameter provides the people picker dictionary object to retrieve the users from
 * @returns {object} a sharepoint user object manager
 */
Speed.prototype.getUsersFromPicker = function (peoplePickerControl) {
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var people = peoplePickerControl;
    var userManager = null;
    try {
        userManager = people.GetAllUserInfo();
    }
    catch (e) {
    }
    return userManager;
}

/**
 * The getUsersFromPicker function gets users from a people picker Asynchronously
 * @param {Object} peoplePickerControl this parameter provides the people picker dictionary object to retrieve the users from
 * @param {function} onSuccess this parameter is the call back function thats called when the users details where retrieved successfully
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} an array of sharepoint user objects
 */
Speed.prototype.getUsersFromPickerAsync = function (peoplePickerControl, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var userDetails = [];
    var ctx = this.initiate();
    var people = peoplePickerControl;
    var userManager = people.GetAllUserInfo();
    if (!jQuery.isEmptyObject(userManager)) {
        // Get the first user's ID by using the login name.
        for (var x = 0; x <= (userManager.length - 1) ; x++) {
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
    }
    else onSuccess(null);
}

/**
 * The setPeoplePickerValue function sets a user value for a people picker
 * @param {Object} peoplePickerObj this parameter provides the people picker dictionary object which the user will be set
 * @param {String} userLogin this parameter provides the login of the user that will be set
 */
Speed.prototype.setPeoplePickerValue = function (peoplePickerObj, userLogin) {
    var peoplePicker = peoplePickerObj
    var usrObj = { 'Key': userLogin };
    peoplePicker.AddUnresolvedUser(usrObj, true);
}

/**
 * The clearPicker function clears the value of a people picker
 * @param {Object} people this parameter provides the people picker dictionary object which is to be cleared
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
 * The currentUserDetails function gets current logged in user details
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {object} a sharepoint user object
 */
Speed.prototype.currentUserDetails = function (callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
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
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {object} a sharepoint user object
 */
Speed.prototype.getUserById = function (usId, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var ctxt = this.initiate();
    var ccbUser = ctxt.get_web().getUserById(usId);
    //runtime method
    ccbUser.retrieve();
    ctxt.load(ccbUser);
    ctxt.executeQueryAsync(function () {
        setTimeout(function () {
            callback(ccbUser);
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
}

/**
 * The getUserById function gets a user by its login
 * @param {string} loginName the user login name
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {object} a sharepoint user object
 */
Speed.prototype.getUserByLoginName = function (loginName, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var context = this.initiate();
    var userObject = context.get_web().ensureUser(loginName);
    //runtime method 
    userObject.retrieve();
    context.load(userObject);
    context.executeQueryAsync(
         setTimeout(function () {
             onSuccess(userObject);
         }, 1000),
                Function.createDelegate(this, onFailedCall));
}

/**
 * The getCurrentUserProperties function gets the current user UserProfile Properties
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {object} a sharepoint user UserProfile Properties
 */
Speed.prototype.getCurrentUserProperties = function (callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var clientContext = this.initiate();
    var peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
    var userProfileProperties = peopleManager.getMyProperties();
    clientContext.load(userProfileProperties);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(userProfileProperties)
        }, 1000);
    }, Function.createDelegate(this, onFailedCall));
};

/**
 * The getSpecificUserProperties function gets a user UserProfile Properties by login name
 * @param {String} acctname the login of the user which you want to obtain its properties
 * @param {array} profilePropertyNames an array of strings containing the properties you want to retrieve
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {object} a sharepoint user UserProfile Properties
 */
Speed.prototype.getSpecificUserProperties = function (acctname, profilePropertyNames, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
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
 * @param {String} description the brief description of the list
 * @param {object} properties the group properties object
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.createSPGroup = function (title, description, properties, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var assignDefinition = (typeof properties.assigndefinition !== 'undefined') ? properties.assigndefinition : false;
    var roleDefinition = (typeof properties.roledefinition !== 'undefined') ? properties.roledefinition : null;

    var allowMemberEdit = (typeof properties.allowMembersEdit !== 'undefined') ? properties.allowMembersEdit : false;
    var everyoneView = (typeof properties.everyone !== 'undefined') ? properties.everyone : false;

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
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} an array of object with properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 */
Speed.prototype.retrieveAllUsersInGroup = function (group, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
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
            prop.logon = oUser.get_loginName();
            users.push(prop);
        }
        callback(users);
    }
    , Function.createDelegate(this, onFailedCall));
}
//-----------reterieve all users in a group 2013----------
/**
 * The allUsersInGroup function gets all users in a sharepoint group
 * @param {String} group the group which users will be retrieved from
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} a sharepoint userCollection object (more info about this user is present in this object)
 */
Speed.prototype.allUsersInGroup = function (group, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var users = [];
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
    }
    , Function.createDelegate(this, onFailedCall));
}

/**
 * The allUsersInGroup2010 function gets all users in a sharepoint group. this function works for sharepoint 2010 but its not an optimized option.
 * @param {String} group the group which users will be retrieved from
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} an array of object with properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 */
Speed.prototype.allUsersInGroup2010 = function (groupName, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var users = [];
    var context = this.initiate();
    var currentWeb = context.get_web();
    var allGroups = currentWeb.get_siteGroups();
    context.load(allGroups);
    context.executeQueryAsync(
       function () {
           var count = allGroups.get_count();
           for (var i = 0; i <= (parseInt(count) - 1) ; i++) {
               var grp = allGroups.getItemAtIndex(i);
               //provide your group name
               if (grp.get_loginName() == groupName) {
                   window.speedGlobal.push(grp.get_users());
                   var total = window.speedGlobal.length;
                   total--;
                   //load users of the group
                   context.load(window.speedGlobal[total]);
                   context.executeQueryAsync(function () {
                       var userEnumerator = window.speedGlobal[total].getEnumerator();
                       while (userEnumerator.moveNext()) {
                           var prop = {};
                           var oUser = userEnumerator.get_current();
                           prop.title = oUser.get_title();
                           prop.id = oUser.get_id();
                           prop.email = oUser.get_email();
                           prop.logon = oUser.get_loginName();
                           users.push(prop);
                       }
                       callback(users);
                   }, Function.createDelegate(this, onFailedCall));
               }
           }
       }, Function.createDelegate(this, onFailedCall));
}

/**
 * The retrieveMultipleGroupUsers function gets all users in different sharepoint group. this function works for sharepoint 2010 but its not an optimized option.
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} an array of object with properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 */
Speed.prototype.retrieveMultipleGroupUsers = function (groupCollection, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var users = [];
    var globalContextCount = [];
    if (typeof groupCollection !== 'undefined') {
        var groupFound = 0;
        var groupsAvail = false;
        var groupNames = groupCollection.split(";");
        for (var i = 0; i <= (groupNames.length - 1) ; i++) {
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
                        prop.logon = oUser.get_loginName();
                        var userExist = false
                        for (var y = 0; y <= (users.length - 1) ; y++) {
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
            }
            , Function.createDelegate(this, onFailedCall));
        }
        //callback called if no group was foud
        if (groupFound == 0 && !groupsAvail) {
            callback(users);
        }
    }
    else {
        callback(users);
    }
}
//---------Checks if user is a member of a group---------------
Speed.prototype.isUserMemberOfGroup = function (group, bywat, userDetailsTocheck, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var boolVal = false;
    var end = false
    this.retrieveAllUsersInGroup(group, function (speedInternalGroupObj) {
        for (var x in speedInternalGroupObj) {
            if (typeof bywat !== 'undefined' && typeof value !== 'undefined') {
                if (bywat == 'id') {
                    if (speedInternalGroupObj[x].id == userDetailsTocheck) {
                        boolVal = true;
                        break;
                    }
                }
                else if (bywat == 'login') {
                    try {
                        if (speedInternalGroupObj[x].logon.toLowerCase() == userDetailsTocheck.toLowerCase()) {
                            boolVal = true;
                            break;
                        }
                    }
                    catch (e) { }
                }
                else if (bywat == 'email') {
                    try {
                        if (speedInternalGroupObj[x].email.toLowerCase() == userDetailsTocheck.toLowerCase()) {
                            boolVal = true;
                            break;
                        }
                    }
                    catch (e) { }
                }
            }
        }
        callback(boolVal);
    }, onFailedCall);
}
/* ============================== Document Library Section ============================*/
//----converts data URI to Base 64------//
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
//------------------create a folder in document Libary---------
/**
 * The createFolder function creates a folder in a document library
 * @param {String} foldername the name of the folder that should be created
 * @param {String} library the title of the library which the folder will be created
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {object} sharepoint folder object returned
 */
Speed.prototype.createFolder = function (foldername, library, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
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
 * The deleteFolderOrFile function deletes folder from Libary
 * @param {String} foldername the name of the folder that should be created
 * @param {String} library the title of the library which the folder will be created
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} sharepoint folder object returned
 */
Speed.prototype.deleteFolderOrFile = function (folderDocUrl, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
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
 * The uploadFile function uploades a file to a folder in a Libary or directly to a library itself
 * @param {String} nameOfFile the name of the file to be uploaded
 * @param {String} dataOfFile the dataURI of the file 
 * @param {String} folder the folder where the file will be uploaded
 * @param {String} filetype the filetype of the file, null should passed if file is not txt
 * @param {function} onSuccess this parameter is the call back function when the function is successful
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} sharepoint file object returned
 */
Speed.prototype.uploadFile = function (nameOfFile, dataOfFile, folder, filetype, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
    var ctx2 = this.initiate();
    if (filetype != "txt")
        var data = this.convertDataURIToBinary(dataOfFile);
    else
        var data = dataOfFile;
    var attachmentFolder = ctx2.get_web().getFolderByServerRelativeUrl(folder);
    var fileCreateInfo = new SP.FileCreationInformation();
    fileCreateInfo.set_url(nameOfFile);
    fileCreateInfo.set_overwrite(true);
    fileCreateInfo.set_content(new SP.Base64EncodedByteArray());
    for (var i = 0; i < data.length; ++i) {
        if (filetype != "txt")
            fileCreateInfo.get_content().append(data[i]);
        else
            fileCreateInfo.get_content().append(data.charCodeAt(i));
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

//=========================upload multiple files ===============================
/**
 * The uploadFile function uploades a file to a folder in a Libary or directly to a library itself
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {String} folderUrl the folder url where the files will be uploaded to 
 * @param {String} fileCount the index of the file object to start in the array
 * @param {function} feedBack the feedback function is called after each file has been uploaded successfully
 * @param {function} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} percentage upload (Int) as the first parameter, sharepoint file object returned as a second parameter
 */
Speed.prototype.uploadMultipleFiles = function (speedContext,fileArr, folderUrl, fileCount, feedBack, onSuccess, onFailed, appContext) {
    speedContext.uploadFile(fileArr[fileCount].dataName, fileArr[fileCount].dataURI, folderUrl, null, function (fileDetails) {
        var totalFiles = fileArr.length;
        var newNumber = parseInt(fileCount) + 1;
        var completed = (newNumber / totalFiles) * 100;
        feedBack(parseInt(completed), fileDetails);
        if (completed == 100) {
            onSuccess();
        }
        else {
            speedContext.uploadMultipleFiles(speedContext,fileArr, folderUrl, newNumber, feedBack, onSuccess, onFailed, appContext);
        }
    }, onFailed, appContext);
}

//=============================read data from text file ========================
Speed.prototype.readFile = function (fileurlPassed, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
    var ctx = this.initiate();
    var oWebsite = ctx.get_web();
    if (typeof appContext !== 'undefined') {
        ctx = appContext.initiate();
    }
    ctx.load(oWebsite);
    ctx.executeQueryAsync(function () {
        var fileUrl = fileurlPassed;
        $.ajax({
            url: fileUrl,
            type: "GET"
        })
        .done(Function.createDelegate(this, onSuccess))
        .error(Function.createDelegate(this, onFailedCall));
    }, onFailedCall);
}

//------------------------check if file exist in documnet library---------------------
Speed.prototype.getFileExists = function (fileUrl, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.onQueryFailed : onFailed;
    var ctx = this.initiate();
    var file = ctx.get_web().getFileByServerRelativeUrl(fileUrl);
    if (typeof appContext !== 'undefined') {
        ctx = appContext.initiate();
    }
    ctx.load(file);
    ctx.executeQueryAsync(function () {
        onSuccess(true);
    },
    function (sender, args) {
        if (args.get_errorTypeName() === "System.IO.FileNotFoundException") {
            onSuccess(false);
        }
        else {
            onFailedCall(sender, args);
        }
    });
}

/**
 * The uploadFile function uploades a file to a folder in a Libary or directly to a library itself
 * @param {object} speedContext the SPcontext where the log will be written to
 * @param {string} fileName the name of the log file
 * @param {string} logContent the content of the log file
 * @param {string} library the library where the log file will be saved
 * @param {String} libraryUrl the library url where the files will be uploaded to 
 * @param {int} logLimit the log file size limit before another log is created
 * @param {function} callback this parameter is the call back function when the logis successfully written to the document library
 * @param {function} [onFailed = function(){}] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * @returns {object} percentage upload (Int) as the first parameter, sharepoint file object returned as a second parameter
 */
Speed.prototype.logWriter = function (speedContext, fileName, logContent, library, libraryUrl, logLimit, callback, onFailed, appContext) {
    var query = [{ orderby: "ID", rowlimit: 1, ascending: "FALSE" }];
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
        if (logsCount == 0 || itemDetails.size > logLimit) {
            //this logs of file if no log text file is present or if the log is greater than 20mb
            speedContext.uploadFile(fileName, logContent, libraryUrl, "txt", callback, onFailed, appContext);
        }
        else {
            speedContext.readFile(itemDetails.url, function (data) {
                data += logContent;
                speedContext.uploadFile(itemDetails.name, data, libraryUrl, "txt", callback, onFailed, appContext);
            }, function (err) {
                setTimeout(function () {
                    onFailed(err);
                }, 1000);
            })
        }
    });
}

/* ============================== Debugging Section  ============================*/
//--------when any query fails this method is called -----------
Speed.prototype.onQueryFailed = function(sender, args){
        var error = {};
        error.msg = args.get_message();
        error.trace = args.get_stackTrace();
        console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
}

//work in progress
Speed.prototype.scriptCacheDebugger = function (scriptToCheck,callBack) {
    if(window["localStorage"]){
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
        if(scriptTag !== null){
            var xhr = new XMLHttpRequest();
            xhr.open('GET', scriptTag.src, true);
            xhr.responseType = 'text';
            xhr.onload = function(e) {
                if (this.status == 200) {
                    // Note: .response instead of .responseText
                    var fileInBytes = this.getResponseHeader('Content-Length');
                    if(lastFileSize !== null){
                        if(fileInBytes.toString() !== lastFileSize){
                            returnObject.fileChanged = true;
                            returnObject.previousSize = lastFileSize;
                            returnObject.currentSize = fileInBytes;
                            var versionNo = lastFileVersion;
                            versionNo = versionNo.replace(/\./g, '');
                            versionNo = parseInt(versionNo) + 1;
                            versionNo = versionNo.toString();
                            var newVersionNo = "";
                            for(var x = 0; x <= (versionNo.length - 1); x++){
                                if((versionNo.length - 1) == x)
                                    newVersionNo += versionNo[x];
                                else
                                    newVersionNo += versionNo[x] + ".";
                            }
                            returnObject.version = newVersionNo;

                            localStorage.setItem("speed" + scriptToCheck + "size",fileInBytes);
                            localStorage.setItem("speed" + scriptToCheck + "version", newVersionNo);
                        }
                        else{
                            returnObject.fileChanged = false;
                            returnObject.previousSize = fileInBytes;
                            returnObject.currentSize = fileInBytes;
                            returnObject.version = lastFileVersion;
                        }
                    }
                    else{
                        localStorage.setItem("speed" + scriptToCheck + "size",fileInBytes);
                        localStorage.setItem("speed" + scriptToCheck + "version", "1.0.0.0");
                        returnObject.fileChanged = false;
                        returnObject.previousSize = fileInBytes;
                        returnObject.currentSize = fileInBytes;
                        returnObject.version = "1.0.0.0";
                    }
                    if(typeof callBack !== "undefined"){
                        callBack(returnObject);
                    }
                }
            };
            xhr.send();
        }
    }
    else{
        console.warn("Script debugger function only works with local storage.....");
    }
}


/* ============================== Table Section ============================*/
/**
 * Exports a List to an Table. Creates the TBody content of a list based on the query
 * @param {String} SpeedContext the speedpoint object
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {Function} conditions this parameter includes special conditions for each object properties, condition must return an object
 * @param {Function} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * @param {function} [onFailed = function] this parameter is the call back function thats called when the function fails, by default onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = Object] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToTable = function (SpeedContext, listName, caml, controls, conditions,onSuccess, onFailed, appContext) {
    SpeedContext.DataForTable.lastPageItem = SpeedContext.DataForTable.currentPage * SpeedContext.DataForTable.pagesize;
    this.getListToItems(SpeedContext, listName, caml, controls,true, conditions, function (requestItems) {
        //gets only table controls
        var tableControls = SpeedContext.getControls(true);
        SpeedContext.DataForTable.tabledata = requestItems;
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
                str += "<tr>";
                if(SpeedContext.DataForTable.includeSN){
                    str += "<td>" + (x + 1) + "</td>";
                }
                for (var propName in Arr[x]) {
                    if($.inArray(propName, tableControls) >= 0){
                        if(SpeedContext.DataForTable.propertiesHandler.hasOwnProperty(propName)){
                            str += "<td>" + SpeedContext.DataForTable.propertiesHandler[propName](Arr[x]) + "</td>";
                        }
                        else
                            str += "<td>" + Arr[x][propName] + "</td>";
                    }
                }
                str += "</tr>";
            }
            $('#' + SpeedContext.DataForTable.tablecontentId).append(str);
            SpeedContext.DataForTable.paginateLinks(1, SpeedContext.DataForTable.paginateSize,SpeedContext.DataForTable);
            $("#pageBack").hide();
            $("#pageBackUp").hide();
            if (SpeedContext.DataForTable.noOfPages <= SpeedContext.DataForTable.paginateSize) {
                $("#pageFront").hide();
                $("#pageFrontUp").hide();
            }
        }
        else {
            $('#' + SpeedContext.DataForTable.tablecontentId).empty();
        }
        onSuccess(SpeedContext.DataForTable.tabledata);
    }, onFailed, appContext);
}

Speed.prototype.DataForTable = {
    tabledata : [],
    noOfPages : 0,
    currentPage : 1,
    pagesize : 30,
    paginateSize : 5,
    currentPos : 1,
    lastPageItem : 0,
    activeClass : "",
    tablecontentId : "",
    includeSN : true,
    //this is responsible for paginating the table
    paginateLinks : function(srt, end,settings) {
        $("#noOfPages").empty();
        $("#noOfPagesUp").empty();
        if (end > settings.noOfPages) {
            end = settings.noOfPages;
        }
        $("#noOfPages").append("<li> <a id=\"pageBack\" class='"+ settings.tablecontentId +"-move'><<</a> </li>");
        $("#noOfPagesUp").append("<li> <a id=\"pageBackUp\" class='"+ settings.tablecontentId +"-move'><<</a> </li>");
        for (srt; srt <= end; srt++) {

            if (srt == settings.activeClass) {
                $("#noOfPages").append("<li class=\"lin" + srt + " active\"> <a class='"+ settings.tablecontentId +"'>" + srt + "</a> </li>");
                $("#noOfPagesUp").append("<li class=\"lin" + srt + " active\"> <a class='"+ settings.tablecontentId +"'>" + srt + "</a> </li>");
            }
            else {
                $("#noOfPages").append("<li class=\"lin" + srt + "\"> <a class='"+ settings.tablecontentId +"'>" + srt + "</a> </li>");
                $("#noOfPagesUp").append("<li class=\"lin" + srt + "\"> <a class='"+ settings.tablecontentId +"'>" + srt + "</a> </li>");
            }
        }
        $("#noOfPages").append("<li> <a id=\"pageFront\" class='"+ settings.tablecontentId +"-move'>>></a> </li>");
        $("#noOfPagesUp").append("<li> <a id=\"pageFrontUp\" class='"+ settings.tablecontentId +"-move'>>></a> </li>");
        $("."+ settings.tablecontentId).click(function() {
            settings.nextItems($(this).text(),settings);
        });

        $("."+ settings.tablecontentId + "-move").click(function() {
            settings.moveLinks(this.id,settings);
        });
    },
    //this is responsible for showing the next items the table
    nextItems: function(id,settings) {
        if (settings.tabledata.length != 0) {
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
            var str ="";
            for (previousItem; previousItem < nextPageItem; previousItem++) {
                str += "<tr>";
                if(settings.includeSN){
                    str += "<td>" + (previousItem + 1) + "</td>";
                }
                for (var propName in settings.tabledata[previousItem]) {
                    if(settings.propertiesHandler.hasOwnProperty(propName)){
                        str += "<td>" + settings.propertiesHandler[propName](settings.tabledata[previousItem]) + "</td>";
                    }
                    else
                        str += "<td>" + settings.tabledata[previousItem][propName] + "</td>";
                }
                str += "</tr>";
            }
            $('#' + settings.tablecontentId).append(str);
        }
    },
    //this is responsible for moving to the new set of links
    moveLinks : function (id,settings) {
        id = id.slice(0, 9);
        if (id == "pageFront") {
            settings.currentPos = settings.currentPos + settings.paginateSize;
            var startPos = settings.currentPos;
            var endPos = startPos + settings.paginateSize - 1;
            if (endPos >= settings.noOfPages) {
                endPos = settings.noOfPages;
            }
            settings.paginateLinks(startPos, endPos, settings);
            $("#pageBack").show();
            $("#pageBackUp").show();
            if (endPos >= settings.noOfPages) {
                $("#pageFront").hide();
                $("#pageFrontUp").hide();
            }
        }
        else {
            settings.currentPos = settings.currentPos - settings.paginateSize;
            var startPos = settings.currentPos;
            var endPos = startPos + settings.paginateSize - 1;
            if (startPos <= 1) {
                startPos = 1;
                currentPos = 1;
            }
            settings.paginateLinks(startPos, endPos, settings);
            $("#pageFront").show();
            $("#pageFrontUp").show();
            if (startPos <= 1) {
                $("#pageBack").hide();
                $("#pageBackUp").hide();
            }
        }
    },
    propertiesHandler : {}
}