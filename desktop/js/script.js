
/* This file is part of Jeedom.
 *
 * Jeedom is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Jeedom is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Jeedom. If not, see <http://www.gnu.org/licenses/>.
 */


 editor = null;

 $("#md_browseScriptFile").dialog({
    autoOpen: false,
    modal: true,
    height: (jQuery(window).height() - 150),
});

 $("#table_cmd tbody").delegate(".cmdAttr[data-l1key=configuration][data-l2key=requestType]", 'change', function (event) {
    $(this).closest('tr').find('.requestTypeConfig').hide();
    $(this).closest('tr').find('.requestTypeConfig[data-type=' + $(this).value() + ']').show();
    if($(this).value() == 'script'){
        $(this).closest('tr').find('.browseScriptFile').show();
        $(this).closest('tr').find('.editScriptFile').show();
        $(this).closest('tr').find('.removeScriptFile').show();
        $(this).closest('tr').find('.newScriptFile').show();
        $(this).closest('tr').find('.bt_shareOnMarket').show();
    }else{
        $(this).closest('tr').find('.browseScriptFile').hide();
        $(this).closest('tr').find('.editScriptFile').hide();
        $(this).closest('tr').find('.removeScriptFile').hide();
        $(this).closest('tr').find('.newScriptFile').hide();
        $(this).closest('tr').find('.bt_shareOnMarket').hide();
    }
});

 $("#table_cmd tbody").delegate(".browseScriptFile", 'click', function (event) {
    var tr = $(this).closest('tr');
    $("#md_browseScriptFile").dialog('open');
    $('#div_browseScriptFileTree').fileTree({
        root: '/',
        script: 'plugins/script/3rdparty/jquery.fileTree/jqueryFileTree.php?root=' + encodeURIComponent(userScriptDir),
        folderEvent: 'click'
    }, function (file) {
        $("#md_browseScriptFile").dialog('close');
        if(userScriptDir.slice(-1) == '/' && file.slice(0,1) == '/'){
            file = file.slice(1);
        }
        tr.find('.cmdAttr[data-l1key=configuration][data-l2key=request]').value(userScriptDir+file);
    });
});

 $("#table_cmd").sortable({axis: "y", cursor: "move", items: ".cmd", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});

 $("#md_editScriptFile").dialog({
    autoOpen: false,
    modal: true,
    height: (jQuery(window).height() - 150),
    width: (jQuery(window).width() - 150)
});

 $('#bt_cronGenerator').on('click',function(){
    jeedom.getCronSelectModal({},function (result) {
        $('.eqLogicAttr[data-l1key=configuration][data-l2key=autorefresh]').value(result.value);
    });
});

 $("#table_cmd tbody").delegate(".editScriptFile", 'click', function (event) {
    var tr = $(this).closest('tr');
    var path = tr.find('.cmdAttr[data-l1key=configuration][data-l2key=request]').val();
    if (path.indexOf(' ') > 0) {
        path = path.substr(0, path.indexOf(' '));
    }
    var data = loadScriptFile(path);
    if (data === false) {
        return;
    }

    if (editor != null) {
        editor.getDoc().setValue(data.content);
        editor.setOption("mode", data.mode);
        setTimeout(function () {
            editor.refresh();
        }, 1);
    } else {
        $('#ta_editScriptFile').val(data.content);
        setTimeout(function () {
            editor = CodeMirror.fromTextArea(document.getElementById("ta_editScriptFile"), {
                lineNumbers: true,
                mode: data.mode,
                matchBrackets: true
            });
            editor.getWrapperElement().style.height = ($('#md_editScriptFile').height()) + 'px';
            editor.refresh();
        }, 1);
    }

    $("#md_editScriptFile").dialog('option', 'buttons', {
        "Annuler": function () {
            $(this).dialog("close");
        },
        "Enregistrer": function () {
            if (saveScriptFile(path, editor.getValue())) {
                $(this).dialog("close");
            }
        }
    });
    $("#md_editScriptFile").dialog('open');
});


