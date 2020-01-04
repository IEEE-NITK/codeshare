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
import socket from "./socket"

var cm = window.cm // cm: CodeMirror

// Join Channel
// let user = document.getElementById("user").innerText
// var userColor = generateColor()
// let socket = new Socket("/socket", { params: { user: user, userColor: userColor } })
// socket.connect()
let channel = socket.channel("room:lobby", {});
let presence = new Presence(channel)
channel.join()

var my_id;
channel.push("get_my_id", {}).receive(
    "ok", (reply) => my_id = reply.user_id
)

// Display active users
displayUsers()

// Keeps track of other's cursors
var markers = {}

/*** Send and recieve editor changes ***/

// Send my changes to others
cm.on("beforeChange", (cm, changeobj) => {
    if (changeobj.origin != undefined) {
    
        if(changeobj.origin == "+input") {
            //select and insert => delete selected stuff first
            if(changeobj.from.line != changeobj.to.line || changeobj.from.ch != changeobj.to.ch) {
                for(var i = changeobj.to.line; i >= changeobj.from.line; i--) {
                    //identifying the begin and end position 
                    var begin = ((i==changeobj.from.line) ? (changeobj.from.ch) : 0)
                    var end = ((i==changeobj.to.line) ? (changeobj.to.ch) : (crdt.data[i].length-2))

                    //deleting the characters
                    for(var j = end-1; j >= begin; j--) {
                        var tempCharacter = crdt.localDelete(i, j)
                        channel.push("shout", {
                            type: "delete",
                            character: tempCharacter,
                            user_id: my_id
                        })
                    }

                    //deleting newline if selection included multiple lines
                    if(i != changeobj.to.line) {
                        var tempCharacter = crdt.localDeleteNewline(i); 
                        channel.push("shout", {
                            type: "deletenewline",
                            character: tempCharacter,
                            user_id: my_id
                        })
                    }
                }
            }
            //newline insertion
            if(changeobj.text.length > 1) {
                var tempCharacter = crdt.localInsertNewline(changeobj.from.line, changeobj.from.ch, my_id);
                channel.push("shout", {
                    type: "inputnewline",
                    character: tempCharacter,
                    user_id: my_id
                })
            }
            //single insertion (normal case)
            else{
                var tempCharacter = crdt.localInsert(changeobj.text[0], changeobj.from.line, changeobj.from.ch, my_id)
                channel.push("shout", {
                    type: "input",
                    character: tempCharacter,
                    user_id: my_id
                })
            }
        }

        else if(changeobj.origin == "+delete") {
            for(var i = changeobj.to.line; i >= changeobj.from.line; i--) {
                //identifying the begin and end position 
                var begin = ((i==changeobj.from.line) ? (changeobj.from.ch) : 0)
                var end = ((i==changeobj.to.line) ? (changeobj.to.ch) : (crdt.data[i].length-2))

                //deleting the characters
                for(var j = end-1; j >= begin; j--) {
                    var tempCharacter = crdt.localDelete(i, j)
                    channel.push("shout", {
                        type: "delete",
                        character: tempCharacter,
                        user_id: my_id
                    })
                }

                //deleting newline if selection included multiple lines
                if(i != changeobj.to.line) {
                    var tempCharacter = crdt.localDeleteNewline(i)
                    channel.push("shout", {
                        type: "deletenewline",
                        character: tempCharacter,
                        user_id: my_id
                    })
                }
            }
        }

        else if(changeobj.origin == "+paste") {

        }
        
        else{
            alert("Unhandled case. Inform developer")
            changeobj.cancel()
        }
    }
})

// Apply changes from others
channel.on('shout', function (payload) {
    if (my_id != payload.user_id) {
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
        // cursorColor: userColor
        user_id: my_id
    });
});

// Receive cursor update from other users
channel.on("updateCursor", function (payload) {
    // console.log(markers)
    var cursor = document.createElement('span');

    if (my_id != payload.user_id) {
        cursor.style.borderLeftStyle = 'solid';
        cursor.style.borderLeftWidth = '1px';
        cursor.style.borderLeftColor = `#${payload.user_id}`;
        cursor.style.height = `${(payload.cursorPos.bottom - payload.cursorPos.top)}px`;
        cursor.style.padding = 0;
        cursor.style.zIndex = 0;
        if (markers[payload.user_id] != undefined) {
            markers[payload.user_id].clear();
        }
        markers[payload.user_id] = cm.setBookmark(payload.cursorPos, { widget: cursor , handleMouseEvents: true});
    }
    if(markers[payload.user_id] != undefined && my_id==payload.user_id){
        markers[payload.user_id].clear();
    }
    console.log("updateCursor markers", markers)
})

// Remove my cursor when I leave
presence.onLeave((user_id,current,leftPres) =>{
    if(current.metas.length==0){
        console.log("onLeave markers", markers)
        markers[user_id].clear()
       delete markers[user_id]
       // console.log(typeof markers)
    }
})

/*** Logging and Misc ***/

function displayUsers() {
    function renderOnlineUsers(presence) {
        let response = ""
        presence.list((user_id, { metas: [params] }) => {
            // let cursorColor = first["cursor_color"]
            response += `<p style="color:#${user_id};">${user_id}</p>`
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