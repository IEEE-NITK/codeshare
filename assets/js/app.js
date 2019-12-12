// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html"


// Import local files
//
// Local files can be imported directly using relative paths, for example:
// import socket from "./socket"
// import "./addon/edit/closebrackets.js"
// import "./addon/display/fullscreen.js"
// import "./addon/display/fullscreen.css"
// import "./mode/javascript/javascript.js"
// import "./mode/python/python.js"
// import "./theme/darcula.css"
// import "./addon/edit/matchbrackets.js"
// import "./addon/edit/matchtags.js"
import { Presence, Socket } from "phoenix"

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
    presence.onSync(() => renderOnlineUsers(presence))
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


let user = document.getElementById("user").innerText
var userColor = generateColor()
let socket = new Socket("/socket", { params: { user: user, userColor: userColor } })
socket.connect()
let channel = socket.channel("room:lobby", {});
let presence = new Presence(channel)
displayUsers()
channel.join()
var markers = {}

channel.push("createCursor", {})

channel.on("createCursor", function (payload) {
    console.log(markers)
    if (user != payload.user_name) {
        const cursorCoords = { ch: 0, line: 0 };
        var cursorElement = document.createElement('span');
        cursorElement.style.borderLeftStyle = 'solid';
        cursorElement.style.borderLeftWidth = '3px';
        cursorElement.style.borderLeftColor = payload.user_color;
        cursorElement.style.height = `${(cursorCoords.bottom - cursorCoords.top)}px`;
        cursorElement.style.padding = 0;
        cursorElement.style.zIndex = 0;
        markers[payload.user_name] = cm.setBookmark(cursorCoords, { widget: cursorElement });
    }
})

var cm=window.cm
cm.on("beforeChange", (cm, changeobj) => {
    console.log(changeobj);
    if (changeobj.origin != undefined) {
        channel.push('shout', {
            changeobj: changeobj,
            user: user
        });
    }
})
cm.on("cursorActivity", (cm) => {
    var cursorPos = cm.getCursor();

    channel.push("updateCursor", {
        cursorPos: cursorPos,
        cursorColor: userColor
    });
});
channel.on("updateCursor", function (payload) {
    if (user != payload.user_name) {
        var cursor = document.createElement('span');
        cursor.style.borderLeftStyle = 'solid';
        cursor.style.borderLeftWidth = '3px';
        cursor.style.borderLeftColor = payload.cursorColor;
        cursor.style.height = `${(payload.cursorPos.bottom - payload.cursorPos.top)}px`;
        cursor.style.padding = 0;
        cursor.style.zIndex = 0;
        if (markers[payload.user_name] != undefined) {
            markers[payload.user_name].clear();
        }
        markers[payload.user_name] = cm.setBookmark(payload.cursorPos, { widget: cursor });
        // markers[payload.user_name].clearWhenEmpty=true;
    }
})
channel.on('shout', function (payload) {
    console.log(payload.changeobj);
    if (user != payload.user) {
        cm.replaceRange(payload.changeobj.text, payload.changeobj.from, payload.changeobj.to);
    }
})
