console.log('background js loaded . fillHelper');

let targetTabId=0;

chrome.runtime.onMessage.addListener(function(message, callback) {
    if (message == 'runContentScript') {
        chrome.tabs.executeScript({
            file: '/assets/js/mycontent-script.js'
        });
    }
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        let data = {};
        targetTabId = tabs[0].id;
        data['targetTabId'] = tabs[0].id;

        chrome.storage.sync.set(data, function(val) {
            // console.log( 'debug store data : ' + JSON.stringify(data) );
            injectContentScript(targetTabId);

            chrome.windows.create({
                'url': 'popup.html',
                'width': 600,
                'height': 800,
                'type': 'popup'
            });
        });
    });

});

function injectContentScript(tabId){
    chrome.tabs.executeScript(tabId, {
        file: '/assets/js/lib/jquery-1.9.1.min.js'
    });
    chrome.tabs.executeScript(tabId, {
        file: '/assets/js/mycontent-script.js'
    });
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    // If updated tab matches this one
    if (changeInfo.status == "complete" && tabId == targetTabId) {
        injectContentScript(targetTabId);
    }
    // console.log('onUpdated tabid : '+ tabId + '_' + targetTabId + ' ' + JSON.stringify(changeInfo));

});
