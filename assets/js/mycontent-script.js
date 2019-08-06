console.log('mycontent js loaded . fillHelper')

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
    let res = '';
    switch (request.cmd) {
        case 'get_form':
            res = getFormHtml(request.value);
            break;
        case 'get_current_url':
            res = getCurrentUrl();
            break;
        case 'get_current_tab':
            chrome.tabs.getCurrent(function(tab){
                res = tab;
            });
            break;
        case 'insert_btn_click':
            insert_data(request.value);
            res = 'end';
            break;
        case 'submit_btn_click':
            $('form *[type=submit]').trigger('click');
            res = 'end';
            break;
        default:

    }
    console.log('debug res ' + JSON.stringify(res));
    sendResponse(res);
});

// get html of form
function getFormHtml(bindFormType){
    let formEle = '';
    if('select_column'==bindFormType){
        formEle = $('form').find('[type!="hidden"]').serializeArray();
    }else{
        formEle = $('form').html();
    }
    return formEle;
}

function getCurrentUrl(){
    // return location.protocol + '//' + location.host + location.pathname
    return location.host + location.pathname;
}

function insert_data(data){
    console.log('insert_data : ' + JSON.stringify(data));
    let form_relation, current_url = '', iptVal = '', columnPrefix = 'column_', dataIndex=0;
    current_url = getCurrentUrl();

    chrome.storage.local.get([current_url], function(result) {
        if( undefined==result[current_url] || 'object' != typeof result[current_url] ){
            console.log('result is not json ' + current_url + ' : ' + typeof result[current_url]);
            return ;
        }
        form_relation = result[current_url];
        $.each(form_relation, function(index, row){
            // check if is column data
            if(row.length>columnPrefix.length && row.substr(0, columnPrefix.length) == columnPrefix){
                dataIndex = parseInt(row.substr(columnPrefix.length))-1
                iptVal = ( undefined!=data[dataIndex] ) ? data[dataIndex]: '';
            }else{
                iptVal = row;
            }
            $('form').find('[name="'+index+'"]').val(iptVal);
        });
    });


}
