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
import {Socket, Presence} from "phoenix"

// Import local files
import crdt from "./crdt"
import socket from "./socket"

var cm = window.cm // cm: CodeMirror

// Join Channel
let channel = socket.channel("room:lobby", {})

channel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })  

// Getting my user_id
var my_id;
channel.push("get_my_id", {}).receive("ok", (reply) => {
    my_id = reply.user_id
    document.getElementById("user_id").textContent = my_id
})

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

var markers = {}
var cursors = {}

function createCursor(payload) {
    var cursor = document.createElement("span")
    cursor.style.borderLeftStyle = 'solid';
    cursor.style.borderLeftWidth = '1px';
    cursor.style.borderLeftColor = `#${payload.user_id.toString(16)}`;
    cursor.style.height = `${(payload.cursorPos.bottom - payload.cursorPos.top)}px`;
    cursor.style.padding = 0;
    cursor.style.zIndex = 0;
    return cursor
}

// Receive cursor update from other users
channel.on("updateCursor", function (payload) {
    console.log(payload)
    console.log(markers)
    if(payload.user_id != my_id) {
        console.log(payload.user_id, "moved his cursor")
        if(markers[payload.user_id] != undefined) {
            markers[payload.user_id].clear()
        }
        else {
            cursors[payload.user_id] = createCursor(payload)
        }
        markers[payload.user_id] = cm.setBookmark(payload.cursorPos, {widget: cursors[payload.user_id], handleMouseEvents: true})
    }
})

/*** Logging and Misc ***/

// To keep track of online users
let presences = {}

channel.on("presence_state", state => {
    presences = Presence.syncState(presences, state)
    renderOnlineUsers(presences)
})

channel.on("presence_diff", diff => {
    var user = diff.leaves[Object.keys(diff.leaves)[0]]
    if(user != undefined) {
        if(markers[user.metas[0].user_id] != undefined)
            markers[user.metas[0].user_id].clear()
        delete markers[user.metas[0].user_id]
        delete cursors[user.metas[0].user_id]
    }
    presences = Presence.syncDiff(presences, diff)
    renderOnlineUsers(presences)
})

const renderOnlineUsers = function(presences) {
    var ctr = 0
    let onlineUsers = Presence.list(presences, (id, {metas: [user, ...rest]}) => {
        console.log("user ", ctr, user)
        ctr = ctr + 1
        return onlineUserTemplate(user);
    }).join("")

    document.querySelector("#online-users").innerHTML = onlineUsers;
}

const onlineUserTemplate = function(user) {
return `
    <div id="online-user-${user.user_id}">
    <strong><font color="#${user.user_id.toString(16)}">${user.user_id}</font></strong>
    </div>
`
}