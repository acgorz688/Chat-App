var socket = io.connect('http://localhost:4000');

const url = document.URL;
const username = getInfo(url).username;
const groupId = getInfo(url).groupId;
const onlineUser = document.getElementById('onlineUser');
const userMessage = document.getElementById('message');
const sendBtn = document.getElementById('send');
const createGroupBtn = document.getElementById('createGroupBtn');
const singInBtn = document.getElementById('singInBtn');
const homeBtn = document.getElementById('homeBtn');
const displayUsername = document.getElementById('displayUsername');
const groupName = document.getElementById('groupName');
const output = document.getElementById('output');
const redDot = document.getElementById('redDot');
const logoutBtn = document.getElementById('logout');
const uploadBtn = document.getElementById('upload');
const file = document.getElementById('file');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const outputMsg = document.getElementById('outputMsg');
const backBtn = document.getElementById('backBtn')
var first = true;
var listJson;


var outputTemp;
var search = true;
groupName.innerHTML= groupId;

//socket 
socket.emit('joinRoom',{username, groupId});

socket.on('message', data =>{
    outputMessgae(data);
})

socket.on('groupUserList',data=>{
    onlineUser.innerHTML='';
    listJson = JSON.parse(data.userList);
    socket.emit('getHistory',{
        username:username,
        socketId:socket.id,
        groupId:getInfo().groupId
    })
})

socket.on('getHistory',data=>{
    var unreadList = JSON.parse(data.unreadUserList);
    var chathistory = JSON.parse(data.groupChathistory);
    if(first == true){
        outputChatHistory(chathistory); 
        first = false;
    }   
    userListWithUnread(listJson,unreadList);
    outPutUserList(listJson);
    outputNavBar();
    backBtn.style.display = "none";
})

socket.on('markMessage',data=>{
    if(data.result == true){
        alert('new message marked');
    }
    else{
        alert('message has been marked!');
    }
})

socket.on('newMessage', data =>{
   updateUserList(data.message[0].senderid,true);
   outPutUserList(listJson);
    
});

socket.on('updatePage', data =>{
    updateUserList(data.receiver,false);
    outPutUserList(listJson);
});

socket.on('searchResult',data=>{
    var result="";
    if(search == true){
        outputTemp = output.innerHTML ;
        search = false;
    }
    if(data.result.length != 0){
        output.innerHTML = "";
        for(var i=0;i<data.result.length;i++){
            var temp = document.createElement("p");
            temp.innerHTML =  `<p>${data.result[i].time} <br /> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
            ${data.result[i].sender}:${data.result[i].msg}
            <input type="button" id="mark" name="rating" value="mark" /></p> 
            `;
            output.appendChild(temp);
            output.scrollTop = output.scrollHeight;  
        }
        
    }
    else{
        output.innerHTML = `<p style="text-align: center"><strong> no match result</strong></P>`
    }
   backBtn.style.display ="block";
    
});

//function 
function outputNavBar(){
    homeBtn.innerHTML =
    `<a id="homeBtn"class="nav-link" 
    href="http://localhost:4000/workSpace/${getInfo(url).username}">
    Home</a>
    `;

    createGroupBtn.innerHTML =
    ` <a id="createGroupBtn" class="nav-link" 
    href="http://localhost:4000/${getInfo(url).username}/newGroup">
    CREATE GROUP</a>`

    singInBtn.innerHTML =
    ` <a id ="singInBtn"class="nav-link" 
    href="http://localhost:4000/${getInfo(url).username}/joinGroup">
    SING IN</a>
    `
    logoutBtn.innerHTML =
    ` <button id ="logoutBtn" type="button" class="btn btn-danger">
    Log Out</button>
    `

    // <a id = "markedMessage" class="dropdown-item" href="#">Marked Message</a>
    markedMessage.innerHTML =  ` <a class="dropdown-item" 
    href="http://localhost:4000/markedMessage/${getInfo().username}">
    Marked Message</button>
    `
}

function updateUserList(user,option) {
    console.log('user');
    console.log(user);
    if(option == false){
        for(var i =0;i<listJson.length;i++){
            console.log('i:');
            console.log(listJson[i]);
            if(listJson[i].username == user){
                listJson[i].unread = false;
            }
        }
    }
    else{
        for(var i =0;i<listJson.length;i++){
            console.log('i:');
            console.log(listJson[i]);
            if(listJson[i].username == user){
                listJson[i].unread = true;
            }
        }
    }
  }

function outputMessgae(data){
    console.log(data)
    var temp = document.createElement("p");
    temp.innerHTML =  `<p>${getTime()} <br /> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
    ${data.username}:${data.message}   <button id="mark" value="${data.id}" onclick="mark(${data.id})"/>Mark</button> 
    </p>
    `;
    output.appendChild(temp);
    output.scrollTop = output.scrollHeight;  
};


function outPutUserList(listJson){
    onlineUser.innerHTML='';
    for (var i=0;i<listJson.length;i++){
        if(listJson[i].username != username ){
            if(listJson[i].unread == true){
            onlineUser.innerHTML += 
            `
            <button 
            class="uerListGroup"
            name="uerListGroup" 
            onclick= window.open('http://localhost:4000/workSpace/${username}/privateChat/${listJson[i].username}')>
            ${listJson[i].username}<div id="redDot"></div> </button>
            `;
        }
        else{
            onlineUser.innerHTML += 
            `
            <button 
            class="uerListGroup"
            name="uerListGroup" 
            onclick= window.open('http://localhost:4000/workSpace/${username}/privateChat/${listJson[i].username}')>
            ${listJson[i].username}</button>
            `;
        }
        }
        
    }
};

