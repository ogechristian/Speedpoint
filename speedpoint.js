//Intellectual property of agabagwu christian 
//sharepoint jsom developer 
//
var Speed = Speed || {};

function Speed(cxt,bolval){
    this.debug = false;
    this.errors = [];
    this.stylePlace = false;
    this.dynamicVariable = 'speed';
    this.url = cxt;
    this.optional = bolval
    if(typeof window.speedGlobal === 'undefined')
        window.speedGlobal = [];
}

/* ============================== Set Up Section ============================*/
Speed.prototype.initiate = function () {
        if(typeof this.url === 'undefined'){
            var context = new SP.ClientContext.get_current();
            return context;
        }
        else{
            if(typeof this.url === 'boolean'){
                this.debug = this.url;
                var context = new SP.ClientContext.get_current();
                return context;
            }
            else{
                if(typeof this.url !== 'undefined' && typeof this.optional === 'boolean'){
                    this.debug = bolval;
                }
                var context = new SP.ClientContext(this.url);
                return context;
            }
        }
    };

/* ============================== Caml Builder Section ============================*/
//-----------------------used to build a caml query -------------------
Speed.prototype.camlBuilder = function(cal){
        var count = 0;
        var noOfFields = [];
        var noOfUsed = 0;
        var andCount = 0;
        var Arr = [];
        if(typeof cal !== 'undefined' && cal.length > 1){
            var usedtottal = cal.length - 1;
            for(i = 1; i <= usedtottal ; i++){
                noOfFields.push(cal[i].val);
                if(cal[i].val != ''){
                    noOfUsed++;
                    Arr.push(cal[i]);
                }
            }
            var total = Arr.length - 1;
            if(typeof cal[0].evaluator == 'undefined') cal[0].evaluator = 'And';
            var queryString = '<View><Query>';
            if(this.CheckNoofUsedFields(noOfFields, 'one')){
                queryString += '<Where>';
                for(i = 0; i <= total ; i++){
                    if(!this.CheckNoofUsedFields(noOfFields, 'onlyone') && (count == 0 || total - i >= 1)){
                        if(typeof Arr[i].evaluator != 'undefined'){
                            queryString += '<' + Arr[i].evaluator + '>';
                            lastEvaluator = Arr[i].evaluator;
                        }
                        else
                            queryString += '<' + cal[0].evaluator + '>';
                        andCount++;
                    }
                    if(typeof Arr[i].support != 'undefined')
                        queryString += "<" + Arr[i].operator +"><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\' " + Arr[i].support.title + "=\'" +  Arr[i].support.value + "\'>"+ Arr[i].val + "</Value></"+ Arr[i].operator +">";
                    else if(typeof Arr[i].author != 'undefined')
                        queryString += "<" + Arr[i].operator +"><FieldRef Name=\'" + Arr[i].field + "\' " + Arr[i].author.title + "=\'" +  Arr[i].author.value + "\' /><Value Type=\'" + Arr[i].type + "\'>"+ Arr[i].val + "</Value></"+ Arr[i].operator +">";
                    else
                        queryString += "<" + Arr[i].operator +"><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\'>"+ Arr[i].val + "</Value></"+ Arr[i].operator +">";
                    count++;
                }
                for(x = (andCount-1); x >= 0; x--){
                    if(typeof Arr[x].evaluator != 'undefined')
                         queryString += '</' + Arr[x].evaluator + '>';
                    else
                         queryString += '</' + cal[0].evaluator + '>';
                }
                queryString += '</Where>';
            }
            if(typeof cal[0].ascending != 'undefined' && typeof cal[0].orderby != 'undefined')
                queryString += '<OrderBy><FieldRef Name=\'' + cal[0].orderby + '\' Ascending="'+ cal[0].ascending +'" /></OrderBy>';
            queryString += '</Query>';

            if(typeof cal[0].rowlimit != 'undefined')
                queryString += '<RowLimit>' + cal[0].rowlimit + '</RowLimit>';
            queryString += '</View>';
        }
        else{
            var queryString = '<View><Query>';
            if(typeof cal != 'undefined'){
                if(typeof cal[0].ascending != 'undefined' && typeof cal[0].orderby != 'undefined')
                    queryString += '<OrderBy><FieldRef Name=\'' + cal[0].orderby + '\' Ascending="'+ cal[0].ascending +'" /></OrderBy>';
            }
            queryString += '</Query>';
            if(typeof cal != 'undefined'){
                if(typeof cal[0].rowlimit != 'undefined')
                    queryString += '<RowLimit>' + cal[0].rowlimit + '</RowLimit>';
            }
            queryString += '</View>';
        }
        return queryString;
    };
    
