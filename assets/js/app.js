import css from "../css/app.css"
import "phoenix_html"
import {Presence,Socket} from "phoenix"
import * as monaco from "monaco-editor"
//import socket from "./socket"
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
  monaco.editor.setTheme('myTheme');
    monaco.editor.create(document.getElementById('container'), {
      value: [
        'function x() {',
        '\tconsole.log("Hello world!");',
        '}'
      ].join('\n'),
      language: 'javascript',
      //theme: 'vs-dark'
    });

    }

}
class OnlineUsers{
  displayUsers(){
   
    function renderOnlineUsers(presence) {
      let response = ""
      presence.list((user, {metas: [first, ...rest]}) => {
        let count = rest.length + 1
        response += `<br>${user} (count: ${count})</br>\n`
      })
      //document.querySelector("main[role=main]")
      let userList=document.getElementById("userList")
      userList.innerHTML = response
      console.log(response)
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
let socket=new Socket("/socket",{params: {user: user}})
socket.connect()
let channel = socket.channel("room:lobby", {});
let presence = new Presence(channel)
var userColor=generateColor()

const m=new MonacoEditor()
m.editor(userColor)
const u=new OnlineUsers()
u.displayUsers()

/**
 * map users to random cursor colors
 * identify user and pattern match color and send color as parameter to editor
 */