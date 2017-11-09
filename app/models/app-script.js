// Project ID: MjWAcy3C4rUtlFyAENnlpfxMsDm5y34sC
// ScriptID: 17krJ7dzxDiy8Aa-9fZMW71tjnDM8w1zxovNUbyr6PsbNUJv9jPYJb8LM
// SDC key: a3ebe6f951b511d5
// Deploy as API executables

function doPost() {
  Logger.log('In doPost');
  return getCaseHistoryFormUrl();
}

function markProcessed(id) {
  var mail = GmailApp.getMessageById(id);
  Logger.log('Marking Processed: ' + id);
  mail.star();
  return;
}

function validateEmail(email) 
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


function getUnreadEmails(addresses, initial) {

  var fromList = '';
  if(addresses.length == 1)
    fromList = addresses[0];
  else {
    fromList = addresses[0];
    for (var ii = 1; ii < addresses.length; ii++) {
      fromList = fromList + ' OR ' + addresses[ii]
    }
  }
  
  var unreadList = [];
  var fromQuery = 'from:(' + fromList + ')';
  var subjectQuery = 'subject:(' + initial + ')';
  var fromORsubject = fromQuery + ' OR ' + subjectQuery;
  Logger.log(fromORsubject);
  
  var threads = GmailApp.search('is:unread AND (' + fromORsubject + ')');
  Logger.log('Unread threads: ' + threads.length);

  for (var ii = 0; ii < threads.length; ii++) {
      var messages = threads[ii].getMessages();
      
      for (var jj = 0; jj < messages.length; jj++) {
        var message = messages[jj];
        if (message.isUnread()) {
          var from = message.getFrom();
          if(from.indexOf('<') >= 0)
            var sender = from.substring(from.indexOf('<')+1, from.indexOf('>'));
          else
            sender = from;
          
          if (validateEmail(sender)) {
            var entry = {
              id: message.getId(),
              date: message.getDate(),
              sender: sender,
              subject: message.getSubject(),
              processed: message.isStarred()
            };
            Logger.log(entry);
            unreadList.push(entry);
          }
        }
      }
  }

  return JSON.stringify(unreadList);
}

//https://productforums.google.com/forum/#!topic/docs/P2kSVDzt05Q
//https://productforums.google.com/forum/#!topic/docs/-PKHodzUDn8
function getCaseHistoryFormUrl(formId, patientId) {
  
  var form = FormApp.openById(formId);
  //var form = FormApp.openById('1wOPn4Y9ASchPwb7n_cPYCCEUqn3gBOXsse6BXfV3pWI');
  form.setTitle('Case History for ' + patientId);
  
  var url = form.getPublishedUrl();
  return url;
  
  //form.removeDestination();
  //form.setDestination(FormApp.DestinationType.SPREADSHEET, detailsSheet);

  /*  Logger.log('Entered in script');
  var root = DriveApp.getRootFolder();
  var folders = root.getFolders();
  var folderSet = {};
  while (folders.hasNext()) {
    var folder = folders.next();
    folderSet[folder.getId()] = folder.getName();
    Logger.log(folder.getName());
  }
  return folderSet;*/
}