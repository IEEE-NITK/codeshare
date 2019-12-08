import css from "../css/app.css"
import "phoenix_html"
import {Presence,Socket} from "phoenix"
import * as monaco from "monaco-editor"

class MonacoEditor{
   editor(userColor) {
    self.MonacoEnvironment = {
      getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
          return './js/json.worker.js';
        }
        if (label === 'css') {
          return './js/css.worker.js';
        }
        if (label === 'html') {
          return './js/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return './js/ts.worker.js';
        }
        return './js/editor.worker.js';
      }
    }
    monaco.editor.defineTheme('myTheme', {
      base: 'vs',
      inherit: true,
      rules: [{ background: 'EDF9FA' }],
      colors: {
          'editor.foreground': '#000000',
          'editor.background': '#EDF9FA',
          'editorCursor.foreground': userColor,
          'editor.lineHighlightBackground': '#0000FF20',
          'editorLineNumber.foreground': '#008800',
          'editor.selectionBackground': '#88000030',
          'editor.inactiveSelectionBackground': '#88000015'
      }
    });
    var editor1, editorText;
  monaco.editor.setTheme('myTheme');
    editor1=monaco.editor.create(document.getElementById('container'), {
      value: [
        'function x() {',
        '\tconsole.log("Hello world!");',
        '}'
      ].join('\n'),
      language: 'javascript',
      //theme: 'vs-dark'
    });
    editorText=editor1.getValue();
    editor1.getModel().onDidChangeContent((event) => {
         if(editorText.localeCompare(editor1.getValue())){
            channel.push('shout',{
                evnt: event,
                text: editor1.getValue(),
                updated_cursor_position : editor1.getPosition(),
                //changed_by: user who made the change               
            });     
        }
    }); 
    channel.on('shout', function(payload){
      var curpos = editor1.getPosition();
      
      console.log(payload.evnt);
      editorText=payload.text;	            
      editor1.setValue(payload.text); 
      editor1.setPosition(curpos);	    
      console.log(payload.curpos)

      //for showing the cursor position of the user who made the change

      var listOfCursors=[]
      // cursorPositionList[payload.changed_by]=payload.updated_cursor_position
      // var style=document.createElement('style');
      // style.type='text/css';
      // document.getElementsByTagName('head')[0].appendChild(style);
      // for(var i=0;i<noOfUsers;i++){
      //   style.innerHTML='.cursor { background: '+userColors[i]+'; width:2px !important;;}';
      //   listOfCursors.push({range: new monaco.Range(1,3,1,3), options: { className: 'cursor'}})
      // }
      
      var decorations = editor1.deltaDecorations([], listOfCursors);

    });
    
    }
    
}
class OnlineUsers{
  displayUsers(){ 
    function renderOnlineUsers(presence) {
      let response = ""
      presence.list((user, {metas: [first, ...rest]}) => {
        let cursorColor=first["cursor_color"]
        response += `<p style="color:${cursorColor};">${user}</p>`
      })
      let userList=document.getElementById("userList")
      userList.innerHTML = response
    }
    presence.onSync(() => renderOnlineUsers(presence))
    channel.join()
  }
}
function generateColor(){
  var letters='0123456789ABCDEF'
  var color='#'
  for(var i=0;i<6;i++){
    color+=letters[Math.floor(Math.random()*16)];
  }
  return color;
}



let user=document.getElementById("user").innerText
var userColor=generateColor()

let socket=new Socket("/socket",{params: {user: user,userColor: userColor}})
socket.connect()
let channel = socket.channel("room:lobby", {});
let presence = new Presence(channel)
const m=new MonacoEditor()
m.editor(userColor)
const u=new OnlineUsers()
u.displayUsers()
//getUserColorMap