$("#table_cmd tbody").delegate(".newScriptFile", 'click', function (event) {
    var tr = $(this).closest('tr');
    bootbox.prompt("Nom du script ?", function (result) {
        if (result !== null) {
            var path = addUserScript(result);
            if (path !== false) {
                tr.find('.cmdAttr[data-l1key=configuration][data-l2key=request]').val(path);
                $('#md_newUserScript').modal('hide');
                tr.find('.editScriptFile').click();
            }
        }
    });
});

$("#table_cmd tbody").delegate(".removeScriptFile", 'click', function (event) {
    var tr = $(this).closest('tr');
    var path = tr.find('.cmdAttr[data-l1key=configuration][data-l2key=request]').val();
    if (path.indexOf(' ') > 0) {
        path = path.substr(0, path.indexOf(' '));
    }
    if (path.indexOf('?') > 0) {
        path = path.substr(0, path.indexOf('?'));
    }
    $.hideAlert();
    bootbox.confirm('{{Etes-vous sûr de vouloir supprimer le script :}} <span style="font-weight: bold ;">' + path + '</span> ?', function (result) {
        if (result) {
            removeScript(path);
            tr.find('.cmdAttr[data-l1key=configuration][data-l2key=request]').val('');
        }
    });
});

$("#table_cmd tbody").delegate('.bt_shareOnMarket', 'click', function () {
    var tr = $(this).closest('tr');
    var path = tr.find('.cmdAttr[data-l1key=configuration][data-l2key=request]').val();
    var logicalId = getLogicalIdFromPath(path);
    if (logicalId == '') {
        $('#div_alert').showAlert({message: '{{Vous devez d\'abord sélectioner un script}}', level: 'danger'});
        return;
    }
    $('#md_modal').dialog({title: "{{Partager sur le market}}"});
    $('#md_modal').load('index.php?v=d&modal=update.send&type=script&logicalId=' + encodeURI(logicalId) + '&name=' + encodeURI(logicalId) + "&hidden=" + encodeURI(path)).dialog('open');
});

$('#bt_getFromMarket').on('click', function () {
    $('#md_modal').dialog({title: "{{Partager sur le market}}"});
    $('#md_modal').load('index.php?v=d&modal=update.list&type=script').dialog('open');
});

$('#bt_getFromMarketicon').on('click', function () {
    $('#md_modal').dialog({title: "{{Partager sur le market}}"});
    $('#md_modal').load('index.php?v=d&modal=update.list&type=script').dialog('open');
});

$("#table_cmd").sortable({axis: "y", cursor: "move", items: ".cmd", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});