//username & groupId
function getInfo(){
    var url = document.location.toString();
　　var arrUrl = url.split("/");
    var username = arrUrl[4];
    var groupId = arrUrl[5];
    result = {username,groupId};
　　return result;
};

function getTime(){
    var currentdate = new Date(); 
    var datetime =  currentdate.getMonth()+1 +"/"+
                    currentdate.getDate() +"/"+
                    currentdate.getFullYear() +" "+
                    currentdate.getHours() +":"+
                    currentdate.getMinutes() + ":" +
                    currentdate.getSeconds();
    return datetime;
};

function outputChatHistory(chathistory){
    console.log(chathistory);
    for(var i=0;i<chathistory.length;i++){
        var temp = document.createElement("p");
        if(chathistory[i].message.length>500){
            console.log(chathistory[i].message.length);
            var message = chathistory[i].message.substring(0,500);
            temp.innerHTML =  `<p >${chathistory[i].time} <br /> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
            ${chathistory[i].senderid}:
            <p id ="${chathistory[i].id}">${message}...... </p> 
            <button id = "view${chathistory[i].id}" class="viewAll" value = "${chathistory[i].message}" onclick="viewAll(this.value,${chathistory[i].id})" >View All</button>
            <button id = "less${chathistory[i].id}" class="showLess" value = "${message}......" onclick="showless(this.value,${chathistory[i].id})"  style="display: none;">Show Less</button>
            <button id="mark" value="${chathistory[i].id}" onclick="mark(this.value)" />Mark</button>
            </p>`;
        }
        else{
            temp.innerHTML =  `<p>${chathistory[i].time} <br /> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
            ${chathistory[i].senderid}:<p>${chathistory[i].message}<p> <button id="mark" value="${chathistory[i].id}" onclick="mark(this.value)" />Mark</button> 
            </p>`;
        }
       
        output.appendChild(temp);
        output.scrollTop = output.scrollHeight;  
    }
}

function mark(value){
    console.log("value: " + value);
    socket.emit('markMessage',{
     socketid:socket.id,
     user:getInfo().username,   
     messageid:value
    })
 }

 function viewAll(fullyMessage,id){
    document.getElementById(id).innerHTML =  `<p id ="${id}">${fullyMessage}</p>` 
    document.getElementById("view"+id).style.display = "none";
    document.getElementById("less"+id).style.display = "block";

    // console.log(document.getElementById("view"+id));
    //document.getElementById("view"+id).innerHTML =`<button "class="viewAll" value = "${shortMessage}" onclick="showless(this.value,${id})" />Show Less</button></p>`;
}

function showless(shortMessage,id){
    document.getElementById(id).innerHTML =  `<p id ="${id}">${shortMessage}</p>`;
    document.getElementById("view"+id).style.display = "block";
    document.getElementById("less"+id).style.display = "none";
}


function userListWithUnread(userlist, unreadlist){
    var result = [];
    var temp = true;
    for(var i =0;i<userlist.length;i++){
        for(var j= 0;j<unreadlist.length;j++){
            if(userlist[i].name ==unreadlist[j].senderid){
                result.push({username:userlist[i].name,unread:true});
                temp = false;
            }
        }
        if(temp == true){
            result.push({username:userlist[i].name,unread:false});
        } 
        temp = true;
    }
    // console.log(listJson);
    listJson = result;
}



// uploadBtn.addEventListener('click',()=>{
//     console.log(file.files);
//     socket.emit('upload',{
//         user:getInfo().username,
//         groupid:getInfo().groupId,
//         file:JSON.stringify(file.files)
//     })
// });

// event listener 
searchBtn.addEventListener('click',()=>{
    console.log("emit");
    socket.emit('search',{
        keywords: searchInput.value
    })
});

backBtn.addEventListener('click',()=>{
    output.innerHTML = outputTemp;
    search = true;
    searchInput.value = "";
    output.scrollTop = output.scrollHeight;
    backBtn.style.display ="none";
})

logoutBtn.addEventListener('click',()=>{
    console.log('logout...');
    socket.emit('logout',{
        user:getInfo().username
    })
    window.location.href="http://localhost:4000/login"
})

sendBtn.addEventListener('click',()=>{
    if(userMessage.value !=''){
        socket.emit('chatMessage',{
            id:Date.now(),
            username:username, 
            groupId:groupId,
            message:userMessage.value,
            time:getTime()
        });
        userMessage.value='';
    }else{
        alert('can not send empty!')
    }   
})


// press key to send
document.onkeydown = function(event){
    var e = event || window.event || arguments.callee.caller.arguments[0];   
    if(e && e.keyCode==13){ // enter 键   
        if(userMessage.value !=''){
            socket.emit('chatMessage',{
                id:Date.now(),
                username:username, 
                groupId:groupId,
                message:userMessage.value,
                time:getTime()
            });
            userMessage.value='';
        }else{
            alert('can not send empty!')
        }   
    }  
}