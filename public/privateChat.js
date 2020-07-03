var socket = io.connect('http://localhost:4000');

const url = document.URL;
const sender = getInfo(url).sender;
const receiver = getInfo(url).receiver;
const userMessage = document.getElementById('message');
const btn = document.getElementById('send');
const createGroupBtn = document.getElementById('createGroupBtn');
const singInBtn = document.getElementById('singInBtn');
const homeBtn = document.getElementById('homeBtn');
const privateChatsername = document.getElementById('privateChatusername');
const output = document.getElementById('output');
const logoutBtn = document.getElementById('logout');
var outputUserList = [];
let chatHistory;

privateChatsername.innerHTML =receiver;

socket.emit('privateChat',{sender,receiver});

socket.on('chatRecord', data =>{
    chatHistory = JSON.parse(data.chathistory); 
    outputChatHistory(chatHistory);
    outputNavBar();
});

socket.on('newMessage',data=>{
    if(data.message[0].senderid == receiver){
        outputMessage(data);
    }
   
});

document.onkeydown = function(event){
    var e = event || window.event || arguments.callee.caller.arguments[0];   
    if(e && e.keyCode==13){ // enter    
        if(userMessage.value !=''){
            socket.emit('privateMessage',{
                sender:sender,
                receiver:receiver,
                message:userMessage.value,
                time: getTime()
            });
            output.innerHTML += 
            `<p>${getTime()} <br /><img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
            ${sender}: ${userMessage.value}</p>`;
            userMessage.value="";
            output.scrollTop = output.scrollHeight;
            //scroll to bottom
        }else{
            alert('can not send empty!')
        }   
    }  
}



btn.addEventListener('click', ()=>{
    socket.emit('privateMessage',{
        sender:sender,
        receiver:receiver,
        message:userMessage.value,
        time: getTime()
    });
    output.innerHTML += 
    `<p>${getTime()} <br /><img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
    ${sender}: ${userMessage.value}</p>`;
    userMessage.value="";
    output.scrollTop = output.scrollHeight;
    //scroll to bottom
})

socket.on('privateChat',data =>{
    outputMessage(data);
});



function updateStatus(list){
    for(var i=0;i<list.length;i++){
        if(list[i].sender == receiver){
            list.splice(i,1);
        }
    }
    return list;
}

function outputChatHistory(chatHistory){
    for(var i = 0;i<chatHistory.length;i++){
        output.innerHTML += 
        `<p>${chatHistory[i].time} <br /><img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
        ${chatHistory[i].senderid}: ${chatHistory[i].message}</p>`
    };
    console.log('get in his');
    output.scrollTop = output.scrollHeight;
    socket.emit('readMessage',
        {
           sender:sender,
           receiver:receiver
        });
}




function outputMessage(data){
    output.innerHTML += 
    `<p>${data.message[0].time}</br /><img src="https://ptetutorials.com/images/user-profile.png" alt="sunil" style="width: 30px;height: 30px;">
    ${data.message[0].senderid}: ${data.message[0].message}</p>
    `;
    output.scrollTop = output.scrollHeight;
    console.log('emit read message');
    socket.emit('readMessage',
    {
       sender:sender,
       receiver:receiver
    });
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

function getInfo(url){
    var url = document.location.toString();
　　var arrUrl = url.split("/");
    var sender = arrUrl[4];
    var receiver = arrUrl[6];
    result = {sender,receiver};
　　return result;
};


function outputNavBar(){
    console.log(getInfo(url));
    homeBtn.innerHTML =
    `<a id="homeBtn"class="nav-item nav-link active" 
    href="http://localhost:4000/workSpace/${getInfo(url).sender}">
    Home <span class="sr-only">(current)</span></a>
    `;

    createGroupBtn.innerHTML =
    ` <a id="createGroupBtn" class="nav-item nav-link" 
    href="http://localhost:4000/${getInfo(url).sender}/newGroup">
    CREATE GROUP</a>`

    singInBtn.innerHTML =
    ` <a id ="singInBtn"class="nav-item nav-link" 
    href="http://localhost:4000/${getInfo(url).sender}/joinGroup">
    SING IN</a>
    `

    logoutBtn.innerHTML =
    ` <button id ="logoutBtn" type="button" class="btn btn-danger">
    Log Out</button>
    `
}

logoutBtn.addEventListener('click',()=>{
    console.log('logout...');
    socket.emit('logout',{
        user:getInfo().sender
    })
    window.location.href="http://localhost:4000/login"
})