function addCmdToTable(_cmd) {
    if (!isset(_cmd)) {
        var _cmd = {};
    }
    if (!isset(_cmd.configuration)) {
        _cmd.configuration = {};
    }
    if (init(_cmd.logicalId) == 'refresh') {
       return;
    }

    var selRequestType = '<select style="width : 90px;" class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="requestType">';
    selRequestType += '<option value="script">{{Script}}</option>';
    selRequestType += '<option value="http">{{HTTP}}</option>';
    selRequestType += '<option value="html">{{HTML}}</option>';
    selRequestType += '<option value="xml">{{XML}}</option>';
    selRequestType += '<option value="json">{{JSON}}</option>';
    selRequestType += '</select>';

    var tr = '<tr class="cmd" data-cmd_id="' + init(_cmd.id) + '">';

    tr += '<td>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="id"  style="display : none;">';
    tr += '<div class="row">';
    tr += '<div class="col-sm-6">';
    tr += '<a class="cmdAction btn btn-default btn-sm" data-l1key="chooseIcon"><i class="fa fa-flag"></i> Icone</a>';
    tr += '<span class="cmdAttr" data-l1key="display" data-l2key="icon" style="margin-left : 10px;"></span>';
    tr += '</div>';
    tr += '<div class="col-sm-6">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="name">';
    tr += '</div>';
    tr += '</div>';
    tr += '<select class="cmdAttr form-control input-sm" data-l1key="value" style="display : none;margin-top : 5px;" title="La valeur de la commande vaut par défaut la commande">';
    tr += '<option value="">Aucune</option>';
    tr += '</select>';
    tr += '</td>';
    tr += '<td class="requestType" type="' + init(_cmd.configuration.requestType) + '" >' + selRequestType;
    tr += '</td>';
    tr += '<td>';
    tr += '<span class="type" type="' + init(_cmd.type) + '">' + jeedom.cmd.availableType() + '</span>';
    tr += '<span class="subType" subType="' + init(_cmd.subType) + '"></span>';
    tr += '</td>';
    tr += '<td><textarea style="height : 95px;" class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="request"></textarea>';
    tr += '<a class="btn btn-default browseScriptFile" style="margin-top : 5px;"><i class="fa fa-folder-open"></i> {{Parcourir}}</a> ';
    tr += '<a class="btn btn-default editScriptFile" style="margin-top : 5px;"><i class="fa fa-edit"></i> {{Editer}}</a> ';
    tr += '<a class="btn btn-success newScriptFile" style="margin-top : 5px;"><i class="fa fa-file-o"></i> {{Nouveau}}</a> ';
    tr += '<a class="btn btn-danger removeScriptFile" style="margin-top : 5px;"><i class="fa fa-trash-o"></i> {{Supprimer}}</a> ';
    tr += '<a class="btn btn-warning bt_shareOnMarket" style="margin-top : 5px;"><i class="fa fa-cloud-upload"></i> {{Partager}}</a> ';
    tr += '</div>';
    tr += '</td>';
    tr += '<td>';

    tr += '<div class="requestTypeConfig" data-type="http">';
    tr += '<center>';
    tr += '<input type="checkbox" class="cmdAttr" data-l1key="configuration" data-l2key="noSslCheck" />{{Vérifier SSL}} ';
    tr += '<input type="checkbox" class="cmdAttr" data-l1key="configuration" data-l2key="allowEmptyResponse" style="margin-left : 20px;"/>{{Retour vide}} ';
    tr += '<input type="checkbox" class="cmdAttr" data-l1key="configuration" data-l2key="doNotReportHttpError" style="margin-left : 20px;"/>{{Pas d\'erreurs}} ';
    tr += '</center>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="reponseMustContain" placeholder="{{La réponse doit contenir}}" title="Vide pour ne mettre aucun contrainte"/>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="timeout" placeholder="{{Timeout (s)}}" title="Par défaut 2 secondes" style="margin-top : 5px;"/>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="maxHttpRetry" placeholder="{{Essais au maximum}}" title="Par défaut 4" style="margin-top : 5px;" />';
    tr += '<div class="row" style="margin-top : 5px;">';
    tr += '<div class="col-sm-6">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="http_username" placeholder="{{Utilisateur}}"/>';
    tr += '</div>';
    tr += '<div class="col-sm-6">';
    tr += '<input type="password" class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="http_password" placeholder="{{Mot de passe}}"/>';
    tr += '</div>';
    tr += '</div>';
    tr += '</div>';

    tr += '<div class="requestTypeConfig" data-type="xml" style="display : none;">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="urlXml" placeholder="URL du fichier XML"/>';
    tr += '<center>';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr" data-l1key="configuration" data-l2key="xmlNoSslCheck"/>{{Vérifier SSL}}</label></span> ';
    tr += '</center>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="xmlTimeout" placeholder="{{Timeout (s)}}" title="Par défaut 2 secondes"/>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="maxXmlRetry" placeholder="{{Essais au maximum}}" title="Par défaut 4" style="margin-top : 5px;" />';
    tr += '<div class="row" style="margin-top : 5px;">';
    tr += '<div class="col-sm-6">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="xml_username" placeholder="{{Utilisateur}}"/>';
    tr += '</div>';
    tr += '<div class="col-sm-6">';
    tr += '<input type="password" class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="xml_password" placeholder="{{Mot de passe}}"/>';
    tr += '</div>';
    tr += '</div>';
    tr += '</div>';

    tr += '<div class="requestTypeConfig" data-type="html" style="display : none;">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="urlHtml" placeholder="URL du HTML"/>';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr" data-l1key="configuration" data-l2key="htmlNoSslCheck"/>{{Vérifier SSL}}</label></span> ';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="htmlTimeout" placeholder="{{Timeout (s)}}" title="Par défaut 2 secondes"/>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="maxHtmlRetry" placeholder="{{Essais au maximum}}" title="Par défaut 4" style="margin-top : 5px;" />';
    tr += '<div class="row" style="margin-top : 5px;">';
    tr += '<div class="col-sm-6">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="html_username" placeholder="{{Utilisateur}}"/>';
    tr += '</div>';
    tr += '<div class="col-sm-6">';
    tr += '<input type="password" class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="html_password" placeholder="{{Mot de passe}}"/>';
    tr += '</div>';
    tr += '</div>';
    tr += '</div>';

    tr += '<div class="requestTypeConfig" data-type="json" style="display : none;">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="urlJson" placeholder="URL du fichier JSON"/>';
    tr += '<center>';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr" data-l1key="configuration" data-l2key="jsonNoSslCheck"/>{{Vérifier SSL}}</label></span> ';
    tr += '</center>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="jsonTimeout" placeholder="{{Timeout (s)}}" title="Par défaut 2 secondes"/>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="maxJsonRetry" placeholder="{{Essais au maximum}}" title="Par défaut 4" style="margin-top : 5px;" />';
    tr += '<div class="row" style="margin-top : 5px;">';
    tr += '<div class="col-sm-6">';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="json_username" placeholder="{{Utilisateur}}"/>';
    tr += '</div>';
    tr += '<div class="col-sm-6">';
    tr += '<input type="password" class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="json_password" placeholder="{{Mot de passe}}"/>';
    tr += '</div>';
    tr += '</div>';
    tr += '</div>';
    tr += '</td>';
    tr += '<td>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="unite"  style="width : 100px;" placeholder="{{Unité}}" title="{{Unité}}">';
    tr += '<input class="tooltips cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="minValue" placeholder="{{Min}}" title="{{Min}} style="margin-top : 5px;""> ';
    tr += '<input class="tooltips cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="maxValue" placeholder="{{Max}}" title="{{Max}} style="margin-top : 5px;"">';
    tr += '<select class="cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="updateCmdId" style="display : none;margin-top : 5px;" title="Commande d\'information à mettre à jour">';
    tr += '<option value="">Aucune</option>';
    tr += '</select>';
    tr += '<input class="tooltips cmdAttr form-control input-sm" data-l1key="configuration" data-l2key="updateCmdToValue" placeholder="Valeur de l\'information" style="display : none;margin-top : 5px;">';
    tr += '</td>';
    tr += '<td>';
    tr += '<center>';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isVisible" checked/>{{Afficher}}</label><span> ';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isHistorized" checked/>{{Historiser}}</label></span> ';
    tr += '<span><label class="checkbox-inline"><input type="checkbox" class="cmdAttr expertModeVisible" data-l1key="display" data-l2key="invertBinary"/>{{Inverser}}</label></span> ';
    tr += '</center>';
    tr += '</td>';
    tr += '<td>';
    if (is_numeric(_cmd.id)) {
        tr += '<a class="btn btn-default btn-xs cmdAction expertModeVisible" data-action="configure"><i class="fa fa-cogs"></i></a> ';
        tr += '<a class="btn btn-default btn-xs cmdAction" data-action="test"><i class="fa fa-rss"></i> {{Tester}}</a>';
    }
    tr += ' <a class="btn btn-default btn-xs cmdAction expertModeVisible" data-action="copy" title="Dupliquer"><i class="fa fa-files-o"></i></a> ';
    tr += '<i class="fa fa-minus-circle pull-right cmdAction cursor" data-action="remove"></i></td>';
    tr += '</tr>';

    $('#table_cmd tbody').append(tr);
    $('#table_cmd tbody tr:last').setValues(_cmd, '.cmdAttr');

    if (isset(_cmd.configuration.requestType)) {
        $('#table_cmd tbody tr:last .cmdAttr[data-l1key=configuration][data-l2key=requestType]').value(init(_cmd.configuration.requestType));
        $('#table_cmd tbody tr:last .cmdAttr[data-l1key=configuration][data-l2key=requestType]').trigger('change');
    }

    if (isset(_cmd.type)) {
        $('#table_cmd tbody tr:last .cmdAttr[data-l1key=type]').value(init(_cmd.type));
    }
    var tr = $('#table_cmd tbody tr:last');
    jeedom.eqLogic.builSelectCmd({
        id: $(".li_eqLogic.active").attr('data-eqLogic_id'),
        filter: {type: 'info'},
        error: function (error) {
            $('#div_alert').showAlert({message: error.message, level: 'danger'});
        },
        success: function (result) {
            tr.find('.cmdAttr[data-l1key=value]').append(result);
            tr.find('.cmdAttr[data-l1key=configuration][data-l2key=updateCmdId]').append(result);
            tr.setValues(_cmd, '.cmdAttr');
            jeedom.cmd.changeType(tr, init(_cmd.subType));
            initTooltips();
        }
    });
}

