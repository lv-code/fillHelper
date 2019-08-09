
let $V = {
    view: {},
    tabs: {}
};
$V.tabs.targetTabUrl = '';
$V.tabs.targetTabId = undefined;

$V.view.colnum = 0; // column number
$V.view.columnPrefix = 'column_';
$V.view.bindFormType = 'select_column';
$V.view.bindInfo = '';
$V.view.bindBtn = '<input type="submit" value="Bind" class="btn-sm btn-secondary float-right">';

$V.view.haveThead = false;
$V.view.insertThead = 'Action';
$V.view.insertBtnHtml = '<button type="button" class="insertBtn btn btn-primary btn-sm">Insert</button>';
$V.view.submitBtnHtml = '<button type="submit" class="submitBtn btn btn-danger btn-sm">Submit</button>';

$V.debug = false;
$V.debugData = 'id1,user1,12345678901\n\
id2,user2,12345678902\n\
id3,user3,12345678903\n\
';

$V.init = function(){

    chrome.storage.sync.get(['targetTabId'], function(res) {
        $V.tabs.targetTabId = res.targetTabId;

        sendMessageToContentScript($V.tabs.targetTabId, {cmd: 'get_current_url'}, function(response) {
            $V.tabs.targetTabUrl = response;
            my_log('debug targetTabUrl ' + $V.tabs.targetTabUrl);
        });
    });
    if($V.debug){
        $('#csv_data').val($V.debugData);
    }
}

/**
TODO
*/
$(function() {
    $V.init();

    $('#csv_data').focus();
    // import csv data
    $('#import').on('click', function() {
        var csv_data = $('#csv_data').val();
        $('#html_table').html('');
        $('#csv_input').hide();
        let csv_data_arr = $.csv.toArrays(csv_data);
        createHtmlTable(csv_data_arr);
        $('#csv_output, #bind_panel').show();

        sendMessageToContentScript($V.tabs.targetTabId, {cmd: 'get_form', value: $V.view.bindFormType}, function(response) {
            createBindForm(response, $V.view.bindFormType);
        });

    });
    $('#back').on('click', function() {
        $('#csv_output, #bind_panel').hide();
        $('#csv_input').show().focus();
    });

});

document.addEventListener('DOMContentLoaded', function() {
    // chrome.runtime.sendMessage('runContentScript');
});

// make select to column of csv
function createBindForm(data, type = '') {
    if (undefined == data) {
        my_log('argument data of createBindForm is undefined!');
        return false;
    }
    let bindForm = $('#bindForm');
    if( undefined!=bindForm.attr('data-bind') ){
        return;
    }

    if ('' == type) {
        bindForm.append(data);
    } else if ('select_column' == type) {
        // todo make select option
        let html = '', columnHtml = '';
        getBindInfo();
        $.each(data, function(index, row) {
            html += '<div class="form-group row mb-1">';
            html += '<label for="' + row.name + '" class="form-label-sm col-6 float-right">';
            html += row.name;
            html += '</label>';
            columnHtml = makeSelectColumnHtml(row.name);
            html += columnHtml;
            html += '</div>';
        });
        html += '<div class="form-group d-flex flex-row-reverse">';
        html += $V.view.bindBtn;
        html += '</div>';
        bindForm.append(html);
    }

    bindForm.attr('data-bind',1);

    // store form bind relation info
    bindForm.submit(function() {
        my_log('bindForm submit');
        let relation = {};
        $(this).find('input[type!="hidden"], select').each(function() {
            if (undefined != $(this).attr('name')) {
                relation[$(this).attr('name')] = $(this).val();
            }

        });

        let key = $V.tabs.targetTabUrl;
        addItem(key, relation);
        $V.view.bindInfo = relation;
        return false;
    });
    return;
}

// sotre the key:value type data
function addItem(key, item){
    let data = {};
    data[key] = ( Object == typeof item) ? JSON.stringify(item) : item;
    chrome.storage.local.set( data, function() {
        if(chrome.runtime.lastError){
            my_log('err addItem ' + chrome.runtime.lastError);
        }else{
            my_log('debug addItem successfully ' + JSON.stringify(data));
        }
    })
}

function getBindInfo(callback){
    chrome.storage.sync.get([$V.tabs.targetTabUrl], function(res) {
        my_log('debug bind_info ' + $V.tabs.targetTabUrl + JSON.stringify(res));
        if($.isEmptyObject(res)){

        }else{
            $V.view.bindInfo = res;
        }

    });
}

// the column select for bind
function makeSelectColumnHtml(name) {
    let columnVal = '';
    let html = '<select name="' + name + '" class="custom-select custom-select-sm col-6">';
    html += '<option selected value="">select_column</option>';
    for (let i = 1; i <= $V.view.colnum; i++) {
        columnVal = $V.view.columnPrefix + i;
        html += '<option value="' + columnVal + '">' + columnVal + '</option>';
    }
    html += '</select>'
    return html;
}

function createHtmlTable(data) {
    let html = '<table  class="table table-condensed table-hover table-striped">';
    if (typeof(data[0]) === 'undefined') {
        return null;
    }

    $.each(data, function(index, row) {
        // row.unshift(index);
        if (0 == $V.view.colnum) {
            $V.view.colnum = row.length;
        }

        if ($V.view.haveThead && index == 0) {
            html += '<thead class="thead-light">';
            html += '<tr>';
            row.push($V.view.insertThead);

            $.each(row, function(index, colData) {
                html += '<th>';
                html += colData;
                html += '</th>';
            });
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';
        } else {
            html += '<tr>';
            //insert button
            row.push($V.view.insertBtnHtml);
            row.push($V.view.submitBtnHtml);
            $.each(row, function(index, colData) {
                html += '<td>';
                html += colData;
                html += '</td>';
            });
            html += '</tr>';
        }
    });
    html += '</tbody>';
    html += '</table>';
    $('#html_table').append(html);

    $('.insertBtn').on('click', function() {
        if(undefined==$V.view.bindInfo){
            alert('Bind info is empty, please select csv column.');
            return;
        }
        $(this).html('inserting').attr('disabled');
        let index = $(".insertBtn").index($(this));
        // my_log(index);
        let rowData = data[index];
        // my_log(rowData);
        sendMessageToContentScript($V.tabs.targetTabId, {cmd: 'insert_btn_click',value: rowData}, function(response) {
            if(chrome.runtime.lastError){
                console.error('err insertBtn ' + chrome.runtime.lastError);
            }
        });
        $(this).html('inserted').removeAttr('disabled');
    });

    $('.submitBtn').on('click', function() {
        $(this).html('submiting').attr('disabled');
        let index = $(".insertBtn").index($(this));
        // my_log(rowData);
        sendMessageToContentScript($V.tabs.targetTabId, {cmd: 'submit_btn_click'});
        $(this).removeAttr('disabled');
        $(this).html('submited');
    });
}
