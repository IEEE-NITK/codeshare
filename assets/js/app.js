// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import css from "../css/app.css"
// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html"

// Import local files

import { Presence, Socket } from "phoenix"
import crdt from "./crdt"

var cm = window.cm // cm: CodeMirror

// Join Channel
let user = document.getElementById("user").innerText
var userColor = generateColor()
let socket = new Socket("/socket", { params: { user: user, userColor: userColor } })
socket.connect()
let channel = socket.channel("room:lobby", {});
let presence = new Presence(channel)
channel.join()

// Display active users
displayUsers()

// Keeps track of other's cursors
var markers = {}

/*** Send and recieve editor changes ***/

// Send my changes to others
cm.on("beforeChange", (cm, changeobj) => {
    console.log(changeobj);
    if (changeobj.origin != undefined) {

        if(changeobj.origin == "+input") {
            //select and insert => delete selected stuff first
            if(changeobj.from.line != changeobj.to.line || changeobj.from.ch != changeobj.to.ch) {
                for(var i = changeObj.to.line; i >= changeObj.from.line; i--) {
                    //identifying the begin and end position 
                    var begin = ((i==changeObj.from.line) ? (changeObj.from.ch) : 0)
                    var end = ((i==changeObj.to.line) ? (changeObj.to.ch) : (crdt.data[i].length-2))

                    //deleting the characters
                    for(var j = end-1; j >= begin; j--) {
                        var tempCharacter = crdt.localDelete(i, j)
                        channel.push("shout", {
                            type: "delete",
                            character: tempCharacter,
                        })
                    }

                    //deleting newline if selection included multiple lines
                    if(i != changeObj.to.line) {
                        var tempCharacter = crdt.localDeleteNewline(i); 
                        channel.push("shout", {
                            type: "deletenewline",
                            character: tempCharacter,
                        })
                    }
                }
            }
            //newline insertion
            if(changeObj.text.length > 1) {
                var tempCharacter = crdt.localInsertNewline(changeObj.from.line, changeObj.from.ch, user);
                channel.push("shout", {
                    type: "inputnewline",
                    character: tempCharacter,
                })
            }
            //single insertion (normal case)
            else{
                var tempCharacter = crdt.localInsert(changeObj.text[0], changeObj.from.line, changeObj.from.ch, user)
                channel.push("shout", {
                    type: "input",
                    character: tempCharacter,
                })
            }
        }

        else if(changeobj.origin == "+delete") {
            for(var i = changeObj.to.line; i >= changeObj.from.line; i--) {
                //identifying the begin and end position 
                var begin = ((i==changeObj.from.line) ? (changeObj.from.ch) : 0)
                var end = ((i==changeObj.to.line) ? (changeObj.to.ch) : (crdt.data[i].length-2))

                //deleting the characters
                for(var j = end-1; j >= begin; j--) {
                    var tempCharacter = crdt.localDelete(i, j)
                    channel.push("shout", {
                        type: "delete",
                        character: tempCharacter,
                    })
                }

                //deleting newline if selection included multiple lines
                if(i != changeObj.to.line) {
                    var tempCharacter = crdt.localDeleteNewline(i)
                    channel.push("shout", {
                        type: "deletenewline",
                        character: tempCharacter,
                    })
                }
            }
        }

        else if(changeobj.origin == "+paste") {

        }
        
        else{
            alert("Unhandled case. Send changeobj from console to developer")
            changeobj.cancel()
        }
    }
})

// Apply changes from others
channel.on('shout', function (payload) {
    if (user != payload.user) {
        if(payload.type == "input") {
            var modifiedLine = crdt.remoteInsert(payload.character)
            cm.replaceRange(crdt.getUpdatedLine(modifiedLine), {line: modifiedLine, ch:0}, {line: modifiedLine})
        }
        else if(payload.type == "delete") {
            var modifiedLine = crdt.remoteDelete(payload.character)
            cm.replaceRange(crdt.getUpdatedLine(modifiedLine), {line: modifiedLine, ch:0}, {line: modifiedLine})
        }
        else if(payload.type == "inputnewline") {
            var modifiedLine = crdt.remoteInsertNewline(payload.character)
            cm.replaceRange([crdt.getUpdatedLine(modifiedLine), ""], {line: modifiedLine, ch:0}, {line: modifiedLine})
            cm.replaceRange(crdt.getUpdatedLine(modifiedLine+1), {line: modifiedLine+1, ch:0}, {line: modifiedLine+1})
        }
        else if(payload.type == "deletenewline") {
            var modifiedLine = crdt.remoteDeleteNewline(payload.character, payload.lineNumber)
            cm.replaceRange(crdt.getUpdatedLine(modifiedLine), {line: modifiedLine, ch:0}, {line: modifiedLine+1})
        }
    }
})


/*** Cursor Activity ***/

// Send my cursor update to other users
cm.on("cursorActivity", (cm) => {
    var cursorPos = cm.getCursor();

    channel.push("updateCursor", {
        cursorPos: cursorPos,
        cursorColor: userColor
    });
});

// Receive cursor update from other users
channel.on("updateCursor", function (payload) {
    console.log(markers)
    var cursor = document.createElement('span');

    if (user != payload.user_name) {
        cursor.style.borderLeftStyle = 'solid';
        cursor.style.borderLeftWidth = '1px';
        cursor.style.borderLeftColor = payload.cursorColor;
        cursor.style.height = `${(payload.cursorPos.bottom - payload.cursorPos.top)}px`;
        cursor.style.padding = 0;
        cursor.style.zIndex = 0;
        if (markers[payload.user_name] != undefined) {
            markers[payload.user_name].clear();
        }
        markers[payload.user_name] = cm.setBookmark(payload.cursorPos, { widget: cursor , handleMouseEvents: true});
    }
    if(markers[payload.user_name] != undefined && user==payload.user_name){
        markers[payload.user_name].clear();
    }
})

// Remove my cursor when I leave
presence.onLeave((id,current,leftPres) =>{
    if(current.metas.length==0){
        markers[id].clear()
       delete markers[id]
       // console.log(typeof markers)
    }
})

/*** Logging and Misc ***/

function displayUsers() {
    function renderOnlineUsers(presence) {
        let response = ""
        presence.list((user, { metas: [first, ...rest] }) => {
            let cursorColor = first["cursor_color"]
            response += `<p style="color:${cursorColor};">${user}</p>`
        })
        let userList = document.getElementById("userList")
        userList.innerHTML = response
    }
    presence.onSync(() => 
    renderOnlineUsers(presence)
    )
}

function generateColor() {
    // var letters = '0123456789ABCDEF'
    // var color = '#'
    // for (var i = 0; i < 6; i++) {
    //     color += letters[Math.floor(Math.random() * 16)];
    // }
    // return color;
    //temporary assignments for user names 1,2,3 
    if (user == "1") return "red"
    else if (user == "2") return "green"
    else return "yellow"
}