function getLogicalIdFromPath(_path) {
    if (_path.indexOf(' ') > 0) {
        _path = _path.substr(0, _path.indexOf(' '));
    }
    var res = _path.split("/");
    if (res.length > 0) {
        return res[res.length - 1];
    } else {
        return _path;
    }
}


function loadScriptFile(_path) {
    $.hideAlert();
    var result = false;
    $.ajax({// fonction permettant de faire de l'ajax
        type: "POST", // méthode de transmission des données au fichier php
        url: "plugins/script/core/ajax/script.ajax.php", // url du fichier php
        data: {
            action: "getScriptContent",
            path: _path,
        },
        dataType: 'json',
        async: false,
        error: function (request, status, error) {
            handleAjaxError(request, status, error, $('#div_alert'));
        },
        success: function (data) { // si l'appel a bien fonctionné
        if (data.state != 'ok') {
            $('#div_alert').showAlert({message: data.result, level: 'danger'});
            return false;
        }
        result = data.result;
        switch (result.extension) {
            case 'php' :
            result.mode = 'text/x-php';
            break;
            case 'sh' :
            result.mode = 'shell';
            break;
            case 'pl' :
            result.mode = 'text/x-php';
            break;
            case 'py' :
            result.mode = 'text/x-python';
            break;
            case 'rb' :
            result.mode = 'text/x-ruby';
            break;
            default :
            result.mode = 'text/x-php';
            break;
        }
    }
});
return result;
}