//-----------------required function for caml builder -------------------
 Speed.prototype.CheckNoofUsedFields = function(Arr,val){
        if(val == 'one'){
            var oneE = false;
            for(x in Arr){
                if(this.checkNull(Arr[x]) != '')
                    oneE = true;
            }
            return oneE;
        }
        if(val == 'onlyone'){
            var count = 0;
            var oneE = false;
            for (y = 0; y <= Arr.length - 1 ; y++){
                if(this.checkNull(Arr[y]) != '')
                    count++;
            }
            if(count == 1){
                oneE = true;
            }
            return oneE;
        }
    };
    
/* ============================== Validation Section ============================*/

//------------validate a field -----------------
Speed.prototype.validateField = function(field,msg,fieldType,id,bool){
        var opt = (typeof fieldType === 'undefined') ? 'text' : fieldType;
        var optid = (typeof id === 'undefined') ? '' : id;
        var optbool = (typeof bool === 'undefined') ? false : bool;
        if($.type(optid) === 'boolean'){
            optbool = optid;
        }
        if($.type(opt) === 'boolean'){
            optbool = opt;
        }
        if(opt == 'number'){
            if(isNaN(field) || field == ""){
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if(opt == 'phonenumber'){
            var passed = false;
            if (field.length == 11 || field.length == 13) passed = true;
            if (isNaN(field) || !passed) {
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if(opt == 'acctno'){
            if(field.length > 10 || field.length < 10 || field.trim() == '' || isNaN(field)){
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if(opt == 'radio'){
            if(typeof field === 'undefined'){
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);  
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if(opt == 'select'){
            if(field == ''){
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if(opt == 'object'){
            if(field == ''){
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if(opt == 'ip'){
            var patt = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
            if(!patt.test(field)){
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else if (opt == 'email') {
            var patt = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
            if (!patt.test(field)) {
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if (!optbool) {
                    this.errors.push(emptyField);
                }
                else {
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if (optid != '' && $.type(optid) !== 'boolean') {
                    $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        else {
            var checkValue = "";
            try{
                checkValue = field.trim();
            }
            catch(e){}
            if (checkValue == '') {
                var emptyField = {};
                emptyField.id = id;
                emptyField.msg = msg;
                if(!optbool) {
                    this.errors.push(emptyField);
                }
                else{
                    this.errors.push(emptyField);
                    alert(msg);
                }
                if(optid != '' && $.type(optid) !== 'boolean'){
                        $("#" + optid).addClass("speedhtmlerr");
                }
            }
        }
        if(optbool && !this.stylePlace) this.styleErrors();
    };

//--------clear validation errors ------
Speed.prototype.clearErrors = function (){
        this.errors = [];
        $(":input,div,tr").removeClass("speedhtmlerr");
    }

//------ create your own custom error styles -------
Speed.prototype.styleErrors = function(mystyle){
    if(!this.stylePlace){
        if(typeof mystyle === 'undefined')
            $("head").append("<style>.speedhtmlerr {border-style : solid !important;border-color:red !important;border-width:1px}</style>");
        else{
            //-----work on this later -------
            $("head").append("<style>.speedhtmlerr" + mystyle + "</style>");
        }
        this.stylePlace = true;
    }
}

//------------
Speed.prototype.validationAlert = function(values,optBool){
        var str = '';
        var condition = (typeof optBool === 'undefined') ? true : optBool;
        for(x in values) {
            if (typeof values[x].id !== 'undefined'){
                if ($('#' + values[x].id).attr('type') == "text") {
                    $("#" + values[x].id).addClass("speedhtmlerr");
                }
                else if (values[x].id == 'files') {
                    //-----work on this later -------
                    alert("please upload an image");
                }
                else {
                    $("#" + values[x].id).addClass("speedhtmlerr");
                }
            }
            else{
                console.log('This object doesnt have an id');
            }
        }
        if(!condition && typeof condition === 'boolean') {
            str = values[0].msg;
        }
        else if(typeof condition === 'string'){
            str = condition;
        }
        else{
            for(x in values){
                str += values[x].msg + '\n';
            }
        }
        this.styleErrors();
        return str;
    };
//------------check if the validation was succesful -------------
Speed.prototype.checkPassedValidation = function(){
        if(this.errors.length == 0){
            return true;
        }
        else
            return false;
    };

//========================== SpeedPoint Binding Section =======================
Speed.prototype.bind = function(listObjects,staticBind){
    var bindStaticFields = (typeof staticBind === 'undefined') ? true : optBool;
    var returnObject = {}
    if(typeof listObjects !== "undefined"){
        returnObject = listObjects
    }
    //decides if u want to bind static fields to objects
    //set this option to false if the static fields already contains the same values with the object
    if(bindStaticFields){
        var element = document.querySelectorAll("[speed-bind]");
        for(i = 0; i <= (element.length -1); i++){
            var property = element[i].getAttribute("speed-bind");
            if(element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea")
                returnObject[property] = element[i].value;
        }
    }
    
    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for(i = 0; i <= (elementValidate.length -1); i++){
    	var property = elementValidate[i].getAttribute("speed-bind-validate");
        var msg = elementValidate[i].getAttribute("speed-validate-msg");
        var inputtype = elementValidate[i].getAttribute("speed-validate-type");
        var inputid = elementValidate[i].getAttribute("id");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
        var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "text" : inputtype;
        if(elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "select" || elementValidate[i].tagName.toLowerCase() == "textarea"){
            returnObject[property] = elementValidate[i].value;
            this.validateField(returnObject[property],validationMessage,validationtype,inputid,false);
        }
    }
    return returnObject;
}

Speed.prototype.htmlBind = function(listObjects){
    for (var key in listObjects) {
        if (listObjects.hasOwnProperty(key)) {
            var element = document.querySelectorAll("[speed-bind='" + key + "']");
            if(element.length > 0){
                for(i = 0; i <= (element.length -1); i++){
                    if(element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea")
                        element[i].value = listObjects[key];
                    else
                        element[i].innerHTML = listObjects[key];
                }
            }
            else{
                element = document.querySelectorAll("[speed-bind-validate='" + key + "']");
                if(element.length > 0){
                    for(i = 0; i <= (element.length -1); i++){
                        if(element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea")
                            element[i].value = listObjects[key];
                        else
                            element[i].innerHTML = listObjects[key];
                    }
                }  
            }
        }
    }
}
    
/* ============================== List Section ============================*/
//---------------create list ------------------------------
Speed.prototype.createList = function (listProperties,onSuccess,onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
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
    if (setgroup) {
        var allGroups = oWebsite.get_siteGroups();
        context.load(allGroups);
        context.executeQueryAsync(
           function () {
               window.speedGlobal[total].breakRoleInheritance(false, true);
               var count = allGroups.get_count();
               for (i = 0; i <= (parseInt(count) - 1) ; i++) {
                   var grp = allGroups.getItemAtIndex(i);
                   //provide your group name
                   for (x in listProperties.group) {
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
        for (x in listProperties.users) {
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
Speed.prototype.createColumnInList = function (arr,listName, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
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
    context.load(genericList);
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess();
        }, 1000);
    }
     , Function.createDelegate(this, onFailedCall));
}

//----------------user must pass in an array,the listname an function for sucessfull call--------------
//---------the array most have an object which properties is the same as the list the are passing into the function-------------
 Speed.prototype.updateItems = function(arr,listName,onSuccess,onFailed){
 		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        if(typeof arr != 'undefined'){
            if(arr.length != 0){
                var context = this.initiate();
                var passwordList = context.get_web().get_lists().getByTitle(listName);
                context.load(passwordList);
                $.each(arr, function (i, itemProperties) {
                    var items = [];
                    items[i] = passwordList.getItemById(itemProperties.Id);
                    for(var propName in itemProperties) {
                        if(propName == "Existing" || propName == "Id"){
                        }
                        else{
                            items[i].set_item(propName, itemProperties[propName]);
                        }
                    }
                    items[i].update();
                });
                context.executeQueryAsync(onSuccess,Function.createDelegate(this, onFailedCall));
            }
        }
    };
//----------------user most pass in an array,the listname an function for sucessfull call--------------
//---------the array most have an object which properties is the same as the list the are passing into the function-------------
Speed.prototype.createItems = function(arr,listName,onSuccess,onFailed){
		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        if(typeof arr != 'undefined'){
            if(arr.length != 0){
            	var listitemArr = [];
                var context = this.initiate();
                var reqList = context.get_web().get_lists().getByTitle(listName);
                $.each(arr, function (i, itemProperties){
                    //if(itemProperties.Existing == "No"){
                    var itemCreateInfo = new SP.ListItemCreationInformation();
                    var listItem = reqList.addItem(itemCreateInfo);
                    for(var propName in itemProperties) {
                        if(propName != "Id"){
                            listItem.set_item(propName, itemProperties[propName]);
                        }
                    }
                    listItem.update();
                    context.load(listItem);
                    listitemArr.push(listItem);
                    //}
                });
                context.executeQueryAsync(function(){
                	setTimeout(function(){
	                    onSuccess(listitemArr);
	                },1000);
	             }
                ,Function.createDelegate(this, onFailedCall));
            }
        }
    };

//---------delete items in the specified list -------
 Speed.prototype.deleteItem = function(listname,id,onSuccess,onFailed){
 			var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
            var context = this.initiate();
            var oList = context.get_web().get_lists().getByTitle(listname);
            window.speedGlobal.push(oList.getItemById(id));
            var total = window.speedGlobal.length;
            total--;
            window.speedGlobal[total].deleteObject();
            context.executeQueryAsync(function(){
                setTimeout(function(){
                    onSuccess();
                },1000);
            }
            , Function.createDelegate(this, onFailedCall));
    };

//-----get items from the specified list --------
 Speed.prototype.getItem = function(listName,caml,onSuccess,onFailed){
 		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var context = this.initiate();
        var oList = context.get_web().get_lists().getByTitle(listName);
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml(caml);
        window.speedGlobal.push(oList.getItems(camlQuery));
        var total = window.speedGlobal.length;
        total--;
        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function(){
                setTimeout(function(){
                    onSuccess(window.speedGlobal[total]);
                },1000);
            }
            ,Function.createDelegate(this, onFailedCall));
    }
    
/* ============================== General Section ============================*/
//---------------------------get parameter name from query string ---------------------
Speed.prototype.getParameterByName = function(name, url) {
        if (!url) url = window.location.href;
        url = url.toLowerCase(); // This is just to avoid case sensitiveness
        name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();// This is just to avoid case sensitiveness for query parameter name
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
}

Speed.prototype.serverDate = function(){
    return new Date(new Date().getTime() + _spPageContextInfo.clientServerTimeDelta);
}
//--------------------------------stringnify date------------------
Speed.prototype.stringnifyDate = function(obj){
        if(typeof obj == "undefined") obj = {};
        if(typeof obj.value === 'undefined'){
            var str = this.serverDate();
        } 
        else
            var str = new Date(obj.value);

        if(typeof obj.includeTime == "undefined") var incTime = false;
        else
            var incTime = obj.includeTime;
            
        if(typeof obj.timeSpace == "undefined") obj.timeSpace = true;

        var year = str.getFullYear();
        var month = str.getMonth() + 1;
        var day = str.getDate();
        var hour = str.getHours();
        var minute = str.getMinutes();
        var second = str.getSeconds();
        if(month.toString().length == 1){
            month = '0' + month;
        }
        if(day.toString().length == 1){
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
        if(typeof obj.format != 'undefined'){
            var format = obj.format;
            var dayused, monthUsed,yearUsed = false;
             var getDelimiter = format.slice(2,3);
             firstField = format.slice(0,2);
             secondField = format.slice(3,5);
             thirdField = format.slice(6,8);
             //var test = firstField + " : " + secondField + " : " + thirdField + " : " + getDelimiter;
             var finalStr = "";
             if(getDelimiter == "-" || getDelimiter == "/"){
                    if(firstField.toLowerCase() == 'dd'){
                        finalStr += day;
                        dayused = true;
                    }
                    else if(firstField.toLowerCase() == 'mm'){
                        finalStr += month;
                        monthUsed = true
                    }
                    else if(firstField.toLowerCase() == 'yy'){
                        finalStr += year;
                        yearUsed = true;
                    }

                    finalStr += getDelimiter;

                    if(secondField.toLowerCase() == 'dd' && !dayused){
                        finalStr += day;
                        dayused = true;
                    }
                    else if(secondField.toLowerCase() == 'mm' && !monthUsed){
                        finalStr += month;
                        monthUsed = true
                    }
                    else if(secondField.toLowerCase() == 'yy' && !yearUsed){
                        finalStr += year;
                        yearUsed = true;
                    }

                    finalStr += getDelimiter;

                    if(thirdField.toLowerCase() == 'dd' && !dayused){
                        finalStr += day;
                        dayused = true;
                    }
                    else if(thirdField.toLowerCase() == 'mm' && !monthUsed){
                        finalStr += month;
                        monthUsed = true
                    }
                    else if(thirdField.toLowerCase() == 'yy' && !yearUsed){
                        finalStr += year;
                        yearUsed = true;
                    }
                    else{
                        finalStr = "Invalid Format";
                        inval = true;
                    }
             }
             else{
                var finalStr = "Invalid Format";
                inval = true;
             }
        }
        else{
                var finalStr = day + '/' + month + '/' + year;
        }
        
        if(incTime && !inval){
        	if(obj.timeSpace)
        		finalStr += '    ' + hour + ':' + minute;
        	else
        		finalStr += '_' + hour + '-' + minute;
        }
        return finalStr;
};

//---------checks if a value is null and returns an empty string  ------
Speed.prototype.checkNull = function(val){
        if(val != null)
            return val;
        else
            return '';
    };
//---------removes html for a element ---------
Speed.prototype.removeHtml = function(val){
        var tmp = document.createElement("DIV");
        tmp.innerHTML = val; 
        return tmp.textContent || tmp.innerText || "";
}
//---------redirects to the specified page in the string parameter---------
Speed.prototype.redirect  = function(url,opt){
        var opt = (typeof opt === 'undefined') ? true : opt;
        if(opt)
            window.location = url;
        else
            location.replace(url);
    };
//-------------returns numbers with comma seperation(used for money presentation)-----------
Speed.prototype.numberWithCommas = function(x){
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
//======================converts xml to json object===============
Speed.prototype.xmlToJson = function(xml) {
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
            for(var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof(obj[nodeName]) == "undefined") {
                    obj[nodeName] = xmlToJson(item);
                } else {
                    if (typeof(obj[nodeName].push) == "undefined") {
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
//----------------returns a valid file name or error codes (0) for invalid file extensions , 1 for mulitple fullstops--------------
Speed.prototype.returnValidFileName = function(val){
    var returnStr;
    var result = val.replace(/_|#|\\|\/|-\ |\(|\)|\&|\@|\!|\$|\%|\^|\*|\+|\=|\[|\]|\{|\}|\'|\"|\<|\>|\?|/g,'');
    var meko = (result.match(/\./g) || []).length;
    if(meko == 1){
    	var splitedStr = result.split(".");
        if(splitedStr[1].length <= 4 )
    	  returnStr = result;
        else
          returnStr = 0;
    }
    else
    	returnStr = 1;
    return returnStr;
}
//--------------clears file input for all browsers----------------
Speed.prototype.clearFileInput = function(elementObj){
	try {
		elementObj.value = null;
	} 
	catch(ex) { }
	if(elementObj.value) {
		 elementObj.parentNode.replaceChild(elementObj.cloneNode(true), elementObj);
	}
}

/*============================= Email Section =========================*/					
Speed.prototype.sendEmail = function(from, to, body, subject) {
//Get the relative url of the site
var urlTemplate = _spPageContextInfo.webServerRelativeUrl;					        
urlTemplate = urlTemplate + "/_api/SP.Utilities.Utility.SendEmail";
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
					                //alert('Email Sent Successfully');
					            },
					            error: function (err) {
					                //alert('Error in sending Email: ' + JSON.stringify(err));
					            }
					        });
}
					    
Speed.prototype.sendCCEmail = function(from, to, body, cc, subject) {
//Get the relative url of the site
//var siteurl = _spPageContextInfo.webServerRelativeUrl;					        
    var urlTemplate = "/_api/SP.Utilities.Utility.SendEmail";
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
					                    'Subject': subject
					                }
					            }),
					            headers: {
					                "Accept": "application/json;odata=verbose",
					                "content-type": "application/json;odata=verbose",
					                "X-RequestDigest": $("#__REQUESTDIGEST").val()
					            },
					            success: function (data) {
					                //alert('Email Sent Successfully');
					            },
					            error: function (err) {
					                //alert('Error in sending Email: ' + JSON.stringify(err));
					            }
					        });
}

/* ============================== People Picker Section ============================*/
    //-----------------------initializes a people picker ------------------------------
Speed.prototype.initializePeoplePicker = function(peoplePickerElementId,properties) {
        var princpalAccount = 'User,DL,SecGroup,SPGroup';
        var width;
        var multipleValues;
        var resolvePrincipalSource;
        var serachPrincipalSource;
        var maxSuggestions;
        if(typeof properties === 'undefined'){
        	resolvePrincipalSource = 15;
        	serachPrincipalSource = 15;
        	multipleValues = false;
        	maxSuggestions = 50;
        	width = "280px";
        }
        else{
        	width = (typeof properties.width === 'undefined') ? '280px' : properties.width;
        	resolvePrincipalSource = (typeof properties.resolvePrincipalSource  === 'undefined') ? 15 : properties.resolvePrincipalSource;
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
};

//----------------------------get name from picker---------------------
Speed.prototype.getNameFrmPicker =  function(person,onSuccess,onFailed){
		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
        var ctx = this.initiate();
        var people = person;
        var userManager = people.GetAllUserInfo();
        if (!jQuery.isEmptyObject(userManager)) {
            // Get the first user's ID by using the login name.
            window.speedGlobal.push(ctx.get_web().ensureUser(userManager[0].Key));
            var total = window.speedGlobal.length;
            total--;
            ctx.load(window.speedGlobal[total]);
            ctx.executeQueryAsync(
                setTimeout(function () {
                    onSuccess(window.speedGlobal[total]);
                }, 1500),
                Function.createDelegate(this, onFailedCall));
        }
        else onSuccess(null);
}

Speed.prototype.setPeoplePickerValue = function(peoplePickerObj,userLogin) {
    var peoplePicker = peoplePickerObj
    var usrObj = { 'Key': userLogin};
    peoplePicker.AddUnresolvedUser(usrObj, true);
}

Speed.prototype.getUserIdByLoginName = function(loginName,onSuccess,onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var context = this.initiate();
    window.speedGlobal.push(context.get_web().ensureUser(loginName));
    var total = window.speedGlobal.length;
    total--;
    context.load(window.speedGlobal[total]);
    context.executeQueryAsync(
         setTimeout(function(){
                    onSuccess(window.speedGlobal[total]);
                },1000),
                Function.createDelegate(this, onFailedCall));
}
    //----------------------------need to work on this later---------------------
Speed.prototype.clearPicker =  function(people,onSuccess){
        //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
        var userManager = people.GetAllUserInfo();
        if (!jQuery.isEmptyObject(userManager)) {
                userManager.forEach(function (index){
                    people.DeleteProcessedUser(userManager[index]);
                });
            }
        //$("input#relievee_TopSpan_EditorInput").show();
}

/* ============================== User Section Section ============================*/
Speed.prototype.currentUserDetails = function(callback,onFailed){
			var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
            var speedContextMaster = this.initiate();
            var speedUserMaster = speedContextMaster.get_web().get_currentUser()
            speedContextMaster.load(speedUserMaster);
            speedContextMaster.executeQueryAsync(function(){
                if(typeof callback !== 'undefined'){
                    callback(speedUserMaster);
                }
            },Function.createDelegate(this, onFailedCall));
};

Speed.prototype.getSpecificUser = function(usId,callback,onFailed){
			var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
            var ctxt = this.initiate();
            var ccbUser = ctxt.get_web().getUserById(usId);
            ctxt.load(ccbUser);
            ctxt.executeQueryAsync(function () {
                setTimeout(function(){
                    callback(ccbUser);
                },1000);
            }, Function.createDelegate(this, onFailedCall));
    }
//---------gets current userprofile properties on the server-----------
 Speed.prototype.getCurrentUserProperties = function(callback,onFailed) {
 		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var clientContext = this.initiate();
        var peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
        var userProfileProperties = peopleManager.getMyProperties();
        clientContext.load(userProfileProperties);                  
        clientContext.executeQueryAsync(function(){
            setTimeout(function(){
                callback(userProfileProperties)
            },1000);
        }, Function.createDelegate(this, onFailedCall));
    };

//-----------get user from account name ---------------------
Speed.prototype.getSpecificUserProperties = function(acctname,profilePropertyNames,callback,onFailed){
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
        clientContext.executeQueryAsync(function(){
            setTimeout(function(){
                callback(userProfileProperties);
            },1000);
        }, Function.createDelegate(this, onFailedCall));
    }

// pass list title, description , check if u want to assign a group definition , the name of the definition, success and failed functions 
Speed.prototype.createSPGroup = function (title, description, properties,callback,onFailed) {
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
    oMembersGRP = currentWEB.get_siteGroups().add(membersGRP);

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
    //-----------reterieve all users in a group 2013----------
Speed.prototype.retrieveAllUsersInGroup = function(group, callback,onFailed) {
		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var users = [];
        var clientContext = this.initiate();
        var collGroup = clientContext.get_web().get_siteGroups();
        var oGroup = collGroup.getByName(group);
        window.speedGlobal.push(oGroup.get_users());
        var total = window.speedGlobal.length;
        total--;
        clientContext.load(window.speedGlobal[total]);
        clientContext.executeQueryAsync(function(){
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
        ,Function.createDelegate(this, onFailedCall));
    }
    //-----------reterieve all users in a group 2013----------
Speed.prototype.allUsersInGroup = function(group, callback,onFailed) {
		var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var users = [];
        var clientContext = this.initiate();
        var collGroup = clientContext.get_web().get_siteGroups();
        var oGroup = collGroup.getByName(group);
        window.speedGlobal.push(oGroup.get_users());
        var total = window.speedGlobal.length;
        total--;
        clientContext.load(window.speedGlobal[total]);
        clientContext.executeQueryAsync(function(){
            setTimeout(function(){
                callback(window.speedGlobal[total]);
            },1000);
        }
        ,Function.createDelegate(this, onFailedCall));
}

Speed.prototype.allUsersInGroup2010 = function (groupName, callback, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
    var users = [];
    var context = this.initiate();
    var currentWeb = context.get_web();
    var allGroups = currentWeb.get_siteGroups();
    context.load(allGroups);
    context.executeQueryAsync(
       function(){
           var count = allGroups.get_count();
           for(i = 0; i <= (parseInt(count) - 1); i++){
               var grp = allGroups.getItemAtIndex(i);
               //provide your group name
               if(grp.get_loginName() == groupName){
                   window.speedGlobal.push(grp.get_users());
                   var total = window.speedGlobal.length;
                   total--;
                   //load users of the group
                   context.load(window.speedGlobal[total]);
                   context.executeQueryAsync(function(){
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
       },Function.createDelegate(this, onFailedCall));
}
    //---------still working on it ---------------
 Speed.prototype.isUserMemberOfGroup = function(group,callback,bywat,value){
            var boolVal = false;
            var end = false
            this.retrieveAllUsersInGroup(group, function(val){
                for(x in val){
                    if(typeof bywat !== 'undefined' && typeof value !== 'undefined'){
                        if(bywat == 'id'){
                            if(val.id == value){
                                boolVal = true;
                                break;
                            }              
                        }
                        else if(bywat == 'login'){
                            if(val.logon == value){
                                boolVal = true;
                                break;
                            }
                        }
                        else if(bywat == 'email'){
                            if(val.email == value){
                                boolVal = true;
                                break;
                            }
                        }
                    }
                }
                callback(boolVal);
            });
    }
/* ============================== Document Library Section ============================*/
//----converts data URI to Base 64------//
Speed.prototype.convertDataURIToBinary = function(dataURI) {
        var BASE64_MARKER = ';base64,';
        var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        var base64 = dataURI.substring(base64Index);
        var raw = window.atob(base64);
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));
        
        for (i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
}
//------------------create a folder in document Libary---------
Speed.prototype.createFolder = function(foldername,libary,onSuccess,onFailed) {
        var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var context = this.initiate();
        var docLib = context.get_web().get_lists().getByTitle(libary);
        itemCreateInfo = new SP.ListItemCreationInformation();
        itemCreateInfo.set_underlyingObjectType(SP.FileSystemObjectType.folder);
        itemCreateInfo.set_leafName(foldername);
        window.speedGlobal.push(docLib.addItem(itemCreateInfo));
        var total = window.speedGlobal.length;
        total--;
        window.speedGlobal[total].update();
        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function(){
            setTimeout(function(){
                onSuccess(window.speedGlobal[total]);
            },1000)
        },Function.createDelegate(this,onFailedCall));
}
//---------------------------Delete folder from Libary-----------------------
Speed.prototype.deleteFolderOrFile = function(folderDocUrl,onSuccess,onFailed){
        var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var context = this.initiate();
        var oWebsite = context.get_web();
        context.load(oWebsite);
        context.executeQueryAsync(function () {
            window.speedGlobal.push(oWebsite.getFolderByServerRelativeUrl(folderDocUrl));
            var total = window.speedGlobal.length;
            total--;
            window.speedGlobal[total].deleteObject();
            context.executeQueryAsync(function(){
                setTimeout(function(){
                    onSuccess();
                },1000)
            },Function.createDelegate(this, onFailedCall));
        }, Function.createDelegate(this, onFailedCall));
}
//------------------------upload file to documnet libary---------------------
Speed.prototype.uploadFile = function(nameOfFile,dataOfFile,folder,filetype,onSuccess,onFailed) {
        var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var ctx2 = this.initiate();
        if(filetype != "txt")
            var data = this.convertDataURIToBinary(dataOfFile);
        else
            var data = dataOfFile;
        var attachmentFolder = ctx2.get_web().getFolderByServerRelativeUrl(folder);
        fileCreateInfo = new SP.FileCreationInformation();
        fileCreateInfo.set_url(nameOfFile);
        fileCreateInfo.set_overwrite(true);
        fileCreateInfo.set_content(new SP.Base64EncodedByteArray());
        for (var i = 0; i < data.length; ++i) {
            if(filetype != "txt")
                fileCreateInfo.get_content().append(data[i]);
            else
                fileCreateInfo.get_content().append(data.charCodeAt(i));
        }
        window.speedGlobal.push(attachmentFolder.get_files().add(fileCreateInfo));
        var total = window.speedGlobal.length;
        total--;
        ctx2.load(window.speedGlobal[total]);
        ctx2.executeQueryAsync(function(){
            setTimeout(function(){
                onSuccess(window.speedGlobal[total]);
            },1000)
        }, Function.createDelegate(this, onFailedCall));
}

//=============================read data from text file ========================
Speed.prototype.readFile = function (fileurlPassed,onSuccess,onFailed) {
        var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
        var ctx = this.initiate();
        var oWebsite = ctx.get_web();
        ctx.load(oWebsite);
        ctx.executeQueryAsync(function () {
            var fileUrl =  fileurlPassed;
            $.ajax({
                url: fileUrl,
                type: "GET"
            })
            .done(Function.createDelegate(this, onSuccess))
            .error(Function.createDelegate(this, onFailedCall));
        }, onFailedCall);
}

//------------------------check if file exist in documnet library---------------------
Speed.prototype.getFileExists = function(fileUrl,onSuccess,error){
	   var onFailedCall = (typeof onFailed === 'undefined') ? this.onQueryFailed : onFailed;
	   var ctx = this.initiate();
	   var file = ctx.get_web().getFileByServerRelativeUrl(fileUrl);
	   ctx.load(file);
	   ctx.executeQueryAsync(function() {
	      onSuccess(true);
	   }, 
	   function(sender, args) {
	     if (args.get_errorTypeName() === "System.IO.FileNotFoundException") {
	         onSuccess(false);
	     }
	     else {
	       onFailedCall(sender,args);
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