function saveScriptFile(_path, _content) {
    $.hideAlert();
    var success = false;
    $.ajax({// fonction permettant de faire de l'ajax
        type: "POST", // méthode de transmission des données au fichier php
        url: "plugins/script/core/ajax/script.ajax.php", // url du fichier php
        data: {
            action: "saveScriptContent",
            path: _path,
            content: _content,
        },
        dataType: 'json',
        async: false,
        error: function (request, status, error) {
            handleAjaxError(request, status, error, $('#div_editScriptFileAlert'));
        },
        success: function (data) { // si l'appel a bien fonctionné
        if (data.state != 'ok') {
            $('#div_editScriptFileAlert').showAlert({message: data.result, level: 'danger'});
            return;
        }
        success = true;
        $('#div_alert').showAlert({message: 'Script sauvegardé', level: 'success'});
    }
});
    return success;
}

function addUserScript(_name) {
    $.hideAlert();
    var success = false;
    $.ajax({// fonction permettant de faire de l'ajax
        type: "POST", // méthode de transmission des données au fichier php
        url: "plugins/script/core/ajax/script.ajax.php", // url du fichier php
        data: {
            action: "addUserScript",
            name: _name,
        },
        dataType: 'json',
        async: false,
        error: function (request, status, error) {
            handleAjaxError(request, status, error, $('#div_newUserScriptAlert'));
        },
        success: function (data) { // si l'appel a bien fonctionné
        if (data.state != 'ok') {
            $('#div_newUserScriptAlert').showAlert({message: data.result, level: 'danger'});
            return;
        }
        success = data.result;
    }
});
    return success;
}

function removeScript(_path) {
    $.hideAlert();
    var success = false;
    $.ajax({// fonction permettant de faire de l'ajax
        type: "POST", // méthode de transmission des données au fichier php
        url: "plugins/script/core/ajax/script.ajax.php", // url du fichier php
        data: {
            action: "removeScript",
            path: _path,
        },
        dataType: 'json',
        async: false,
        error: function (request, status, error) {
            handleAjaxError(request, status, error, $('#div_newUserScriptAlert'));
        },
        success: function (data) { // si l'appel a bien fonctionné
        if (data.state != 'ok') {
            $('#div_newUserScriptAlert').showAlert({message: data.result, level: 'danger'});
            return;
        }
        $('#div_alert').showAlert({message: 'Script supprimé', level: 'success'});
        success = true;
    }
});
    return success;
}


